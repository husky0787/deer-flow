# Technology Stack

**Analysis Date:** 2026-03-05

## Languages

**Primary:**
- Python 3.12+ - Backend AI agent system, core business logic
- TypeScript 5.8 - Frontend web application with type safety
- JavaScript - Build tools and scripts

**Secondary:**
- Bash - Development automation and container management
- YAML - Configuration and Docker Compose

## Runtime

**Environment:**
- Python 3.12+ (via uv package manager)
- Node.js 22+ (required, enforced in Makefile check)

**Package Manager:**
- Backend: `uv` - Fast Python package manager and environment manager (required)
- Frontend: `pnpm` 10.26.2 (required, managed via packageManager field in `frontend/package.json`)
- Lockfiles: `backend/uv.lock` (backend), `frontend/pnpm-lock.yaml` (frontend)

## Frameworks

**Core:**
- LangGraph 1.0.6+ - Agent orchestration and workflow engine (backend)
- FastAPI 0.115.0+ - REST API framework (gateway service)
- Next.js 16.1.4 - Full-stack React framework with App Router (frontend)
- React 19.0.0 - UI component library (frontend)

**Agent/LLM:**
- LangChain 1.2.3+ - LLM abstraction and tool integration layer
- LangChain-MCP-Adapters 0.1.0+ - Model Context Protocol integration
- Agent-Sandbox 0.0.19+ - Sandbox execution environment abstraction

**Testing:**
- Pytest 8.0.0+ - Python test framework
- No frontend test framework configured

**Build/Dev:**
- Uvicorn 0.34.0+ - ASGI server for FastAPI
- Ruff 0.14.11+ - Python linter and formatter
- ESLint 9.23.0 - JavaScript/TypeScript linting
- Tailwind CSS 4.0.15 - Utility-first CSS framework
- Turbopack - Next.js turbo compiler for fast dev builds

## Key Dependencies

**Critical (Backend):**
- `langgraph>=1.0.6` - Agent execution engine at `/home/user_demo/Husky/deer-flow-1/backend/src/agents/lead_agent/`
- `langchain>=1.2.3` - LLM integrations and tool abstractions
- `fastapi>=0.115.0` - REST API server at `/home/user_demo/Husky/deer-flow-1/backend/src/gateway/`
- `uvicorn[standard]>=0.34.0` - ASGI server
- `sse-starlette>=2.1.0` - Server-sent events for streaming responses
- `pydantic>=2.12.5` - Data validation and settings management
- `kubernetes>=30.0.0` - K8s API for provisioner mode sandbox management

**Model Providers (Backend):**
- `langchain-openai>=1.1.7` - OpenAI GPT models (ChatOpenAI)
- `langchain-deepseek>=1.0.1` - DeepSeek models
- `langchain-google-genai>=4.2.1` - Google Gemini models (ChatGoogleGenerativeAI)
- Custom integration: `src.models.patched_deepseek:PatchedChatDeepSeek` for DeepSeek reasoning and Volcengine/Douban models

**Community Tools (Backend):**
- `tavily-python>=0.7.17` - Web search (configured at `/home/user_demo/Husky/deer-flow-1/config.example.yaml` lines 124-128)
- `firecrawl-py>=1.15.0` - Web scraping API (community integration at `/home/user_demo/Husky/deer-flow-1/backend/src/community/firecrawl/`)
- `ddgs>=9.10.0` - DuckDuckGo image search (community integration at `/home/user_demo/Husky/deer-flow-1/backend/src/community/image_search/`)
- `markitdown[all,xlsx]>=0.0.1a2` - Document conversion (PDF, Word, Excel, PPT)
- `readabilipy>=0.3.0` - HTML readability extraction
- `markdownify>=1.2.2` - HTML to Markdown conversion

**Data & Utilities (Backend):**
- `duckdb>=1.4.4` - In-memory SQL database (no persistent database configured)
- `tiktoken>=0.8.0` - Token counting for LLM context management
- `pyyaml>=6.0.3` - YAML configuration parsing
- `httpx>=0.28.0` - Async HTTP client
- `python-multipart>=0.0.20` - Multipart form parsing for file uploads

