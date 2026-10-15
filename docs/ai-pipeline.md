# AI 处理流程

这篇讲**代码怎么实现**模型调用的那部分：流程顺序、提示词怎么加载、模型怎么选、付费调用怎么保证不重复花钱、事件怎么判断该不该合并。改这部分代码前先看这篇。

想改"标准应该是什么"（门槛、提示词内容、怎么用标注样本校准），看 [精选与校准](selection.md)；想改"事件归组该怎么判断、怎么评测"，看 [事件归组](grouping.md)。这几篇是互补的：那两篇是"调标准"的视角，这篇是"代码怎么跑"的视角。

## 一条资料经过的模型调用节点

`packages/backend/src/editorial/analyze.ts` 的 `analyzeArticle` 按顺序做（每一步有自己的提示词，在 `industry/prompts/`）：

1. **prefilter** — 判断这条资料和这个行业有没有关系（宽召回）。只有明确 `BLOCK` 才会拦下；给出 `BLOCK` 但缺证据时降级成 `UNKNOWN`。资料还没有正文或可展示的原帖时，停在 `UNKNOWN` 等下一个版本的资料。
2. **score** — 同一份标准独立打两次分（`SCORE_CALLS = 2`），两次分数之和对比信源分级的门槛（`industry/selection.ts`）决定是否入选精选；分数的平均值（向下取整）展示给读者。
3. **structure** — 和打分并行：分类、标签、主题、这条新闻当前的"事实"是什么。
4. **写作** — 等 structure 出来后：入选或接近入选的用更贵的"理解"提示词写标题/摘要/推荐理由（`understand`，模型支持看图时会带上首图）；其余用更便宜的"摘要"提示词（`summarize`）；中文短帖原样保留（`verbatim`）。
5. **wording** — 如果写出来的文案用了网站要避免的词（`industry/wording.ts` 有配置才会跑这一步），回去改一次，只改用词不改判断。

全部结果写成一行 `analyses`（append-only，不覆盖旧记录），带着 `receipt_ids`、`prompt_version`，供后台"内容诊断"逐步回看。

## 提示词加载与版本化（`editorial/prompts.ts`）

提示词是 `industry/prompts/*.md` 文件，支持 `{{> 文件名}}` 互相引用和 `{{变量}}` 占位符替换。每份提示词的最终文本会算一个内容哈希，拼成 `promptVersion`——这样后台和回执里能看到"这条判断到底是用哪一版提示词产出的"，改提示词不用额外记版本号,内容变了哈希就变。

## 模型怎么选（`editorial/models.ts`）

默认所有步骤共用 `.env` 里的 `LLM_*`，不配置额外的东西也能跑。要不要分步骤换模型，看是否踩中下面几条，不是必须做的事：

- **调用量和任务难度不匹配**：prefilter、score 这类调用量大但单次任务简单，适合便宜快的模型；写作、理解需要判断力，才值得用更贵的模型。
- **要不要"思考"（reasoning）**：答案确定、不需要推理的任务（比如结构抽取）关掉 `thinking` 省 token 和延迟；需要判断力的任务（评分、归组复核）开着 `thinking` 换更稳的结果。
- **要不要看图**：只有 `understand`（能看图时带首图）这类步骤需要 `vision` 能力的模型，其余步骤没必要为这个多付成本。
- **复核步骤建议换一家厂商**：`groupReview` 是在主模型判断完之后再复核一遍，同一个模型的系统性偏差容易被"复核"原样确认一次，换一家服务商能多一道独立校验。

配置和解析逻辑：每一步（prefilter/score/structure/understand/summarize/wording/group/groupReview/digest/report/translate……）按三层优先级选模型：**后台"模型与评测"页的设置**（存 `settings` 表，有审计）→ **环境变量**（如 `SCORE_MODEL`）→ **`site/models.ts` 的 `DEFAULTS`**，都没写就用 `.env` 的 `LLM_*` 默认模型。选择结果缓存 60 秒，改了立刻生效不用重启，但只影响之后的调用，已经写好的历史判断不会重新跑一遍。

`CAPABILITIES` 登记每一步的 `label`（后台显示名）、`env`（对应环境变量名）、`default`（代码默认值）、`purposes`（产生哪些回执用途，供后台统计）、`vision`（是否要求模型能看图）、`idle`（这个站没有这个步骤的需要时，对应服务故障不报警，比如没配 `industry/wording.ts` 时 `wording` 步骤不跑也不告警）。

新增一个具名模型，在 `site/models.ts` 的 `PRESETS` 里加一条：`service`/`model` 标识、`baseUrlEnv`/`apiKeyEnv`（各自的地址和密钥环境变量名，真实值配在 `.env`）、`extra`（额外请求字段，比如开关 `thinking`）、`reasoningTokens`（推理模型的输出额度，不留的话推理会把每一步的输出额度用光导致答案为空）、`jsonMode`、`vision`。配好后用 `DEFAULTS`、环境变量或后台页三种方式之一指定哪个步骤用它。`modelFor(capability)` 按上面的优先级解析出当前该用的模型名再传给 `chatJson`，调用方代码不用因为换模型而改。

## 付费调用：回执与预算（`providers/`）

- **`receipts.ts`** 是所有付费调用（模型、X、公众号、Jina）共用的入口：调用前先按"任务+输入版本+服务商+模型+提示词+配置"算一个稳定的 `logicalKey`，写一行 `pending` 状态的回执，调用成功后把原始响应存回这行,再让业务代码读。这样进程崩溃、超时重试都不会重复扣费——同样的 `logicalKey` 命中已有回执直接复用（`reused: true`）；结果不明的回执（`unknown`）30 分钟后自动放行一次重试，再不明就要后台人工核对放行。
- **预算熔断**：`checkBudget` 从 `budgets` 表读每分钟/每小时/每天的上限（后台"设置"可改），用 Postgres advisory lock 按服务串行化检查,超过直接抛 `BudgetExceededError` 而不是悄悄跳过。
- **`llm.ts`** 的 `chatJson` 是实际的 OpenAI 兼容调用：支持 JSON 模式、看图、推理模型的输出额度（`reasoningTokens`），以及对模型输出格式错误的容错解析（`extractJson`，解析不出来抛 `ModelOutputError`）。
- **`embeddings.ts`** 是向量调用，供事件候选召回用；没配置向量服务时归组改用文字重合度召回。

## 事件归组（`events/group.ts`）

一条新资料归组时：先按向量相似度（没配向量服务就按文字重合度）在最近两周内找候选事实/事件，再让模型判断是同一事实、同一事件下的新事实，还是新事件（`events/relate.ts` 的关系判断）。合并判断的相似度低于 0.85 时，再让第二个模型复核一遍（`groupReview`，建议配成和主模型不同的厂商）才落地,拿不准时倾向于合并而不是拆开。只提供讨论热度的信源（`hot_signal`）可以挂到事件上贡献热度,但自己不会开新事件。

## 热度（`events/hot.ts`）

按事件（不是按文章）算：48 小时窗口内，每个独立参与者（信源/作者/群体）只算一次，24 小时热度减半;至少要有 2 个独立参与者、其中至少 1 个是正式信源才上榜。涨幅和 6 小时前比,只在双方都有观测数据的参与者范围内比较,标"上升"或"新"。
