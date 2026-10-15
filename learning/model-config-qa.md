# AI 模型配置与调用问答笔记

## 1. Fastify 接口代码在哪

- 启动入口:`apps/api/src/main.ts`
- 应用/插件组装:`apps/api/src/app.ts`
- 各业务路由在 `apps/api/src/routes/`:后台鉴权 `admin-auth.ts`、后台接口 `admin.ts`,公开的网站数据接口 `v1.ts`、`site.ts` 等。

## 2. `LLM_API_KEY` 怎么被调用

```
.env(LLM_API_KEY/LLM_BASE_URL/...) 或 site/models.ts 的具名 PRESETS
  ↓
providers/llm.ts 的 chatJson()
  ↓ 先查 MODEL_CALLS_ENABLED,没开直接报错(唯一的开关检查点)
  ↓
providers/receipts.ts 的 paidRequest()
  ↓ 写一行 pending 回执,按 logicalKey 去重(进程崩溃/超时重试不重复扣费)
  ↓ Postgres advisory lock 串行化预算检查,超预算抛 BudgetExceededError
  ↓
真正 fetch(baseUrl + "/chat/completions", { authorization: Bearer apiKey })
```

- 读者打开网页**不会**触发这条链路,只有 worker 处理文章时才会调。
- 谁在调:`editorial/analyze.ts` 的 `analyzeArticle` 按步骤(prefilter/score/structure/understand/summarize/wording)依次调 `chatJson`;翻译、事件归组/复核、日报写作(`translate.ts`、`events/group.ts`、`events/digest.ts`、`reports/compose.ts`)走同一套链路,只是传入的 model/purpose 不同。

## 3. 为什么要按步骤配不同模型(需求)

默认所有步骤共用 `.env` 的 `LLM_*`,不配置也能跑。要分步骤换模型,通常是踩中下面几条,不是必须做的事:

- **调用量和任务难度不匹配**:prefilter、score 调用量大但单次任务简单,适合便宜快的模型;写作、理解需要判断力,才值得用更贵的模型。
- **要不要"思考"(reasoning)**:答案确定、不需要推理的任务(结构抽取)关掉 `thinking` 省 token 和延迟;需要判断力的任务(评分、归组复核)开着 `thinking` 换更稳的结果。
- **要不要看图**:只有 `understand`(能看图时带首图)这类步骤需要 `vision` 模型,其余步骤没必要为视觉能力多付成本。
- **复核步骤建议换一家厂商**:`groupReview` 是主模型判断完之后再复核一遍,同一个模型的系统性偏差容易被"复核"原样确认,换厂商能多一道独立校验。

## 4. 配置的代码逻辑

三层优先级(`editorial/models.ts` 的 `modelFor()`):

1. **后台"模型与评测"页设置**(存 `settings` 表,有审计,改了立刻生效,缓存 60 秒)
2. **环境变量**(如 `SCORE_MODEL`)
3. **`site/models.ts` 的 `DEFAULTS`**,都没写就用 `.env` 的 `LLM_*`

关键结构:

- `CAPABILITIES`:登记每一步的 `label`(后台显示名)、`env`、`default`、`purposes`(回执用途,供后台统计)、`vision`、`idle`(这个站不需要这步时,对应服务故障不报警)。
- `PRESETS`(`site/models.ts`):具名模型配置,`service`/`model`、`baseUrlEnv`/`apiKeyEnv`(各自的地址和密钥环境变量名)、`extra`(额外请求字段,比如开关 `thinking`)、`reasoningTokens`(推理模型的输出额度,不留会导致推理把输出额度用光、答案为空)、`jsonMode`、`vision`。

新增模型步骤:在 `PRESETS` 加一条 → `.env` 补上对应的 baseUrl/apiKey → 用 `DEFAULTS`/环境变量/后台页三种方式之一指派给某个步骤。调用方代码(`modelFor(capability)` → `chatJson`)不用因为换模型而改。

## 5. 提示词 vs 代码阈值:规则到底发不发给模型

**发给模型的部分**:

- 评分标准、权重、什么算噪声这类"标准文字"写在 `industry/prompts/selection-score.md`,整段文本就是提示词。
- 分类、标签、公司实体清单定义在 `industry/taxonomy.ts`(`CATEGORIES`、`CATEGORY_TAGS`、`TOPIC_TAGS`、`ENTITY_TAGS`、`ENTITIES`),渲染提示词时用 `{{categoryGuide}}`、`{{categoryTags}}` 等占位符动态拼进提示词文本(`industry/prompts/structure.md`),模型只能从这份清单里选,不能自己编。

**不发给模型、只在代码里判断的部分**:

- 多少分算入选的**门槛**在 `industry/selection.ts`:模型只负责打分(0–100),门槛比较(两次分数之和 ≥ 2×门槛)是代码拿到分数后自己算的,模型不知道门槛,避免模型为了"凑够分"反向揣测标准。
- 信源分级(T1/T1.5/T2)在后台配置,不进提示词,只用来决定代码该用哪个门槛比较。

一句话:**"怎么判断"的标准和"有哪些选项"会写进提示词给模型看;"多少分算过线"这种阈值只留在代码里,模型看不到也不参与这步判断。**

## 6. 本地环境踩坑记录

- `createdb myhot_dev` 是终端命令,不写进 `.env`;`.env` 里要加的是 `DATABASE_URL`/`API_BASE_URL` 两行(`.env.example` 第 130-132 行默认注释掉)。
- `password authentication failed for user "postgres"`:`DATABASE_URL` 里没写密码,要补成 `postgres://postgres:密码@127.0.0.1:5432/库名`,且库名要和 `createdb` 建的那个一致。
- `DATABASE_URL`(端口 5432,Postgres 默认)和 `API_BASE_URL`(端口 3001,Fastify)是两个独立进程的端口,不会冲突。
- 装 PostgreSQL 时弹出的 Stack Builder 是装额外插件用的,本地开发直接 Cancel。
