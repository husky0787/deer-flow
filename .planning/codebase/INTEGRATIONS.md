# External Integrations

**Analysis Date:** 2026-03-05

## APIs & External Services

**LLM Providers:**
- OpenAI - GPT-4, GPT-4o models via `langchain_openai:ChatOpenAI`
  - SDK: langchain-openai (via LangChain)
  - Auth: `OPENAI_API_KEY` env var
  - Config location: `config.example.yaml` lines 16-23

- Google Gemini - Gemini 2.5 Pro via `langchain_google_genai:ChatGoogleGenerativeAI`
  - SDK: langchain-google-genai
  - Auth: `GOOGLE_API_KEY` or `GEMINI_API_KEY` env var
  - Config location: `config.example.yaml` lines 53-60

- DeepSeek - DeepSeek V3 with reasoning support via `src.models.patched_deepseek:PatchedChatDeepSeek`
  - SDK: langchain-deepseek (custom patched)
  - Auth: `DEEPSEEK_API_KEY` env var
  - Config location: `config.example.yaml` lines 62-74

- Volcengine/Douban - Doubao models via custom `src.models.patched_deepseek:PatchedChatDeepSeek`
  - SDK: Custom implementation at `backend/src/models/patched_deepseek.py`
  - Auth: `VOLCENGINE_API_KEY` env var
  - Base URL: `https://ark.cn-beijing.volces.com/api/v3`
  - Config location: `config.example.yaml` lines 76-89

- Novita AI - DeepSeek-compatible OpenAI endpoint via `langchain_openai:ChatOpenAI`
  - SDK: langchain-openai
  - Auth: `NOVITA_API_KEY` env var
  - Base URL: `https://api.novita.ai/openai` (OpenAI-compatible)
  - Config location: `config.example.yaml` lines 26-42

- Anthropic Claude - Claude 3.5 Sonnet (commented example)
  - SDK: langchain-anthropic
  - Auth: `ANTHROPIC_API_KEY` env var (not yet installed)
  - Config location: `config.example.yaml` lines 44-51

**Web Search & Scraping:**
- Tavily Search API - Web search and fetch (required tool)
  - SDK: tavily-python
  - Auth: `TAVILY_API_KEY` env var (required)
  - Max results: configurable (default: 5)
  - Implementation: `backend/src/community/tavily/tools.py` lines 1-63
  - Tools: `web_search_tool`, `web_fetch_tool` (web_fetch also supports web_fetch via Tavily)
  - Config: `config.example.yaml` lines 124-128

- Jina AI Reader API - Web fetching with readability
  - SDK: Custom HTTP client (requests library)
  - Auth: `JINA_API_KEY` env var (optional, rate limit improvement)
  - Endpoint: `https://r.jina.ai/`
  - Implementation: `backend/src/community/jina_ai/jina_client.py` (custom client), `backend/src/community/jina_ai/tools.py`
  - Tool: `web_fetch_tool` (alternative to Tavily)
  - Config: `config.example.yaml` lines 131-134
  - Features: Returns HTML or markdown, configurable timeout

- Firecrawl API - Advanced web scraping and search
  - SDK: firecrawl-py
  - Auth: `FIRECRAWL_API_KEY` env var (optional)
  - Implementation: `backend/src/community/firecrawl/tools.py`
  - Tools: `web_search_tool`, `web_fetch_tool` (alternative implementations)
  - Config: `config.example.yaml` lines 138-140 (not in default tools list)

- DuckDuckGo - Image search service (free)
  - SDK: ddgs (DuckDuckGo Search)
  - Auth: None required (free)
  - Implementation: `backend/src/community/image_search/tools.py`
  - Tool: `image_search_tool`
  - Config: `config.example.yaml` lines 137-141
  - Features: No authentication, supports size/color/type filters

## Data Storage

