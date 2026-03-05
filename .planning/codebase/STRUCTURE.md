# Codebase Structure

**Analysis Date:** 2026-03-05

## Directory Layout

```
deer-flow/
├── Makefile                          # Root commands (check, install, dev, stop)
├── README.md                         # Project overview and setup
├── config.example.yaml               # Example configuration (copy to config.yaml)
├── extensions_config.example.json    # Example extensions config
├── .env.example                      # Environment variable template
├── CLAUDE.md                         # Development guidelines
├── deer-flow.code-workspace          # VSCode workspace config
│
├── backend/                          # Python backend (LangGraph + Gateway)
│   ├── Makefile                      # Backend commands (dev, gateway, lint, test)
│   ├── pyproject.toml                # Python dependencies (uv)
│   ├── uv.lock                       # Locked dependency versions
│   ├── langgraph.json                # LangGraph server entry point config
│   ├── CLAUDE.md                     # Backend development guide
│   │
│   ├── src/
│   │   ├── __init__.py               # Package marker
│   │   ├── client.py                 # Embedded DeerFlowClient (in-process SDK)
│   │   │
│   │   ├── agents/                   # Agent system and middleware
│   │   │   ├── __init__.py
│   │   │   ├── thread_state.py       # ThreadState schema with custom reducers
│   │   │   ├── lead_agent/
│   │   │   │   ├── agent.py          # make_lead_agent() factory, middleware setup
│   │   │   │   ├── prompt.py         # System prompt templates and skill injection
│   │   │   │   └── __init__.py
│   │   │   ├── middlewares/          # 10 middleware modules
│   │   │   │   ├── thread_data_middleware.py
│   │   │   │   ├── uploads_middleware.py
│   │   │   │   ├── sandbox_middleware.py (SandboxMiddleware)
│   │   │   │   ├── dangling_tool_call_middleware.py
│   │   │   │   ├── memory_middleware.py
│   │   │   │   ├── title_middleware.py
│   │   │   │   ├── view_image_middleware.py
│   │   │   │   ├── subagent_limit_middleware.py
│   │   │   │   ├── clarification_middleware.py (last, interrupts)
│   │   │   │   └── __init__.py
│   │   │   ├── memory/
│   │   │   │   ├── updater.py        # LLM-based fact extraction
│   │   │   │   ├── queue.py          # Debounced update queue
│   │   │   │   ├── prompt.py         # Memory update prompts
│   │   │   │   └── __init__.py
│   │   │   └── __init__.py
│   │   │
│   │   ├── gateway/                  # FastAPI REST API
│   │   │   ├── app.py                # FastAPI app creation, lifespan
│   │   │   ├── config.py             # Gateway config (host, port)
│   │   │   ├── routers/
│   │   │   │   ├── models.py         # GET /api/models, /api/models/{name}
│   │   │   │   ├── mcp.py            # GET/PUT /api/mcp/config
│   │   │   │   ├── skills.py         # GET/PUT /api/skills, POST /api/skills/install
│   │   │   │   ├── memory.py         # GET/POST /api/memory
│   │   │   │   ├── artifacts.py      # GET /api/threads/{id}/artifacts/{path}
│   │   │   │   ├── uploads.py        # POST/GET/DELETE /api/threads/{id}/uploads
│   │   │   │   ├── agents.py         # Custom agent CRUD
│   │   │   │   └── __init__.py
│   │   │   └── __init__.py
│   │   │
│   │   ├── sandbox/                  # Sandbox execution system
│   │   │   ├── sandbox.py            # Abstract Sandbox interface
│   │   │   ├── provider.py           # SandboxProvider lifecycle
│   │   │   ├── tools.py              # bash, ls, read_file, write_file, str_replace
│   │   │   ├── middleware.py         # SandboxMiddleware for lifecycle
│   │   │   ├── local/
│   │   │   │   ├── sandbox.py        # LocalSandbox implementation
│   │   │   │   ├── provider.py       # LocalSandboxProvider singleton
│   │   │   │   └── __init__.py
│   │   │   └── __init__.py
│   │   │
│   │   ├── subagents/                # Task delegation system
│   │   │   ├── executor.py           # Background execution with polling
│   │   │   ├── registry.py           # Built-in agent registry
│   │   │   ├── builtins/
│   │   │   │   ├── general_purpose.py
│   │   │   │   ├── bash.py
│   │   │   │   └── __init__.py
│   │   │   └── __init__.py
│   │   │
│   │   ├── tools/                    # Tool system
│   │   │   ├── tools.py              # get_available_tools() factory
│   │   │   ├── builtins/
│   │   │   │   ├── clarification_tool.py    # ask_clarification
│   │   │   │   ├── present_file_tool.py     # present_files (outputs only)
│   │   │   │   ├── view_image_tool.py       # view_image (vision models)
│   │   │   │   ├── task_tool.py             # task (subagent delegation)
│   │   │   │   ├── setup_agent_tool.py      # Agent setup
│   │   │   │   └── __init__.py
│   │   │   └── __init__.py
│   │   │
│   │   ├── mcp/                      # Model Context Protocol integration
│   │   │   ├── cache.py              # Cached MCP tool loading with mtime checks
│   │   │   ├── client.py             # MultiServerMCPClient wrapper
│   │   │   └── __init__.py
│   │   │
│   │   ├── models/                   # Model factory and implementations
│   │   │   ├── factory.py            # create_chat_model() with thinking/vision support
│   │   │   ├── patched_deepseek.py   # DeepSeek-specific patches
│   │   │   └── __init__.py
│   │   │
│   │   ├── skills/                   # Skills discovery and management
│   │   │   ├── loader.py             # load_skills() recursively scans skills/ dir
│   │   │   └── __init__.py
│   │   │
│   │   ├── config/                   # Configuration system
│   │   │   ├── app_config.py         # Main config loader (config.yaml)
│   │   │   ├── extensions_config.py  # MCP + skills config (extensions_config.json)
│   │   │   ├── paths.py              # Thread-relative path resolution
│   │   │   ├── summarization_config.py
│   │   │   ├── memory_config.py
│   │   │   ├── agents_config.py
│   │   │   ├── sandbox_config.py
│   │   │   ├── tool_config.py
│   │   │   ├── tracing_config.py
│   │   │   ├── model_config.py
│   │   │   └── __init__.py
│   │   │
│   │   ├── reflection/                # Dynamic module loading
│   │   │   ├── __init__.py           # resolve_variable(), resolve_class()
│   │   │   └── error_hints.py        # Actionable error messages for missing modules
│   │   │
│   │   ├── community/                 # Community-provided tools
│   │   │   ├── tavily/               # Web search and fetch
│   │   │   ├── jina_ai/              # Jina reader API
│   │   │   ├── firecrawl/            # Firecrawl web scraping
│   │   │   ├── image_search/         # DuckDuckGo image search
│   │   │   ├── aio_sandbox/          # Docker-based sandbox
│   │   │   └── __init__.py
│   │   │
│   │   └── utils/                     # Shared utilities
│   │       ├── network.py            # URL validation, HTTP utilities
│   │       ├── readability.py        # Text extraction from HTML
│   │       └── __init__.py
│   │
│   ├── tests/                         # Test suite
│   │   ├── conftest.py               # Pytest fixtures and mocks
│   │   ├── test_client.py            # DeerFlowClient unit tests
│   │   ├── test_client_live.py       # Live integration tests
│   │   ├── test_docker_sandbox_mode_detection.py
│   │   ├── test_provisioner_kubeconfig.py
│   │   └── ...
│   │
│   └── docs/                          # Backend documentation
│       ├── CONFIGURATION.md
│       ├── ARCHITECTURE.md
│       ├── API.md
│       ├── FILE_UPLOAD.md
│       ├── PATH_EXAMPLES.md
│       ├── summarization.md
│       └── plan_mode_usage.md
│
├── frontend/                          # TypeScript/React frontend (Next.js)
│   ├── Makefile                       # Frontend commands (dev, build, check)
│   ├── package.json                   # Node dependencies (pnpm)
│   ├── pnpm-lock.yaml                 # Locked dependency versions
│   ├── tsconfig.json                  # TypeScript configuration
│   ├── next.config.ts                 # Next.js configuration
│   ├── tailwind.config.ts             # Tailwind CSS v4
│   ├── prettier.config.js             # Code formatting
│   ├── CLAUDE.md                      # Frontend development guide
│   │
│   ├── src/
│   │   ├── env.js                     # Environment validation (t3-oss/env-nextjs)
│   │   ├── app.css                    # Global styles
│   │   ├── styles/                    # Tailwind CSS and theming
│   │   │   ├── globals.css            # Global imports and variables
│   │   │   └── ...
│   │   │
│   │   ├── app/                       # Next.js App Router
│   │   │   ├── layout.tsx             # Root layout with theme, i18n
│   │   │   ├── page.tsx               # Landing page (/)
│   │   │   │
│   │   │   ├── api/
│   │   │   │   ├── auth/[...all]/route.ts  # Better-auth routes
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── workspace/             # Workspace routes
│   │   │   │   ├── layout.tsx         # Workspace layout with sidebar
│   │   │   │   ├── page.tsx           # Workspace home
│   │   │   │   ├── chats/
│   │   │   │   │   ├── page.tsx       # Chat list
│   │   │   │   │   └── [thread_id]/   # Single chat pages
│   │   │   │   ├── agents/
│   │   │   │   │   ├── page.tsx       # Agents list
│   │   │   │   │   ├── new/           # Create agent page
│   │   │   │   │   └── [agent_name]/  # Agent chat pages
│   │   │   │   └── ...
│   │   │   │
│   │   │   └── mock/                  # Mock API routes for demo mode
│   │   │       └── api/
│   │   │           ├── models/
│   │   │           ├── skills/
│   │   │           ├── mcp/
│   │   │           ├── threads/
│   │   │           └── ...
│   │   │
│   │   ├── components/                # React components
│   │   │   ├── ui/                    # Shadcn UI primitives (auto-generated)
│   │   │   ├── ai-elements/           # Vercel AI SDK elements (auto-generated)
│   │   │   ├── workspace/             # Workspace-specific components
│   │   │   │   ├── chat-message.tsx
│   │   │   │   ├── artifacts-panel.tsx
│   │   │   │   ├── message-input.tsx
│   │   │   │   └── ...
│   │   │   ├── landing/               # Landing page components
│   │   │   │   ├── header.tsx
│   │   │   │   ├── hero.tsx
│   │   │   │   └── sections/
│   │   │   │       ├── case-study-section.tsx
│   │   │   │       ├── skills-section.tsx
│   │   │   │       └── ...
│   │   │   └── theme-provider.tsx     # Dark mode provider
│   │   │
│   │   ├── core/                      # Business logic and hooks
│   │   │   ├── api/                   # LangGraph SDK client initialization
│   │   │   │   └── index.ts           # getAPIClient() singleton
│   │   │   │
│   │   │   ├── agents/                # Agent management
│   │   │   │   ├── api.ts             # List, get, create, update, delete agents
│   │   │   │   ├── hooks.ts           # useAgents, useAgent hooks
│   │   │   │   ├── types.ts           # Agent type definitions
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── threads/               # Thread/conversation management
│   │   │   │   ├── api.ts             # Create, fetch, delete threads
│   │   │   │   ├── hooks.ts           # useThreadStream, useSubmitThread, useThreads
│   │   │   │   ├── types.ts           # Thread types, stream event types
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── artifacts/             # Artifact handling
│   │   │   │   ├── api.ts             # Download artifact files
│   │   │   │   ├── cache.ts           # Artifact caching
│   │   │   │   ├── hooks.ts           # useArtifact hook
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── messages/              # Message transformation
│   │   │   │   ├── parser.ts          # Parse markdown, code blocks
│   │   │   │   ├── types.ts           # Message type definitions
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── uploads/               # File upload management
│   │   │   │   ├── api.ts             # Upload files, list, delete
│   │   │   │   ├── hooks.ts           # useUpload hook
│   │   │   │   ├── types.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── settings/              # User preferences (localStorage)
│   │   │   │   ├── hooks.ts           # useLocalSettings hook
│   │   │   │   ├── types.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── memory/                # User memory (localStorage)
│   │   │   │   ├── hooks.ts           # useMemory hook
│   │   │   │   ├── types.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── tools/                 # Tool utility functions
│   │   │   │   ├── utils.ts           # formatToolCall, parseToolResult
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── todos/                 # Todo/task management
│   │   │   │   ├── types.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── i18n/                  # Internationalization
│   │   │   │   ├── context.tsx        # I18nProvider and useI18n hook
│   │   │   │   ├── server.ts          # detectLocaleServer()
│   │   │   │   ├── hooks.ts           # useLocale hook
│   │   │   │   ├── locale.ts          # Locale type and resolution
│   │   │   │   ├── cookies.ts         # Locale cookie handling
│   │   │   │   ├── locales/
│   │   │   │   │   ├── en-US.ts
│   │   │   │   │   ├── zh-CN.ts
│   │   │   │   │   └── types.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── config/                # Configuration retrieval
│   │   │   │   ├── index.ts           # getBackendBaseURL(), getLangGraphURL()
│   │   │   │   └── types.ts
│   │   │   │
│   │   │   ├── notification/          # Toast notifications
│   │   │   │   ├── hooks.ts           # useNotification hook
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── mcp/                   # MCP configuration
│   │   │   │   ├── hooks.ts           # useMCP, useMCPConfig hooks
│   │   │   │   ├── types.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── utils/                 # General utilities
│   │   │   │   ├── files.tsx          # File utilities
│   │   │   │   ├── string.ts          # String manipulation
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── index.ts               # Re-exports
│   │   │
│   │   ├── server/                    # Server-side utilities
│   │   │   └── better-auth/           # Authentication setup (WIP)
│   │   │       ├── config.ts
│   │   │       ├── client.ts
│   │   │       ├── server.ts
│   │   │       └── index.ts
│   │   │
│   │   ├── lib/                       # Shared utilities
│   │   │   ├── utils.ts               # cn() for conditional classes
│   │   │   └── index.ts
│   │   │
│   │   ├── hooks/                     # General React hooks
│   │   │   ├── use-debounce.ts
│   │   │   └── ...
│   │   │
│   │   └── index.ts
│   │
│   ├── public/                        # Static assets
│   │   ├── demo/                      # Demo thread data
│   │   │   └── threads/
│   │   │       └── {thread_id}/thread.json
│   │   └── ...
│   │
│   └── CLAUDE.md                      # Frontend development guide
│
├── skills/                            # Agent skills directory
│   ├── public/                        # Public skills (committed to repo)
│   │   └── {skill_name}/
│   │       └── SKILL.md               # Skill metadata (YAML frontmatter)
│   └── custom/                        # Custom skills (gitignored, user-installed)
│       └── {skill_name}/
│           └── SKILL.md
│
├── docker/                            # Docker and deployment
│   ├── Dockerfile                     # Application image
│   ├── docker-compose.yml
│   ├── nginx.conf                     # Nginx reverse proxy config
│   └── ...
│
├── scripts/                           # Utility scripts
│   ├── install.sh                     # Installation script
│   └── ...
│
├── docs/                              # Project-level documentation
│   └── (architecture, setup guides)
│
├── .github/                           # GitHub configuration
│   └── workflows/                     # CI/CD pipelines
│       ├── backend-unit-tests.yml
│       └── ...
│
├── .planning/                         # GSD planning directory
│   └── codebase/                      # Architecture analysis (this directory)
│       ├── ARCHITECTURE.md
│       ├── STRUCTURE.md
│       ├── CONVENTIONS.md (quality focus)
│       ├── TESTING.md (quality focus)
│       ├── STACK.md (tech focus)
│       ├── INTEGRATIONS.md (tech focus)
│       └── CONCERNS.md (concerns focus)
│
└── .planning/phases/                  # Implementation plan phases
    └── {phase_id}/
        ├── plan.md
        ├── checklist.md
        └── code/                      # Implementation code
```

