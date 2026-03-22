# CLAUDE.md

## Project
Mini Atoms Demo

目标：在 6 小时内交付一个可运行、可在线访问、具备真实交互与数据持久化的网页应用 Demo，体验上接近 Atoms 的核心价值：
- 用户输入需求
- AI 生成小型网页应用
- 右侧实时预览
- 支持继续修改
- 保存历史版本
- 可通过链接分享查看

这是一个 **范围严格收敛的 Demo**，不是完整 Atoms 平台复刻。

---

## Success Criteria

必须满足：
1. 有真实交互，不是静态页面
2. 有数据持久化（PostgreSQL）
3. 有在线访问链接
4. 支持基本主流程：创建项目 → 输入需求 → AI 生成 → 预览 → 保存 → 再编辑
5. 至少一个延展能力：版本历史 / 回滚

优先级排序：
1. 跑通闭环
2. 稳定可演示
3. UI 清晰
4. 工程结构干净
5. 再考虑附加亮点

---

## Non-Goals

本次不要做：
- 真正复刻 Atoms 全量功能
- 真正多智能体并发编排
- 用户生成应用一键部署到公网
- 完整注册登录体系
- 复杂权限系统
- 在线 IDE 级文件编辑体验
- 任意 npm 依赖安装与运行
- 后端代码生成与执行沙箱

任何会显著增加不确定性的功能，默认不做。

---

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma
- PostgreSQL
- Sandpack
- OpenAI SDK / compatible LLM API
- PM2 + Nginx
- pnpm

部署形态：
- Next.js app 由 PM2 启动
- Nginx 做反向代理
- PostgreSQL 使用已有实例

---

## Product Scope

### Required Pages

1. Landing Page
   - 产品标题
   - 需求输入框
   - 开始生成按钮
   - 最近项目列表

2. Builder Page
   - 左侧：对话 / 指令输入
   - 中间：生成状态 / 版本列表
   - 右侧：预览区（Sandpack）

3. Share Page
   - 只读访问
   - 展示最新版本预览
   - 提供基本项目信息

### Required Features

1. Create Project
   - 输入 prompt 后创建项目
   - 生成首个版本

2. Generate App
   - AI 根据 prompt 生成 React 单页应用
   - 输出标准化 Sandpack files JSON
   - 在右侧预览运行

3. Continue Editing
   - 基于当前版本继续修改
   - 生成新版本并刷新预览

4. Persistence
   - 保存项目、消息、版本
   - 刷新页面后可恢复

5. Share Link
   - 每个项目有只读分享页

6. Version History
   - 展示历史版本
   - 支持切换查看
   - 如时间允许，支持回滚

---

## Implementation Strategy

### Core Principle

**Fake it smart.**

界面上可以呈现为“Planner / Builder / Fixer”多阶段工作流，
但实现上优先用单模型串行调用，不做真实多 agent 编排。

### Generation Constraints

为了提升成功率，模型输出必须满足：
- 仅生成 React 单页应用
- 不依赖额外 npm 包
- 必须包含 `/App.tsx` 和 `/index.tsx`
- 可包含 `/styles.css`
- 输出必须是合法 JSON
- 不生成服务端代码
- 不访问外部 API
- 默认使用前端内存 mock 数据
- 代码以稳定可运行优先，不追求花哨

### Allowed Demo App Types

优先支持：
- Todo App
- Habit Tracker
- Notes App
- Expense Tracker
- Quiz App
- Simple Dashboard
- Recipe Planner

避免：
- 电商系统
- 支付系统
- 实时协作
- 多租户 SaaS
- 复杂后台系统

---

## Database Design

### projects
- id
- title
- session_id
- latest_version_id
- share_slug
- created_at
- updated_at

### messages
- id
- project_id
- role
- content
- created_at

### versions
- id
- project_id
- prompt
- files_json
- summary
- created_at

说明：
- `files_json` 直接存储 Sandpack 所需文件结构
- 不做复杂文件树数据库拆分
- 优先保证快速读写与版本恢复

---

## Suggested File Structure

```txt
src/
  app/
    page.tsx
    project/[id]/page.tsx
    share/[slug]/page.tsx
    api/
      generate/route.ts
      projects/route.ts
      projects/[id]/route.ts
      versions/[id]/route.ts
  components/
    builder/
      prompt-panel.tsx
      version-list.tsx
      preview-pane.tsx
      status-steps.tsx
    ui/
  lib/
    db.ts
    prisma.ts
    sandpack.ts
    prompts.ts
    session.ts
  server/
    generate-app.ts
    projects.ts
prisma/
  schema.prisma
```

可根据实际脚手架调整，但保持分层清晰。

---

## UX Rules

- 首屏必须让用户立刻理解“这是一个 AI 生成应用的工具”
- 生成中必须有明确状态反馈
- 错误提示必须可理解，不要直接抛 raw error
- Builder 页面三栏布局优先，保证演示直观
- 预览区永远是视觉重点
- 版本列表不必复杂，但必须清楚
- 默认走最短主流程，不要让用户做多余配置

---

## Engineering Rules

- 优先简单稳定方案，避免炫技
- 每新增一个功能，都要问：是否直接提升评审体验？
- 不为了“更像 Atoms”而引入高风险复杂度
- 先跑通主流程，再做美化和扩展
- 任何阻碍上线的功能都应该被降级或砍掉
- 所有 API 返回统一结构，便于前端处理
- 生成失败时提供兜底提示，不阻塞整个项目访问

---

## Delivery Rules

最终必须交付：
1. 在线访问链接
2. 可运行 Demo
3. README
4. 示例 prompt
5. 基本部署说明

README 至少包含：
- 项目简介
- 技术栈
- 核心流程
- 本地启动方式
- 环境变量说明
- 部署方式（PM2 + Nginx）
- 已知限制

---

## Timeboxing

如果总时间只有 6 小时，按以下顺序执行：

### Phase 1 - Skeleton
- 初始化项目
- 搭建页面骨架
- 接入数据库
- 搭基础部署

### Phase 2 - Core Loop
- prompt → AI generate → Sandpack preview 跑通

### Phase 3 - Persistence
- 保存 projects / versions / messages
- 刷新恢复

### Phase 4 - Iteration
- 支持继续修改
- 支持版本历史

### Phase 5 - Delivery
- 分享页
- 错误处理
- README
- 上线

如果时间不足，优先级砍掉顺序：
1. 复杂动画
2. 文件树展示
3. Code tab
4. 回滚
5. Landing 页装饰

不能砍掉：
- AI 生成
- 实时预览
- 持久化
- 在线访问

---

## Prompting Guidance

生成代码时，提示词应强调：
- 目标是生成一个可在 Sandpack 中运行的 React SPA
- 输出 JSON，不要解释
- 仅使用 React / ReactDOM / CSS
- 保持 UI 简洁清晰
- 代码可读
- 必须包含基本交互
- 不依赖后端

如一次生成失败，优先做一次修复重试；不要无限重试。

---

## Definition of Done

满足以下条件即可认为完成：
- 用户能访问在线页面
- 用户可输入需求创建项目
- AI 能生成一个可运行的小应用
- 右侧可正常预览
- 用户可继续修改并生成新版本
- 数据存入 PostgreSQL
- 分享页可访问
- README 完整

---

## Notes for Claude

在这个项目里，请始终记住：
- **目标不是“做得最大”，而是“在有限时间里做得最像成品”。**
- 遇到复杂实现时，优先选择可演示、可维护、可上线的简化方案。
- 如果某功能会显著增加不确定性，就把它降级成更稳的版本。
- 评审更看重完整闭环、工程取舍和可交付性，而不是功能数量。