**Databases:**
- No persistent relational database configured - stateless by default
- Optional: DuckDB 1.4.4+ - In-memory SQL database (included but not actively used for persistence)
- Optional: PostgreSQL via MCP - PostgreSQL server integration available through MCP
  - Config: `extensions_config.example.json` lines 21-27 (disabled by default, stdio transport)
  - Requires: MCP PostgreSQL server (`@modelcontextprotocol/server-postgres`)

**File Storage:**
- Local filesystem - Default sandbox stores files in `backend/.deer-flow/threads/{thread_id}/user-data/`
  - Workspace directory: `backend/.deer-flow/threads/{thread_id}/user-data/workspace/`
  - Uploads directory: `backend/.deer-flow/threads/{thread_id}/user-data/uploads/`
  - Outputs directory: `backend/.deer-flow/threads/{thread_id}/user-data/outputs/`
- Container/Docker volumes - When using AioSandboxProvider for isolated file systems
- Skills directory - Mounted from host at `skills/` (project root)
  - Physical: `deer-flow/skills/public/` (committed) and `deer-flow/skills/custom/` (gitignored)
  - Container path: `/mnt/skills` (configurable in config.yaml)

**Memory Storage:**
- JSON file - Persistent user memory and context
  - Location: `backend/memory.json` (configurable via `memory.storage_path` in config.yaml)
  - Structure: User context (work/personal/top-of-mind), history, facts with confidence scores
  - Updated via: `backend/src/agents/memory/updater.py` (LLM-based extraction)

**Caching:**
- MCP tool cache - File mtime-based invalidation in `backend/src/mcp/cache.py`
- No Redis or external caching configured
- In-memory state via LangGraph checkpointer (InMemoryStore by default)

## Authentication & Identity

**User Authentication:**
- No backend authentication currently implemented
- Frontend declares `better-auth^1.3` but marked as "not yet active" per `frontend/CLAUDE.md`
- Threads are identified by `thread_id` (UUID), no user ownership tracking
- Memory is global (all threads share `memory.json`)

**API Key Management:**
- Environment variables: All sensitive API keys read from `.env` or environment
- Env var resolution in config: Values starting with `$` are replaced (e.g., `api_key: $OPENAI_API_KEY`)
- No credential storage in source code - Examples use `$VAR` pattern in config.example.yaml

**MCP OAuth Support:**
- HTTP/SSE MCP servers support OAuth2 token endpoint flows
  - Config: `extensions_config.example.json` lines 36-60
  - Supported grant types: `client_credentials`, `refresh_token`
  - Automatic token refresh: Implemented in `backend/src/mcp/oauth.py`
  - Token injection: Authorization headers automatically added to requests

## Monitoring & Observability

**Error Tracking:**
- No dedicated error tracking service configured
- Logs written to: `logs/` directory (langgraph.log, gateway.log, frontend.log, nginx.log)

**Tracing:**
- LangSmith optional integration (commented out in config)
- Lazy initialization: `backend/src/models/factory.py` lines 51-63
- Tracing enabled via environment variable check in `backend/src/config/__init__.py`

**Logs:**
- Structured logging via Python `logging` module throughout codebase
- Frontend logs: `frontend/logs/` and stdout
- All services log to files in `logs/` directory
- No centralized logging service configured

## CI/CD & Deployment

**Hosting Options:**

1. **Local Development** - Via `make dev`
   - All services run locally on host
   - Nginx reverse proxy on localhost:2026
   - Supported on macOS and Linux

2. **Docker Compose** - Via `docker-compose -f docker/docker-compose-dev.yaml up`
   - Multi-container development environment
   - Services: nginx, frontend, gateway, langgraph, optional provisioner
   - Config: `docker/docker-compose-dev.yaml` lines 1-150

3. **Kubernetes (Provisioner Mode)** - For production-grade isolation
   - Provisioner service: `docker/provisioner/` (creates Pods in K8s)
   - Requires: Kubeconfig file at `~/.kube/config`
   - Env vars: `K8S_NAMESPACE=deer-flow`, kubeconfig path, K8s API server URL
   - HostPath volumes: Skills and threads directories mapped to K8s nodes
   - Healthcheck: `GET /health` on provisioner:8002

