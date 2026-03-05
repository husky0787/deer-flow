# Testing Patterns

**Analysis Date:** 2026-03-05

## Test Framework

**Runner:**
- Backend: pytest v8.0.0+
- Frontend: No test framework configured (see "Test Coverage Gaps")

**Run Commands (Backend):**
```bash
make test                    # Run all tests (backend directory)
PYTHONPATH=. uv run pytest tests/ -v  # Run with full output
make lint                    # Lint with ruff (backend directory)
```

**Frontend:**
- No test infrastructure configured; uses linting only (`pnpm lint`, `pnpm check`)

## Test File Organization

**Backend:**
- Location: `backend/tests/` directory
- Naming: `test_<feature>.py`
- Examples:
  - `tests/test_client.py` (77+ unit tests)
  - `tests/test_lead_agent_model_resolution.py` (6+ tests)
  - `tests/test_skills_loader.py`
  - `tests/test_mcp_client_config.py`
  - `tests/test_docker_sandbox_mode_detection.py`
  - `tests/test_provisioner_kubeconfig.py`

**Frontend:**
- No test files currently; conventions would follow `.test.ts`, `.test.tsx`, `.spec.ts`, `.spec.tsx` patterns

## Test Structure

**Backend Setup:**
Configuration via `backend/tests/conftest.py`:
- Adds `src/` to `sys.path` for absolute imports
- Pre-mocks `src.subagents.executor` to break circular imports during unit testing
- Mock provides `SubagentExecutor`, `SubagentResult`, `SubagentStatus`, `MAX_CONCURRENT_SUBAGENTS`
- Allows lightweight config/registry modules to be tested in isolation

**Test Suite Organization:**
Tests use pytest fixtures and class-based organization:

```python
@pytest.fixture
def mock_app_config():
    """Provide a minimal AppConfig mock."""
    model = MagicMock()
    model.name = "test-model"
    model.supports_thinking = False
    model.model_dump.return_value = {"name": "test-model", "use": "langchain_openai:ChatOpenAI"}

    config = MagicMock()
    config.models = [model]
    return config


@pytest.fixture
def client(mock_app_config):
    """Create a DeerFlowClient with mocked config loading."""
    with patch("src.client.get_app_config", return_value=mock_app_config):
        return DeerFlowClient()


class TestClientInit:
    def test_default_params(self, client):
        assert client._model_name is None
        assert client._thinking_enabled is True
```

**Patterns:**
- Fixture-based setup with `@pytest.fixture` decorator
- Class-based test organization (e.g., `TestClientInit`, `TestConfigQueries`)
- Method naming: `test_<scenario>` (e.g., `test_default_params`, `test_custom_params`)
- Private helper functions: `_make_app_config()`, `_make_model()` for test data

## Mocking

**Framework:** unittest.mock (`MagicMock`, `patch`)

**Patterns:**
```python
# Creating mocks
model = MagicMock()
model.name = "test-model"
model.model_dump.return_value = {...}

# Patching modules
with patch("src.client.get_app_config", return_value=mock_app_config):
    result = DeerFlowClient()

# Using monkeypatch fixture (pytest)
def test_example(monkeypatch):
    monkeypatch.setattr(lead_agent_module, "get_app_config", lambda: app_config)
    resolved = lead_agent_module._resolve_model_name("missing-model")
```

**What to Mock:**
- External dependencies: LLM clients, file systems, network calls
- Config loaders to isolate unit tests from filesystem
- Complex dependencies (e.g., sandbox providers) when testing lighter modules

**What NOT to Mock:**
- Pydantic models and validation logic — test with real instances
- Exception classes and error scenarios
- Core logic that's the subject of the test

## Fixtures and Factories

**Test Data Factories:**
```python
def _make_app_config(models: list[ModelConfig]) -> AppConfig:
    return AppConfig(
        models=models,
        sandbox=SandboxConfig(use="src.sandbox.local:LocalSandboxProvider"),
    )


def _make_model(name: str, *, supports_thinking: bool) -> ModelConfig:
    return ModelConfig(
        name=name,
        display_name=name,
        description=None,
        use="langchain_openai:ChatOpenAI",
        model=name,
        supports_thinking=supports_thinking,
        supports_vision=False,
    )
```

