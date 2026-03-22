# Atoms Demo

> AI-driven web app generator — describe what you want, get a running app in seconds.

A focused demo built in ~6 hours that demonstrates the core Atoms value proposition: natural language input → AI-generated React application → live preview → iterative editing → persistent history → shareable link.

---

## Live Demo

Input a prompt like "build me a habit tracker" and watch a fully interactive web app appear in the preview pane. Continue refining it through conversation, browse version history, and share via a public link.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack with API routes, SSR, streaming |
| Language | TypeScript | Type safety across front and back |
| Styling | Tailwind CSS + shadcn/ui | Rapid UI, consistent design system |
| Database | PostgreSQL + Prisma | Relational, mature, easy migrations |
| Auth | iron-session | Lightweight cookie session, zero infra overhead |
| LLM | Multi-provider (Anthropic / OpenAI / Bailian) | Flexibility for cost and availability |
| Code Editor | Monaco Editor | VSCode-quality editing in-browser |
| Data Fetching | SWR | Client-side caching with revalidation |
| i18n | Custom context (zh/en) | Bilingual support without heavy library |
| Deployment | PM2 + Nginx | Simple, production-ready, no containers needed |
| Package Manager | pnpm | Faster installs, workspace support |

---

## Quick Start (Local)

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- PostgreSQL instance running

### 1. Clone and install

```bash
git clone <repo-url>
cd atoms
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/atoms

# Session encryption key (any random 32+ char string)
SESSION_SECRET=your-random-secret-here

# Choose one AI provider
AI_PROVIDER=bailian        # or: anthropic / openai

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_BASE_URL=https://api.anthropic.com

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1

# Alibaba Bailian / DashScope (Qwen, Kimi, GLM)
DASHSCOPE_API_KEY=sk-...
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

### 3. Initialize database

```bash
pnpm prisma migrate dev
```

### 4. Run development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Production Deployment (PM2 + Nginx)

### Build

```bash
pnpm build
```

This runs `prisma generate && prisma migrate deploy && next build` in sequence.

### Start with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # auto-restart on reboot
```

### Nginx reverse proxy

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
        # Required for SSE streaming
        proxy_buffering off;
        proxy_read_timeout 300s;
    }
}
```

> **Note:** `proxy_buffering off` is critical — without it, Server-Sent Events for streaming generation will be buffered and the real-time preview won't work.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Cookie encryption key (32+ chars) |
| `AI_PROVIDER` | Yes | `anthropic` / `openai` / `bailian` |
| `ANTHROPIC_API_KEY` | If using Anthropic | Claude API key |
| `ANTHROPIC_BASE_URL` | No | Override for proxy/compatible endpoints |
| `OPENAI_API_KEY` | If using OpenAI | OpenAI API key |
| `OPENAI_BASE_URL` | No | Override for Azure or compatible endpoints |
| `DASHSCOPE_API_KEY` | If using Bailian | Alibaba DashScope key |
| `DASHSCOPE_BASE_URL` | No | DashScope API base URL |

---

## Core User Flow

```
Landing Page
  └─ Enter prompt + select model
       └─ POST /api/projects (create project)
            └─ Project created → redirect to /project/[id]

Builder Page (/project/[id])
  ├─ Chat Panel (left)
  │   ├─ Engineer Mode: choose plan → confirm → generate
  │   ├─ Direct Mode: prompt → generate immediately
  │   └─ Race Mode: two models generate in parallel, pick winner
  ├─ Preview Pane (right)
  │   ├─ Live tab: iframe preview
  │   ├─ Code tab: Monaco editor (HTML/CSS/JS)
  │   └─ Files tab: workspace file browser
  └─ Version History drawer: browse, restore, label versions

Share Page (/p/[slug])
  └─ Read-only iframe preview + "Clone" CTA