**Deployment:**
- Dockerfiles: `frontend/Dockerfile`, provisioner in `docker/provisioner/Dockerfile`
- No GitHub Actions/CI pipeline detected in `.github/workflows/` for production deployment

## Environment Configuration

**Required Environment Variables:**
- `TAVILY_API_KEY` - Web search service
- `JINA_API_KEY` - Jina AI reader (actually optional, with graceful fallback)

**Optional Environment Variables:**
```
FIRECRAWL_API_KEY         # For Firecrawl web scraping
VOLCENGINE_API_KEY        # For Volcengine/Douban models
OPENAI_API_KEY            # For OpenAI models
GEMINI_API_KEY            # For Google Gemini models
DEEPSEEK_API_KEY          # For DeepSeek models
NOVITA_API_KEY            # For Novita AI (OpenAI-compatible)
ANTHROPIC_API_KEY         # For Anthropic Claude models (not installed)
GITHUB_TOKEN              # For GitHub MCP server
MCP_OAUTH_CLIENT_ID       # For OAuth-protected MCP servers
MCP_OAUTH_CLIENT_SECRET   # For OAuth-protected MCP servers
API_TOKEN                 # Generic token for custom MCP servers
CORS_ORIGINS              # Comma-separated list for CORS (e.g., http://localhost:3000)
```

**Secrets Location:**
- `.env` file in project root (gitignored, not committed)
- Environment setup per CLAUDE.md: Values starting with `$` in config.yaml are resolved from environment

## Webhooks & Callbacks

**Incoming:**
- SSE (Server-Sent Events) streaming - For agent response streaming
  - Endpoint: Proxied via nginx from `localhost:2024/*` (LangGraph)
  - Implementation: `sse-starlette>=2.1.0` for streaming

**Outgoing:**
- No outgoing webhooks configured
- Community tool integrations (web search, image search) are request-response only

## Skills System

**Skills Configuration:**
- Location: `deer-flow/skills/` (project root)
- Public skills: `deer-flow/skills/public/` (committed)
- Custom skills: `deer-flow/skills/custom/` (gitignored for user additions)
- Format: Directory with `SKILL.md` (YAML frontmatter: name, description, license, allowed-tools)
- Enable/disable: Via `extensions_config.json` `skills` map
- API: `POST /api/skills/install` - Install from .skill ZIP archive
- Implementation: `backend/src/skills/loader.py`
- Injection: Enabled skills listed in agent system prompt with container paths

## MCP (Model Context Protocol) Integration

**Server Support:**
- Multi-server management via `langchain-mcp-adapters` `MultiServerMCPClient`
- Transport types: stdio (command-based), SSE (Server-Sent Events), HTTP
- Configuration: `extensions_config.json` mcpServers map

**Built-in Examples:**
- Filesystem MCP - File system access (`@modelcontextprotocol/server-filesystem`)
- GitHub MCP - Repository operations (`@modelcontextprotocol/server-github`)
- PostgreSQL MCP - Database access (`@modelcontextprotocol/server-postgres`)

**Custom MCP Servers:**
- SSE transport with OAuth: Supports token endpoint flows with automatic refresh
- HTTP transport with OAuth: Token endpoint, grant types, and header injection
- Lazy initialization: Tools cached and reloaded on config changes (mtime-based)
- Implementation: `backend/src/mcp/client.py`, `backend/src/mcp/oauth.py`, `backend/src/mcp/tools.py`

## Model Context Protocol OAuth

**Token Flows:**
- Grant type: `client_credentials` or `refresh_token`
- Client credentials: `client_id`, `client_secret` from env vars
- Token URL: `token_url` in MCP config
- Scope: Optional `scope` field
- Audience: Optional `audience` field
- Refresh behavior: Automatic refresh with `refresh_skew_seconds` (default: 60s)

**Implementation:**
- File: `backend/src/mcp/oauth.py`
- Automatic: Token refresh before expiry + Authorization header injection

---

*Integration audit: 2026-03-05*