## Directory Purposes

**`backend/src/`:**
- Core Python application code
- All modules follow strict layering: config → models → tools → agents → gateway
- No circular imports; config module at bottom of dependency chain

**`backend/src/agents/`:**
- Lead agent factory, middleware pipeline, thread state
- Middlewares execute in specific order; order matters for correctness
- ThreadState is LangGraph schema; all agent state flows through it

**`backend/src/sandbox/`:**
- Abstract execution environment with pluggable implementations
- Local provider is default; Docker/provisioner mode via config
- Virtual path translation hides physical paths from agent

**`backend/src/tools/`:**
- Factory pattern combines multiple tool sources
- Builtin tools: present_files, ask_clarification, view_image (vision), task (subagents)
- MCP tools lazily loaded and cached with mtime invalidation

**`backend/src/config/`:**
- All configuration schemas and loaders
- Pydantic validation for all config files
- Environment variable resolution via `$VAR_NAME` syntax

**`backend/src/gateway/`:**
- FastAPI REST API for frontend
- Routers handle models, MCP, skills, memory, artifacts, uploads
- Does NOT contain agent logic; agents run in LangGraph Server

**`backend/tests/`:**
- Unit tests follow naming: `test_<module>.py`
- TDD approach: write tests before code
- Live tests in `test_client_live.py` (require config.yaml)