```

---

## Implementation Approach & Key Trade-offs

### Generation Strategy: Single HTML File

Generated apps are a single self-contained HTML file (with inline CSS and JS), not a multi-file React project. This was a deliberate choice:

- **Why:** Sandpack/multi-file React builds introduce transpilation complexity and failure modes. A single HTML file with vanilla JS or inline React (via CDN) is reliable, fast, and always renders.
- **Trade-off:** No npm packages, no component splitting. Acceptable for demos (Todo, Notes, Habit Tracker, etc.).
- **Recovery:** If generation produces invalid HTML, the extract step strips markdown fencing and retries parsing before failing.

### Dual Audience Design

The interface provides two distinct workflows based on user sophistication:

**Engineers** get full control:
- **Plan Mode:** AI first generates an implementation plan (checklist), user reviews and confirms, then generation begins. Transparent about what will be built.
- **Race Mode:** Two models generate simultaneously, side-by-side comparison, user picks the winner. Optimizes for quality at higher cost.
- **Model Selector:** 14 models across 3 providers (Claude, GPT, Qwen/Kimi/GLM). Each has cost/capability annotations.
- **Code Editor:** Monaco editor for direct HTML/CSS/JS editing post-generation.

**Regular users** get simplicity:
- Default "Direct" mode skips planning, generates immediately.
- Auto-routing could select cheaper models for simpler prompts (groundwork laid via `resolveModel()`, not yet fully automated).
- Clean one-prompt-to-app flow with no configuration required.

### Multi-Provider LLM Architecture

All providers are unified through a single `generateAppStream()` interface in `src/lib/claude.ts`. The system prompt, streaming logic, and HTML extraction are provider-agnostic. Adding a new provider requires only adding model entries to `src/lib/models.ts` and a new branch in the stream handler.

This allows cost optimization: route simple generation to Qwen (cheap), complex planning to Claude Opus (capable), without changing any UI code.

### Persistence Model

Versions store raw HTML (not a file tree). This is simpler than a multi-file schema and sufficient for single-file apps. Version numbers are auto-incremented per project. The `isActive` flag points to the current displayed version.

Projects have a `slug` (nanoid-based) for public share URLs, independent of the internal database `id`.

### Auth: Sessions over JWT

iron-session stores the user ID in an encrypted, tamper-proof cookie. No token refresh logic, no external auth service. Appropriate for a demo — add JWT or NextAuth for production multi-tenant use.

---

## What's Built

| Feature | Status | Notes |
|---|---|---|
| User registration / login | Done | Email + bcrypt password |
| Project creation from prompt | Done | Auto-titles from prompt content |
| AI generation (streaming) | Done | SSE stream to browser |
| Live preview (iframe) | Done | Self-contained HTML rendering |
| Conversation history | Done | Multi-turn editing with context |
| Version history + restore | Done | All versions stored, one-click restore |
| Version labeling | Done | Custom labels per version |
| Plan Mode | Done | AI plan → confirm → generate |
| Race Mode | Done | Dual concurrent generation, pick winner |
| Code viewer / editor | Done | Monaco, split into HTML/CSS/JS tabs |
| Workspace file browser | Done | Disk-persisted parsed file tree |
| Public share page | Done | Read-only `/p/[slug]` |
| Remix / clone project | Done | Copy any project to your workspace |
| Publish toggle | Done | Controls public visibility |
| Multi-provider LLM | Done | Anthropic, OpenAI, Bailian (14 models) |
| Model selector UI | Done | Grouped by vendor with capability tags |
| Dark / light / system theme | Done | Persisted to localStorage |
| Bilingual UI (zh/en) | Done | Language toggle in header |
| Generation interruption recovery | Done | Resume or discard interrupted sessions |
| Async generation task tracking | Done | DB-backed task status |
| User settings page | Done | Profile + password change |
| Dashboard | Done | Project list with search |
| Workspace membership | Done | OWNER/EDITOR/VIEWER roles (DB schema) |

---

## What's Not Built (and Why)

### Backend Code Execution

The biggest omission: generated apps cannot run server-side code (Node.js, Python, databases, etc.).

**Why it was cut:**

This is the hardest part of the Atoms platform — not the vibe-coding, but the infrastructure: sandboxed Docker containers per session, container lifecycle management (spin up, idle timeout, teardown), network isolation, CI/CD to validate container images, and the debugging work to get all of this reliable. A conservative estimate is 2–3× the total budget just for this subsystem.

Shipping a broken sandbox is worse than shipping no sandbox. The current approach (self-contained HTML) is 100% reliable and covers the most compelling demo apps (Todo, Habit Tracker, Notes, Dashboard, etc.).

**How to add it later:**
- Container: Docker + a Node.js/Python minimal runtime image
- Orchestration: Kubernetes or a simpler Docker API wrapper
- Sandboxing: gVisor or Firecracker for isolation
- Dev tunnel: expose container port to browser via WebSocket proxy

### MCP / Skills Management (for engineers)

The model selector and provider routing is groundwork for a skill-routing system where the AI selects the right tool/model for each subtask. The architecture supports this (modular model resolver, provider abstraction) but the actual MCP integration, skill catalog, and routing logic are not implemented.

**Priority if extending:** High value for power users. The `resolveModel()` function in `src/lib/models.ts` is the right extension point.

### Automatic Cost-Aware Model Routing

The design intent was: simple prompts → cheap model (Qwen Mini), complex prompts → powerful model (Claude Opus), with no user configuration needed. The infrastructure exists (multi-provider, model metadata with cost tiers) but the routing decision logic is not implemented.

### Real-time Collaboration

WebSocket infra not set up. Would need Liveblocks or y.js for meaningful multi-user editing.

### Workspace Collaboration UI

The database schema has `WorkspaceMember` with roles, and the API routes exist (`/api/workspaces/members`), but no UI is built for inviting or managing members.

---

## If Given More Time: Extension Priorities

### Priority 1 — Backend Execution Sandbox (High Impact, High Effort)

The leap from "HTML toy" to "real app generator" requires running server-side code. Approach:
1. Docker container pool per user session
2. File injection via API
3. WebSocket terminal + HTTP preview proxy
4. Auto-teardown on idle

This unlocks: full-stack app generation, real databases, real APIs.

### Priority 2 — MCP Skills + Automatic Routing (High Impact, Medium Effort)

Build a skill registry where each skill has: trigger condition, model preference, system prompt override. The router inspects the user's prompt and selects the appropriate skill automatically. Engineers can also pin a specific skill. This directly addresses the dual-audience design goal.

Extension point: `src/lib/models.ts` → `resolveModel()` → add a `resolveSkill(prompt)` layer.

### Priority 3 — Streaming Plan Execution (Medium Impact, Medium Effort)

Currently, Plan Mode generates the entire plan, waits for user confirmation, then generates. A more compelling UX is: show plan items executing one by one with status updates, like a real agent pipeline. The `GenerationTask` model in Prisma is already set up for async tracking.

### Priority 4 — Version Diffing (Medium Impact, Low Effort)

Show a diff between versions in the Code tab (Monaco's diff editor is built-in). Makes the iteration story much clearer to reviewers.

### Priority 5 — Export / Deploy

Let users download the generated HTML file, or one-click deploy to Vercel/Netlify for static sites. No backend infra needed for static HTML export.

### Priority 6 — Prompt Templates / Gallery

Curated example prompts on the landing page that launch with one click. Reduces the "blank box" problem for new users.

---

## Development Process

Built using:
- **Claude Code** — primary agent for scaffolding, API routes, component wiring
- **Codex** — supplementary code generation for boilerplate
- **OpenClaw** — exploration and research queries
- **Cursor** — editor with inline AI assistance for iteration

The 6-hour constraint forced ruthless prioritization: every feature decision was filtered through "does this make the demo more convincing, or just more complex?"

The biggest time sinks were:
1. Streaming SSE through Nginx (buffering config)
2. HTML extraction reliability (handling various LLM output formats)
3. Race Mode state management (two independent streaming hooks)

---

## Known Limitations

- Generated apps are single-file HTML — no npm packages, no server-side code
- No real-time collaboration
- No automated testing suite
- Session management is demo-grade (single-node, no Redis)
- Workspace member management has no UI
- Auto model routing by prompt complexity is not implemented
- No rate limiting on generation endpoints

---

## Example Prompts to Try

```
Build a habit tracker with streak counting and a weekly progress calendar

