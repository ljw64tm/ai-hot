# 项目架构问答笔记:数据从哪来、怎么更新

## 1. 整体链路

```
信源(RSS/网页/JSON/X/公众号)
  ↓ worker 定时抓取
采集(判重 · 抓原文)
  ↓
判断与写作(调 AI 模型:预筛 · 评分 · 标题摘要 · 结构化)
  ↓
归组(事件 · 热度 · 综述)
  ↓
写入数据库
  ↓
公开读取层 publication/(网页 · RSS · API v1 · MCP · 站点地图 · 分享图读的都是这一层)
  ↓
apps/web(React)通过 HTTP 读 apps/api 渲染页面
```

- 数据库里存的不是"页面"本身,而是模型离线分析/写作后的结构化结果(标题、摘要、评分、分组、事件综述等)。
- 页面渲染时只读这些已经算好的数据,**不会触发任何模型调用**(`docs/architecture.md` 的硬规则:"页面不调模型")。

## 2. 三个独立进程

| 进程 | 代码位置 | 职责 |
|---|---|---|
| api | `apps/api/` | Fastify,网站自用接口、公开 API、RSS、MCP、后台接口 |
| worker | `apps/worker/` | pg-boss 任务队列和定时任务:抓信源、调模型、归组、热度、日报、告警、清理 |
| web | `apps/web/` | React Router 服务端渲染,只通过 HTTP 读 api,不碰数据库 |

本地要看到真实更新的数据,三个都要起:

```bash
npm run dev:api
npm run dev:worker   # 真正干活的那个
npm run dev:web
```

只开 api + web、不开 worker,数据库数据永远不会更新。

## 3. worker 是不是每隔几分钟都会花 token?

**不是。** 定时任务每隔几分钟做的是"查数据库里有没有活要干",不是无条件调模型:

- `content.sweep`(每 5 分钟):查有没有超过 3 分钟还处于 `new` 状态的文章,**有才排队处理**,没有就是一次空查询。
- `content.translate`(每 5 分钟):查有没有已发布、全文、非中文、还没翻译的文章,没有就直接返回。
- `hot.rank`(每 5 分钟):纯粹用已有数据算热度排序,**不调 AI 模型**。

真正消耗 token 的前提是:**有新内容被采集进来**,且 `MODEL_CALLS_ENABLED=true` 并配置了有效的 `LLM_API_KEY`。

## 4. 内容更新频率一览(北京时间,见 `apps/worker/src/schedules.ts`)

| 任务 | 频率 |
|---|---|
| 抓信源(`sources.schedule`) | 每分钟检查哪个信源到了该抓的间隔 |
| 判重/清洗(`content.sweep`) | 每 5 分钟 |
| 全文翻译 | 每 5 分钟 |
| 热度计算 | 每 5 分钟 |
| 事件归组(`stories.links`) | 每小时第 12 分 |
| 日报/周报/月报出刊检查 | 每 30 分钟检查是否到出刊时间点 |

出刊时间点定义在 `site/site.ts` 的 `EDITION_TIMES`:日报 08:00、周报每周一 10:00、月报每月 1 日 10:30(北京时间)。

## 5. 怎么判断新内容要不要被采集

两层判断:

1. **该不该抓**:每个信源在数据库 `sources` 表有 `next_fetch_at`,`sources.schedule` 每分钟查到点的信源(`enabled` 且到了 `next_fetch_at`),排进 `fetchSource` 队列,抓完把 `next_fetch_at` 往后推 10 分钟。实际间隔每天会按 `adaptIntervals` 自适应调整(过去 7 天产出越频繁间隔越短,最快 15 分钟;安静的信源最长拉到 2 小时)。
   初始信源列表来自 `industry/sources.json`(首次启动导入,之后改动在后台"信源管理"里,不会被这个文件覆盖)。

2. **是不是新的**:抓回来的候选条目按 `identityKey`(通常是归一化后的 URL)去重 —— 数据库 `articles` 表已有相同 `identityKey` 的算旧内容跳过,没有的才插入新记录(状态 `new`),之后才会被 `content.sweep` 捞去做正文提取、预筛、评分(这一步才真正调模型花钱)。

## 6. 去哪抓(按信源 `kind`)

- `rss`:直接请求配置的 `feedUrl`(例如 OpenAI News 的 `https://openai.com/news/rss.xml`)。
- `web_list` / `json_list`:请求配置的网页/JSON 接口,解析出链接列表。
- `x_search`:通过第三方 API(SocialData)搜索 X/Twitter。
- 公众号:通过 Dajiala 第三方服务查公众号文章。

实际发请求的入口是 `fetchSource` 队列的 worker(`packages/backend/src/jobs/sources.ts`),调用 `collectSource(sourceId)`。

## 7. 本地看不到内容时排查

- `.env` 里 `COLLECT_ENABLED` 和 `MODEL_CALLS_ENABLED` 要是 `true`(`init-env.ts` 生成的默认是开的)。
- `LLM_API_KEY` 没填或填错:预筛和评分调不动模型,内容会停在"全部动态"之前甚至更早,去 `/admin` 的"运行"页看报错。
- 等不及定时任务:可以用 `docs/dev-setup.md` 里的手动触发单个信源抓取的办法(信源 `id` 见 `industry/sources.json` 或后台"信源管理"),但抓完还要靠跑着的 `dev:worker` 做后续预筛/评分/写作/归组。
