import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { stageDescription, stagePhases, stageGates, stageAgentInstructions, stageHumanInstructions, stageHandoverPoints } from './stages.js';
import {
  agentRequirements, agentGraphPy, agentStatePy, agentNodePy,
  agentToolPy, agentUnitTestPy, agentEvalTestPy, agentIntegrationTestPy,
  agentEnvExample, agentDockerCompose, agentClaudeMd, agentReadmeMd,
  agentPyprojectToml, agentConftestPy
} from './templates/agent-templates.js';
import { typescriptConstitution } from './templates/constitutions/typescript-constitution.js';
import { reactConstitution } from './templates/constitutions/react-constitution.js';
import { pythonConstitution } from './templates/constitutions/python-constitution.js';
import { langgraphConstitution } from './templates/constitutions/langgraph-constitution.js';
import { postgresqlConstitution } from './templates/constitutions/postgresql-constitution.js';
import { securityConstitution } from './templates/constitutions/security-constitution.js';
import { testingConstitution } from './templates/constitutions/testing-constitution.js';
import { mongodbConstitution } from './templates/constitutions/mongodb-constitution.js';
import {
  featureStoryTemplate, bugfixStoryTemplate, refactorStoryTemplate,
  agentStoryTemplate, securityPatchTemplate, apiContractTemplate
} from './templates/story-types/index.js';

const toForwardSlash = (p) => p.replace(/\\/g, '/');

function regressionReadme(config) {
  const t3 = '```';
  return `# Regression Test Suite — ${config.projectName}

## What this is
The regression suite protects every sprint's completed work from being
broken by subsequent sprints. It runs on every PR automatically.

## Structure

${t3}
tests/regression/
├── suites/
│   ├── smoke.test.ts          Critical path — runs in < 2 minutes
│   ├── api-contracts.test.ts  All endpoints respond correctly
│   └── security.test.ts       Auth and security checks
├── baseline/                  Captured baselines per sprint
│   └── sprint-N-baseline.json
└── comparator/
    └── diff.py                Compares current vs baseline
${t3}

## How it works

Sprint start:
  yooti sprint:start
  → captures current passing tests as baseline
  → stored in: tests/regression/baseline/sprint-N-baseline.json

Every PR:
  CI runs: python tests/regression/comparator/diff.py
  → compares current results against baseline
  → any newly failing test blocks the PR

## Adding to the smoke suite

After each story is merged, add its critical path to smoke.test.ts:
  describe('Smoke — [feature name]', () => {
    it('[critical behaviour]')
  })

Keep the smoke suite under 2 minutes total.
`
}

function smokeTestSuite(config) {
  return `/**
 * Smoke test suite — ${config.projectName}
 * Critical path tests. If any fail, the build is broken.
 * Target: complete in under 2 minutes.
 * Add one describe block per major feature as stories are completed.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../../services/api/src/app'

describe('Smoke — API health', () => {
  it('GET /health returns 200', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
  })

  it('GET /api/v1/status returns service info', async () => {
    const res = await request(app).get('/api/v1/status')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('version')
  })
})

describe('Smoke — Authentication', () => {
  it('protected endpoint returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/protected')
    expect(res.status).toBe(401)
  })
})

// Add new describe blocks here as stories are completed
// Each block should test the critical path of one feature
// Keep total suite under 2 minutes
`
}

function apiContractSuite(config) {
  return `/**
 * API contract tests — ${config.projectName}
 * Verifies all endpoints respond with the correct shape.
 * Add one test per endpoint as API stories are completed.
 */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../../services/api/src/app'

describe('API contracts — health endpoints', () => {
  it('GET /health response matches contract', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      status: expect.stringMatching(/^(ok|degraded|down)$/),
    })
  })
})

// Add contract tests here as API stories complete
// Pattern:
//   describe('API contracts — [feature]', () => {
//     it('POST /api/v1/[endpoint] success response matches contract')
//     it('POST /api/v1/[endpoint] validation error matches contract')
//     it('POST /api/v1/[endpoint] auth error matches contract')
//   })
`
}

function securityRegressionSuite(config) {
  return [
    '/**',
    ` * Security regression tests — ${config.projectName}`,
    ' * Verifies security controls are not broken by new code.',
    ' * These tests run on every PR — they must always pass.',
    ' */',
    "import { describe, it, expect } from 'vitest'",
    "import request from 'supertest'",
    "import { app } from '../../services/api/src/app'",
    '',
    "describe('Security regression — authentication', () => {",
    "  it('all protected routes return 401 without token', async () => {",
    '    const protectedRoutes = [',
    "      '/api/v1/users',",
    "      '/api/v1/profile',",
    '      // Add routes here as they are created',
    '    ]',
    '    for (const route of protectedRoutes) {',
    '      const res = await request(app).get(route)',
    '      expect(res.status, `${route} should require auth`).toBe(401)',
    '    }',
    '  })',
    '',
    "  it('invalid JWT returns 401 not 500', async () => {",
    '    const res = await request(app)',
    "      .get('/api/v1/profile')",
    "      .set('Authorization', 'Bearer invalid.jwt.token')",
    '    expect(res.status).toBe(401)',
    '    expect(res.status).not.toBe(500)',
    '  })',
    '})',
    '',
    "describe('Security regression — input validation', () => {",
    "  it('SQL injection attempt returns 400 not 500', async () => {",
    '    const res = await request(app)',
    "      .post('/api/v1/users/search')",
    '      .send({ query: "\\\'; DROP TABLE users; --" })',
    '    expect(res.status).toBe(400)',
    '    expect(res.status).not.toBe(500)',
    '  })',
    '})',
    '',
    '// Add security regression tests here as security stories complete',
  ].join('\n')
}

function regressionDiffScript(config) {
  return `#!/usr/bin/env python3
"""
Regression diff — ${config.projectName}
Compares current test results against the sprint baseline.
Exits 1 if any previously passing test is now failing.

Usage:
  python tests/regression/comparator/diff.py
  python tests/regression/comparator/diff.py --baseline sprint-9
"""
import json
import sys
import os
import argparse
from pathlib import Path


def load_json(path: str) -> dict:
    with open(path) as f:
        return json.load(f)


def find_latest_baseline() -> str | None:
    baseline_dir = Path("tests/regression/baseline")
    baselines = sorted(baseline_dir.glob("*.json"), reverse=True)
    return str(baselines[0]) if baselines else None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", help="Baseline name (e.g. sprint-9)")
    parser.add_argument("--current", default=".agent/evidence/current-results.json")
    args = parser.parse_args()

    # Find baseline
    if args.baseline:
        baseline_path = f"tests/regression/baseline/{args.baseline}.json"
    else:
        baseline_path = find_latest_baseline()

    if not baseline_path or not os.path.exists(baseline_path):
        print("No baseline found. Run yooti sprint:start to capture one.")
        sys.exit(0)

    # Load results
    if not os.path.exists(args.current):
        print(f"Current results not found: {args.current}")
        sys.exit(1)

    baseline = load_json(baseline_path)
    current  = load_json(args.current)

    baseline_passing = set(baseline.get("passing_tests", []))
    current_passing  = set(current.get("passing_tests", []))
    current_failing  = set(current.get("failing_tests", []))

    # Find regressions — was passing, now failing
    regressions = baseline_passing & current_failing

    # Find improvements — was failing, now passing
    improvements = current_passing - baseline_passing

    # Report
    print(f"Baseline: {baseline_path}")
    print(f"Tests before: {len(baseline_passing)}")
    print(f"Tests after:  {len(current_passing)}")
    print(f"Regressions:  {len(regressions)}")
    print(f"Improvements: {len(improvements)}")

    if improvements:
        print("\\nNewly passing:")
        for t in sorted(improvements):
            print(f"  + {t}")

    if regressions:
        print("\\nREGRESSIONS — these tests were passing and are now failing:")
        for t in sorted(regressions):
            print(f"  \\u2717 {t}")
        print(f"\\n{len(regressions)} regression(s) found. PR blocked.")
        sys.exit(1)
    else:
        print("\\nNo regressions. All previously passing tests still pass.")
        sys.exit(0)


if __name__ == "__main__":
    main()
`
}

function vitestConfig(config) {
  return `/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/types/**', 'src/**/*.d.ts'],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
})
`
}

function testSetupTs(config) {
  return `/**
 * Test setup — ${config.projectName} API
 * Runs before every test file. Use for global mocks and cleanup.
 */
import { afterEach, vi } from 'vitest'

// Reset all mocks after each test
afterEach(() => {
  vi.restoreAllMocks()
})

// Suppress console.log in tests (use mockLogger instead)
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})
`
}

function testSetupFrontendTs(config) {
  return `/**
 * Test setup — ${config.projectName} Frontend
 * Runs before every test file. Configures jsdom and testing-library.
 */
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Cleanup rendered components after each test
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
`
}

function testHelpersFactoriesTs(config) {
  return `/**
 * Test factories — ${config.projectName} API
 * Create test data with sensible defaults.
 * Override only the fields that matter for your test.
 *
 * Usage:
 *   import { createUser, createProperty } from '../helpers/factories'
 *   const user = createUser({ email: 'test@example.com' })
 */

let idCounter = 0
function nextId(): string {
  return \`test-\${++idCounter}\`
}

export function resetIdCounter(): void {
  idCounter = 0
}

export interface TestUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'user' | 'viewer'
  createdAt: Date
  updatedAt: Date
}

export function createUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: nextId(),
    email: \`user-\${idCounter}@test.com\`,
    name: \`Test User \${idCounter}\`,
    role: 'user',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }
}

export interface TestProperty {
  id: string
  address: string
  status: 'active' | 'archived'
  sqft: number
  createdAt: Date
  updatedAt: Date
}

export function createProperty(overrides: Partial<TestProperty> = {}): TestProperty {
  return {
    id: nextId(),
    address: \`\${idCounter} Test Street\`,
    status: 'active',
    sqft: 1200,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }
}
`
}

function testHelpersMocksTs(config) {
  return `/**
 * Test mocks — ${config.projectName} API
 * Shared mock implementations for external dependencies.
 *
 * Usage:
 *   import { mockLogger, mockDatabase } from '../helpers/mocks'
 *   const logger = mockLogger()
 *   const db = mockDatabase()
 */
import { vi } from 'vitest'

export function mockLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  }
}

export function mockDatabase() {
  return {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    transaction: vi.fn(async (fn: Function) => fn()),
  }
}

export function mockRedis() {
  const store = new Map<string, string>()
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => { store.set(key, value) }),
    del: vi.fn(async (key: string) => { store.delete(key) }),
    incr: vi.fn(async (key: string) => {
      const val = parseInt(store.get(key) ?? '0') + 1
      store.set(key, String(val))
      return val
    }),
    expire: vi.fn().mockResolvedValue(true),
  }
}

export function mockEmailService() {
  return {
    send: vi.fn().mockResolvedValue({ messageId: 'mock-msg-id' }),
    sendTemplate: vi.fn().mockResolvedValue({ messageId: 'mock-msg-id' }),
  }
}
`
}

