# Architecture

**Analysis Date:** 2026-03-05

## Pattern Overview

**Overall:** Event-driven agent orchestration with layered separation of concerns

**Key Characteristics:**
- **Modular Pipeline**: Agent orchestrates through middleware chain, each adding capabilities
- **State-based Execution**: ThreadState persists conversation context across LangGraph steps
- **Provider Pattern**: Pluggable backends for sandbox, models, and external tools
- **Per-thread Isolation**: All user data, sandbox execution, and artifacts scoped to thread_id
- **API Gateway Separation**: REST API decoupled from LangGraph agent runtime

## Layers

**Frontend (Next.js):**
- Purpose: React-based chat UI and workspace management
- Location: `frontend/src/`
- Contains: App Router pages, React components, business logic hooks
- Depends on: Backend Gateway API, LangGraph streaming
- Used by: End users via web browser

**LangGraph Agent Runtime:**
- Purpose: Core AI orchestration, tool execution, middleware chain
- Location: `backend/src/agents/` (lead_agent, middlewares, thread_state)
- Contains: Agent definition, state management, 10-step middleware pipeline
- Depends on: Models, sandbox, tools, memory, skills
- Used by: Frontend via SSE streaming, DeerFlowClient

**Gateway API (FastAPI):**
- Purpose: Configuration management and file operations
- Location: `backend/src/gateway/`
- Contains: REST endpoints for models, MCP, skills, memory, artifacts, uploads
- Depends on: Configuration system, file storage
- Used by: Frontend, external clients

**Sandbox System:**
- Purpose: Isolated command execution and file operations
- Location: `backend/src/sandbox/`
- Contains: Abstract interface, local provider, path translation layer
- Depends on: File system, optional Docker/provisioner backends
- Used by: Sandbox tools (bash, ls, read_file, write_file)

**Tool System:**
- Purpose: Agent capability composition
- Location: `backend/src/tools/`, `backend/src/tools/builtins/`, `backend/src/community/`
- Contains: Tool factory, built-in tools, MCP integration, community tools
- Depends on: Sandbox, external APIs (Tavily, Jina, etc.)
- Used by: Agent via LangGraph tool execution

**Configuration System:**
- Purpose: Runtime behavior customization
- Location: `backend/src/config/`
- Contains: YAML parsing, environment resolution, validation schemas
- Depends on: Pydantic, file system
- Used by: All backend modules

## Data Flow

**Chat Message Flow:**

1. User sends message → Frontend thread hook captures input
2. Hook calls LangGraph Server streaming endpoint (`/api/langgraph/runs/create`)
3. LangGraph creates thread state with human message
4. Lead agent created dynamically with config (thinking_enabled, model_name, subagent_enabled)
5. Middleware chain executes in order:
   - ThreadDataMiddleware: Creates per-thread directory structure
   - UploadsMiddleware: Injects newly uploaded files
   - SandboxMiddleware: Acquires sandbox instance
   - DanglingToolCallMiddleware: Cleans up interrupted tool calls
   - SummarizationMiddleware: Context reduction (optional)
   - TodoListMiddleware: Task tracking (optional, plan_mode)
   - TitleMiddleware: Auto-generates conversation title
   - MemoryMiddleware: Queues memory updates
   - ViewImageMiddleware: Injects base64 images (vision models)
   - SubagentLimitMiddleware: Enforces concurrent task limit
   - ClarificationMiddleware: Intercepts clarification requests
6. Model generates response with tool calls
7. Tools execute via sandbox or external APIs
8. Results streamed back as SSE events (values, messages-tuple, end)
9. Frontend receives events and updates state

**State Management:**

- **ThreadState** (`src/agents/thread_state.py`): LangGraph-backed conversation state
  - Core: messages (conversation history)
  - Annotations: artifacts (deduped), todos, uploaded_files, viewed_images
  - Context: sandbox_id, thread_data (paths), title

- **Frontend State**: React hooks with TanStack Query
  - Messages streamed in real-time via EventSource
  - Artifacts cached after download
  - Settings stored in localStorage

- **Persistent State**:
  - Memory: `backend/.deer-flow/memory.json` (facts, context, history)
  - Thread data: `backend/.deer-flow/threads/{thread_id}/user-data/{workspace,uploads,outputs}/`
  - Config: `config.yaml`, `extensions_config.json` (project root)

## Key Abstractions

