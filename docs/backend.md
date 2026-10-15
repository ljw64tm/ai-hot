# 后端

两个运行进程（`apps/api`、`apps/worker`）加业务代码主体 `packages/backend/src/`。改这块代码前先看这篇；整体三进程分工见 [架构](architecture.md)，AI 相关流程另见 [AI 处理流程](ai-pipeline.md)。

## apps/api —— Fastify 接口

入口 `apps/api/src/main.ts` → `apps/api/src/app.ts` 的 `buildApp()` 注册所有路由模块（`apps/api/src/routes/`）：

| 文件 | 职责 |
|---|---|
| `site.ts` | 网站 SSR 自用接口（`/api/site/*`：首页数据、条目、事件、报告、主题、搜索建议、站点统计），也挂了 `feedback.ts`（反馈提交） |
| `v1.ts` | 公开 API（`/api/v1/*`：条目、热点、事件、日报、精选同步快照与增量） |
| `agent.ts` | 给 Agent 用的 Markdown 接口（`/api/v1/agent/*`：搜索、热点、事件、日报、模块能力） |
| `admin.ts` + `admin-auth.ts` | 后台接口（`/api/admin/*`：信源、内容、反馈、运行记录、设置、模型、SelectBench、审计）和登录会话（`/api/auth/*`） |
| `ingest.ts` | 外部推送入口 `/api/ingest/items`（token 鉴权） |
| `mcp.ts` | MCP 服务（`/api/mcp`） |
| `media.ts` | 签名图片代理 `/api/img-proxy` |
| `og.ts` | 分享图生成（条目、海报、报告、主题、事件） |
| `feeds.ts` | RSS |
| `static.ts` | 站点地图、`robots.txt`、`llms.txt`、`manifest`、`openapi-v1.json`、图标 |

开发：`npm run dev:api`（`node --watch`，默认 3001 端口）。

## apps/worker —— pg-boss 任务队列 + 定时任务

入口 `apps/worker/src/main.ts`：装载站点模块，连 pg-boss（`packages/backend/src/jobs/queue.ts` 的 `getBoss()`），注册各队列处理器和定时任务。

**队列**（`JobData`/`QUEUES`，`packages/backend/src/jobs/queue.ts`）：

| 队列 | 做什么 |
|---|---|
| `content.analyze` | 一篇资料的预筛/评分/写作（AI 判断） |
| `content.extract-body` | 补抓正文 |
| `events.group` | 归组进事件 |
| `events.digest` | 生成事件综述 |
| `sources.fetch` / `sources.fetch-x` / `sources.mp` | 普通信源抓取 / X 分片抓取 / 公众号检查 |
| `notify.selected` | 精选推送（飞书） |
| `publication.republish-source` | 重新发布某信源下的内容 |
| `media.prepare` | 媒体预处理 |

注册文件在 `packages/backend/src/jobs/`：`content.ts`、`sources.ts`、`events.ts`、`notify.ts`、`publication.ts`。

**定时任务**（`apps/worker/src/schedules.ts` 的 `ENGINE_SCHEDULES`，Asia/Shanghai 时区，执行记录写入 `job_runs`）：`content.sweep`/`content.translate`（每 5 分）、`hot.rank`/`hot.snapshot`（热度计算与快照）、`stories.links`（关联事件）、`reports.compose`（日报周报月报，错过的那次补跑一次）、`ops.retention`（按隐私条款到期删除）、`seo.indexnow`、`ops.recover`/`ops.alerts`/`ops.digest`（恢复异常回执、告警、每日摘要）、`feedback.forward`、`ops.backup`（配置了才跑）、`reports.source-health`（每周一）；`COLLECT_ENABLED=true` 时还有 `sources.schedule`、`sources.adapt-intervals`、`sources.icons`，配了 Dajiala 还有 `sources.mp-reconcile`。

开发：`npm run dev:worker`（`node --watch`，无 HTTP 端口）。

## packages/backend/src/ —— 业务代码主体

| 目录 | 职责 | 关键文件 |
|---|---|---|
| `sources/` | 六种信源的读取器与调度 | `collect.ts`（抓一个信源）、`rss.ts`/`web-list.ts`/`json-list.ts`/`x.ts`/`mp.ts`、`health.ts`（健康与重试退避） |
| `content/` | 资料入库、判重、正文提取 | `materials.ts`（唯一入口，`upsertMaterial`/身份键）、`extract.ts`（补抓正文） |
| `editorial/` | AI 判断与写作 | `analyze.ts`（流程编排）、`prompts.ts`（读取并给提示词版本化）、`models.ts`（每一步用哪个模型） |
| `events/` | 事件归组、热度、综述 | `group.ts`（归组判断）、`hot.ts`（热度算法）、`digest.ts`（综述）、`consolidate.ts`/`merge.ts`（合并）、`corrections.ts`（人工覆盖） |
| `publication/` | **唯一的公开读取层** | `scope.ts`（可见性/精选席位/证据条件的唯一定义）、`publish.ts`（从已有结果推导公开投影，不调模型） |
| `providers/` | 外部付费调用 | `receipts.ts`（回执与预算熔断）、`llm.ts`（OpenAI 兼容调用）、`embeddings.ts`、`x.ts`/`jina.ts`/`dajiala.ts` |
| `notify/` | 飞书推送 | |
| `operations/` | 告警、备份、清理、IndexNow | `alerts.ts`、`backup.ts`、`retention.ts`、`recover.ts`、`indexnow.ts` |
| `admin/` | 后台接口的业务逻辑 | 鉴权、内容诊断与人工更正、模型与提示词管理、SelectBench、来源管理 |

## 几条不变的规则（详见 [架构](architecture.md)）

- 公开出口（网页、RSS、API、MCP、站点地图）全部读 `publication/`，不绕过这一层自己拼可见性条件。
- 每个付费调用先走 `providers/receipts.ts` 记一张回执再花钱，进程重启或重试时复用已付费的结果；每个服务有独立的预算熔断。
- 读者打开页面不触发模型调用，模型只在 worker 的任务里调用；安全阀（`COLLECT_ENABLED`、`MODEL_CALLS_ENABLED` 等）只有写成 `true` 才打开。

## 跨进程契约

- 后台接口类型以 `packages/contracts/src/admin.ts` 为准。
- 任务载荷类型以 `packages/backend/src/jobs/queue.ts` 的 `JobData` 为准，发送方（业务代码 `boss.send(...)`）和接收方（worker 的 `boss.work(...)`）共享同一份类型，payload 不会在两边悄悄漂移。