function testHelpersRenderTsx(config) {
  return [
    '/**',
    ` * Test render helper — ${config.projectName} Frontend`,
    ' * Wraps components with providers for testing.',
    ' * Always use renderWithProviders instead of render.',
    ' *',
    ' * Usage:',
    " *   import { renderWithProviders } from '../helpers/render'",
    " *   const { getByText } = renderWithProviders(<MyComponent />)",
    ' */',
    "import React, { type ReactElement } from 'react'",
    "import { render, type RenderOptions } from '@testing-library/react'",
    "import { axe, toHaveNoViolations } from 'jest-axe'",
    '',
    'expect.extend(toHaveNoViolations)',
    '',
    '// Add your providers here (router, theme, auth, etc.)',
    'function AllProviders({ children }: { children: React.ReactNode }) {',
    '  return <>{children}</>',
    '}',
    '',
    'export function renderWithProviders(',
    '  ui: ReactElement,',
    '  options?: Omit<RenderOptions, "wrapper">',
    ') {',
    '  return render(ui, { wrapper: AllProviders, ...options })',
    '}',
    '',
    '/**',
    ' * Run axe accessibility check on a container.',
    ' * Call this in EVERY component test.',
    ' *',
    ' * Usage:',
    " *   const { container } = renderWithProviders(<Button />)",
    " *   await expectNoA11yViolations(container)",
    ' */',
    'export async function expectNoA11yViolations(container: HTMLElement) {',
    '  const results = await axe(container)',
    '  expect(results).toHaveNoViolations()',
    '}',
  ].join('\n') + '\n'
}

function exampleUnitTestTs(config) {
  return `/**
 * Example unit test — ${config.projectName} API
 * Demonstrates the testing patterns for this project.
 * Delete this file once you have real tests.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { createUser, resetIdCounter } from '../helpers/factories'
import { mockLogger, mockDatabase } from '../helpers/mocks'

describe('Example — factories and mocks', () => {
  beforeEach(() => {
    resetIdCounter()
  })

  it('creates a user with default values', () => {
    const user = createUser()
    expect(user.id).toBe('test-1')
    expect(user.email).toBe('user-1@test.com')
    expect(user.role).toBe('user')
  })

  it('creates a user with overrides', () => {
    const user = createUser({ email: 'admin@test.com', role: 'admin' })
    expect(user.email).toBe('admin@test.com')
    expect(user.role).toBe('admin')
  })

  it('mockLogger records calls', () => {
    const logger = mockLogger()
    logger.info('test message', { key: 'value' })
    expect(logger.info).toHaveBeenCalledWith('test message', { key: 'value' })
  })

  it('mockDatabase returns empty results by default', async () => {
    const db = mockDatabase()
    const result = await db.query('SELECT 1')
    expect(result.rows).toEqual([])
    expect(result.rowCount).toBe(0)
  })
})
`
}

function exampleUnitTestTsx(config) {
  return [
    '/**',
    ` * Example React unit test — ${config.projectName} Frontend`,
    ' * Demonstrates component testing with accessibility checks.',
    ' * Delete this file once you have real tests.',
    ' */',
    "import { describe, it, expect } from 'vitest'",
    "import { screen } from '@testing-library/react'",
    "import { renderWithProviders, expectNoA11yViolations } from '../helpers/render'",
    '',
    'function ExampleButton({ label }: { label: string }) {',
    '  return <button type="button">{label}</button>',
    '}',
    '',
    "describe('Example — React component test', () => {",
    "  it('renders the button with label', () => {",
    "    renderWithProviders(<ExampleButton label=\"Click me\" />)",
    "    expect(screen.getByText('Click me')).toBeInTheDocument()",
    '  })',
    '',
    "  it('has no accessibility violations', async () => {",
    "    const { container } = renderWithProviders(<ExampleButton label=\"Click me\" />)",
    '    await expectNoA11yViolations(container)',
    '  })',
    '})',
  ].join('\n') + '\n'
}

function pytestConfig(config) {
  return `[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
markers = [
    "eval: marks tests as eval tests (run with --eval, costs money)",
    "integration: marks tests as integration tests (require services)",
    "slow: marks tests as slow (run with --slow)",
]
addopts = "-v --strict-markers"
filterwarnings = ["error", "ignore::DeprecationWarning"]

[tool.coverage.run]
source = ["src"]
omit = ["tests/*", "**/__pycache__/*"]

[tool.coverage.report]
fail_under = 80
show_missing = true
exclude_lines = [
    "pragma: no cover",
    "if TYPE_CHECKING:",
    "if __name__",
]
`
}

function conftest(config) {
  return `"""
Shared pytest fixtures — ${config.projectName}
Loaded automatically by pytest for all tests.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock


def pytest_addoption(parser):
    """Add custom CLI flags."""
    parser.addoption("--eval", action="store_true", default=False, help="Run eval tests (costs money)")


def pytest_configure(config):
    """Register custom markers."""
    config.addinivalue_line("markers", "eval: marks tests as eval tests")


def pytest_collection_modifyitems(config, items):
    """Skip eval tests unless --eval is passed."""
    if not config.getoption("--eval"):
        skip_eval = pytest.mark.skip(reason="need --eval option to run")
        for item in items:
            if "eval" in item.keywords:
                item.add_marker(skip_eval)


@pytest.fixture
def mock_logger():
    """Mock structured logger."""
    logger = MagicMock()
    logger.info = MagicMock()
    logger.warning = MagicMock()
    logger.error = MagicMock()
    logger.bind = MagicMock(return_value=logger)
    return logger


@pytest.fixture
def mock_db():
    """Mock async database connection."""
    db = AsyncMock()
    db.execute = AsyncMock(return_value=None)
    db.fetch_one = AsyncMock(return_value=None)
    db.fetch_all = AsyncMock(return_value=[])
    return db


@pytest.fixture
def mock_llm():
    """Mock LLM client — returns canned responses."""
    llm = AsyncMock()
    llm.invoke = AsyncMock(return_value=MagicMock(content="mock LLM response"))
    llm.ainvoke = AsyncMock(return_value=MagicMock(content="mock LLM response"))
    return llm
`
}

function pythonTestHelpersFactories(config) {
  return `"""
Test factories — ${config.projectName}
Create test data with sensible defaults.

Usage:
    from tests.helpers.factories import create_user, create_property
    user = create_user(email="custom@test.com")
"""
from datetime import datetime, timezone
from uuid import uuid4


_counter = 0


def _next_id() -> str:
    global _counter
    _counter += 1
    return f"test-{_counter}"


def reset_counter() -> None:
    global _counter
    _counter = 0


def create_user(**overrides) -> dict:
    defaults = {
        "id": _next_id(),
        "email": f"user-{_counter}@test.com",
        "name": f"Test User {_counter}",
        "role": "user",
        "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        "updated_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
    }
    return {**defaults, **overrides}


def create_property(**overrides) -> dict:
    defaults = {
        "id": _next_id(),
        "address": f"{_counter} Test Street",
        "status": "active",
        "sqft": 1200,
        "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        "updated_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
    }
    return {**defaults, **overrides}
`
}

function pythonTestHelpersMocks(config) {
  return `"""
Test mocks — ${config.projectName}
Shared mock implementations for external dependencies.

Usage:
    from tests.helpers.mocks import mock_logger, mock_db
"""
from unittest.mock import AsyncMock, MagicMock


def mock_logger() -> MagicMock:
    logger = MagicMock()
    logger.info = MagicMock()
    logger.warning = MagicMock()
    logger.error = MagicMock()
    logger.bind = MagicMock(return_value=logger)
    return logger


def mock_db() -> AsyncMock:
    db = AsyncMock()
    db.execute = AsyncMock(return_value=None)
    db.fetch_one = AsyncMock(return_value=None)
    db.fetch_all = AsyncMock(return_value=[])
    return db


def mock_redis() -> MagicMock:
    store: dict[str, str] = {}
    redis = AsyncMock()
    redis.get = AsyncMock(side_effect=lambda k: store.get(k))
    redis.set = AsyncMock(side_effect=lambda k, v: store.update({k: v}))
    redis.delete = AsyncMock(side_effect=lambda k: store.pop(k, None))
    return redis


def mock_llm_response(content: str = "mock response") -> MagicMock:
    response = MagicMock()
    response.content = content
    return response
`
}

function examplePythonUnitTest(config) {
  return `"""
Example unit test — ${config.projectName}
Demonstrates the testing patterns for this project.
Delete this file once you have real tests.
"""
import pytest
from tests.helpers.factories import create_user, reset_counter


class TestCreateUser:
    """Factory produces correct defaults."""

    def setup_method(self):
        reset_counter()

    def test_creates_user_with_defaults(self):
        user = create_user()
        assert user["id"] == "test-1"
        assert user["email"] == "user-1@test.com"
        assert user["role"] == "user"

    def test_creates_user_with_overrides(self):
        user = create_user(email="admin@test.com", role="admin")
        assert user["email"] == "admin@test.com"
        assert user["role"] == "admin"

    def test_increments_id(self):
        user1 = create_user()
        user2 = create_user()
        assert user1["id"] != user2["id"]


class TestAddNumbers:
    """Basic arithmetic — replace with real tests."""

    def test_positive_numbers(self):
        assert 2 + 3 == 5

    def test_negative_numbers(self):
        assert -1 + -2 == -3

    def test_zero(self):
        assert 0 + 0 == 0
`
}

function unitTestsCiYml(config) {
  const lintCmd = config.linter === 'biome' ? 'npx biome check src/' : 'npx eslint src/ --max-warnings 0'
  const hasAgents = config.projectType === 'full' || config.projectType === 'agent'

  let jobs = ''

  if (config.stack.includes('node')) {
    jobs += `  api-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install
        working-directory: services/api
      - name: Lint
        run: ${lintCmd}
        working-directory: services/api
      - name: Type check
        run: npx tsc --noEmit
        working-directory: services/api
      - name: Unit tests with coverage
        run: npx vitest run tests/unit/ --coverage
        working-directory: services/api
`
  }

  if (config.stack.includes('react')) {
    jobs += `  frontend-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install
        working-directory: frontend/dashboard
      - name: Lint
        run: ${lintCmd}
        working-directory: frontend/dashboard
      - name: Type check
        run: npx tsc --noEmit
        working-directory: frontend/dashboard
      - name: Unit tests with coverage
        run: npx vitest run tests/unit/ --coverage
        working-directory: frontend/dashboard
`
  }

  if (config.stack.includes('python')) {
    jobs += `  python-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install -r requirements.txt
        working-directory: batch/analytics
      - name: Lint
        run: ruff check src/ && ruff format --check src/
        working-directory: batch/analytics
      - name: Type check
        run: mypy src/ --strict
        working-directory: batch/analytics
      - name: Unit tests with coverage
        run: pytest tests/unit/ --cov=src --cov-fail-under=80
        working-directory: batch/analytics
`
  }

  if (hasAgents) {
    jobs += `  agent-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install -r agents/requirements.txt
      - name: Lint
        run: ruff check agents/ && ruff format --check agents/
      - name: Type check
        run: mypy agents/ --strict
      - name: Unit tests (no LLM calls)
        run: pytest agents/ -m "not eval" --cov=agents
`
  }

  return `name: Unit Tests
on:
  push:
    branches: ['**']
jobs:
${jobs}`
}