Create a personal finance dashboard with income/expense categories and a monthly chart

Make a quiz app about world geography with 10 questions and a score screen

Build a Pomodoro timer with task list and session history

Create a recipe manager where I can save, search, and filter recipes by ingredient
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login / Register pages
│   ├── api/              # All API routes
│   │   ├── auth/         # Login, register, logout, me
│   │   ├── generate/     # Streaming generation endpoint
│   │   ├── plan/         # Plan generation endpoint
│   │   ├── projects/     # CRUD + versions + publish + remix
│   │   ├── race/         # Dual-model race endpoint
│   │   ├── user/         # Profile management
│   │   └── workspaces/   # Workspace + member management
│   ├── dashboard/        # Project list
│   ├── project/[id]/     # Builder workspace
│   ├── p/[slug]/         # Public share page
│   ├── settings/         # User settings
│   └── page.tsx          # Landing page
├── components/
│   ├── workspace/        # ChatPanel, AppViewer, CodeViewer, RaceMode, VersionHistory, WorkflowPanel, ModelSelector
│   └── shared/           # ThemeToggle, LangToggle
├── contexts/             # ThemeContext, LangContext
├── hooks/                # useGenerate, usePlan, useRace
├── lib/                  # claude, db, models, auth, extractCode, workspace, utils
├── locales/              # zh.ts, en.ts
└── types/                # Shared TypeScript interfaces
prisma/
└── schema.prisma         # User, Project, Version, Message, GenerationTask, Workspace
```