**`frontend/src/app/`:**
- Next.js App Router structure
- Workspace route contains chat, agents, and settings pages
- Landing page at `/`, workspace at `/workspace`

**`frontend/src/core/`:**
- Business logic organized by domain (threads, agents, artifacts, uploads, etc.)
- Each domain has: `api.ts` (HTTP calls), `hooks.ts` (React hooks), `types.ts` (TypeScript)
- `api/` contains singleton LangGraph SDK client

**`frontend/src/components/`:**
- UI components split by context: landing, workspace
- Shadcn UI and Vercel AI SDK components auto-generated (don't edit)
- Workspace components: message rendering, artifact display, input area

**`frontend/src/server/`:**
- Server-side only utilities (cannot use in client components)
- Better-auth authentication setup (currently WIP)

## Key File Locations

**Entry Points:**
- `backend/langgraph.json`: LangGraph server config, points to `src/agents/lead_agent/agent.py:make_lead_agent`
- `backend/src/gateway/app.py`: FastAPI app factory
- `frontend/src/app/page.tsx`: Root landing page
- `frontend/src/app/layout.tsx`: Root layout with theme and i18n

**Configuration:**
- `config.yaml`: Main application config (copy from `config.example.yaml`)
- `extensions_config.json`: MCP servers and skills config (copy from `extensions_config.example.json`)
- `backend/src/config/app_config.py`: Configuration loader and schema
- `frontend/src/env.js`: Environment variable validation

**Core Logic:**
- `backend/src/agents/lead_agent/agent.py`: Agent creation and middleware setup
- `backend/src/agents/thread_state.py`: Conversation state schema
- `backend/src/tools/tools.py`: Tool factory
- `backend/src/models/factory.py`: Model instantiation
- `frontend/src/core/threads/hooks.ts`: Thread streaming and state management

**Testing:**
- `backend/tests/test_client.py`: DeerFlowClient unit tests (77 tests)
- `backend/tests/test_client_live.py`: Live integration tests

## Naming Conventions

**Files:**
- Python: `snake_case.py` (e.g., `lead_agent.py`, `thread_state.py`)
- TypeScript: `kebab-case.ts` or `camelCase.ts` depending on context
  - Components: `PascalCase.tsx` (e.g., `ChatMessage.tsx`)
  - Utilities: `camelCase.ts` (e.g., `formatToolCall.ts`)
  - Hooks: `use*.ts` (e.g., `useThreadStream.ts`)

**Directories:**
- Python: `snake_case/` (e.g., `lead_agent/`, `thread_state/`)
- TypeScript: `kebab-case/` (e.g., `ui/`, `ai-elements/`) or domain names (e.g., `agents/`)

**Classes:**
- Python: `PascalCase` (e.g., `Sandbox`, `ThreadState`, `DeerFlowClient`)
- TypeScript: `PascalCase` (e.g., `Agent`, `Thread`)

**Functions:**
- Python: `snake_case` (e.g., `create_chat_model()`, `get_available_tools()`)
- TypeScript: `camelCase` (e.g., `getBackendBaseURL()`, `useThreadStream()`)

**Constants:**
- Python: `UPPER_SNAKE_CASE` (e.g., `MAX_CONCURRENT_SUBAGENTS`)
- TypeScript: `UPPER_SNAKE_CASE` (e.g., `MAX_MESSAGE_LENGTH`)

## Where to Add New Code

**New Backend Feature:**
1. If it's a tool: add to `backend/src/tools/` or `backend/src/tools/builtins/`
2. If it's a middleware: add to `backend/src/agents/middlewares/`
3. If it's a config option: add to relevant `backend/src/config/*.py`
4. If it's an API endpoint: add router to `backend/src/gateway/routers/`
5. Create tests: `backend/tests/test_<feature>.py`

**New Frontend Feature:**
1. If it's a page: add to `frontend/src/app/workspace/<feature>/page.tsx`
2. If it's a component: add to `frontend/src/components/workspace/`
3. If it's API integration: add to `frontend/src/core/<domain>/{api,hooks,types}.ts`
4. If it's a hook: add to `frontend/src/hooks/` or `frontend/src/core/<domain>/hooks.ts`

**New Community Tool:**
1. Create directory: `backend/src/community/<tool_name>/`
2. Implement tool class with Langchain BaseTool interface
3. Register in tool factory: `backend/src/tools/tools.py`
4. Document in `docs/` directory

**New Skill:**
1. If public: `skills/public/<skill_name>/SKILL.md` (commit to repo)
2. If custom: `skills/custom/<skill_name>/SKILL.md` (created via API, gitignored)
3. SKILL.md structure: YAML frontmatter (name, description, license, allowed-tools) + content

## Special Directories

**`backend/.deer-flow/`:**
- Purpose: Thread data, sandbox execution, memory storage
- Generated: Yes (created at runtime)
- Committed: No (gitignored)
- Contents: `threads/{thread_id}/user-data/{workspace,uploads,outputs}`, `memory.json`

**`frontend/public/demo/`:**
- Purpose: Demo thread data for preview mode
- Generated: No
- Committed: Yes
- Contents: Sample thread JSON and artifacts for demonstration

**`frontend/src/components/ui/` and `frontend/src/components/ai-elements/`:**
- Purpose: Auto-generated component registries
- Generated: Yes (via component registry tools)
- Committed: Yes
- **Note:** Do not manually edit these; regenerate via registry tools if needed

**`.planning/`:**
- Purpose: GSD planning and codebase analysis
- Generated: Yes (via `/gsd:map-codebase` command)
- Committed: Yes
- Contents: Architecture, structure, conventions, testing, stack, integrations, concerns documents

---

*Structure analysis: 2026-03-05*
