# 前端

`apps/web`，React Router v7（服务端渲染）+ Tailwind CSS。改这块代码前先看这篇；整体三进程分工见 [架构](architecture.md)。

## 不变的规则

**前端只通过 HTTP 读 `apps/api`，不碰数据库，不调用模型，不存密钥。** `apps/web/app/lib/api.server.ts` 的注释写得很直接："the web process never touches the database; SSR reads the api over loopback"。页面打开时只读 api 已经算好的结果，不会触发任何模型调用。

## 入口文件

| 文件 | 作用 |
|---|---|
| `apps/web/app/entry.server.tsx` | 服务端渲染入口 |
| `apps/web/app/entry.client.tsx` | 浏览器端 hydration 入口 |
| `apps/web/app/root.tsx` | 根布局（导航、页脚、全局 Provider） |
| `apps/web/server.ts` | 生产环境的 HTTP 服务器：构建产物的静态文件由它来发，api 自己的路径（`/api/*`、`/feed*`、`/og/*` 等）直接代理给 `apps/api`，其余走 SSR |

## 路由

`apps/web/app/routes.ts` 是唯一的路由表（React Router 的 `RouteConfig`），每个页面对应 `apps/web/app/routes/` 下一个文件：

- 公开页面：`home.tsx`（首页精选）、`all.tsx`（全部动态）、`item.tsx`/`item-original.tsx`（条目详情/原文）、`hot.tsx`（热点榜）、`story.tsx`（事件页）、`report-latest.tsx`/`report-detail.tsx`/`daily-archive.tsx`（日报周报月报）、`topics.tsx`/`topic.tsx`（主题）、`about.tsx`、`terms.tsx`、`privacy.tsx`、`changelog.tsx`、`feedback.tsx`、`more.tsx`、`starred.tsx`（收藏）、`agent.tsx`（Agent 接入说明）
- 后台页面：`admin-login.tsx` 加一个 `admin/layout.tsx` 布局下的 `admin/index.tsx`、`content.tsx`/`content-item.tsx`、`sources.tsx`/`source.tsx`/`source-new.tsx`、`feedback.tsx`、`runs.tsx`、`models.tsx`、`selectbench.tsx`/`selectbench-run.tsx`、`settings.tsx`、`audit.tsx`
- 模块页面：`routes.ts` 读 `site/modules/` 的清单（`MODULES`），把每个启用模块声明的 `pages`/`adminPages` 自动拼进路由表，框架代码本身不 import 任何模块

## 和后端通信

- `apps/web/app/lib/api.server.ts` — `apiGet`（给 loader 用的 `fetch` 封装，15 秒超时，透传响应头方便设置缓存）、`loadOr404`、`cachedPage`（给页面设置响应的 `Cache-Control`）。目标地址是 `API_BASE_URL`（默认开发用 `http://127.0.0.1:3001`）。
- `apps/web/app/lib/api-proxy.server.ts` — `proxyToApi`：把 api 自己拥有的路径（如 `/api/*`、RSS、OG 图）原样转发给 api，去掉逐跳头，`server.ts` 用它做反向代理。

## 开发命令

```bash
npm run dev -w @aihot/web     # = npm run dev:web，react-router dev，默认 3000 端口，带热更新
npm run build -w @aihot/web   # 生产构建
npm run typecheck -w @aihot/web   # react-router typegen && tsc -p .
```

## 模块怎么接页面

一个模块想加页面或导航项，在它的 `web.tsx` 里声明（类型见 `packages/contracts/src/modules.ts`），列进 `site/modules/web.ts` 的清单即可；只在某一页出现的部件给出按需加载函数，随那一页代码一起加载，不拖慢其他页面。详见 [架构](architecture.md#模块)。