**Location:**
- Fixtures in `backend/tests/conftest.py` for shared setup
- Test-specific factories defined at module level (e.g., `_make_model()` in test files)
- Example in `backend/tests/test_lead_agent_model_resolution.py`

## Coverage

**Requirements:**
- Not enforced; no coverage thresholds configured
- Backend tests focus on critical paths: config resolution, client conformance, tool behavior

**View Coverage:**
```bash
# Generate coverage report (if configured)
# Currently: No coverage tool configured
PYTHONPATH=. uv run pytest tests/ --cov=src --cov-report=term-missing
```

## Test Types

**Unit Tests (Majority):**
- Scope: Individual functions and classes
- Approach: Isolated with mocks for dependencies
- Examples:
  - `test_lead_agent_model_resolution.py` — Model resolution logic with mocked `get_app_config`
  - `test_client.py` — DeerFlowClient methods with mocked config and skills loader
  - `test_skills_loader.py` — Skill discovery and parsing
  - `test_reflection_resolvers.py` — Dynamic module and class resolution

**Integration Tests:**
- Scope: Multiple components working together
- Examples:
  - `test_mcp_oauth.py` — OAuth token management with real HTTP intercepts (mocked)
  - `test_docker_sandbox_mode_detection.py` — Config-based sandbox mode detection
  - `test_provisioner_kubeconfig.py` — Kubeconfig file handling

**E2E Tests:**
- Framework: Not formalized; limited live tests
- Location: `tests/test_client_live.py` for live integration tests (requires `config.yaml`)

**Regression Tests:**
- File: `backend/tests/test_docker_sandbox_mode_detection.py` — Docker mode detection from config
- File: `backend/tests/test_provisioner_kubeconfig.py` — Kubeconfig handling
- CI: Run via `.github/workflows/backend-unit-tests.yml` on every PR

## Common Patterns

**Testing Configuration Resolution:**
```python
def test_resolve_model_name_falls_back_to_default(monkeypatch, caplog):
    app_config = _make_app_config([
        _make_model("default-model", supports_thinking=False),
        _make_model("other-model", supports_thinking=True),
    ])

    monkeypatch.setattr(lead_agent_module, "get_app_config", lambda: app_config)

    with caplog.at_level("WARNING"):
        resolved = lead_agent_module._resolve_model_name("missing-model")

    assert resolved == "default-model"
    assert "fallback to default model" in caplog.text
```

**Testing Error Cases:**
```python
def test_resolve_model_name_raises_when_no_models_configured(monkeypatch):
    app_config = _make_app_config([])

    monkeypatch.setattr(lead_agent_module, "get_app_config", lambda: app_config)

    with pytest.raises(ValueError, match="No chat models are configured"):
        lead_agent_module._resolve_model_name("missing-model")
```

**Gateway Conformance Testing:**
Pattern: Validate that client methods produce output conforming to Gateway Pydantic models
```python
class TestGatewayConformance:
    """Validate client output conforms to Gateway API response schemas."""

    def test_list_models_conforms_to_gateway(self, client):
        result = client.list_models()
        # Parse through Gateway response model — raises ValidationError if schema mismatch
        ModelsListResponse.model_validate(result)
```

Location: `backend/tests/test_client.py` — Tests that every dict-returning client method validates against corresponding Gateway Pydantic response model (e.g., `ModelsListResponse`, `SkillsListResponse`, `MemoryStatusResponse`)

## Test-Driven Development (TDD)

**Mandatory for Backend:**
- Write tests BEFORE or WITH implementation
- All features and bug fixes require unit tests
- Run full suite before committing: `make test`
- Policy enforced in `backend/CLAUDE.md`: "Every new feature or bug fix MUST be accompanied by unit tests. No exceptions."

**Frontend:**
- No formal test infrastructure; TDD not currently practiced
- Code style checked via ESLint and TypeScript (`pnpm check`)

## CI/CD Testing

**Workflow:** `.github/workflows/backend-unit-tests.yml`
- Runs pytest on every PR
- Includes regression tests for Docker/provisioner behavior
- Fails PR if any test fails or linting issues present

---

*Testing analysis: 2026-03-05*
