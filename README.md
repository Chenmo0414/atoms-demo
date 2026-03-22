# Atoms Demo

> AI 驱动的网页应用生成器 —— 描述你的需求，秒级生成可运行的应用。

约 6 小时内构建的聚焦型 Demo，完整呈现 Atoms 的核心价值链路：自然语言输入 → AI 生成应用 → 实时预览 → 迭代修改 → 持久化历史 → 可分享链接。

---

## 产品简介

在输入框中输入"帮我做一个习惯打卡 App"，右侧预览区即出现一个可交互的网页应用。你可以继续对话修改，查看历史版本，并通过公开链接分享给任何人。

---

## 技术栈

| 层次 | 选型 | 选择理由 |
|---|---|---|
| 框架 | Next.js 14 (App Router) | 全栈一体，内置 API Routes、SSR、流式响应 |
| 语言 | TypeScript | 前后端统一类型安全 |
| 样式 | Tailwind CSS + shadcn/ui | 快速搭建 UI，设计系统一致 |
| 数据库 | PostgreSQL + Prisma | 成熟可靠，迁移简单 |
| 认证 | iron-session | 轻量 Cookie Session，无需额外基础设施 |
| LLM | 多 Provider（Anthropic / OpenAI / 百炼） | 灵活切换，兼顾成本与可用性 |
| 代码编辑器 | Monaco Editor | 浏览器内 VSCode 级别编辑体验 |
| 数据请求 | SWR | 客户端缓存 + 自动重新验证 |
| 国际化 | 自定义 Context（中/英） | 无需重型 i18n 库，轻量双语支持 |
| 部署 | PM2 + Nginx | 简单稳定，无需容器化 |
| 包管理 | pnpm | 安装速度快，支持 Workspace |

---

## 本地启动

### 前置条件

- Node.js 18+
- pnpm（`npm install -g pnpm`）
- 一个可用的 PostgreSQL 实例

### 1. 克隆并安装依赖

```bash
git clone <repo-url>
cd atoms
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`：

```env
# PostgreSQL 连接字符串
DATABASE_URL=postgresql://user:password@localhost:5432/atoms

# Session 加密密钥（任意 32 位以上随机字符串）
SESSION_SECRET=your-random-secret-here

# 选择 AI Provider（三选一）
AI_PROVIDER=bailian        # 可选: anthropic / openai

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_BASE_URL=https://api.anthropic.com

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1

# 阿里云百炼 / DashScope（通义、Kimi、GLM）
DASHSCOPE_API_KEY=sk-...
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

### 3. 初始化数据库

```bash
pnpm prisma migrate dev
```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)。

---

## 生产部署（PM2 + Nginx）

### 构建

```bash
pnpm build
```

构建命令会依次执行：`prisma generate && prisma migrate deploy && next build`。

### 用 PM2 启动

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # 设置开机自启
```

### Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        # 流式生成必须关闭缓冲，否则 SSE 不会实时推送
        proxy_buffering off;
        proxy_read_timeout 300s;
    }
}
```

> **关键配置：** `proxy_buffering off` 是必须项。不配置此项，服务端 SSE 流会被 Nginx 缓冲，生成过程中预览区不会实时更新。

---

## 环境变量说明

| 变量名 | 是否必填 | 说明 |
|---|---|---|
| `DATABASE_URL` | 是 | PostgreSQL 连接字符串 |
| `SESSION_SECRET` | 是 | Cookie 加密密钥（32 位以上） |
| `AI_PROVIDER` | 是 | `anthropic` / `openai` / `bailian` |
| `ANTHROPIC_API_KEY` | 使用 Anthropic 时必填 | Claude API Key |
| `ANTHROPIC_BASE_URL` | 否 | 用于代理或兼容端点 |
| `OPENAI_API_KEY` | 使用 OpenAI 时必填 | OpenAI API Key |
| `OPENAI_BASE_URL` | 否 | 用于 Azure 或兼容端点 |
| `DASHSCOPE_API_KEY` | 使用百炼时必填 | 阿里云 DashScope Key |
| `DASHSCOPE_BASE_URL` | 否 | DashScope API 地址 |

---

## 核心流程

```
首页
  └─ 输入 Prompt + 选择模型
       └─ POST /api/projects（创建项目）
            └─ 创建成功 → 跳转 /project/[id]