**ThreadState:**
- Purpose: Unified schema for LangGraph state across middleware
- Examples: `backend/src/agents/thread_state.py`
- Pattern: TypedDict with custom reducers (merge_artifacts, merge_viewed_images)

**Sandbox Interface:**
- Purpose: Abstract execution environment
- Examples: `backend/src/sandbox/sandbox.py` (abstract), `backend/src/sandbox/local/` (local impl)
- Pattern: ABC with concrete providers for local, Docker, provisioner

**Tool Factory:**
- Purpose: Lazy load and compose tools from multiple sources
- Examples: `backend/src/tools/tools.py` → get_available_tools()
- Pattern: Combines config tools, MCP tools, built-ins, and subagent tools

**Middleware Chain:**
- Purpose: Before/after hooks into LangGraph agent
- Examples: `backend/src/agents/middlewares/*`
- Pattern: Inherit from Middleware, override before_*, after_* methods

**Model Factory:**
- Purpose: Dynamic model instantiation with feature support
- Examples: `backend/src/models/factory.py` → create_chat_model()
- Pattern: Reflection-based resolution, supports thinking/vision flags

**Configuration Provider:**
- Purpose: Environment-aware config loading
- Examples: `backend/src/config/app_config.py`, `extensions_config.py`
- Pattern: Singleton with reload support, env var resolution

## Entry Points

**Frontend Landing Page:**
- Location: `frontend/src/app/page.tsx`
- Triggers: Page load at `/`
- Responsibilities: Marketing content, navigation to workspace

**Frontend Chat Page:**
- Location: `frontend/src/app/workspace/chats/[thread_id]/page.tsx`
- Triggers: User opens existing thread or creates new
- Responsibilities: Render chat UI, stream messages, display artifacts

**LangGraph Agent Endpoint:**
- Location: `backend/langgraph.json` (entry point), `backend/src/agents/lead_agent/agent.py`
- Triggers: Frontend calls `/api/langgraph/runs/create` via SSE
- Responsibilities: Create lead_agent with middleware, execute conversation turn

**Gateway API Endpoints:**
- Location: `backend/src/gateway/app.py` + routers in `backend/src/gateway/routers/`
- Triggers: Frontend API calls for models, skills, memory, artifacts, uploads
- Responsibilities: Configuration queries, file operations, MCP management

**Embedded Client:**
- Location: `backend/src/client.py` → DeerFlowClient class
- Triggers: Programmatic Python code (testing, standalone agents)
- Responsibilities: Provide in-process access to all DeerFlow capabilities

## Error Handling

**Strategy:** Layered error propagation with graceful degradation

**Patterns:**

- **Middleware Errors**: Logged with context, don't interrupt stream (except ClarificationMiddleware)
- **Tool Execution**: Tool returns error string, LLM processes as part of conversation
- **Config Errors**: Fail-fast at startup (app.py lifespan), log actionable messages
- **Model Resolution**: Missing model → fallback to default, warning logged
- **MCP Tool Errors**: Graceful skip with warning, non-critical to agent operation
- **Sandbox Errors**: Tool returns shell error output, LLM has context to retry

**Exception Handling:**
- try/except in middleware to prevent breaking stream
- Logging at INFO/WARNING level for operational visibility
- User-facing errors returned as tool results, not exceptions

## Cross-Cutting Concerns

**Logging:**
- Uses Python standard logging module
- LangSmith integration optional via tracing config
- Structured logging with thread_id context where relevant

**Validation:**
- Pydantic schemas for all config files (app_config.py, extensions_config.py, etc.)
- Runtime parameter validation in RunnableConfig (configurable dict)
- File path validation with path traversal protection (`resolve()` and `relative_to()`)

**Authentication:**
- Better-auth framework integrated (`frontend/src/server/better-auth/`)
- Auth routes via `frontend/src/app/api/auth/[...all]/route.ts`
- Currently optional, allows anonymous usage

**Threading & Concurrency:**
- Async-first with asyncio (FastAPI, LangGraph)
- Subagent execution uses thread pools (3 scheduler + 3 execution workers)
- Sandbox operations may be sync (local) or async (provisioner)

**Resource Isolation:**
- Per-thread directories prevent cross-thread data leaks
- Virtual path mappings hide physical paths from agent
- Sandbox sandbox_id stored in state for tracking

---

*Architecture analysis: 2026-03-05*