**Frontend Dependencies:**
- `@langchain/core^1.1.15` - LangChain client for frontend
- `@langchain/langgraph-sdk^1.5.3` - LangGraph SDK for streaming agent interactions
- `better-auth^1.3` - Auth library (declared but not yet active per CLAUDE.md)
- `@tanstack/react-query^5.90.17` - Server state management
- `@xyflow/react^12.10.0` - Visual flow diagrams
- `next-themes^0.4.6` - Theme switching
- Radix UI components (dialog, dropdown, select, tabs, tooltip, etc.)
- CodeMirror 6 with language support (Python, JavaScript, HTML, CSS, JSON, Markdown)
- Markdown rendering: `rehype-katex`, `rehype-raw`, `remark-gfm`, `remark-math`, `shiki` 3.15.0

**UI Framework:**
- `tailwind-merge^3.4.0` - Merge Tailwind CSS classes
- `class-variance-authority^0.7.1` - Component variant system
- `lucide-react^0.562.0` - Icon library
- `motion^12.26.2` - Animation library
- `gsap^3.13.0` - Advanced animation framework
- `sonner^2.0.7` - Toast notifications
- `embla-carousel-react^8.6.0` - Carousel component

**Utilities:**
- `zod^3.24.2` - Schema validation (TypeScript)
- `@t3-oss/env-nextjs^0.12.0` - Environment variable validation
- `nanoid^5.1.6` - Unique ID generation
- `date-fns^4.1.0` - Date manipulation

## Configuration

**Environment:**
- Backend: `.env` file (see `/home/user_demo/Husky/deer-flow-1/.env.example`)
  - Required: `TAVILY_API_KEY`, `JINA_API_KEY`
  - Optional: `FIRECRAWL_API_KEY`, `VOLCENGINE_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `NOVITA_API_KEY`
  - Optional: `CORS_ORIGINS` for CORS header configuration
  - Values starting with `$` are resolved as environment variables in config files

- Frontend: `frontend/.env` (dev only, example in `/home/user_demo/Husky/deer-flow-1/frontend/.env.example`)
  - `NEXT_PUBLIC_BACKEND_BASE_URL` - Gateway API URL (default: empty, uses nginx proxy)
  - `NEXT_PUBLIC_LANGGRAPH_BASE_URL` - LangGraph server URL (default: `/api/langgraph`, uses nginx proxy)

**Application Config:**
- `config.yaml` (project root) - Main application configuration
  - Models: Define LLM instances with API keys and parameters (lines 15-104 of example)
  - Tools: Configure available tools, tool groups, and community integrations (lines 111-163 of example)
  - Sandbox: Choose execution environment - local, Docker (AioSandboxProvider), or Kubernetes provisioner (lines 166-222 of example)
  - Skills: Path to skills directory and container mount path (lines 245-254 of example)
  - Memory: Persistent user context storage configuration (lines 320-328 of example)
  - Summarization: Automatic conversation summarization settings (lines 273-314 of example)
  - Title: Auto-generation of thread titles (lines 261-265 of example)

- `extensions_config.json` (project root) - MCP and skills configuration
  - MCP servers: Managed servers (filesystem, GitHub, PostgreSQL) with stdio/SSE/HTTP transports
  - OAuth support: Token endpoint flows for OAuth2-protected MCP servers
  - Skills: Enable/disable installed skills

**Build:**
- `backend/Makefile` - Backend development commands
- `frontend/Makefile` - Frontend development commands
- Root `Makefile` - Unified development workflow
- Docker: `docker/docker-compose-dev.yaml` - Multi-service dev environment

## Platform Requirements

**Development:**
- Node.js 22+ (enforced in `Makefile` check target)
- Python 3.12+
- pnpm 10.26.2+
- uv package manager (for Python)
- nginx (for local development reverse proxy)
- Docker or Apple Container runtime (for sandbox isolation, optional but recommended)
- Kubernetes cluster + kubeconfig (only for provisioner mode sandbox)

**Production:**
- Deployment via Docker: `frontend/Dockerfile`, `backend/Dockerfile` (in provisioner/)
- Container orchestration: Optional k3s Kubernetes cluster for advanced isolation (provisioner mode)
- Supported runtimes: Docker/OrbStack on macOS, Linux, or Kubernetes
- Entry points:
  - LangGraph Server: port 2024
  - Gateway API: port 8001
  - Frontend: port 3000
  - Nginx reverse proxy: port 2026 (unified entry point)

---

*Stack analysis: 2026-03-05*