工作台页面（/project/[id]）
  ├─ 左侧：对话面板
  │   ├─ 工程师模式：AI 生成方案 → 用户确认 → 开始生成
  │   ├─ 直接模式：输入 Prompt → 立即生成
  │   └─ 竞速模式：两个模型并行生成，用户选优
  ├─ 右侧：预览区
  │   ├─ 预览 Tab：iframe 实时渲染
  │   ├─ 代码 Tab：Monaco 编辑器（HTML/CSS/JS）
  │   └─ 文件 Tab：工作区文件浏览器
  └─ 版本历史抽屉：浏览、恢复、标注版本

分享页（/p/[slug]）
  └─ 只读 iframe 预览 + "复刻此项目"入口
```

---

## 实现思路与关键取舍

### 生成策略：单文件 HTML

生成的应用是一个独立的 HTML 文件（内联 CSS 和 JS），而非 React 多文件项目，这是有意为之的选择：

- **为什么这样做：** Sandpack 多文件 React 构建引入了转译复杂度和潜在失败点。单个 HTML 文件（使用 CDN 引入的 React 或纯 JS）可靠、快速、始终可渲染。
- **代价：** 不支持 npm 包，不能拆分组件。对于 Demo 类应用（Todo、笔记、习惯追踪等）完全够用。
- **容错：** 如果生成的 HTML 无效，提取步骤会剥离 Markdown 代码块标记并重新解析，再失败才报错。

### 双受众设计

界面根据用户技术背景提供两套工作流：

**面向工程师**，提供完整控制权：
- **计划模式（Plan Mode）：** AI 先生成实现方案清单，用户审阅确认后再开始生成。对生成过程透明可控。
- **竞速模式（Race Mode）：** 两个模型并行生成，并排对比，用户选优。以更高成本换取更好质量。
- **模型选择器：** 覆盖 3 个 Provider 的 14 个模型（Claude、GPT、通义/Kimi/GLM），每个模型标注成本与能力。
- **代码编辑器：** Monaco 编辑器，支持生成后直接修改 HTML/CSS/JS。

**面向普通用户**，提供最简路径：
- 默认"直接模式"，跳过规划，立即生成。
- 自动路由逻辑（简单 Prompt → 低成本模型）的基础设施已铺好（`resolveModel()`），但自动决策部分尚未实现。
- 一句话到应用，零配置。

### 多 Provider LLM 架构

所有 Provider 通过 `src/lib/claude.ts` 中的统一 `generateAppStream()` 接口对外暴露。系统提示词、流式逻辑、HTML 提取均与 Provider 无关。新增一个 Provider 只需在 `src/lib/models.ts` 添加模型条目，并在流处理器中增加一个分支。

这为成本优化提供了基础：将简单生成路由到通义（低成本），将复杂规划路由到 Claude Opus（高能力），无需修改任何 UI 代码。

### 持久化模型

版本直接存储原始 HTML（而非文件树）。比多文件 Schema 简单，对单文件应用完全足够。版本号按项目自增，`isActive` 标志指向当前展示的版本。

项目有基于 nanoid 生成的 `slug`，用于公开分享 URL，与数据库内部 `id` 完全解耦。

### 认证：Session 而非 JWT

iron-session 将用户 ID 存入加密防篡改的 Cookie。无需 Token 刷新逻辑，无需外部认证服务。适合 Demo 场景——如需生产多租户使用，可替换为 JWT 或 NextAuth。

---

## 已完成功能

| 功能 | 状态 | 备注 |
|---|---|---|
| 用户注册 / 登录 | 完成 | 邮箱 + bcrypt 密码 |
| 从 Prompt 创建项目 | 完成 | 自动从 Prompt 提取项目标题 |
| AI 生成（流式） | 完成 | SSE 流实时推送到浏览器 |
| 实时预览（iframe） | 完成 | 自包含 HTML 渲染 |
| 对话历史 | 完成 | 多轮修改，携带上下文 |
| 版本历史 + 恢复 | 完成 | 全量版本存储，一键恢复 |
| 版本标注 | 完成 | 自定义版本标签 |
| 计划模式 | 完成 | AI 方案 → 确认 → 生成 |
| 竞速模式 | 完成 | 双模型并发生成，选优 |
| 代码查看 / 编辑 | 完成 | Monaco，拆分 HTML/CSS/JS Tab |
| 工作区文件浏览器 | 完成 | 磁盘持久化的解析文件树 |
| 公开分享页 | 完成 | 只读 `/p/[slug]` |
| 复刻 / 克隆项目 | 完成 | 复制任意项目到自己的工作区 |
| 发布开关 | 完成 | 控制项目公开可见性 |
| 多 Provider LLM | 完成 | Anthropic、OpenAI、百炼（14 个模型） |
| 模型选择器 UI | 完成 | 按厂商分组，带能力标签 |
| 深色 / 浅色 / 系统主题 | 完成 | 持久化到 localStorage |
| 双语 UI（中/英） | 完成 | 页头语言切换 |
| 生成中断恢复 | 完成 | 支持继续或放弃中断的生成 |
| 异步生成任务追踪 | 完成 | 数据库记录任务状态 |
| 用户设置页 | 完成 | 资料修改 + 密码更改 |
| 控制台（Dashboard） | 完成 | 项目列表 + 搜索 |
| 工作区成员管理 | 完成（Schema） | OWNER/EDITOR/VIEWER 角色，暂无 UI |

---

## 未实现的功能及原因

### 后端代码执行沙箱

最大的缺失：生成的应用无法运行服务端代码（Node.js、Python、数据库等）。

**为什么放弃：**

这是 Atoms 平台最难的部分——不是 vibe coding 本身，而是基础设施：每个 Session 的隔离 Docker 容器、容器生命周期管理（启动、空闲超时、销毁）、网络隔离、用于验证容器镜像的 CI/CD 流水线，以及让这一切稳定可靠所需的调试工作。主要的工作量不在代码生成上，而在服务端容器的调试、部署和 CI/CD 工作流的开发。保守估计，仅这个子系统就需要总预算的 2-3 倍时间，在 6 小时内无法完成。

交付一个不稳定的沙箱，比不交付更糟糕。当前方案（自包含 HTML）100% 可靠，且覆盖了最有说服力的 Demo 类应用（Todo、习惯追踪、笔记、Dashboard 等）。

**后续如何添加：**
- 容器：Docker + Node.js/Python 最小运行时镜像
- 编排：Kubernetes 或更简单的 Docker API 封装
- 沙箱隔离：gVisor 或 Firecracker
- 开发隧道：通过 WebSocket 代理将容器端口暴露给浏览器

### MCP / Skills 管理（面向工程师）

模型选择器和 Provider 路由是 Skill 路由系统的基础——AI 自动为每个子任务选择合适的工具/模型。架构已支持（模块化模型解析器、Provider 抽象），但实际的 MCP 集成、Skill 目录和路由逻辑尚未实现。

面向工程师，应该提供复杂的工作模式，例如 MCP Skills 的管理与编排；面向产品经理或普通用户，则应尽量简单直接，提供自动路由功能，进而节约成本。这个双轨设计已在架构上预留，但 `resolveSkill(prompt)` 层还未落地。

**扩展切入点：** `src/lib/models.ts` 中的 `resolveModel()` 函数。

### 自动成本感知模型路由

设计意图是：简单 Prompt → 低成本模型（通义 Mini），复杂 Prompt → 强力模型（Claude Opus），无需用户配置。基础设施已就位（多 Provider、模型元数据含成本档位），但路由决策逻辑尚未实现。

### 实时协作

未搭建 WebSocket 基础设施。多人实时编辑需要 Liveblocks 或 y.js。

### 工作区协作 UI

数据库 Schema 已有 `WorkspaceMember`（含角色），API 路由也已存在（`/api/workspaces/members`），但邀请和管理成员的 UI 尚未开发。

---

## 如果继续投入时间：扩展优先级

### P1 — 后端执行沙箱（高影响 · 高投入）

从"HTML 玩具"到"真正的应用生成器"，必须支持运行服务端代码。实现路径：
1. 每个用户 Session 分配一个 Docker 容器池
2. 通过 API 注入生成的文件
3. WebSocket 终端 + HTTP 预览代理
4. 空闲自动销毁

解锁能力：全栈应用生成、真实数据库、真实 API。

### P2 — MCP Skills + 自动路由（高影响 · 中投入）

构建 Skill 注册表，每个 Skill 包含：触发条件、模型偏好、系统提示词覆盖。路由器检测用户 Prompt 并自动选择合适的 Skill；工程师也可手动锁定特定 Skill。这直接落地双受众设计目标。

扩展切入点：`src/lib/models.ts` → `resolveModel()` → 增加 `resolveSkill(prompt)` 层。

### P3 — 流式计划执行（中影响 · 中投入）

当前计划模式是：生成完整方案 → 等用户确认 → 再生成。更有冲击力的 UX 是：方案条目逐条执行并带状态更新，真正呈现 Agent Pipeline 的感觉。Prisma 中的 `GenerationTask` 模型已为异步追踪做好准备。

### P4 — 版本 Diff 对比（中影响 · 低投入）

在代码 Tab 中展示两个版本的差异（Monaco 内置 Diff Editor）。让迭代修改的故事更清晰可见。

### P5 — 导出 / 一键部署

支持下载生成的 HTML 文件，或一键部署到 Vercel/Netlify（静态站点）。静态 HTML 导出无需后端基础设施。

### P6 — Prompt 模板 / 案例库

首页提供精选示例 Prompt，一键启动。解决新用户面对空白输入框的迷茫感。

---

## 开发过程

使用工具：
- **Claude Code** — 主力 Agent，负责脚手架、API 路由、组件连接
- **Codex** — 辅助代码生成，处理样板代码
- **OpenClaw** — 探索性查询与调研
- **Cursor** — 编辑器，内联 AI 辅助迭代

6 小时的时间约束迫使极度聚焦：每个功能决策都经过"这会让 Demo 更有说服力，还是只会增加复杂度？"的过滤。

耗时最长的三个点：
1. SSE 流式传输经过 Nginx 时的缓冲配置问题
2. HTML 提取的可靠性（处理各种 LLM 输出格式）
3. 竞速模式的状态管理（两个独立流式 Hook 并发）

---

## 已知限制

- 生成的应用为单文件 HTML，不支持 npm 包，不能运行服务端代码
- 不支持实时协作
- 无自动化测试套件
- Session 管理为 Demo 级别（单节点，无 Redis）
- 工作区成员管理暂无 UI
- 未实现基于 Prompt 复杂度的自动模型路由
- 生成接口无限流保护

---

## 示例 Prompt

```
帮我做一个习惯打卡应用，支持连续打卡天数统计和每周进度日历

