# 本地开发

给要改代码、需要热更新和快速反馈的程序员。只讲本机开发这一条路；要部署给读者用，见 [部署](deploy.md)（Docker 或生产环境裸机）。

## 准备

- Node.js 24.11 以上
- 本机能跑一个 PostgreSQL 16 或 17（装一个本机实例，或者只用 Docker 跑 `db` 这一个容器都行）
- 一个 OpenAI 兼容的模型 API Key（DeepSeek、千问、智谱都可以），没有 key 也能跑网页和后台，但不会有任何真实内容

```bash
git clone https://github.com/KKKKhazix/AIHOT.git myhot
cd myhot
npm ci
```

## 配置

```bash
node scripts/init-env.ts --llm-key <你的模型 API Key>
```

生成 `.env`，随机密钥和管理员密码都已经填好（密码只打印这一次，也存在 `.env` 的 `ADMIN_PASSWORD` 里）。没传 `--llm-key` 的话自己去 `.env` 补上 `LLM_API_KEY`。

本机直接跑（不用 Docker 的 `db` 容器）时，建一个数据库，再在 `.env` 里加两行：

```bash
createdb myhot_dev
```

```dotenv
DATABASE_URL=postgres://你的用户名@127.0.0.1:5432/myhot_dev
API_BASE_URL=http://127.0.0.1:3001
```

这两行默认在 `.env.example` 里是注释掉的（"不用 Docker、直接在本机跑时才需要"那一节），取消注释填好就行。想在开发时免登录进 `/admin`，再加一行 `DEV_AUTH_ROLE=admin`（生产环境会拒绝启动，不用担心带到线上）。

## 跑起来

```bash
node --env-file=.env scripts/migrate.ts   # 建表
node --env-file=.env scripts/seed.ts      # 导入示范信源
```

然后开三个终端，各跑一个带热更新的进程：

```bash
npm run dev:api      # Fastify 接口，默认 3001 端口
npm run dev:worker   # pg-boss 任务队列：抓取、调模型、归组、出刊
npm run dev:web      # React Router 网页，默认 3000 端口，通过 API_BASE_URL 读 api
```

三个都用 `node --watch`（web 是 `react-router dev`），改代码直接生效，不用重启。打开 `http://localhost:3000`，后台在 `/admin`。

## 等不及定时任务，手动跑一次采集

默认信源要等 worker 的定时任务轮到它才抓；本地调试时想立刻看到数据，直接触发：

```bash
node --env-file=.env scripts/collect.ts <source-id> [...更多 source-id]
```

`source-id` 是 `industry/sources.json` 里信源的 `id`，或者在后台"信源管理"里看。抓到的内容还要排队给 worker 做预筛、评分、写作、归组，这些事只在 worker 跑着的时候才会发生——确认 `npm run dev:worker` 那个终端在跑。

## 为什么看不到内容

- `.env` 里 `COLLECT_ENABLED` 和 `MODEL_CALLS_ENABLED` 要是 `true`（`init-env.ts` 生成的默认就是开的）。这两个是安全阀，只认小写 `true`，没写或写别的都算关。
- 没填 `LLM_API_KEY`（或者填错了）：预筛和评分调不动模型，内容会停在"全部动态"之前甚至更早；去 `/admin` 的"运行"页看报错。
- 数据库账号没有 `CREATEDB` 权限：跑测试会失败（见下）；本地开发库本身不需要这个权限,只有建库这一步需要。
- 付费请求有预算熔断，默认额度足够开发用；真的撞到上限会在"运行"页和 `/admin` 的"设置 → 付费请求上限"看到。

## 检查改动

```bash
npm run typecheck
DATABASE_URL=postgres://127.0.0.1:5432/myhot_test npm test   # 库名必须以 _test 或 _ci 结尾，没有会自动建好并迁移
npm run build -w @aihot/web && node --test apps/web/tests/*.test.ts
node scripts/smoke.ts --base http://localhost:3000             # 三个进程都在跑的时候
```

测试不访问任何外部服务：模型、X、公众号、Jina 都连本地假服务，用的数据库账号要有建库权限（`CREATEDB`）。

## 接下来

- 整体数据流和三个进程怎么分工：[架构](architecture.md)
- 前端、后端、数据库、AI 流程各自怎么组织：[前端](frontend.md)、[后端](backend.md)、[数据库](database.md)、[AI 处理流程](ai-pipeline.md)
- 要部署给真实读者用：[部署](deploy.md)
