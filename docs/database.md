# 数据库

PostgreSQL 16/17。改表结构或写新迁移前先看这篇；迁移的完整约定（命名、排序执行、在线 DDL 限制、破坏性变更怎么处理）见 [架构](architecture.md#数据库迁移)，这里不重复，只给表的全貌和本地操作命令。

## 迁移怎么管理（摘要）

- 文件在 `database/migrations/`，命名 `NNNN_说明.sql`；只属于某个模块的表放在 `modules/<名字>/migrations/`，和引擎的迁移一起按**完整文件名**排序执行和记账——编号相同的不同文件分别执行，不能靠编号大小绕过顺序。
- 已发布的迁移是部署历史，不能改写或删除，修正放新文件。
- 从 `0055` 起，每个文件只放一条允许在线执行的语句（建索引用 `CREATE INDEX CONCURRENTLY IF NOT EXISTS`，加约束先 `NOT VALID` 再单独验证），`scripts/check-migrations.ts` 会检查新迁移是否符合这个限制。
- 大批数据回填、改类型、删列这类破坏性变更不放进常规迁移，要单独设计升级/回退步骤。

完整规则见 [架构](architecture.md#数据库迁移)。

## 核心表（按领域分组）

### 信源与采集

| 表 | 内容 |
|---|---|
| `sources` | 信源配置：`kind`（rss/web_list/json_list/x_search/mp_account/external）、分级 `tier`（T1/T1_5/T2/EXCLUDE_MP）、`participation_mode`（editorial/hot_signal/isolated）、`site_fulltext`/`syndicate_fulltext`（站内全文/对外全文两个独立授权）、抓取健康 `health`/`fail_count`、游标 `cursor`（只在成功抓取后前进） |
| `fetch_runs` | 每次抓取的执行记录 |

### 资料与正文

| 表 | 内容 |
|---|---|
| `articles` | 一条资料对应一行；`identity_key` 做跨入口判重，`timeline_at` 是实际排序时间（发现时间或存量资料的原文时间），`backfill` 标记是否按存量规则归档，`body_status` 跟踪正文抓取状态 |
| `article_revisions` | 正文修订历史 |
| `article_discoveries` | 同一条资料被多个入口发现时的记录 |
| `translations` | 全文翻译结果，`origin` 区分模型翻译/重放/信源自带 |

### 付费请求回执与预算

| 表 | 内容 |
|---|---|
| `receipts` | 每个付费请求一行；`logical_key` 是这个请求的稳定身份（任务+输入版本+服务商+模型+提示词+配置），用来做幂等和复用；`status` 含 `pending`/`unknown` 这种中间态 |
| `budgets` | 每个付费服务每分钟/每小时/每天的调用上限，填 0 立即停用 |

### AI 判断结果

| 表 | 内容 |
|---|---|
| `analyses` | 每次判断一行（append-only，不覆盖旧记录）：预筛结果 `relevance`、分类标签、中文标题摘要理由、分数 `score`、`selected`、`prompt_version`、`receipt_ids` |
| `editorial_overrides` | 人工更正，带 `version` 防止旧任务覆盖人工结果 |

### 事件归组与热度

| 表 | 内容 |
|---|---|
| `stories` | 事件（跟踪的一条线），`status`（active/watching/settled），`merged_into` 指向被合并后的目标 |
| `story_aliases` | 事件合并后旧 public_id 的 308 跳转表 |
| `story_links` | 事件之间的关系（storyline/related） |
| `story_digests` | 事件综述的历史版本 |
| `facts` | 一个具体事实（谁做了什么，有时间有依据），挂在某个事件下 |
| `fact_articles` | 事实和支撑它的报道的关联，`role`（primary/report/mention） |
| `story_signals` | 热度的讨论证据（如 X 讨论帖），每个参与者+资料一行 |
| `hot_rankings` | 热度榜的历史快照 |
| `story_heat_hourly` | 按小时的热度明细，用于计算趋势 |
| `embeddings` | 事件候选召回用的向量（没有 pgvector 扩展，查询时扫最近窗口） |
| `grouping_decisions` | 每次归组判断的留痕：候选、结论、用的回执 |

### 公开发布

| 表 | 内容 |
|---|---|
| `publications` | **唯一的公开投影表**，所有公开出口都读这张表（`eligible`/`selected`/`visibility` 控制可见性，`search_text` 支撑搜索）——其派生规则由 `publication/scope.ts` 统一定义 |
| `selected_ledger` / `selected_state` | 精选同步接口的变更日志（`upsert`/`remove`）和当前状态快照 |

### 报告与主题

| 表 | 内容 |
|---|---|
| `reports` | 日报/周报/月报，`(kind, key)` 唯一 |
| `report_revisions` | 报告的历史修订 |
| `topics` | 主题（公司/方向/内容形态），`slug` 永久不变 |

### 后台、审计与运维

| 表 | 内容 |
|---|---|
| `admin_users` / `admin_sessions` | 管理员身份；会话 id 哈希存储，cookie 只带随机值 |
| `audit_log` | 后台操作审计（谁、做了什么、改前改后） |
| `feedback` / `feedback_bans` | 读者反馈与封禁 |
| `ingest_events` | 外部推送接口的调用记录 |
| `settings` | 后台可编辑的小型键值配置 |
| `stored_files` | 截图、二维码、分享图缓存等按内容哈希寻址的文件 |
| `job_runs` | 每个定时任务/采集任务的执行记录，后台"运行"页读这张表 |
| `selectbench_runs` / `selectbench_results` | 精选评测的运行记录和逐条结果 |

## 本地操作

```bash
node --env-file=.env scripts/migrate.ts   # 执行所有未执行过的迁移（按完整文件名排序）
node --env-file=.env scripts/seed.ts      # 导入 industry/sources.json 的示范信源（幂等）
```

CI/发布前检查新迁移是否符合在线 DDL 限制：`scripts/check-migrations.ts`（被 `scripts/migration-safety.ts` 定义的允许语句词表驱动，两者都不直接手动跑）。

测试时数据库名必须以 `_test` 或 `_ci` 结尾，不存在会自动建库并迁移，账号需要 `CREATEDB` 权限（每个测试文件在它自己的一份库副本上并行跑）。