创建一个个人财务看板，有收支分类和月度折线图

做一个世界地理知识竞赛，包含 10 道题目和最终得分页面

做一个番茄钟计时器，带任务列表和历史会话记录

创建一个食谱管理器，可以保存、搜索、按食材筛选菜谱
```

---

## 项目结构

```
src/
├── app/
│   ├── (auth)/           # 登录 / 注册页
│   ├── api/              # 所有 API 路由
│   │   ├── auth/         # 登录、注册、登出、当前用户
│   │   ├── generate/     # 流式生成端点
│   │   ├── plan/         # 方案生成端点
│   │   ├── projects/     # 项目 CRUD + 版本 + 发布 + 复刻
│   │   ├── race/         # 双模型竞速端点
│   │   ├── user/         # 用户资料管理
│   │   └── workspaces/   # 工作区 + 成员管理
│   ├── dashboard/        # 项目列表
│   ├── project/[id]/     # 工作台页面
│   ├── p/[slug]/         # 公开分享页
│   ├── settings/         # 用户设置
│   └── page.tsx          # 首页
├── components/
│   ├── workspace/        # ChatPanel、AppViewer、CodeViewer、RaceMode、VersionHistory、WorkflowPanel、ModelSelector
│   └── shared/           # ThemeToggle、LangToggle
├── contexts/             # ThemeContext、LangContext
├── hooks/                # useGenerate、usePlan、useRace
├── lib/                  # claude、db、models、auth、extractCode、workspace、utils
├── locales/              # zh.ts、en.ts
└── types/                # 共享 TypeScript 类型定义
prisma/
└── schema.prisma         # User、Project、Version、Message、GenerationTask、Workspace
```