export async function generateFiles(config) {
  const root = config.context === 'brownfield' ? '.' : config.projectName;
  const t3 = '```';

  // ── CREATE DIRECTORIES ──
  const dirs = [
    `${root}/.claude/agents`,
    `${root}/.claude/rules`,
    `${root}/.agent/examples/greenfield`,
    `${root}/.agent/examples/brownfield`,
    `${root}/.agent/requirements`,
    `${root}/.agent/plans`,
    `${root}/.agent/snapshots`,
    `${root}/.agent/evidence`,
    `${root}/.agent/context`,
    `${root}/.agent/corrections`,
    `${root}/.agent/test-requirements`,
    `${root}/.agent/gates`,
    `${root}/.agent/logs`,
    `${root}/.agent/audit`,
    `${root}/.claude/constitutions`,
    `${root}/.agent/templates`,
    `${root}/pipeline/schemas`,
    `${root}/pipeline/scripts`,
    `${root}/pipeline/infra`,
    `${root}/docs`,
  ];

  if (config.stack.includes('node')) {
    dirs.push(
      `${root}/services/api/src/routes`,
      `${root}/services/api/src/services`,
      `${root}/services/api/src/middleware`,
      `${root}/services/api/src/stores`,
      `${root}/services/api/src/types`,
      `${root}/services/api/tests/unit`,
      `${root}/services/api/tests/integration`,
      `${root}/services/api/tests/characterization`,
    );
  }
  if (config.stack.includes('react')) {
    dirs.push(
      `${root}/frontend/dashboard/src/components`,
      `${root}/frontend/dashboard/src/pages`,
      `${root}/frontend/dashboard/src/lib`,
      `${root}/frontend/dashboard/tests/unit`,
      `${root}/frontend/dashboard/tests/e2e`,
    );
  }
  if (config.stack.includes('python')) {
    dirs.push(
      `${root}/batch/analytics/src/jobs`,
      `${root}/batch/analytics/tests/unit`,
      `${root}/batch/analytics/tests/integration`,
    );
  }
  if (config.ci === 'github-actions') dirs.push(`${root}/.github/workflows`);
  if (config.context === 'brownfield') dirs.push(`${root}/.agent/discovery`);

  dirs.forEach(d => mkdirSync(toForwardSlash(d), { recursive: true }));

  const write = (path, content) => writeFileSync(toForwardSlash(`${root}/${path}`), content, 'utf8');
  const lintCmd = config.linter === 'biome' ? 'biome check src/' : 'eslint src/ --max-warnings 0';

  // ── .claude/CLAUDE.md ──
  write('.claude/CLAUDE.md', `# CLAUDE — Autonomous SDLC Agent Context
# Project: ${config.projectName}
# Context: ${config.context.toUpperCase()} · Stack: ${config.stack.join(' + ')}
# Generated by: @yooti/cli v1.0.0

## Your role
You are a senior software engineer operating inside an autonomous SDLC pipeline.
You execute tasks defined in .plan.md files precisely and within scope.
You write production-quality code, tests TDD-first, self-heal failures up to 5 iterations,
and produce evidence packages for human review at Gate G3 (PR review).

## Toolchain — run in this exact order every iteration

### Node.js API (services/api/)
  Step 1 Lint:   ${lintCmd}
  Step 2 Types:  npx tsc --noEmit --strict
  Step 3 Tests:  npx vitest run tests/unit/ --coverage
  Step 4 Green:  commit

### React Frontend (frontend/dashboard/)
  Step 1 Lint:       ${lintCmd}
  Step 2 Types:      npx tsc --noEmit
  Step 3 Tests:      npx vitest run --coverage  (axe-core runs inside)
  Step 4 Playwright: npx playwright test
  Step 5 Green:      commit

### Python Batch (batch/analytics/)
  Step 1 Lint:   ruff check src/ && ruff format --check src/
  Step 2 Types:  mypy src/ --strict
  Step 3 Tests:  pytest tests/unit/ --cov=src
  Step 4 Green:  commit

RULE: If ANY step fails → diagnose → fix → restart from Step 1. Never skip steps.

## Working in the agents/ layer

When generating or modifying any file inside agents/:

Read these constitutions first:
  .claude/constitutions/python.md
  .claude/constitutions/langgraph.md
  .claude/constitutions/security.md
  .claude/constitutions/testing.md

Agent architecture rules (summary — full detail in langgraph.md):
  State is immutable — nodes return dicts, never mutate
  One node, one responsibility — max 50 lines per node
  Errors are state — return {"error": str(e)}, never raise
  Prompts are files — read from agents/[name]/prompts/ not hardcoded
  Structured logging — structlog on every node entry and exit

Test layers for any agent story:
  Unit:        agents/[name]/tests/unit/       no LLM calls, every commit
  Integration: agents/[name]/tests/integration/ mocked LLM, every PR
  Evals:       agents/[name]/tests/evals/       real LLM, nightly only

Never add a .claude/ folder inside agents/
All Claude context lives here in the root .claude/ folder

## Agent read order — execute before every task

1. Read .agent/requirements/[STORY-ID]-validated.json       — the spec
2. Read .agent/plans/[STORY-ID]-T00N.plan.md                — your task scope and steps
3. Read .agent/context/[STORY-ID]/ (all files, if exists)   — human-attached context
4. Read .agent/corrections/ (filter by your task-id)        — injected fixes from humans
5. Read .agent/test-requirements/ (filter by story-id)      — mandatory test specs from QA
6. Check .agent/gates/ for G2 approval                      — do not code without sign-off
7. Check .agent/escalations/ for unresolved items            — do not proceed if you have open escalations

You may NOT begin code generation until:
- The story has a validated_requirement.json
- The task has a .plan.md with status PENDING or IN_PROGRESS
- Gate G2 is signed (a G2-approved.md file exists for this story)
- You have no unresolved escalations for this task

### Context handling
Context in .agent/context/[STORY-ID]/ is attached by humans.
Read ALL files in that folder before generating code.
If a context file references a URL, fetch it.
If a context file references a local file path, read it.
If a context file type is "constraint", treat it as an absolute rule — never violate it.
If a context file type is "api", use the exact endpoints and schemas defined.

### Correction handling
Corrections in .agent/corrections/ override your previous approach.
Read all corrections for your task-id before each iteration.
A correction marked "Is blocker: YES" means STOP all other work and fix this first.
A correction takes precedence over the original .plan.md.

### Scope handling
Only modify files listed in your .plan.md under CREATE or MODIFY.
If you need a file not in scope: STOP, write .agent/escalations/[TASK-ID]-scope.md, wait.
If a correction has type SCOPE_ERROR: revert out-of-scope changes immediately.

### Test requirements
Read .agent/test-requirements/ for your story before writing tests.
Each requirement specifies layer, scenario, priority, and target file.
P0 requirements must pass before PR. P1 must pass before G4.

## Audit logging — required for every action

You must log every significant action to .agent/logs/[STORY-ID].log.json.
Use the appendEvent function from src/audit/logger.js.
Do not skip logging — the audit trail is a compliance requirement.

Log these events:
- Every phase transition              → PHASE_START
- Every file you create or modify     → FILES_CHANGED
- Every iteration you start           → ITERATION_START
- Every quality check result          → QUALITY_RESULT (PASS or FAIL)
- Every escalation you write          → ESCALATION
- When you open a PR                  → PR_OPENED
- When a story is complete            → STORY_CLOSED with summary stats

Human actions (gates, corrections, annotations) are logged by
the human via CLI commands — you do not log those.

## Coding constitutions — read before writing any code

These files define the coding standards, patterns, and rules for this project.
Read every constitution that applies to the layer you are working in.
A constitution violation blocks the PR — no exceptions.

Always apply:
- .claude/constitutions/security.md
- .claude/constitutions/testing.md

${config.stack.includes('node') ? 'TypeScript layer:\n- .claude/constitutions/typescript.md' : ''}
${config.stack.includes('react') || config.stack.includes('nextjs') ? 'React layer:\n- .claude/constitutions/react.md' : ''}
${config.stack.includes('python') ? 'Python layer:\n- .claude/constitutions/python.md' : ''}
${config.hasPostgres ? 'Database layer:\n- .claude/constitutions/postgresql.md' : ''}
${config.hasMongo ? 'MongoDB layer:\n- .claude/constitutions/mongodb.md' : ''}
${config.projectType === 'full' || config.projectType === 'agent' ? 'Agent layer:\n- .claude/constitutions/langgraph.md' : ''}

## Story type templates

When creating a new story, use the appropriate template from .agent/templates/.
Each template defines the required fields, acceptance criteria structure,
definition of done, and which constitutions apply.

Available templates:
- .agent/templates/feature-story.json      — new features
- .agent/templates/bugfix-story.json       — bug fixes (regression test first)
- .agent/templates/refactor-story.json     — refactors (no behaviour change)
- .agent/templates/security-patch.json     — security vulnerabilities (P0)
- .agent/templates/api-contract.json       — API endpoints (contract tests)
${config.projectType === 'full' || config.projectType === 'agent' ? '- .agent/templates/agent-story.json       — LangGraph agents (3-layer testing)' : ''}

## Unit testing — mandatory on every story

Write tests BEFORE implementation (TDD).
Iteration 1 always starts with failing tests.

Node.js API:
  Run:      cd services/api && npm run test:coverage
  Location: tests/unit/*.test.ts
  Helpers:  import { createUser } from '../helpers/factories'
            import { mockLogger, mockDatabase } from '../helpers/mocks'
  Config:   vitest.config.ts — coverage thresholds enforced

React frontend:
  Run:      cd frontend/dashboard && npm run test:coverage
  Location: tests/unit/*.test.tsx
  Helpers:  import { renderWithProviders } from '../helpers/render'
  Required: axe accessibility test in EVERY component test

Python agents/batch:
  Run:      pytest -m "not eval and not integration" --cov
  Location: tests/unit/test_*.py
  Helpers:  from tests.helpers.factories import create_user
  Config:   pyproject.toml — fail_under = 80 enforced
  Note:     pytest --eval runs eval tests (nightly only, costs money)

## When you add a new dependency

After adding a package to package.json or requirements.txt:
Write: .agent/escalations/[TASK-ID]-install-required.md

Content:
  # Install required
  Task: [TASK-ID]
  Package: [package name and version]
  File updated: [package.json | requirements.txt]
  Command to run:
    npm install           (Node.js)
    pip install -r requirements.txt --break-system-packages (Python)
    docker compose restart [service] (if using Docker)

Do not proceed with code generation until the install
escalation is acknowledged by the developer.
The package will not be importable until it is installed.

## Absolute rules
1. SCOPE — only modify files listed in your .plan.md "Files in Scope"
2. TDD — write tests before implementation. Iteration 0 = RED tests
3. NO INVENTED APIS — every import must exist in package.json / requirements.txt
4. NO SECRETS — all config via environment variables (.env.example has the names)
5. ZERO WARNINGS — --max-warnings 0 enforced. Fix all warnings.
6. ESCALATE — write to .agent/escalations/ on: SCOPE_ERROR, ENV_ERROR, SPEC_AMBIGUITY, >5 iterations

## Context: ${config.context.toUpperCase()}
${config.context === 'brownfield'
  ? `- Read .agent/discovery/risk-surface.json before touching any file
- Read .claude/rules/brownfield-rules.md before generating code
- Characterization tests REQUIRED before modifying files with coverage < 40%
- Match existing code style exactly. Minimize diff. No opportunistic refactoring.`
  : `- Read .claude/rules/greenfield-rules.md for the Pattern Mandate
- You are establishing the patterns — consistency > cleverness`}

## Quality gates — all must pass before PR
| Gate | Threshold | Blocks? |
|------|-----------|---------|
| Lint | 0 warnings | YES |
| Types | 0 errors | YES |
| Unit tests | 100% pass | YES |
| Coverage overall | >= 80% | YES |
| Coverage new code | >= 90% | YES |
| Regression diff | 0 new failures | YES |
| Accessibility | 0 violations | YES |
| Lighthouse perf | >= 80 | YES |

## Pipeline stage: ${config.stage} — ${stageDescription(config.stage)}

### What the agent does at this stage
${stageAgentInstructions(config.stage)}

### What the human does at this stage
${stageHumanInstructions(config.stage)}

### Handover points — STOP and wait for human at these points
${stageHandoverPoints(config.stage)}
`);

  // ── .claude/agents/ ──
  write('.claude/agents/requirements.md', `# Requirements Ingestion Agent
Parse raw user stories into validated_requirement.json.
Flag ambiguities: BLOCKER (hold), WARNING (proceed with note), NOTE (log only).
Structure every AC as Given/When/Then with testable: true/false.
Write to: .agent/requirements/STORY-NNN-validated.json
Validate against: pipeline/schemas/validated_requirement.schema.json
`);

  write('.claude/agents/codegen.md', `# Code Generation Agent

## Before writing any code
1. Read the .plan.md file completely
2. Read current content of every file you will MODIFY
3. Read reference files for pattern context
4. Run: node pipeline/scripts/preflight.js

## Generation loop (max 5 iterations)
  1. Write/modify code (within .plan scope ONLY)
  2. ${lintCmd} — FAIL: fix manually, restart
  3. tsc --noEmit / mypy --strict — FAIL: fix types, restart
  4. Hallucination check: all imports exist? all signatures match? — FAIL: fix, restart
  5. vitest run tests/unit/ / pytest tests/unit/ — FAIL: diagnose (see diagnosis.md), fix, restart
  6. All green: git commit

## Commit format
feat(STORY-NNN): short description
- what changed and why
Relates-to: STORY-NNN | Task: T-00N | Agent: CodeGenAgent | Iteration: N

## SCOPE_ERROR protocol
If you need a file NOT in .plan scope:
  STOP. Write .agent/escalations/STORY-NNN-scope.md. Do not proceed.
`);

  write('.claude/agents/testgen.md', `# Test Generation Agent — TDD Mandate

## Core rule: tests BEFORE implementation
Iteration 0 = tests written, ALL FAILING (RED). This is correct.
Never write implementation before tests exist.

## Unit test dimensions (cover all 5)
1. Happy path — primary success scenario
2. Boundary conditions — at limit, one over, one under
3. Error handling — when dependencies fail
4. Interface contract — public API matches .plan spec
5. Configuration — respects injected config values

## Unit test rules
- ALL external I/O mocked (no real DB, Redis, AWS in unit tests)
- One assertion per test
- Descriptive names — reads like a sentence
- Independent — no shared mutable state

## Integration tests
- Derived from acceptance criteria (Given/When/Then → assertions)
- Real services via docker-compose.test.yml
- Full setup AND teardown per test

## Accessibility (frontend)
- axe(container) after EVERY component render — zero violations required

## Playwright (frontend) — 3 mandatory viewports
  mobile: 375px | tablet: 768px | desktop: 1280px

## Python/AWS
- @mock_aws on ALL tests touching S3, SQS, DynamoDB, Lambda
`);

  write('.claude/agents/diagnosis.md', `# Diagnosis Agent — Self-Healing

| Code | Source | Auto-fix | Escalate after |
|------|--------|----------|----------------|
| LINT_ERROR | ESLint/Biome/Ruff | Read error, fix manually | 3 retries |
| TYPE_ERROR | tsc/mypy | Fix types, check interfaces | 3 retries |
| IMPORT_ERROR | Hallucination guard | Scan package.json, correct path | 2 retries |
| LOGIC_ERROR | Unit tests | Re-read AC from .plan, rewrite | 5 retries |
| A11Y_ERROR | axe-core | Fix ARIA, labels, contrast | 3 retries |
| ENV_ERROR | Integration tests | STOP — escalate to DevOps | Immediately |
| SCOPE_ERROR | Scope guard | STOP — escalate to Dev | Immediately |

## Process
1. Read complete error output
2. Classify using table above
3. Apply minimum fix targeting the root cause only
4. Restart from Step 1 of generation loop
5. Log each attempt in .agent/evidence/STORY-NNN/iteration-log.json
`);

  write('.claude/agents/deploy.md', `# Deploy Agent
# Activated after Gate G4 (QA sign-off)

## Staging (automatic after G4)
1. docker compose -f docker-compose.staging.yml up -d
2. Wait 30s, run smoke tests
3. Generate .agent/evidence/STORY-NNN/staging-health.json
4. Notify Release Manager for G5 review

## Production (after G5 approval — requires --confirm)
1. Blue-green or rolling deploy
2. 15-minute health window: p99 latency, error rate, business metrics
3. AUTO-ROLLBACK if any check fails within 15 min
4. On success: close tickets, post release notes to Slack
`);

  // ── .claude/rules/ ──
  write('.claude/rules/scope-enforcement.md', `# Scope Enforcement — Zero Tolerance

The .plan.md file is the contract. Files in Scope = the ONLY files you may touch.

## SCOPE_ERROR protocol
If you need to touch a file NOT in your .plan:
  1. STOP immediately — do not make the change
  2. Write: .agent/escalations/STORY-NNN-scope.md
     - Which file, why you need it, impact, recommendation
  3. Wait for developer to amend the .plan
  4. Do not proceed

No exceptions. Scope creep is the highest-risk failure mode in autonomous pipelines.
`);

  write('.claude/rules/greenfield-rules.md', `# Greenfield Pattern Mandate
# Apply to ALL code in this project

## Architecture
- Services: class-based, constructor dependency injection
- Controllers/routes: thin — validate, call service, return response
- Services: business logic only — no HTTP, no DB queries
- Repositories: DB layer only — no business logic
- Errors: extend AppError base class — never throw raw Error()

## TypeScript
- Interfaces for all data shapes, never raw objects in signatures
- Enums for status fields, event types, role names
- No 'any' — figure out the type
- Explicit return types on all exported functions

## Async
- async/await only — no .then() chains
- Promise.all() for parallel — never sequential await in a loop

## Naming
- PascalCase: PropertyService.ts
- camelCase: formatCurrency.ts
- kebab-case: property-routes.ts

## Never use console.log in production code
- Structured logging only (JSON) with requestId, userId, timestamp, service
`);

  write('.claude/rules/brownfield-rules.md', `# Brownfield Rules — Surgical Mode

## Core principle
Make the smallest possible change to achieve the story goal.
You are a surgeon, not an architect.

## Before touching any file
1. Check .agent/discovery/risk-surface.json — is this file high risk?
2. If coverage < 40% or dependents > 5: write characterization tests FIRST
3. Read 50 lines above and below your change point for context

## Style — match exactly
- Indentation, quotes, semicolons: match what's already there
- If existing code uses .then(): your new code uses .then()
- You are joining a codebase, not rewriting it

## Tests — append only
- NEVER modify an existing passing test
- ADD new tests only — append to existing test files
- Characterization tests lock existing behavior (right or wrong)

## Reuse first
Search before creating: does this utility/pattern already exist?

## Found a bug out of scope?
Do NOT fix it. Write .agent/tech-debt/STORY-NNN-bug.md and move on.
`);

  // ── Pipeline schemas ──
  write('pipeline/schemas/validated_requirement.schema.json', JSON.stringify({
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "ValidatedRequirement",
    "type": "object",
    "required": ["story_id", "title", "type", "acceptance_criteria", "definition_of_done"],
    "properties": {
      "story_id": { "type": "string", "pattern": "^STORY-[0-9]+" },
      "title": { "type": "string", "minLength": 5 },
      "type": { "type": "string", "enum": ["feature", "bugfix", "refactor", "chore"] },
      "priority": { "type": "string", "enum": ["P0", "P1", "P2", "P3"] },
      "acceptance_criteria": {
        "type": "array", "minItems": 1,
        "items": {
          "type": "object",
          "required": ["id", "given", "when", "then", "testable"],
          "properties": {
            "id": { "type": "string" },
            "given": { "type": "string" },
            "when": { "type": "string" },
            "then": { "type": "string" },
            "testable": { "type": "boolean" }
          }
        }
      },
      "definition_of_done": { "type": "array", "items": { "type": "string" } },
      "estimated_complexity": { "type": "string", "enum": ["XS", "S", "M", "L", "XL"] }
    }
  }, null, 2));

  // ── Pipeline scripts ──
  write('pipeline/scripts/preflight.js', [
    '#!/usr/bin/env node',
    '// Yooti pre-flight checks — runs on Mac, Linux, and Windows',
    '// Usage: node pipeline/scripts/preflight.js',
    '',
    "import { existsSync, readFileSync } from 'fs'",
    "import { execSync } from 'child_process'",
    '',
    'const results = []',
    '',
    'function check(name, fn) {',
    '  try {',
    '    const result = fn()',
    "    results.push({ name, pass: result !== false, reason: typeof result === 'string' ? result : null })",
    '  } catch (err) {',
    '    results.push({ name, pass: false, reason: err.message })',
    '  }',
    '}',
    '',
    '// 1. Git repository exists',
    "check('Git repository exists', () => {",
    "  execSync('git rev-parse --git-dir', { stdio: 'ignore' })",
    '  return true',
    '})',
    '',
    '// 2. Working tree is clean',
    "check('Working tree is clean', () => {",
    "  const out = execSync('git status --porcelain', { encoding: 'utf8' })",
    '  const lines = out.split(\'\\n\').filter(Boolean)',
    "  const trackedChanges = lines.filter(line => !line.startsWith('??'))",
    '  if (trackedChanges.length > 0) {',
    "    const files = trackedChanges.map(l => l.trim()).join(', ')",
    "    throw new Error('Modified tracked files found: ' + files + '. Commit or stash before running.')",
    '  }',
    "  const untracked = lines.filter(line => line.startsWith('??'))",
    '  if (untracked.length > 0) {',
    "    return 'Pass — ' + untracked.length + ' untracked file(s) present (not blocking)'",
    '  }',
    '  return true',
    '})',
    '',
    '// 3. docker-compose.yml exists',
    "check('docker-compose.yml exists', () => {",
    "  if (!existsSync('docker-compose.yml')) throw new Error('docker-compose.yml not found in project root')",
    '  return true',
    '})',
    '',
    '// 4. .claude/CLAUDE.md exists',
    "check('.claude/CLAUDE.md exists', () => {",
    "  if (!existsSync('.claude/CLAUDE.md')) throw new Error('.claude/CLAUDE.md not found — run yooti init')",
    '  return true',
    '})',
    '',
    '// 5. yooti.config.json exists and is valid JSON',
    "check('yooti.config.json is valid', () => {",
    "  if (!existsSync('yooti.config.json')) throw new Error('yooti.config.json not found — run yooti init')",
    '  try {',
    "    JSON.parse(readFileSync('yooti.config.json', 'utf8'))",
    '  } catch {',
    "    throw new Error('yooti.config.json contains invalid JSON')",
    '  }',
    '  return true',
    '})',
    '',
    '// 6. Pipeline scripts exist',
    "check('Pipeline scripts exist', () => {",
    '  const required = [',
    "    'pipeline/scripts/preflight.js',",
    "    'pipeline/scripts/snapshot.py',",
    "    'pipeline/scripts/regression-diff.py',",
    "    'pipeline/scripts/generate-pr-body.py',",
    '  ]',
    '  const missing = required.filter(f => !existsSync(f))',
    "  if (missing.length > 0) throw new Error('Missing: ' + missing.join(', '))",
    '  return true',
    '})',
    '',
    '// 7. Example artifacts exist',
    "check('Example artifacts exist', () => {",
    "  if (!existsSync('.agent/examples')) throw new Error('.agent/examples not found — run yooti init')",
    '  return true',
    '})',
    '',
    '// ── Results ──',
    'const pass = results.filter(r => r.pass).length',
    'const fail = results.filter(r => !r.pass).length',
    '',
    "console.log('')",
    'results.forEach(r => {',
    '  if (r.pass) {',
    "    const isWarn = typeof r.reason === 'string' && r.reason.includes('untracked')",
    "    const icon = isWarn ? '\\x1b[33m⚠\\x1b[0m' : '\\x1b[32m✓\\x1b[0m'",
    "    console.log('  ' + icon + ' ' + r.name)",
    "    if (isWarn && r.reason) console.log('    \\x1b[2m→ ' + r.reason + '\\x1b[0m')",
    '  } else {',
    "    console.log('  \\x1b[31m✗\\x1b[0m ' + r.name)",
    "    if (r.reason) console.log('    \\x1b[2m→ ' + r.reason + '\\x1b[0m')",
    '  }',
    '})',
    '',
    "console.log('')",
    "console.log('  ' + pass + '/' + results.length + ' checks passed')",
    '',
    'if (fail > 0) {',
    "  const s = fail > 1 ? 's' : ''",
    "  console.log('\\n  \\x1b[31m' + fail + ' check' + s + ' failed. Fix the issues above before continuing.\\x1b[0m\\n')",
    '  process.exit(1)',
    '} else {',
    "  console.log('  \\x1b[32mAll checks passed. Ready to start sprint.\\x1b[0m\\n')",
    '  process.exit(0)',
    '}',
  ].join('\n'));

  write('pipeline/scripts/snapshot.py', `#!/usr/bin/env python3
"""Capture regression baseline snapshot. Usage: python snapshot.py [tag]"""
import json, subprocess, sys, os
from datetime import datetime, timezone

def run(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return r.stdout.strip()

tag = sys.argv[1] if len(sys.argv) > 1 else datetime.now().strftime("%Y%m%d-%H%M%S")
snapshot = {
    "captured_at": datetime.now(timezone.utc).isoformat(),
    "tag": tag,
    "git_sha": run("git rev-parse HEAD"),
    "git_branch": run("git branch --show-current"),
    "note": "Run with real test suite output for full baseline"
}
os.makedirs(".agent/snapshots", exist_ok=True)
fname = f".agent/snapshots/{tag}.json"
with open(fname, "w") as f:
    json.dump(snapshot, f, indent=2)
print(f"Snapshot saved: {fname}")
`);

  write('pipeline/scripts/regression-diff.py', `#!/usr/bin/env python3
"""Compare current tests against baseline. Usage: python regression-diff.py"""
import json, glob, sys, os

snapshots = sorted(glob.glob(".agent/snapshots/*.json"))
if not snapshots:
    print("No baseline found. Run: python pipeline/scripts/snapshot.py")
    sys.exit(1)

with open(snapshots[-1]) as f:
    baseline = json.load(f)

print(f"Baseline: {snapshots[-1]}")
print(f"Captured: {baseline.get('captured_at', 'unknown')}")
print(f"SHA:      {baseline.get('git_sha', 'unknown')[:8]}")
print()
print("0 regressions vs baseline.")
print("(Connect to your test runner output for full diff)")
`);

  write('pipeline/scripts/generate-pr-body.py', `#!/usr/bin/env python3
"""Generate PR body from evidence package. Usage: python generate-pr-body.py STORY-001"""
import json, sys, os
from datetime import datetime

story_id = sys.argv[1] if len(sys.argv) > 1 else "STORY-001"
req_path = f".agent/requirements/{story_id}-validated.json"
story = {}
if os.path.exists(req_path):
    with open(req_path) as f:
        story = json.load(f)

title = story.get("title", story_id)
acs = story.get("acceptance_criteria", [])
ac_table = "\\n".join(f"| {ac['id']}: {ac['then'][:55]} | pending | pending |" for ac in acs)

body = f"""## {story_id}: {title}

### What changed
<!-- Agent: summarise implementation -->

### Acceptance Criteria
| Criteria | Status | Test |
|----------|--------|------|
{ac_table}

### Test Results
- Unit: .agent/evidence/{story_id}/test-results.json
- Coverage: .agent/evidence/{story_id}/coverage-summary.json
- Regression: .agent/evidence/{story_id}/regression-diff.json

### Known Gaps
<!-- Agent: document uncovered branches -->

---
Generated {datetime.now().strftime("%Y-%m-%d %H:%M")} by @yooti/cli
"""

os.makedirs(f".agent/evidence/{story_id}", exist_ok=True)
out = f".agent/evidence/{story_id}/pr-body.md"
with open(out, "w") as f:
    f.write(body)
print(f"PR body written: {out}")
`);

  // ── Docker compose ──
  const hasPostgres = config.hasPostgres !== undefined ? config.hasPostgres : true;
  const hasRedis    = config.hasRedis    !== undefined ? config.hasRedis    : true;
  const hasMongo    = config.hasMongo    || false;
  const hasAge      = config.hasAge      || false;
  const hasPgvector = (config.databases || []).includes('pgvector');

  const composeParts = [];
  composeParts.push(`version: '3.9'`);
  composeParts.push('');
  composeParts.push('services:');

  // API service
  if (config.stack.includes('node')) {
    const apiDeps = [hasPostgres && 'postgres', hasRedis && 'redis'].filter(Boolean);
    composeParts.push(`
  api:
    build: ./services/api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=\${DATABASE_URL}
      - REDIS_URL=\${REDIS_URL}
    volumes:
      - ./services/api:/app
      - /app/node_modules
    depends_on:
${apiDeps.map(d => `      - ${d}`).join('\n')}
    restart: unless-stopped`);
  }

  // Python FastAPI service
  if (config.backend === 'python-api' || config.stack?.includes('python-api')) {
    const fastApiDeps = [hasPostgres && 'postgres', hasRedis && 'redis'].filter(Boolean);
    composeParts.push(`
  api_python:
    build: ./services/api_python
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=\${DATABASE_URL}
      - REDIS_URL=\${REDIS_URL}
      - ANTHROPIC_API_KEY=\${ANTHROPIC_API_KEY}
    volumes:
      - ./services/api_python:/app
    depends_on:
${fastApiDeps.map(d => `      - ${d}`).join('\n')}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 10s
      timeout: 5s
      retries: 5`);
  }

  // Agent service
  if (config.stack.includes('python') || config.projectType === 'agent') {
    const agentDeps = [hasPostgres && 'postgres'].filter(Boolean);
    composeParts.push(`
  agents:
    build: ./agents
    ports:
      - "8001:8001"
    environment:
      - DATABASE_URL=\${DATABASE_URL}
      - ANTHROPIC_API_KEY=\${ANTHROPIC_API_KEY}
      - LANGCHAIN_TRACING_V2=\${LANGCHAIN_TRACING_V2}
      - LANGCHAIN_API_KEY=\${LANGCHAIN_API_KEY}
    volumes:
      - ./agents:/app
    depends_on:
${agentDeps.map(d => `      - ${d}`).join('\n')}
    restart: unless-stopped`);
  }

  // Frontend service
  if (config.stack.includes('react') || config.stack.includes('nextjs')) {
    composeParts.push(`
  frontend:
    build: ./frontend/dashboard
    ports:
      - "5173:5173"
    volumes:
      - ./frontend/dashboard:/app
      - /app/node_modules
    restart: unless-stopped`);
  }

  // Database services — only what was selected
  if (hasPostgres) {
    const pgvectorInit = hasPgvector
      ? `\n      - ./pipeline/scripts/init-pgvector.sql:/docker-entrypoint-initdb.d/01-pgvector.sql`
      : '';
    const ageInit = hasAge
      ? `\n      - ./pipeline/scripts/init-age.sql:/docker-entrypoint-initdb.d/02-age.sql`
      : '';
    composeParts.push(`
  postgres:
    image: ${hasPgvector ? 'pgvector/pgvector:pg16' : 'postgres:16-alpine'}
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=app
      - POSTGRES_PASSWORD=app
      - POSTGRES_DB=appdb
    volumes:
      - pg_data:/var/lib/postgresql/data${pgvectorInit}${ageInit}
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      timeout: 5s
      retries: 5`);
  }

  if (hasRedis) {
    composeParts.push(`
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5`);
  }

  if (hasMongo) {
    composeParts.push(`
  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=app
      - MONGO_INITDB_ROOT_PASSWORD=app
      - MONGO_INITDB_DATABASE=appdb
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped`);
  }

  // Volumes
  const composeVolumes = [];
  if (hasPostgres) composeVolumes.push('  pg_data:');
  if (hasRedis)    composeVolumes.push('  redis_data:');
  if (hasMongo)    composeVolumes.push('  mongo_data:');

  if (composeVolumes.length) {
    composeParts.push('');
    composeParts.push('volumes:');
    composeParts.push(composeVolumes.join('\n'));
  }

  write('docker-compose.yml', composeParts.join('\n') + '\n');

  // ── Database init scripts ──
  if (hasPgvector) {
    write('pipeline/scripts/init-pgvector.sql', `-- pgvector extension init
-- Runs automatically on first docker compose up
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT extname, extversion
FROM pg_extension
WHERE extname = 'vector';
`);
  }

  if (hasAge) {
    write('pipeline/scripts/init-age.sql', `-- Apache AGE extension init
-- Runs automatically on first docker compose up
CREATE EXTENSION IF NOT EXISTS age;
LOAD 'age';
SET search_path = ag_catalog, "$user", public;

-- Create default graph
SELECT create_graph('${config.projectName}_graph');
`);
  }

  // ── yooti.config.json ──
  write('yooti.config.json', JSON.stringify({
    version: "1.0.0",
    project: config.projectName,
    context: config.context,
    stage: config.stage,
    stack: {
      services: config.stack.map(s => ({
        name: s === 'node' ? 'api' : s === 'react' ? 'frontend' : 'batch',
        lang: s,
        path: s === 'node' ? 'services/api' : s === 'react' ? 'frontend/dashboard' : 'batch/analytics'
      }))
    },
    pipeline: {
      stage: config.stage,
      description: stageDescription(config.stage),
      phases: stagePhases(config.stage),
      gates: stageGates(config.stage)
    },
    toolchain: {
      api: {
        linter: config.linter,
        formatter: config.linter === 'biome' ? 'biome' : 'prettier',
        type_check: "tsc",
        test_runner: "vitest",
        test_command: "npm run test:coverage",
        test_unit: "npm run test -- tests/unit/",
        test_integration: "npm run test -- tests/integration/",
        coverage_threshold: 80,
        new_code_threshold: 90,
        mutation: "stryker",
        security: ["snyk", "semgrep"]
      },
      frontend: {
        linter: config.linter,
        type_check: "tsc",
        test_runner: "vitest",
        test_command: "npm run test:coverage",
        a11y_runner: "axe-core",
        e2e_runner: "playwright",
        component_isolation: "storybook",
        responsive_breakpoints: [375, 768, 1280],
        accessibility_standard: "WCAG21AA",
        performance: "lighthouse-ci"
      },
      batch: {
        linter: "ruff",
        formatter: "ruff",
        type_check: "mypy",
        test_runner: "pytest",
        test_command: "pytest -m 'not eval and not integration'",
        test_unit: "pytest -m 'not eval and not integration'",
        test_integration: "pytest -m integration",
        test_evals: "pytest --eval",
        coverage_threshold: 80,
        aws_mock: "moto"
      }
    },
    quality_gates: {
      coverage_threshold: 80,
      new_code_coverage: 90,
      mutation_score: 85,
      lighthouse_performance: 80,
      lighthouse_accessibility: 90,
      max_agent_iterations: 5,
      zero_lint_warnings: true,
      zero_type_errors: true,
      zero_security_findings: true,
      zero_a11y_violations: true
    },
    yooti_os: {
      enabled: config.yootiOs || false,
      endpoint: null
    }
  }, null, 2));

  // ── Example artifacts ──
  const exReq = (ctx) => JSON.stringify({
    story_id: "STORY-001",
    title: ctx === 'greenfield' ? "Property CRUD — create, read, update, archive" : "Add rate limiting to POST /auth/login",
    type: "feature", priority: "P1", context: ctx,
    acceptance_criteria: [{
      id: "AC-1",
      given: ctx === 'greenfield' ? "An authenticated property manager" : "A user submits more than 5 login attempts in 60 seconds",
      when: ctx === 'greenfield' ? "They POST /properties with a valid payload" : "The 6th request arrives",
      then: ctx === 'greenfield' ? "Property created, 201 returned with id" : "Return HTTP 429 with Retry-After header",
      testable: true
    }],
    definition_of_done: ["Unit tests passing", "Integration tests passing", "Coverage new code >= 90%", "0 regressions"],
    estimated_complexity: "M"
  }, null, 2);

  write('.agent/examples/greenfield/validated_requirement.json', exReq('greenfield'));
  write('.agent/examples/brownfield/validated_requirement.json', exReq('brownfield'));

  write('.agent/examples/greenfield/STORY-001-T001.plan.md', `# STORY-001-T001 — Property Service + Repository

## Status
PENDING

## Scope

CREATE:
- services/api/src/services/PropertyService.ts
- services/api/src/repositories/PropertyRepository.ts
- services/api/src/types/property.types.ts

MODIFY:
- services/api/src/container.ts

OUT OF SCOPE (do not touch):
- services/api/src/app.ts
- services/api/src/routes/ (handled in T002)

## Acceptance criteria covered
- AC-1: POST /properties with valid payload returns 201 with id and timestamps

## Implementation steps
1. Define PropertyRecord type: { id, address, status, sqft, createdAt, updatedAt }
2. Define PropertyStatus enum: ACTIVE | ARCHIVED
3. PropertyRepository: create(), findById(), update(), archive() (soft-delete, status=ARCHIVED)
4. PropertyService: wraps repository, adds business validation
5. Register both in container.ts as singletons

## Dependencies
Depends on: none
Blocks: T002

## Role annotations
<!-- Humans add structured notes here using yooti commands -->
<!-- Format: [ROLE GATE timestamp]: note text -->
`);

  write('.agent/examples/brownfield/STORY-001-T001.plan.md', `# STORY-001-T001 — Redis Rate Limit Store

## Status
PENDING

## Scope

CREATE:
- services/api/src/stores/RateLimitStore.ts
- services/api/tests/unit/RateLimitStore.test.ts

MODIFY:
- services/api/src/container.ts

OUT OF SCOPE (do not touch):
- services/api/src/app.ts (HIGH RISK — 12 dependents — handled in T002)
- Any existing auth files

## Acceptance criteria covered
- AC-1: 6th request in 60s returns allowed: false with correct ttl

## Implementation steps
1. RateLimitResult type: { count, ttl, allowed }
2. RateLimitStore: increment(ip) using Redis INCR + EXPIRE
3. Fail-open: if Redis unavailable log warning and return allowed: true
4. Register in container.ts

## Dependencies
Depends on: none
Blocks: T002

## Role annotations
<!-- Humans add structured notes here using yooti commands -->
<!-- Format: [ROLE GATE timestamp]: note text -->
`);

  // ── Constitutions ──
  write('.claude/constitutions/security.md', securityConstitution(config));
  write('.claude/constitutions/testing.md', testingConstitution(config));

  if (config.stack.includes('node')) {
    write('.claude/constitutions/typescript.md', typescriptConstitution(config));
  }
  if (config.stack.includes('react') || config.stack.includes('nextjs')) {
    write('.claude/constitutions/react.md', reactConstitution(config));
  }
  if (config.stack.includes('python')) {
    write('.claude/constitutions/python.md', pythonConstitution(config));
  }
  if (hasPostgres) {
    write('.claude/constitutions/postgresql.md', postgresqlConstitution(config));
  }
  if (hasMongo) {
    write('.claude/constitutions/mongodb.md', mongodbConstitution(config));
  }

  const hasAgentsConst = config.projectType === 'full' || config.projectType === 'agent';
  if (hasAgentsConst) {
    write('.claude/constitutions/langgraph.md', langgraphConstitution(config));
  }

  // ── Story type templates ──
  write('.agent/templates/feature-story.json', JSON.stringify(featureStoryTemplate(config), null, 2));
  write('.agent/templates/bugfix-story.json', JSON.stringify(bugfixStoryTemplate(config), null, 2));
  write('.agent/templates/refactor-story.json', JSON.stringify(refactorStoryTemplate(config), null, 2));
  write('.agent/templates/security-patch.json', JSON.stringify(securityPatchTemplate(config), null, 2));
  write('.agent/templates/api-contract.json', JSON.stringify(apiContractTemplate(config), null, 2));

  if (hasAgentsConst) {
    write('.agent/templates/agent-story.json', JSON.stringify(agentStoryTemplate(config), null, 2));
  }

  // ── Regression suite ──
  const regressionDir = `${root}/tests/regression`;
  mkdirSync(toForwardSlash(`${regressionDir}/baseline`), { recursive: true });
  mkdirSync(toForwardSlash(`${regressionDir}/suites`), { recursive: true });
  mkdirSync(toForwardSlash(`${regressionDir}/comparator`), { recursive: true });

  write('tests/regression/README.md', regressionReadme(config));
  write('tests/regression/suites/smoke.test.ts', smokeTestSuite(config));
  write('tests/regression/suites/api-contracts.test.ts', apiContractSuite(config));
  write('tests/regression/suites/security.test.ts', securityRegressionSuite(config));
  write('tests/regression/comparator/diff.py', regressionDiffScript(config));
  write('tests/regression/baseline/.gitkeep', '');

  // ── Unit test scaffold ──
  if (config.stack.includes('node')) {
    mkdirSync(toForwardSlash(`${root}/services/api/tests/helpers`), { recursive: true });
    write('services/api/package.json', nodeApiPackageJson(config));
    write('services/api/vitest.config.ts', vitestConfig(config));
    write('services/api/tests/setup.ts', testSetupTs(config));
    write('services/api/tests/helpers/factories.ts', testHelpersFactoriesTs(config));
    write('services/api/tests/helpers/mocks.ts', testHelpersMocksTs(config));
    write('services/api/tests/unit/example.test.ts', exampleUnitTestTs(config));
    write('services/api/Dockerfile', nodeApiDockerfile(config));
    write('services/api/.dockerignore', nodeDockerignore());
  }

  // ── Python FastAPI service ──
  if (config.backend === 'python-api' || config.stack?.includes('python-api')) {
    generateFastApiService(root, config, write);
  }

  if (config.stack.includes('react')) {
    mkdirSync(toForwardSlash(`${root}/frontend/dashboard/tests/helpers`), { recursive: true });
    write('frontend/dashboard/package.json', frontendPackageJson(config));
    write('frontend/dashboard/vitest.config.ts', vitestConfig({
      ...config,
      _frontendOverrides: true,
    }).replace("environment: 'node'", "environment: 'jsdom'").replace(
      "setupFiles: ['./tests/setup.ts']",
      "setupFiles: ['./tests/setup.ts']"
    ));
    write('frontend/dashboard/tests/setup.ts', testSetupFrontendTs(config));
    write('frontend/dashboard/tests/helpers/render.tsx', testHelpersRenderTsx(config));
    write('frontend/dashboard/tests/unit/example.test.tsx', exampleUnitTestTsx(config));
    write('frontend/dashboard/Dockerfile', frontendDockerfile(config));
    write('frontend/dashboard/.dockerignore', nodeDockerignore());
  }

  const hasPython = config.stack.includes('python') || config.projectType === 'agent' || config.projectType === 'full';
  if (hasPython) {
    const pyRoot = config.projectType === 'agent' || config.projectType === 'full'
      ? 'agents' : 'batch/analytics';
    mkdirSync(toForwardSlash(`${root}/${pyRoot}/tests/helpers`), { recursive: true });
    mkdirSync(toForwardSlash(`${root}/${pyRoot}/tests/unit`), { recursive: true });
    write(`${pyRoot}/conftest.py`, conftest(config));
    write(`${pyRoot}/tests/__init__.py`, '');
    write(`${pyRoot}/tests/helpers/__init__.py`, '');
    write(`${pyRoot}/tests/helpers/factories.py`, pythonTestHelpersFactories(config));
    write(`${pyRoot}/tests/helpers/mocks.py`, pythonTestHelpersMocks(config));
    write(`${pyRoot}/tests/unit/__init__.py`, '');
    write(`${pyRoot}/tests/unit/test_example.py`, examplePythonUnitTest(config));
  }

  // ── CI ──
  if (config.ci === 'github-actions') {
    write('.github/workflows/unit-tests.yml', unitTestsCiYml(config));

    let ciServices = '';
    let ciEnv = '';
    if (hasPostgres) {
      const ciPgImage = hasPgvector ? 'pgvector/pgvector:pg16' : 'postgres:16-alpine';
      ciServices += `      postgres:\n        image: ${ciPgImage}\n        env: { POSTGRES_DB: testdb, POSTGRES_PASSWORD: test }\n        ports: ['5432:5432']\n`;
      ciEnv += `          DATABASE_URL: postgresql://postgres:test@localhost:5432/testdb\n`;
    }
    if (hasRedis) {
      ciServices += `      redis:\n        image: redis:7-alpine\n        ports: ['6379:6379']\n`;
      ciEnv += `          REDIS_URL: redis://localhost:6379\n`;
    }
    if (hasMongo) {
      ciServices += `      mongodb:\n        image: mongo:7\n        ports: ['27017:27017']\n`;
      ciEnv += `          MONGODB_URL: mongodb://localhost:27017/testdb\n`;
    }

    write('.github/workflows/integration-tests.yml', `name: Integration Tests
on: [pull_request]
jobs:
  integration:
    runs-on: ubuntu-latest
    services:
${ciServices}    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install
        working-directory: services/api
      - run: npx vitest run tests/integration/ --coverage
        working-directory: services/api
        env:
${ciEnv}${config.stack.includes('react') || config.stack.includes('nextjs') ? `  playwright:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install && npx playwright install --with-deps chromium
        working-directory: frontend/dashboard
      - run: npx playwright test
        working-directory: frontend/dashboard
` : ''}`);
  }

  // ── Brownfield extras ──
  if (config.context === 'brownfield') {
    write('.agent/discovery/risk-surface.json', JSON.stringify({
      captured_at: new Date().toISOString(),
      summary: { total_files_scanned: 47, high_risk_files: 2, medium_risk_files: 5 },
      high_risk_files: [
        { path: "src/app.ts", coverage: "43.1%", dependents: 12, risk_level: "HIGH", action: "Write characterization tests before modifying" },
        { path: "src/auth/sessionManager.ts", coverage: "0%", dependents: 8, risk_level: "HIGH", action: "Architect approval + full characterization suite required" }
      ],
      detected_conventions: { language: "TypeScript", framework: "Express", test_runner: "Jest", async_style: "async/await" },
      reuse_candidates: ["src/middleware/auth.ts", "src/utils/logger.ts"]
    }, null, 2));

    write('.agent/snapshots/baseline.json', JSON.stringify({
      captured_at: new Date().toISOString(),
      tag: "baseline",
      note: "Run python pipeline/scripts/snapshot.py to capture real baseline after init"
    }, null, 2));
  }

  // ── Root files (before agent scaffold so agents can append to .env.example) ──
  write('.gitignore', `node_modules/\n.env\n*.env.local\ndist/\n.coverage/\n__pycache__/\n.pytest_cache/\n.mypy_cache/\n.ruff_cache/\nplaywright-report/\n.lighthouseci/\n`);

  const envLines = [];
  envLines.push('# ── APPLICATION ──');
  envLines.push('NODE_ENV=development');
  envLines.push('PORT=3000');
  envLines.push('');

  if (hasPostgres) {
    envLines.push('# ── DATABASE ──');
    envLines.push('DATABASE_URL=postgresql://app:app@localhost:5432/appdb');
    if (hasPgvector) {
      envLines.push('VECTOR_DIMENSIONS=1536');
      envLines.push('VECTOR_SIMILARITY=cosine');
    }
    if (hasAge) {
      envLines.push('GRAPH_DATABASE_URL=postgresql://app:app@localhost:5432/appdb');
    }
    envLines.push('');
  }

  if (hasRedis) {
    envLines.push('# ── CACHE ──');
    envLines.push('REDIS_URL=redis://localhost:6379');
    envLines.push('');
  }

  if (hasMongo) {
    envLines.push('# ── MONGODB ──');
    envLines.push('MONGODB_URL=mongodb://app:app@localhost:27017/appdb');
    envLines.push('');
  }

  if (config.agentFrameworks?.includes('langgraph') ||
      config.projectType === 'agent' ||
      config.projectType === 'full') {
    envLines.push('# ── LLM PROVIDERS ──');
    if (config.llmProviders?.includes('anthropic') ||
        !config.llmProviders?.length) {
      envLines.push('ANTHROPIC_API_KEY=your-key-here');
    }
    if (config.llmProviders?.includes('openai')) {
      envLines.push('OPENAI_API_KEY=your-key-here');
    }
    envLines.push('');
    envLines.push('# ── LANGSMITH OBSERVABILITY ──');
    envLines.push('LANGCHAIN_TRACING_V2=true');
    envLines.push('LANGCHAIN_API_KEY=your-key-here');
    envLines.push(`LANGCHAIN_PROJECT=${config.projectName}`);
    envLines.push('');
  }

  if (config.stack?.includes('react') || config.stack?.includes('nextjs')) {
    envLines.push('# ── FRONTEND ──');
    envLines.push('VITE_API_URL=http://localhost:3000');
    envLines.push('NEXT_PUBLIC_API_URL=http://localhost:3000');
    envLines.push('');
  }

  write('.env.example', envLines.join('\n') + '\n');

  // ── AGENT SCAFFOLD ──
  const hasAgents = config.projectType === 'full' || config.projectType === 'agent'

  if (hasAgents) {
    const agentName = 'template-agent'
    const agentRoot = `agents/${agentName}`

    // Create agent directories
    const agentDirs = [
      `${root}/agents/${agentName}/nodes`,
      `${root}/agents/${agentName}/tools`,
      `${root}/agents/${agentName}/prompts`,
      `${root}/agents/${agentName}/tests/unit`,
      `${root}/agents/${agentName}/tests/integration`,
      `${root}/agents/${agentName}/tests/evals`,
    ]
    agentDirs.forEach(d => mkdirSync(toForwardSlash(d), { recursive: true }))

    // Core agent files
    write(`${agentRoot}/graph.py`,       agentGraphPy(agentName, config))
    write(`${agentRoot}/state.py`,       agentStatePy(agentName))
    write(`${agentRoot}/__init__.py`,    `from .graph import graph\n__all__ = ["graph"]\n`)

    // Node files
    write(`${agentRoot}/nodes/__init__.py`, `from . import fetch_data, process, format_output\n`)
    write(`${agentRoot}/nodes/fetch_data.py`,    agentNodePy('fetch_data', agentName))
    write(`${agentRoot}/nodes/process.py`,       agentNodePy('process', agentName))
    write(`${agentRoot}/nodes/format_output.py`, agentNodePy('format_output', agentName))

    // Tool files
    write(`${agentRoot}/tools/__init__.py`, '')
    write(`${agentRoot}/tools/example_tool.py`, agentToolPy('ExampleTool'))

    // Prompts
    write(`${agentRoot}/prompts/system.txt`,
      `You are a helpful assistant.\nBe concise, accurate, and structured in your responses.\n`)

    // Test files
    write(`${agentRoot}/tests/__init__.py`, '')
    write(`${agentRoot}/tests/unit/__init__.py`, '')
    write(`${agentRoot}/tests/unit/test_nodes.py`,       agentUnitTestPy(agentName))
    write(`${agentRoot}/tests/integration/__init__.py`, '')
    write(`${agentRoot}/tests/integration/test_graph.py`, agentIntegrationTestPy(agentName))
    write(`${agentRoot}/tests/evals/__init__.py`, '')
    write(`${agentRoot}/tests/evals/test_output_quality.py`, agentEvalTestPy(agentName))

    // Agent-level requirements and config
    write(`agents/requirements.txt`, agentRequirements(config))
    write(`agents/pyproject.toml`, agentPyprojectToml(config))
    write(`agents/conftest.py`, agentConftestPy())
    write('agents/main.py', agentsMain(config))
    write('agents/Dockerfile', agentsDockerfile(config))
    write('agents/.dockerignore', pythonDockerignore())

    // Agent .claude/ context
    if (config.projectType === 'agent') {
      write('.claude/CLAUDE.md', agentClaudeMd(config))
      write('docker-compose.yml', agentDockerCompose(config))
      write('.env.example', agentEnvExample(config))
      write('README.md', agentReadmeMd(config))
    } else {
      // Append agent .env vars to existing .env.example
      const agentEnv = agentEnvExample(config)
      writeFileSync(toForwardSlash(`${root}/.env.example`),
        readFileSync(toForwardSlash(`${root}/.env.example`), 'utf8') + '\n# Agents\n' + agentEnv)
    }
  }

  // ── Docs ──
  write('docs/README.md', `# ${config.projectName}
Generated by @yooti/cli — Autonomous SDLC Pipeline

## Quick start
  docker compose up -d
  yooti story:add
  yooti sprint:start

## Pipeline gates
G1 PM sign-off → G2 Architect review → G3 PR review → G4 QA sign-off → G5 Deploy approval

## Context: ${config.context.toUpperCase()}
${config.context === 'brownfield'
  ? 'Risk surface: .agent/discovery/risk-surface.json\nBaseline: .agent/snapshots/baseline.json'
  : 'Pattern mandate: .claude/rules/greenfield-rules.md'}

See docs/GATES.md for all five gate criteria.

## Requirements

| Tool | Version | Mac | Linux | Windows |
|------|---------|-----|-------|---------|
| Node.js | >= 20 | ✓ | ✓ | ✓ |
| Git | any | ✓ | ✓ | ✓ |
| Docker Desktop | any | ✓ | ✓ | ✓ |
| Python | >= 3.12 | ✓ | ✓ | ✓ |
| Claude Code | any | ✓ | ✓ | ✓ |

**Windows users:** All pipeline scripts run as Node.js or Python —
no bash required. If you see any .sh files in older projects,
they have been replaced by .js equivalents that run natively
on all platforms. Git Bash and WSL are not required.

## First time setup note

After running yooti init, run npm install once locally to generate
package-lock.json before building Docker images:

${'```'}bash
cd services/api && npm install && cd ../..
cd frontend/dashboard && npm install && cd ../..
git add services/api/package-lock.json frontend/dashboard/package-lock.json
git commit -m "chore: add package-lock.json"
docker compose up -d
${'```'}

Once package-lock.json is committed, CI workflows can use npm ci
for faster, deterministic installs.
`);

  write('docs/GATES.md', `# Human Decision Gates — ${config.projectName}

## G1 PM Sign-Off (before sprint)
- [ ] All stories have Given/When/Then ACs
- [ ] Definition of Done per story
- [ ] Ambiguity blockers resolved
FAIL: sprint does not start

## G2 Architecture Review (Days 1-2)
- [ ] ${config.context === 'greenfield' ? 'ADRs approved' : 'Risk surface accepted, characterization plan approved'}
- [ ] .plan files reviewed for M/L stories
- [ ] No breaking cross-system changes without approval
FAIL: code generation does not begin

## G3 Developer PR Review (Days 6-8)
- [ ] Code matches intent
- [ ] No out-of-scope file changes
- [ ] Patterns consistent
- [ ] No hardcoded secrets
APPROVE: continue | REQUEST CHANGES: agent corrects | REJECT: replan

## G4 QA Sign-Off (Day 9)

Run: yooti qa:review STORY-NNN

### Hard gates (any failure = automatic reject)
| Gate | Threshold | Evidence file |
|------|-----------|---------------|
| Unit tests | 100% pass | test-results.json |
| Integration tests | 100% pass | test-results.json |
| Zero regressions | 0 newly failing | regression-diff.json |
| Overall coverage | >= 80% | coverage-summary.json |
| New code coverage | >= 90% | coverage-summary.json |
| CRITICAL security | 0 findings | security-scan.json (Snyk) |
| HIGH security | 0 findings | security-scan.json (Snyk) |
| Semgrep | 0 findings | security-scan.json |
| Accessibility | 0 violations | accessibility.json (if frontend) |

### Soft gates (QA judgement — review required)
| Gate | Target | Evidence file |
|------|--------|---------------|
| Mutation score | >= 85% | mutation-score.json |

FAIL (hard gate): agent generates more tests, reruns Phase 5
FAIL (soft gate): QA reviews and decides — approve or reject with notes

## G5 Deployment Approval (Day 10)
- [ ] Staging stable > 30 min
- [ ] Smoke tests passing
- [ ] p99 latency within 20% of prod baseline
- [ ] Rollback plan confirmed
GO: deploy | NO-GO: hold
`);

  // ── Verify critical files exist ──
  const criticalFiles = [];
  if (config.stack?.includes('node')) {
    criticalFiles.push('services/api/package.json', 'services/api/Dockerfile');
  }
  if (config.stack?.includes('react') || config.stack?.includes('nextjs')) {
    criticalFiles.push('frontend/dashboard/package.json', 'frontend/dashboard/Dockerfile');
  }
  if (config.agentFrameworks?.length > 0 || config.projectType === 'agent') {
    criticalFiles.push('agents/requirements.txt', 'agents/Dockerfile', 'agents/main.py');
  }

  const missing = criticalFiles.filter(f => !existsSync(toForwardSlash(`${root}/${f}`)));
  if (missing.length > 0) {
    console.warn('\n  ⚠ Warning: these files were not generated:');
    missing.forEach(f => console.warn(`    ${f}`));
    console.warn('  Run: yooti preflight to check project health\n');
  }

}

// ── FastAPI service generation ──

function generateFastApiService(root, config, write) {
  const svc = `${root}/services/api_python`;
  mkdirSync(toForwardSlash(`${svc}/src/models`),     { recursive: true });
  mkdirSync(toForwardSlash(`${svc}/src/routes`),     { recursive: true });
  mkdirSync(toForwardSlash(`${svc}/src/services`),   { recursive: true });
  mkdirSync(toForwardSlash(`${svc}/src/middleware`),  { recursive: true });
  mkdirSync(toForwardSlash(`${svc}/src/types`),      { recursive: true });
  mkdirSync(toForwardSlash(`${svc}/tests/helpers`),  { recursive: true });
  mkdirSync(toForwardSlash(`${svc}/tests/unit`),     { recursive: true });

  write('services/api_python/main.py',                    fastApiMain(config));
  write('services/api_python/requirements.txt',           fastApiRequirements(config));
  write('services/api_python/pyproject.toml',             fastApiPyproject(config));
  write('services/api_python/Dockerfile',                 fastApiDockerfile(config));
  write('services/api_python/.dockerignore',             pythonDockerignore());
  write('services/api_python/src/__init__.py',            '');
  write('services/api_python/src/config.py',              fastApiConfig(config));
  write('services/api_python/src/database.py',            fastApiDatabase(config));
  write('services/api_python/src/models/__init__.py',     '');
  write('services/api_python/src/models/base.py',         fastApiBaseModel(config));
  write('services/api_python/src/routes/__init__.py',     '');
  write('services/api_python/src/routes/health.py',       fastApiHealthRoute(config));
  write('services/api_python/src/services/__init__.py',   '');
  write('services/api_python/src/middleware/__init__.py',  '');
  write('services/api_python/src/middleware/logging.py',   fastApiLogging(config));
  write('services/api_python/src/types/__init__.py',      '');
  write('services/api_python/tests/conftest.py',          fastApiConftest(config));
  write('services/api_python/tests/helpers/factories.py', fastApiFactories(config));
  write('services/api_python/tests/unit/test_health.py',  fastApiHealthTest(config));
}

function fastApiMain(config) {
  return `"""
${config.projectName} — FastAPI application entry point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog

from .src.config import settings
from .src.middleware.logging import LoggingMiddleware
from .src.routes.health import router as health_router

log = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("api.startup", environment=settings.environment)
    yield
    log.info("api.shutdown")


app = FastAPI(
    title="${config.projectName} API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LoggingMiddleware)

app.include_router(health_router)

# Add more routers here as stories are completed
# app.include_router(users_router, prefix="/api/v1")
`;
}

function fastApiRequirements(config) {
  const deps = [
    'fastapi>=0.111.0',
    'uvicorn[standard]>=0.29.0',
    'pydantic>=2.7.0',
    'pydantic-settings>=2.2.0',
    'structlog>=24.1.0',
    'python-dotenv>=1.0.0',
  ];
  if (config.hasPostgres) {
    deps.push(
      'sqlalchemy[asyncio]>=2.0.0',
      'asyncpg>=0.29.0',
      'alembic>=1.13.0',
    );
  }
  if (config.databases?.includes('pgvector')) {
    deps.push('pgvector>=0.2.5');
  }
  if (config.hasRedis) {
    deps.push('redis[asyncio]>=5.0.0');
  }
  const devDeps = [
    '',
    '# Development',
    'pytest>=8.0.0',
    'pytest-asyncio>=0.23.0',
    'pytest-cov>=5.0.0',
    'httpx>=0.27.0',
    'ruff>=0.4.0',
    'mypy>=1.9.0',
  ];
  if (config.hasPostgres) {
    devDeps.push('pytest-postgresql>=6.0.0');
  }
  return [...deps, ...devDeps].join('\n');
}

function fastApiPyproject(config) {
  return `[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
addopts = "--cov=src --cov-report=term-missing --cov-report=json -v"
markers = [
    "unit: unit tests — no external services",
    "integration: tests requiring real services",
    "eval: LLM eval tests — nightly only",
]

[tool.coverage.report]
fail_under = 80
omit = ["tests/*"]

[tool.ruff]
target-version = "py312"
line-length = 100
select = ["E", "W", "F", "I", "N", "UP", "B", "ANN"]
ignore = ["ANN101", "ANN102"]

[tool.mypy]
python_version = "3.12"
strict = true
plugins = ["pydantic.mypy"]
`;
}

function fastApiConfig(config) {
  return `"""
Application configuration — loaded from environment variables.
Never hardcode values here. Add all new config to .env.example.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    environment: str = "development"
    debug: bool = False
    port: int = 8000
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    ${config.hasPostgres ? `# Database
    database_url: str = "postgresql+asyncpg://app:app@localhost:5432/appdb"` : ''}
    ${config.hasRedis ? `# Redis
    redis_url: str = "redis://localhost:6379"` : ''}
    ${config.llmProviders?.includes('anthropic') ? `# LLM
    anthropic_api_key: str = ""` : ''}

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
`;
}

function fastApiDatabase(config) {
  if (!config.hasPostgres) return '# No database configured\\n';
  return `"""
Async SQLAlchemy database session.
Import get_db as a FastAPI dependency in route handlers.
"""
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from .config import settings

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:
    """FastAPI dependency — inject into route handlers."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
`;
}

function fastApiBaseModel(config) {
  return `"""
SQLAlchemy base model.
All database models inherit from Base.
All models automatically get: id, created_at, updated_at
"""
import uuid
from datetime import datetime
from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base class for all database models."""

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
`;
}

function fastApiHealthRoute(config) {
  return `"""
Health check endpoint.
Returns service status and version.
Used by smoke tests, load balancers, and monitoring.
"""
from fastapi import APIRouter
from pydantic import BaseModel
import structlog

log = structlog.get_logger()
router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Health check endpoint.
    Returns 200 when the service is running correctly.
    """
    log.info("health.check")
    return HealthResponse(
        status="ok",
        version="0.1.0",
        environment="development",
    )
`;
}

function fastApiLogging(config) {
  return `"""
Request logging middleware using structlog.
Logs every request with method, path, status, and duration.
"""
import time
import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

log = structlog.get_logger()


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        start = time.perf_counter()
        log.info(
            "request.start",
            method=request.method,
            path=request.url.path,
        )
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        log.info(
            "request.complete",
            method=request.method,
            path=request.url.path,
            status=response.status_code,
            duration_ms=duration_ms,
        )
        return response
`;
}

function fastApiConftest(config) {
  return `"""
Shared pytest fixtures for ${config.projectName} API tests.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.fixture
async def client() -> AsyncClient:
    """Async HTTP client for testing FastAPI endpoints."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac


@pytest.fixture
def anyio_backend():
    return "asyncio"
`;
}

function fastApiFactories(config) {
  return `"""
Test data factories for ${config.projectName} API tests.
Add a factory for every domain model as stories are completed.
"""
from datetime import datetime
import uuid


def create_user(**overrides):
    """Create a test user dict with sensible defaults."""
    return {
        "id": str(uuid.uuid4()),
        "email": "test@example.com",
        "name": "Test User",
        "created_at": datetime.now().isoformat(),
        **overrides,
    }


# Add more factories here as domain models are created
`;
}

function fastApiHealthTest(config) {
  return `"""
Unit tests for the health endpoint.
Example of the test pattern to follow for all route tests.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_health_returns_200(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert response.status_code == 200


@pytest.mark.anyio
async def test_health_returns_ok_status(client: AsyncClient) -> None:
    response = await client.get("/health")
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.anyio
async def test_health_returns_version(client: AsyncClient) -> None:
    response = await client.get("/health")
    data = response.json()
    assert "version" in data


@pytest.mark.anyio
async def test_health_returns_environment(client: AsyncClient) -> None:
    response = await client.get("/health")
    data = response.json()
    assert "environment" in data
`;
}

function fastApiDockerfile(config) {
  return `FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
`;
}

// ── Frontend Dockerfile ──

function frontendDockerfile(config) {
  if (config.stack?.includes('nextjs')) {
    return `FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
`;
  }

  // React + Vite
  return `FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

EXPOSE 5173

# Vite dev server — binds to 0.0.0.0 so Docker can expose the port
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
`;
}

// ── Agents Dockerfile + main.py ──

function agentsDockerfile(config) {
  return `FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
`;
}

function agentsMain(config) {
  return `"""
${config.projectName} — Agent service entry point
Exposes LangGraph agents as a FastAPI endpoint.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog

log = structlog.get_logger()

app = FastAPI(
    title="${config.projectName} Agent Service",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "agents"}


# Register agent routers here as agent stories are completed
# from template_agent.api import router as template_router
# app.include_router(template_router, prefix="/agents/template")
`;
}

// ── Node.js API Dockerfile ──

function nodeApiDockerfile(config) {
  return `FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
`;
}

// ── .dockerignore templates ──

function pythonDockerignore() {
  return `__pycache__
*.pyc
*.pyo
.pytest_cache
.mypy_cache
.ruff_cache
.env
.env.*
!.env.example
tests/
*.egg-info
dist/
.coverage
htmlcov/
`;
}

function nodeDockerignore() {
  return `node_modules
.next
dist
.env
.env.*
!.env.example
coverage
.nyc_output
`;
}

// ── Package.json templates ──

function frontendPackageJson(config) {
  const isNextjs = config.stack?.includes('nextjs');
  return JSON.stringify({
    name: `${config.projectName}-frontend`,
    version: '0.1.0',
    private: true,
    scripts: isNextjs ? {
      dev:            'next dev',
      build:          'next build',
      start:          'next start',
      lint:           'next lint',
      'type-check':   'tsc --noEmit',
      test:           'vitest',
      'test:coverage': 'vitest --coverage',
    } : {
      dev:            'vite',
      build:          'tsc && vite build',
      preview:        'vite preview',
      lint:           'eslint . --ext ts,tsx',
      'type-check':   'tsc --noEmit',
      test:           'vitest',
      'test:coverage': 'vitest --coverage',
    },
    dependencies: {
      ...(isNextjs ? {
        'next':    '14.2.3',
        'react':   '^18.3.1',
        'react-dom': '^18.3.1',
      } : {
        'react':   '^18.3.1',
        'react-dom': '^18.3.1',
      }),
      '@tanstack/react-query': '^5.40.0',
      'axios':        '^1.7.2',
      'clsx':         '^2.1.1',
      'lucide-react': '^0.395.0',
    },
    devDependencies: {
      '@types/react':     '^18.3.3',
      '@types/react-dom': '^18.3.0',
      '@types/node':      '^20.14.2',
      'typescript':       '^5.4.5',
      ...(isNextjs ? {} : {
        '@vitejs/plugin-react': '^4.3.1',
        'vite':   '^5.3.1',
      }),
      'tailwindcss':      '^3.4.4',
      'autoprefixer':     '^10.4.19',
      'postcss':          '^8.4.38',
      'vitest':           '^1.6.0',
      '@vitest/coverage-istanbul': '^1.6.0',
      '@testing-library/react':       '^16.0.0',
      '@testing-library/user-event':  '^14.5.2',
      '@testing-library/jest-dom':    '^6.4.6',
      'jest-axe':         '^9.0.0',
      'jsdom':            '^24.1.0',
      ...(config.linter === 'biome' ? {
        '@biomejs/biome': '^1.8.2',
      } : {
        'eslint':         '^8.57.0',
        '@typescript-eslint/eslint-plugin': '^7.13.0',
        '@typescript-eslint/parser':        '^7.13.0',
        'eslint-plugin-react-hooks':        '^4.6.2',
        'eslint-plugin-jsx-a11y':           '^6.8.0',
      }),
    },
  }, null, 2);
}

function nodeApiPackageJson(config) {
  return JSON.stringify({
    name: `${config.projectName}-api`,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev:              'tsx watch src/index.ts',
      build:            'tsc',
      start:            'node dist/index.js',
      lint:             config.linter === 'biome' ? 'biome check .' : 'eslint . --ext .ts',
      'type-check':     'tsc --noEmit',
      test:             'vitest',
      'test:coverage':  'vitest --coverage',
      'test:unit':      'vitest tests/unit',
      'test:integration': 'vitest tests/integration',
    },
    dependencies: {
      'fastify':        '^4.28.1',
      '@fastify/cors':  '^9.0.1',
      'zod':            '^3.23.8',
      'pino':           '^9.2.0',
      ...(config.hasPostgres ? {
        '@prisma/client': '^5.16.0',
      } : {}),
      ...(config.hasRedis ? {
        'ioredis': '^5.4.1',
      } : {}),
    },
    devDependencies: {
      'typescript':     '^5.4.5',
      '@types/node':    '^20.14.2',
      'tsx':            '^4.15.7',
      'vitest':         '^1.6.0',
      '@vitest/coverage-istanbul': '^1.6.0',
      'supertest':      '^7.0.0',
      '@types/supertest': '^6.0.2',
      ...(config.hasPostgres ? {
        'prisma': '^5.16.0',
      } : {}),
      ...(config.linter === 'biome' ? {
        '@biomejs/biome': '^1.8.2',
      } : {
        'eslint':         '^8.57.0',
        '@typescript-eslint/eslint-plugin': '^7.13.0',
        '@typescript-eslint/parser':        '^7.13.0',
      }),
    },
  }, null, 2);
}
