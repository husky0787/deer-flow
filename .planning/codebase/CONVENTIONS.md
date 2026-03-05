# Coding Conventions

**Analysis Date:** 2026-03-05

## Naming Patterns

**Files:**
- TypeScript/JavaScript files: `camelCase.ts`, `camelCase.tsx`, `camelCase.js`
- Python files: `snake_case.py`
- Configuration files: `config.yaml`, `extensions_config.json`, `tsconfig.json`, `eslint.config.js`
- Components: `PascalCase.tsx` (e.g., `MessageGroup.tsx`, `PromptInput.tsx`)
- Test files: `test_<feature>.py` (backend), no test files in frontend currently

**Functions:**
- TypeScript/JavaScript: `camelCase` (e.g., `useThreadStream`, `cn`, `getAPIClient`)
- Python: `snake_case` (e.g., `replace_virtual_path`, `get_thread_data`, `is_local_sandbox`)
- Private functions in Python: Prefix with `_` (e.g., `_resolve_model_name`, `_make_app_config`)
- React hooks: Prefix with `use` (e.g., `useThreadStream`, `useUpdateSubtask`, `useI18n`)

**Variables:**
- TypeScript/JavaScript: `camelCase` (e.g., `threadId`, `isMock`, `onFinish`)
- Python: `snake_case` (e.g., `thread_data`, `sandbox_id`, `config_path`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `MAX_CONCURRENT_SUBAGENTS = 3`, `VIRTUAL_PATH_PREFIX`)
- Unused parameters: Prefix with `_` (ESLint rule enforced)

**Types:**
- TypeScript: `PascalCase` for interfaces, types, and classes (e.g., `Model`, `ThreadState`, `AgentThreadState`)
- Python: `PascalCase` for classes and type hints (e.g., `SandboxError`, `AppConfig`, `ModelConfig`)

## Code Style

**Formatting:**
- Frontend: Prettier v3.5.3 configured for TypeScript/JSX
- Backend: Ruff v0.14.11 (linting and formatting)
- Line length: 240 characters (Python backend)
- Indentation: 2 spaces (TypeScript/JavaScript), 4 spaces (Python)
- Quotes: Double quotes (`"`) consistently

**Linting:**
- Frontend: ESLint with TypeScript support (typescript-eslint)
  - Config file: `frontend/eslint.config.js`
  - Ignored directories: `.next`, `src/components/ui/**`, `src/components/ai-elements/**`, `*.js`
  - Key rules:
    - `@typescript-eslint/consistent-type-imports`: Use inline type imports with fixStyle `inline-type-imports`
    - `@typescript-eslint/no-unused-vars`: Warn, ignoring variables starting with `_`
    - `import/order`: Enforced ordering (builtin → external → internal → parent → sibling → index)

- Backend: Ruff v0.14.11
  - Config: `backend/pyproject.toml`
  - Double quotes enforced
  - Python 3.12+ with type hints
  - Check: `ruff check src/`
  - Format: `ruff format src/`

## Import Organization

**Frontend:**
Order enforced by ESLint `import/order` rule:

1. **Builtin** — Node.js built-ins (e.g., `import type { ReactNode }`)
2. **External** — npm packages (e.g., `import { useStream } from "@langchain/langgraph-sdk"`)
3. **Internal** — App code with `@/` alias (e.g., `import { getAPIClient } from "@/core/api"`)
4. **Parent** — Parent directory imports (e.g., `import type { AgentThread }`)
5. **Sibling** — Same directory imports (e.g., `import { types }`)
6. **Index** — Barrel files (e.g., `import { foo } from "."`)
7. **Object** — CSS and Markdown files (e.g., `import "./styles.css"`, `import "*.md"`)

Within each group, imports are alphabetized case-insensitively with newlines between groups.

**Path Aliases:**
- Frontend: `@/*` maps to `src/*` (via `tsconfig.json`)
- Backend: Absolute imports (e.g., `from src.agents.thread_state import ThreadState`)

**Backend:**
Docstring-style imports at module level with grouped organization:
```python
from pathlib import Path
from typing import Any, Self
from unittest.mock import MagicMock, patch

import yaml
from dotenv import load_dotenv
from pydantic import BaseModel, Field

from src.config.app_config import AppConfig
from src.sandbox.sandbox import Sandbox
```

## Error Handling

**Frontend:**
- Promise rejections caught with `.catch()` or `try/catch` blocks
- Toast notifications via `sonner` for user-facing errors (e.g., `toast.error("Failed to upload")`)
- No error boundaries currently implemented; errors surface to console and toast

**Backend:**
- Custom exception hierarchy rooted at `SandboxError` with structured details
- Exceptions include `message`, `details` dict, and typed fields (e.g., `SandboxCommandError` has `command` and `exit_code`)
- Example: `src/sandbox/exceptions.py` defines `SandboxNotFoundError`, `SandboxCommandError`, `SandboxFileError`, `SandboxPermissionError`
- Detailed error info via `__str__()` method formatting: `"message (key1=value1, key2=value2)"`
- Validation errors via Pydantic raise `ValidationError` with field-level details

## Logging

**Frontend:**
- No centralized logging framework; uses `console.log()` / `console.error()` for debugging
- Toast notifications for user-facing messages (via `sonner`)

**Backend:**
- Standard library `logging` module
- Logger created per module: `logger = logging.getLogger(__name__)`
- Warning logs for fallback behaviors (e.g., model resolution fallbacks)
- Example: `logger.warning(f"Model '{requested_model_name}' not found in config; fallback to default model '{default_model_name}'.")`

## Comments

**When to Comment:**
- Complex algorithms or non-obvious logic
- Decision points and trade-offs
- Cross-references to related code
- Configuration explanations
- TODO/FIXME notes for future work (minimal in codebase: only 2 TODOs found)

**JSDoc/TSDoc:**
- Minimal usage in frontend; component props documented inline as type definitions
- Example function in frontend:
  ```typescript
  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
  }
  ```

**Docstrings (Python):**
- Module-level docstrings for files with complex logic
- Function docstrings with Args, Returns, and description sections
- Example from `src/sandbox/tools.py`:
  ```python
  def replace_virtual_path(path: str, thread_data: ThreadDataState | None) -> str:
    """Replace virtual /mnt/user-data paths with actual thread data paths.

    Mapping:
        /mnt/user-data/workspace/* -> thread_data['workspace_path']/*
        ...

    Args:
        path: The path that may contain virtual path prefix.
        thread_data: The thread data containing actual paths.

    Returns:
        The path with virtual prefix replaced by actual path.
    """
  ```

## Function Design

**Size:**
- Functions typically 10-50 lines in Python
- Larger functions broken into private helper functions (e.g., `_resolve_model_name`, `_create_summarization_middleware`)
- React hooks 30-150 lines, complex ones split across multiple hooks

**Parameters:**
- Prefer explicit parameters over implicit context
- Use type annotations for all parameters (TypeScript enforced, Python recommended)
- Optional parameters: `param: Type | None = None`

**Return Values:**
- Always annotate return types
- Return early to reduce nesting: `if condition: return value`
- Python: Use `None` explicitly for no-op returns
- TypeScript: Prefer `Promise<T>` over callbacks for async operations

**Async Functions:**
- Python: Regular functions using `ThreadState` reducers; async via `SubagentExecutor` background threads
- TypeScript: Async/await for API calls; callbacks for React hooks (e.g., `onStart`, `onFinish` in `useThreadStream`)

## Module Design

**Exports:**
- TypeScript: Named exports preferred; default exports only for components/pages
- Example from `frontend/src/core/models/types.ts`:
  ```typescript
  export interface Model {
    id: string;
    name: string;
    ...
  }
  ```
- Python: `from src.module import Class, function` style imports

**Barrel Files:**
- Frontend: Some used (e.g., `src/core/models/index.ts`), but not extensively
- Python: No barrel files; direct imports from modules

**File Organization:**
- Co-locate related code: types with implementations, hooks with components
- Example: `src/core/threads/` contains both `types.ts` and `hooks.ts`
- Utilities in `src/lib/` (TypeScript) or `src/utils/` (Python)
- Components in `src/components/` with subdirectories by feature

## Specific Patterns

**React Components:**
- Server components by default (`"use client"` only for interactive components)
- Props defined as inline type parameters in function signature
- Example from `frontend/src/components/workspace/messages/message-group.tsx`:
  ```typescript
  export function MessageGroup({
    className,
    messages,
    isLoading = false,
  }: {
    className?: string;
    messages: Message[];
    isLoading?: boolean;
  }) {
    // ...
  }
  ```

**Tailwind CSS:**
- Use `cn()` utility from `@/lib/utils` for conditional class merging
- Example: `className={cn("w-full gap-2 rounded-lg", className)}`
- Classes applied with `className` prop; inline styles avoided

**Configuration Resolution:**
- Python: `AppConfig.resolve_config_path()` with priority (explicit → env var → current dir → parent dir)
- Environment variables in config with `$` prefix (e.g., `$OPENAI_API_KEY`) resolved at load time

**Middleware/State Management:**
- Python: Middleware as classes with `__call__` method taking state and returning modified state
- TypeScript: React hooks as primary state API; TanStack Query for server state; localStorage for user preferences

---

*Convention analysis: 2026-03-05*
