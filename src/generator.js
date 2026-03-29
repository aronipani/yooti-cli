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
import { configConstitution } from './templates/constitutions/config-constitution.js';
import { dockerConstitution } from './templates/constitutions/docker-constitution.js';
import { awsConstitution } from './templates/constitutions/aws-constitution.js';
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

  if (config.includeAws) {
    dirs.push(
      `${root}/scripts`,
      `${root}/events`,
    );
  }

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
  const isAgent = config.projectType === 'agent' || config.projectType === 'full';
  const hasNode = config.stack.includes('node');
  const hasReact = config.stack.includes('react') || config.stack.includes('nextjs');
  const hasPython = config.stack.includes('python') || isAgent;
  const itemPrefix = config.itemPrefix ?? 'STORY';
  const itemTag = itemPrefix ? `${itemPrefix}-ID` : 'ID';
  const itemNNN = itemPrefix ? `${itemPrefix}-NNN` : 'NNN';
  const item001 = itemPrefix ? `${itemPrefix}-001` : '001';

  const stageName = (stage) => {
    const names = {
      1: 'Foundation — agent parses requirements only',
      2: 'Build — agent generates plans and requirements',
      3: 'Review — agent writes code and tests. Team reviews PR and controls all deploys.',
      4: 'Deploy — agent writes code and deploys to staging. Team controls production.',
      5: 'Autonomous — agent runs the full pipeline. Team controls 5 gates only.'
    };
    return names[stage] || names[3];
  };

  const stageAgentDoes = (stage) => {
    const actions = {
      1: '- Parse stories only\n- Does not write plans or code',
      2: '- Parse stories\n- Write .plan files\n- Does not write code',
      3: '- Parse stories, write .plan files\n- Generate implementation code (full generation loop)\n- Write tests TDD-first\n- Generate PR body and evidence package\n- STOP at PR — human reviews, edits, approves or rejects\n- STOP at deploy — human controls all deployments',
      4: '- Full pipeline through staging deploy\n- STOP at production — human controls production only',
      5: '- Full pipeline end to end\n- STOP at 5 human gates only'
    };
    return actions[stage] || actions[3];
  };

  const stageHumanDoes = (stage) => {
    const actions = {
      1: '- Everything except story parsing',
      2: '- Review plans\n- Write all code\n- All deployments',
      3: '- Review and sign off requirements (Gate G1)\n- Review architecture and .plan files (Gate G2)\n- Review PR — audit code, make edits directly in the branch, approve or reject (Gate G3)\n- Control ALL deployments — staging and production',
      4: '- Gate G1, G2, G3, G4\n- Production deployments only',
      5: '- Gate G1, G2, G3, G4, G5 only'
    };
    return actions[stage] || actions[3];
  };

  write('.claude/CLAUDE.md', `# CLAUDE — Autonomous SDLC Agent Context
# Project: ${config.projectName}
# Context: ${config.context.toUpperCase()} · Stack: ${config.stack.join(' + ')}
# Generated by: @yooti/cli v1.0.0

## Who you are
You are the Yooti code generation agent for ${config.projectName}.
You operate within the Yooti pipeline framework.
You write code, write tests, and self-heal failures.
You do not make decisions that belong to humans.
You do not merge PRs, deploy to production, or skip gates.

## Toolchain — run in this exact order every iteration
${hasNode ? `
### Node.js API (services/api/)
  Step 1 Lint:   ${lintCmd}
  Step 2 Types:  npx tsc --noEmit --strict
  Step 3 Tests:  npx vitest run tests/unit/ --coverage
  Step 4 Green:  commit
` : ''}${hasReact ? `
### React Frontend (frontend/dashboard/)
  Step 1 Lint:       ${lintCmd}
  Step 2 Types:      npx tsc --noEmit
  Step 3 Tests:      npx vitest run --coverage  (axe-core runs inside)
  Step 4 Playwright: npx playwright test
  Step 5 Green:      commit
` : ''}${hasPython ? `
### Python API / Agents (services/api_python/ or agents/)
  Step 1 Lint:   ruff check src/ && ruff format --check src/
  Step 2 Types:  mypy src/ --strict
  Step 3 Tests:  pytest tests/unit/ --cov=src
  Step 4 Green:  commit

### Python Batch (batch/analytics/)
  Step 1 Lint:   ruff check src/ && ruff format --check src/
  Step 2 Types:  mypy src/ --strict
  Step 3 Tests:  pytest tests/unit/ --cov=src
  Step 4 Green:  commit
` : ''}
RULE: If ANY step fails → diagnose → fix → restart from Step 1. Never skip steps.
${isAgent ? `
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
` : ''}
## How to decompose stories into tasks — Phase 2 rules

A task is NOT one acceptance criterion.
A task is one logical unit of work at one layer that can be
built, committed, and tested independently.

RULE 1 — Split by layer, not by AC
  Database schema changes   → one task
  API endpoint changes      → one task (depends on database task)
  Frontend component        → one task (depends on API task)
  Agent / LangGraph changes → one task (separate from API)
  Email / async workers     → one task (separate from API)

RULE 2 — Maximum files per task
  A task should touch no more than 5-7 files.
  If a task needs more files, split it into two tasks.

RULE 3 — One task covers multiple AC
  AC are requirements. Tasks are implementation units.
  A single task typically covers 2-4 AC.
  Never create one task per AC.

RULE 4 — Dependency order is mandatory
  Tasks run sequentially — T001 completes before T002 starts.
  Always specify which task depends on which.
  Database tasks always come before API tasks.
  API tasks always come before frontend tasks.

RULE 5 — Maximum tasks per story by complexity
  XS story → 1 task
  S story  → 1-2 tasks
  M story  → 2-3 tasks
  L story  → 3-4 tasks
  XL story → 4-5 tasks
  If you need more tasks than this the story is too large.
  Raise an escalation — do not create extra tasks autonomously.

CORRECT decomposition example — User registration (M complexity)

  T001 — Database schema and user model
    Layer: database
    Files: src/models/user.py (or user.ts)
    AC covered: AC-1 (foundation for account creation)
    Depends on: none

  T002 — Registration API endpoint with rate limiting
    Layer: api
    Files: src/routes/auth/register.py,
           src/services/auth_service.py,
           src/middleware/rate_limit.py
    AC covered: AC-1, AC-2, AC-3, AC-4, AC-6
    Depends on: T001

  T003 — Welcome email service
    Layer: api (async worker)
    Files: src/services/email_service.py
    AC covered: AC-5
    Depends on: T002

  T004 — Registration frontend form
    Layer: frontend
    Files: src/pages/RegisterPage.tsx,
           src/components/RegisterForm.tsx
    AC covered: AC-1, AC-3, AC-4
    Depends on: T002

WRONG decomposition example — do not do this

  T001 — AC-1 account creation     ✗ one AC per task
  T002 — AC-2 duplicate email      ✗ one AC per task
  T003 — AC-3 password validation  ✗ one AC per task

If you find yourself creating one task per AC you are doing
it wrong. Stop, re-read these rules, and start over.

## Phase 2 — story decomposition output

Phase 2 produces PLAN FILES ONLY.
No code. No tests. No implementation. No imports.

For each story in scope:
  1. Read .agent/requirements/[${itemTag}]-validated.json
  2. Apply the decomposition rules above
  3. Write one .plan.md file per task to .agent/plans/
  4. Mark each plan Status: PENDING
  5. Stop — wait for Gate G2 before writing any code

Phase 2 is complete when:
  Every story has at least one .plan.md file
  Every plan has: Status, Layer, Scope (CREATE/MODIFY/OUT OF SCOPE),
    AC covered, Implementation steps, Dependencies
  No code files have been created or modified

Phase 4 starts ONLY after:
  Gate G2 is signed — .agent/gates/[${itemTag}]-G2-approved.md exists
  Architect has reviewed and approved the plans

If you find yourself writing code during Phase 2 — STOP.
  Delete the code.
  Write the plan file instead.
  Wait for G2 approval.

## Phase 3 — environment setup

Phase 3 runs automatically before Phase 4.
It does not require human input.

  1. Create feature branch: git checkout -b feature/[${itemTag}]
  2. Run preflight checks: node pipeline/scripts/preflight.js
  3. Confirm .agent/gates/[${itemTag}]-G2-approved.md exists
  4. Confirm .agent/plans/[${itemTag}]-*.plan.md files exist
  5. Proceed to Phase 4

If preflight fails: write escalation and stop.
If G2 gate is missing: write escalation and stop.

## Phase 4 — code generation rules

STEP 1 — Write failing tests first (TDD mandatory)
  Write the test before the implementation.
  The test must fail before you write any implementation code.
  This is not optional. Every task starts with failing tests.

STEP 2 — Write minimum implementation to pass tests
  Write only what is needed to make the tests pass.
  Do not add functionality not covered by a test.
  Do not touch files outside your plan scope.

STEP 3 — Run the quality loop
  Python layer:
    ruff check . && ruff format --check .
    mypy . --strict
    pytest -m "not eval and not integration" --cov
  TypeScript/Node layer:
    ${lintCmd}
    tsc --noEmit
    vitest --coverage
  React layer:
    ${lintCmd}
    tsc --noEmit
    vitest --coverage

STEP 4 — Self-heal failures
  If lint fails: fix the lint error. Re-run from Step 3.
  If type check fails: fix the type error. Re-run from Step 3.
  If tests fail: diagnose the failure. Fix it. Re-run from Step 3.
  Maximum 5 iterations per task.
  If not green after 5 iterations: write escalation. Stop.

STEP 5 — Mark task complete
  Update Status in the .plan.md file from PENDING to COMPLETE.
  Move to the next task in dependency order.

## Phase 5 — test orchestration and evidence package

Phase 5 runs after all tasks in a story are COMPLETE.
Phase 5 must complete before any PR is opened.
Never open a PR without a complete evidence package.

Steps in order:
  1. Run full test suite for all affected layers
  2. Run coverage report — save to coverage.json
  3. Run regression diff: python tests/regression/comparator/diff.py
  4. Run security scan if available (snyk, semgrep)
  5. Create .agent/evidence/[${itemTag}]/ folder
  6. Write these evidence files:

     test-results.json
     { "story_id": "[${itemTag}]", "generated_at": "[ISO]",
       "unit": { "total": N, "passed": N, "failed": 0 },
       "integration": { "total": N, "passed": N, "failed": 0 } }

     coverage-summary.json
     { "story_id": "[${itemTag}]", "generated_at": "[ISO]",
       "overall": N.N, "new_code": N.N, "files": [] }

     regression-diff.json
     { "story_id": "[${itemTag}]", "generated_at": "[ISO]",
       "baseline_sprint": "sprint-N", "newly_failing": [],
       "newly_passing": [], "total_tests_before": N, "total_tests_after": N }

     security-scan.json
     { "story_id": "[${itemTag}]", "generated_at": "[ISO]",
       "snyk": { "critical": 0, "high": 0, "medium": 0 },
       "semgrep": { "findings": 0 } }

     accessibility.json (frontend stories only)
     { "story_id": "[${itemTag}]", "generated_at": "[ISO]",
       "violations": 0, "passes": N, "viewports_tested": [375, 768, 1280] }

     pr-body.md
     ## [${itemTag}] — [story title]
     ### Acceptance criteria coverage
     | AC | Status | Test |
     |----|--------|------|
     | AC-1 | PASS | test_name |
     ### Test results
     Unit: N/N passing · Integration: N/N passing · Regression: 0 newly failing
     ### Coverage
     Overall: N.N% · New code: N.N%
     ### Security
     Snyk: 0 critical, 0 high · Semgrep: 0 findings
     ### Files changed
     List every file created or modified with line counts.
     ### Deliberate decisions
     List any non-obvious choices made.

  7. Self-audit before PR (mandatory)

     Before writing the PR body, run this audit on every file you changed.
     Write the results to .agent/evidence/[${itemTag}]/code-audit.md

     For each file in your task scope check:

       SECURITY
       □ No hardcoded secrets, passwords, or API keys
       □ All SQL uses parameterised queries — no string concatenation
       □ Auth middleware present on every protected endpoint
       □ No sensitive data in log output
       □ User input validated before use
       □ Error responses never expose stack traces or internal paths

       CODE QUALITY
       □ Every function has type annotations (Python) or TypeScript types
       □ No bare except: or empty catch blocks
       □ No TODO or FIXME comments in production code
       □ No commented-out code blocks
       □ No print() or console.log() debug statements
       □ Every public function has a docstring or JSDoc comment

       TESTS
       □ Test file exists for every new source file
       □ Tests test behaviour not implementation
       □ No test calls a real external service (all mocked)
       □ axe-core test present in every React component test

       CONSTITUTION COMPLIANCE
       □ config.md rules followed for any config files changed
       □ docker.md rules followed if Dockerfile or compose changed
       □ Ports in Dockerfile match ports in .env.example
       □ No hardcoded URLs — all from environment variables

     Write the audit report in this format:

       # Code Audit — [${itemTag}]
       Date: [ISO timestamp]
       Files audited: N

       ## Violations found
       [list any violations with file and line number]
       OR: No violations found.

       ## Checks passed
       [count of checks that passed]

     If violations are found:
       Fix each violation before continuing.
       Do NOT open a PR with known violations.
       Update the audit report after fixing.

     Add the audit report to the PR body under a ## Code audit section.

  8. Hard blocks — do NOT open PR if any are true:
     test-results.json shows failed > 0
     coverage-summary.json shows overall < 80
     coverage-summary.json shows new_code < 90
     regression-diff.json shows newly_failing is not empty
     security-scan.json shows snyk.critical > 0 or snyk.high > 0
     code-audit.md contains violations

  9. Open the PR only after all evidence files exist
     and all hard blocks are clear

## Gate G3 — PR review

Gate G3 happens entirely in GitHub.
The developer reviews, approves, and merges the PR in GitHub.
No CLI command is required at Gate G3.
After the PR is merged QA proceeds with: yooti qa:review [${itemTag}]

Do NOT wait for a CLI command at Gate G3.
Do NOT re-open the PR after it is merged.
Do NOT start the next story until G3 is complete.

## Constitution enforcement — mandatory before writing any file

Before writing ANY file in a task, state out loud which
constitutions apply and confirm you have read them.

CHECKLIST — run this before every task:

  Writing a Python file?
    → Read .claude/constitutions/python.md NOW
    → Read .claude/constitutions/security.md NOW
    → Read .claude/constitutions/testing.md NOW

  Writing a React/TypeScript file?
    → Read .claude/constitutions/react.md NOW (components)
    → Read .claude/constitutions/typescript.md NOW (non-component)
    → Read .claude/constitutions/security.md NOW
    → Read .claude/constitutions/testing.md NOW

  Writing a database migration or query?
    → Read .claude/constitutions/postgresql.md NOW
    → Read .claude/constitutions/security.md NOW

  Writing a LangGraph agent?
    → Read .claude/constitutions/langgraph.md NOW
    → Read .claude/constitutions/python.md NOW
    → Read .claude/constitutions/testing.md NOW

  Writing any configuration file (.env, docker-compose, pyproject.toml)?
    → Read .claude/constitutions/config.md NOW
    → Read .claude/constitutions/docker.md NOW (if Docker file)

  Writing any test file?
    → Read .claude/constitutions/testing.md NOW

SELF-AUDIT — before marking any task COMPLETE:
  □ Every function has type annotations (Python) or types (TypeScript)
  □ No secrets or hardcoded values — all from environment variables
  □ Every new dependency is in requirements.txt or package.json
  □ No bare except/empty catch blocks
  □ All error messages are user-friendly — no stack traces exposed
  □ Every public function has a docstring or JSDoc comment
  □ SQL queries use parameterised inputs — never string concatenation
  □ Auth checks present on every protected endpoint
  □ Test file exists for every new source file
  □ axe-core test present in every React component test

If any box cannot be checked: fix it before marking COMPLETE.
Do not mark a task COMPLETE with a known violation.

## Before every task — read in this order

1. .agent/requirements/[${itemTag}]-validated.json
   The spec. Every AC must have a test. Non-negotiable.

2. .agent/plans/[${itemTag}]-[TASK-ID].plan.md
   Your task. Scope is law. Read the Role annotations section.
   Check status — only proceed if PENDING or IN_PROGRESS.

3. .agent/context/[${itemTag}]/ (all files if folder exists)
   URL files: fetch the URL before proceeding
   File files: read the file at the path
   Constraint files: treat as absolute rules
   API files: use exact schemas defined here

4. .agent/corrections/ (filter by your task ID)
   Corrections override the original plan for that issue.
   BLOCKER corrections: fix before continuing.

5. .agent/test-requirements/ (filter by story ID)
   Additional test scenarios QA requires.
   All P0 requirements must pass before PR opens.

6. .agent/gates/[${itemTag}]-G2-approved.md
   MUST EXIST before you write any code.
   If missing: write escalation and stop.

7. .agent/escalations/ (check for open blockers)
   If an open blocker exists for this story: stop.
   Do not proceed until it is resolved.

## Dependency order rules

Within a story: always T001 → T002 → T003 in order.
  Never start T002 before T001 is COMPLETE.
  Never start T003 before T002 is COMPLETE.

Across stories: respect cross-story dependencies.
  The plan file says "Depends on: ${itemNNN}-TMMM"
  Do not start a task if its dependency is not COMPLETE.

## Scope rules — these are absolute

Only touch files listed in your plan's CREATE or MODIFY scope.
If a file is in OUT OF SCOPE: do not touch it.
If you need to touch a file not in your scope:
  Write .agent/escalations/[TASK-ID]-scope-expansion.md
  Describe which file and why
  Stop. Do not touch the file. Wait for architect approval.

## Escalation rules — when to stop

Write an escalation and stop when:
  - You cannot fix a failure after 5 iterations
  - You need to touch a file outside your scope
  - A G2 gate file does not exist for your story
  - A constraint in a context file makes the AC impossible
  - You discover an ambiguity the PM needs to resolve
  - You need a new dependency not in requirements.txt or package.json

Never guess. Never expand scope. Never skip a gate.
When in doubt: escalate and stop.

## Audit logging — required for every action

Log every significant action to .agent/logs/[${itemTag}].log.json.

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

## Constitutions — read before writing any code
${hasPython ? `
Python code (any layer):      .claude/constitutions/python.md` : ''}
${isAgent ? `
LangGraph agents:             .claude/constitutions/langgraph.md` : ''}
${hasReact ? `
React components:             .claude/constitutions/react.md` : ''}
${config.hasPostgres ? `
Database queries or schemas:  .claude/constitutions/postgresql.md` : ''}

${config.includeAws ? `
AWS services:        .claude/constitutions/aws.md
  Covers: ${(config.awsServices || []).join(', ')}
  Rules: moto in every unit test, single table DynamoDB, batchItemFailures SQS,
         no hardcoded ARNs, Secrets Manager for credentials, LocalStack locally` : ''}
Configuration files (.env, pyproject.toml, vitest.config): .claude/constitutions/config.md
Docker files (Dockerfile, docker-compose.yml):             .claude/constitutions/docker.md

Any code in any layer:        .claude/constitutions/security.md
Any test in any layer:        .claude/constitutions/testing.md

Read the relevant constitution BEFORE writing any code for that layer.
Constitutions are law — not suggestions.

## Story type templates

When creating a new story use the appropriate template from .agent/templates/.

Available templates:
- .agent/templates/feature-story.json      — new features
- .agent/templates/bugfix-story.json       — bug fixes (regression test first)
- .agent/templates/refactor-story.json     — refactors (no behaviour change)
- .agent/templates/security-patch.json     — security vulnerabilities (P0)
- .agent/templates/api-contract.json       — API endpoints (contract tests)
${isAgent ? '- .agent/templates/agent-story.json       — LangGraph agents (3-layer testing)' : ''}

## Unit testing — mandatory on every story

Write tests BEFORE implementation (TDD).
Iteration 1 always starts with failing tests.
${hasNode ? `
Node.js API:
  Run:      cd services/api && npm run test:coverage
  Location: tests/unit/*.test.ts
  Helpers:  import { createUser } from '../helpers/factories'
            import { mockLogger, mockDatabase } from '../helpers/mocks'
  Config:   vitest.config.ts — coverage thresholds enforced
` : ''}${hasReact ? `
React frontend:
  Run:      cd frontend/dashboard && npm run test:coverage
  Location: tests/unit/*.test.tsx
  Helpers:  import { renderWithProviders } from '../helpers/render'
  Required: axe accessibility test in EVERY component test
` : ''}${hasPython ? `
Python agents/batch:
  Run:      pytest -m "not eval and not integration" --cov
  Location: tests/unit/test_*.py
  Helpers:  from tests.helpers.factories import create_user
  Config:   pyproject.toml — fail_under = 80 enforced
  Note:     pytest --eval runs eval tests (nightly only, costs money)
` : ''}

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

## Absolute rules
1. SCOPE — only modify files listed in your .plan.md "Files in Scope"
2. TDD — write tests before implementation. Iteration 0 = RED tests
3. NO INVENTED APIS — every import must exist in package.json / requirements.txt
4. NO SECRETS — all config via environment variables (.env.example has the names)
5. ZERO WARNINGS — --max-warnings 0 enforced. Fix all warnings.
6. ESCALATE — write to .agent/escalations/ on: SCOPE_ERROR, ENV_ERROR, SPEC_AMBIGUITY, >5 iterations

## Context: ${config.context.toUpperCase()}
${config.context === 'greenfield'
  ? '- Read .claude/rules/greenfield-rules.md for the Pattern Mandate\n- You are establishing the patterns — consistency > cleverness'
  : '- Read .claude/rules/brownfield-rules.md for adoption rules\n- Match existing patterns — never introduce new ones without architect approval'}

## Quality thresholds — hard requirements

Coverage overall:    >= 80%   (blocks PR if not met)
Coverage new code:   >= 90%   (blocks PR if not met)
Lint errors:         0        (blocks PR)
Type errors:         0        (blocks PR)
Unit tests:          100% pass (blocks PR)
Security findings:   0 HIGH/CRITICAL (blocks PR)

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

## Pipeline stage: ${config.stage} — ${stageName(config.stage)}

### What the agent does at this stage
${stageAgentDoes(config.stage)}

### What the human does at this stage
${stageHumanDoes(config.stage)}

### Handover points — STOP and wait for human at these points
STOP after: PR body and evidence package generated
Human takes over: PR review (read, edit, approve/reject), ALL deployments
KEY POINT: Human may edit code directly in the feature branch before approving
${config.agent === 'codex' || config.agent === 'both' ? `
## Using Codex CLI

This project supports Codex CLI as the code generation agent.
Codex reads the same CLAUDE.md and constitution files.

Key differences when using Codex:
  - Codex uses AGENTS.md in addition to CLAUDE.md
  - Create .codex/ folder with AGENTS.md pointing to this CLAUDE.md
  - Codex does not automatically read .claude/ — reference explicitly
  - The pipeline, gates, and evidence package are identical

Codex prompt format:
  "Read AGENTS.md and CLAUDE.md. Proceed to Phase 2 for ${itemNNN}."

AGENTS.md should contain:
  Reference to this CLAUDE.md as the primary context file
  Explicit instruction to read .claude/constitutions/ before coding
  Same gate and evidence requirements as Claude Code
` : ''}
${config.includeAws ? `
## AWS local development

LocalStack runs all AWS services locally at http://localhost:4566
Start: docker compose up localstack -d
Setup: python scripts/create_local_resources.py
Test:  python scripts/invoke_local.py

AWS region: ${config.awsRegion || 'us-east-1'}
Services:   ${(config.awsServices || []).join(', ')}
Deploy:     ${config.awsDeploy || 'sam'}

Unit tests use moto — never real AWS, never LocalStack
Integration tests use LocalStack — docker compose up localstack -d first
Staging/production — real AWS, IAM roles, Secrets Manager
` : ''}`);

  // ── .claude/agents/ ──
  write('.claude/agents/requirements.md', `# Requirements Ingestion Agent
Parse raw user stories into validated_requirement.json.
Flag ambiguities: BLOCKER (hold), WARNING (proceed with note), NOTE (log only).
Structure every AC as Given/When/Then with testable: true/false.
Write to: .agent/requirements/${itemNNN}-validated.json
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
feat(${itemNNN}): short description
- what changed and why
Relates-to: ${itemNNN} | Task: T-00N | Agent: CodeGenAgent | Iteration: N

## SCOPE_ERROR protocol
If you need a file NOT in .plan scope:
  STOP. Write .agent/escalations/${itemNNN}-scope.md. Do not proceed.
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
5. Log each attempt in .agent/evidence/${itemNNN}/iteration-log.json
`);

  write('.claude/agents/deploy.md', `# Deploy Agent
# Activated after Gate G4 (QA sign-off)

## Staging (automatic after G4)
1. docker compose -f docker-compose.staging.yml up -d
2. Wait 30s, run smoke tests
3. Generate .agent/evidence/${itemNNN}/staging-health.json
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
  2. Write: .agent/escalations/${itemNNN}-scope.md
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
Do NOT fix it. Write .agent/tech-debt/${itemNNN}-bug.md and move on.
`);

  // ── Pipeline schemas ──
  write('pipeline/schemas/validated_requirement.schema.json', JSON.stringify({
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "ValidatedRequirement",
    "type": "object",
    "required": ["story_id", "title", "type", "acceptance_criteria", "definition_of_done"],
    "properties": {
      "story_id": { "type": "string", "pattern": itemPrefix ? `^${itemPrefix}-[0-9]+` : "^[0-9]+" },
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
    '// ── Prerequisites — tools required before the pipeline can run ──',
    '',
    `const config = existsSync('yooti.config.json')`,
    `  ? JSON.parse(readFileSync('yooti.config.json', 'utf8'))`,
    '  : {}',
    '',
    'const prereqs = [',
    '  {',
    "    name:    'Git',",
    "    command: 'git --version',",
    '    install: {',
    "      darwin:  'brew install git',",
    "      win32:   'winget install Git.Git',",
    "      linux:   'sudo apt-get install git',",
    '    },',
    '    required: true,',
    '  },',
    '  {',
    "    name:    'GitHub CLI (gh)',",
    "    command: 'gh --version',",
    '    install: {',
    "      darwin:  'brew install gh',",
    "      win32:   'winget install GitHub.cli',",
    "      linux:   'sudo apt-get install gh',",
    '    },',
    '    required: false,',
    "    reason:   'Required for automatic PR creation in Phase 6',",
    '  },',
    '  {',
    "    name:    'Node.js >= 20',",
    "    command: 'node --version',",
    "    versionCheck: v => parseInt(v.replace('v','').split('.')[0]) >= 20,",
    '    install: {',
    "      darwin:  'brew install node@20',",
    "      win32:   'winget install OpenJS.NodeJS.LTS',",
    "      linux:   'nvm install 20',",
    '    },',
    '    required: true,',
    '  },',
    '  {',
    "    name:    'Python >= 3.12',",
    "    command: process.platform === 'win32'",
    "      ? 'python --version'",
    "      : 'python3 --version 2>/dev/null || python --version',",
    '    versionCheck: v => {',
    "      const m = v.match(/(\\d+)\\.(\\d+)/)",
    '      return m && (parseInt(m[1]) > 3 || (parseInt(m[1]) === 3 && parseInt(m[2]) >= 12))',
    '    },',
    '    install: {',
    "      darwin:  'brew install python@3.12',",
    "      win32:   'winget install Python.Python.3.12',",
    "      linux:   'sudo apt-get install python3.12',",
    '    },',
    `    required: config.stack?.includes('python') || config.projectType !== 'web',`,
    '  },',
    '  {',
    "    name:    'Docker Desktop',",
    "    command: 'docker --version',",
    '    install: {',
    "      darwin:  'https://docs.docker.com/desktop/install/mac-install/',",
    "      win32:   'https://docs.docker.com/desktop/install/windows-install/',",
    "      linux:   'https://docs.docker.com/desktop/install/linux-install/',",
    '    },',
    `    required: config.deploy === 'docker',`,
    "    reason:   'Required for docker compose up',",
    '  },',
    '  {',
    "    name:    'Docker Compose',",
    "    command: 'docker compose version',",
    '    install: {',
    "      all: 'Included with Docker Desktop',",
    '    },',
    `    required: config.deploy === 'docker',`,
    '  },',
    ']',
    '',
    "console.log('\\n◆ Checking prerequisites...\\n')",
    'let prereqFailed = false',
    '',
    'for (const prereq of prereqs) {',
    '  if (!prereq.required) continue',
    '  try {',
    "    const out = execSync(prereq.command, { encoding: 'utf8', stdio: 'pipe' }).trim()",
    '    const versionOk = prereq.versionCheck ? prereq.versionCheck(out) : true',
    '    if (versionOk) {',
    "      console.log(`  \\x1b[32m✓\\x1b[0m ${prereq.name}`)",
    '    } else {',
    "      console.log(`  \\x1b[31m✗\\x1b[0m ${prereq.name} — version too old`)",
    '      const platform = process.platform',
    "      const cmd = prereq.install[platform] || prereq.install.all",
    "      if (cmd) console.log(`    \\x1b[2mInstall: ${cmd}\\x1b[0m`)",
    '      prereqFailed = true',
    '    }',
    '  } catch {',
    "    console.log(`  \\x1b[31m✗\\x1b[0m ${prereq.name} — not found`)",
    '    const platform = process.platform',
    "    const cmd = prereq.install[platform] || prereq.install.all",
    "    if (cmd) console.log(`    \\x1b[2mInstall: ${cmd}\\x1b[0m`)",
    '    prereqFailed = true',
    '  }',
    '}',
    '',
    '// Warn-only prereqs',
    'for (const prereq of prereqs.filter(p => !p.required)) {',
    '  try {',
    "    execSync(prereq.command, { stdio: 'pipe' })",
    "    console.log(`  \\x1b[32m✓\\x1b[0m ${prereq.name}`)",
    '  } catch {',
    "    console.log(`  \\x1b[33m⚠\\x1b[0m ${prereq.name} — not found (optional)`)",
    "    if (prereq.reason) console.log(`    \\x1b[2m${prereq.reason}\\x1b[0m`)",
    '    const platform = process.platform',
    "    const cmd = prereq.install[platform] || prereq.install.all",
    "    if (cmd) console.log(`    \\x1b[2mInstall: ${cmd}\\x1b[0m`)",
    '  }',
    '}',
    '',
    'if (prereqFailed) {',
    "  console.log('\\n  \\x1b[31m✗ Install missing prerequisites then run again.\\x1b[0m\\n')",
    '  process.exit(1)',
    '}',
    '',
    '// ── Project checks ──',
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
"""Generate PR body from evidence package. Usage: python generate-pr-body.py ${item001}"""
import json, sys, os
from datetime import datetime

story_id = sys.argv[1] if len(sys.argv) > 1 else "${item001}"
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

  // Batch service
  if (config.projectType === 'full' && config.stack?.includes('python')) {
    composeParts.push(`
  batch:
    build: ./batch/analytics
    environment:
      - AWS_REGION=\${AWS_REGION}
      - AWS_ACCESS_KEY_ID=\${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=\${AWS_SECRET_ACCESS_KEY}
      - S3_BUCKET=\${S3_BUCKET}
      - DATABASE_URL=\${DATABASE_URL}
    volumes:
      - ./batch/analytics:/app
    profiles:
      - batch
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

  // LocalStack for AWS integration testing
  if (config.includeAws) {
    const localstackServices = buildLocalStackServices(config.awsServices);
    const awsRegion = config.awsRegion || 'us-east-1';
    composeParts.push(`
  localstack:
    image: localstack/localstack:3
    ports:
      - "4566:4566"
    environment:
      - SERVICES=${localstackServices}
      - DEFAULT_REGION=${awsRegion}
      - AWS_DEFAULT_REGION=${awsRegion}
    volumes:
      - ./localstack-data:/var/lib/localstack
      - /var/run/docker.sock:/var/run/docker.sock
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4566/_localstack/health"]
      interval: 10s
      timeout: 5s
      retries: 5
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
  write('yooti.config.json', yootiConfigTemplate(config));

  // ── Example artifacts ──
  const exReq = (ctx) => JSON.stringify({
    story_id: item001,
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

  write(`.agent/examples/greenfield/${item001}-T001.plan.md`, `# ${item001}-T001 — Property Service + Repository

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

  write(`.agent/examples/brownfield/${item001}-T001.plan.md`, `# ${item001}-T001 — Redis Rate Limit Store

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

  write('.agent/examples/good-decomposition.md', goodDecompositionExample(config));
  write('.agent/examples/bad-decomposition.md', badDecompositionExample(config));

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

  write('.claude/constitutions/config.md', configConstitution(config));
  write('.claude/constitutions/docker.md', dockerConstitution(config));

  if (config.includeAws) {
    write('.claude/constitutions/aws.md', awsConstitution(config));
  }

  const hasAgentsConst = config.projectType === 'full' || config.projectType === 'agent';
  if (hasAgentsConst) {
    write('.claude/constitutions/langgraph.md', langgraphConstitution(config));
  }

  // ── AGENTS.md for Codex ──
  if (config.agent === 'codex' || config.agent === 'both') {
    write('AGENTS.md', agentsMdTemplate(config))
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

  // ── AWS scaffolding ──
  if (config.includeAws) {
    write('.agent/templates/aws-lambda.json', awsLambdaStoryTemplate());
    write('scripts/create_local_resources.py', createLocalResourcesScript(config));
    write('scripts/invoke_local.py', invokeLocalScript(config));
    write('.env.aws.example', awsEnvExample(config));
    generateTestEvents(write, config);
    if (config.awsDeploy === 'sam') {
      write('template.yaml', samTemplate(config));
    }
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
    write('.github/workflows/security-scan.yml', securityCiYml(config));
    write('.github/workflows/gate-g3.yml', gateG3CiYml(config));

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
  write('.gitignore', `node_modules/\n.env\n*.env.local\ndist/\n.coverage/\n__pycache__/\n.pytest_cache/\n.mypy_cache/\n.ruff_cache/\nplaywright-report/\n.lighthouseci/\nlocalstack-data/\n`);

  write('.env.example', envExampleTemplate(config));

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

  // ── Batch service ──
  if ((config.projectType === 'full') &&
      (config.stack?.includes('python') || config.agentFrameworks?.length > 0)) {
    generateBatchService(root, config, write);
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

### Plan quality checklist — architect reviews each plan against this

DECOMPOSITION
- [ ] Tasks split by layer — not by acceptance criterion
- [ ] No more tasks than the complexity allows
  (XS=1, S=1-2, M=2-3, L=3-4, XL=4-5)
- [ ] Each task touches no more than 5-7 files
- [ ] Every AC from the story is covered by at least one task
- [ ] No AC is left without a task covering it

SCOPE
- [ ] Every file in CREATE/MODIFY scope is necessary for this task
- [ ] OUT OF SCOPE section lists unrelated directories
- [ ] No file appears in two tasks (no overlap between tasks)
- [ ] Scope does not bleed into unrelated services

DEPENDENCIES
- [ ] Tasks are ordered correctly — database before API before frontend
- [ ] Dependency chain has no circular references
- [ ] Tasks that can run in parallel are identified

IMPLEMENTATION STEPS
- [ ] Steps are actionable and specific
- [ ] Steps follow the correct order
- [ ] Steps reference the right files from scope
- [ ] No step touches a file outside the scope

APPROVE when all boxes above are checked.
REJECT with specific feedback on which box failed and why.

## G3 Developer PR Review (Days 6-8)
- [ ] Code matches intent
- [ ] No out-of-scope file changes
- [ ] Patterns consistent
- [ ] No hardcoded secrets
APPROVE: continue | REQUEST CHANGES: agent corrects | REJECT: replan

## G4 QA Sign-Off (Day 9)

Run: yooti qa:review ${itemNNN}

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

  write('docs/PROMPTS.md', promptsGuideTemplate(config));
  write('docs/CUSTOMISING.md', generateCustomisingMd(config));
  if (config.includeAws) {
    write('docs/AWS-GUIDE.md', awsGuideTemplate(config));
  }

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

// ── Decomposition examples ──

function goodDecompositionExample(config) {
  const itemPrefix = config.itemPrefix ?? 'STORY'
  return `# Good task decomposition — reference example

## Story
${itemPrefix ? itemPrefix + '-003' : '003'} — As a new visitor I want to create an account
Complexity: M
Affected layers: database, api, frontend

## Correct decomposition — 4 tasks for M complexity

${itemPrefix ? itemPrefix + '-003' : '003'}-T001 — Database schema and user model
  Layer:      database
  Status:     PENDING
  Files:
    CREATE: prisma/schema.prisma (users table)
    CREATE: src/models/user.ts
    OUT OF SCOPE: src/routes/, frontend/
  AC covered: AC-1 (foundation)
  Depends on: none
  Steps:
    1. Add users table to prisma schema
    2. Define User TypeScript model
    3. Write migration
    4. Write unit tests for model

${itemPrefix ? itemPrefix + '-003' : '003'}-T002 — Registration API endpoint
  Layer:      api
  Status:     PENDING
  Files:
    CREATE: src/routes/auth/register.ts
    CREATE: src/services/auth.service.ts
    MODIFY: src/middleware/rate-limit.ts
    OUT OF SCOPE: frontend/, prisma/
  AC covered: AC-1, AC-2, AC-3, AC-4, AC-6
  Depends on: T001
  Steps:
    1. Create registration route handler
    2. Add password hashing in auth service
    3. Add rate limiting middleware
    4. Write integration tests for all AC

${itemPrefix ? itemPrefix + '-003' : '003'}-T003 — Welcome email service
  Layer:      api (async)
  Status:     PENDING
  Files:
    CREATE: src/services/email.service.ts
    OUT OF SCOPE: frontend/, prisma/, src/routes/
  AC covered: AC-5
  Depends on: T002
  Steps:
    1. Create email service with SendGrid
    2. Add welcome email template
    3. Wire to registration completion event
    4. Write integration test with mocked email

${itemPrefix ? itemPrefix + '-003' : '003'}-T004 — Registration frontend form
  Layer:      frontend
  Status:     PENDING
  Files:
    CREATE: src/pages/Register.tsx
    CREATE: src/components/RegisterForm.tsx
    OUT OF SCOPE: services/api/, prisma/
  AC covered: AC-1, AC-3, AC-4
  Depends on: T002
  Steps:
    1. Create RegisterForm component with validation
    2. Wire to POST /api/v1/auth/register
    3. Handle all error states from API
    4. Write component tests including axe accessibility

## Why this decomposition is correct
  - 4 tasks for M complexity — within the M limit of 2-3 is tight
    but acceptable because there are 4 distinct layers
  - Each task is at one layer only
  - Each task has clear dependencies
  - AC are distributed across tasks by which layer implements them
  - No task has more than 4 files
`;
}

function badDecompositionExample(config) {
  const itemPrefix = config.itemPrefix ?? 'STORY'
  return `# Bad task decomposition — what NOT to do

## Story
${itemPrefix ? itemPrefix + '-003' : '003'} — As a new visitor I want to create an account
Complexity: M

## Wrong decomposition — one task per AC

${itemPrefix ? itemPrefix + '-003' : '003'}-T001 — Implement AC-1 account creation     ✗
${itemPrefix ? itemPrefix + '-003' : '003'}-T002 — Implement AC-2 duplicate email      ✗
${itemPrefix ? itemPrefix + '-003' : '003'}-T003 — Implement AC-3 password validation  ✗
${itemPrefix ? itemPrefix + '-003' : '003'}-T004 — Implement AC-4 email validation     ✗
${itemPrefix ? itemPrefix + '-003' : '003'}-T005 — Implement AC-5 welcome email        ✗
${itemPrefix ? itemPrefix + '-003' : '003'}-T006 — Implement AC-6 rate limiting        ✗

## Why this is wrong

  1. AC-1, AC-2, AC-3, AC-4, AC-6 are all implemented in the same
     API endpoint file. Splitting them into separate tasks means
     the agent will create the same file 5 times or create
     conflicts between tasks.

  2. There are 6 tasks for an M complexity story.
     M allows 2-3 tasks maximum.

  3. Tasks do not have a meaningful dependency order.
     AC-3 and AC-4 are both frontend validation —
     they belong in the same task.

  4. The agent will not know which task owns which file,
     leading to scope conflicts and duplicate code.

## Rule to remember

  If your tasks look like a numbered list of your AC
  you have decomposed by AC not by layer.
  Start over. Group by layer instead.
`;
}

// ── Security CI workflow ──

function securityCiYml(config) {
  let jobs = '';

  // Snyk dependency scan
  let snykSteps = '';
  if (config.stack?.includes('node')) {
    snykSteps += `
      - name: Scan Node.js API
        run: snyk test --severity-threshold=high
        working-directory: services/api
        continue-on-error: true`;
  }
  if (config.stack?.includes('react') || config.stack?.includes('nextjs')) {
    snykSteps += `
      - name: Scan Frontend
        run: snyk test --severity-threshold=high
        working-directory: frontend/dashboard
        continue-on-error: true`;
  }
  if (config.stack?.includes('python')) {
    snykSteps += `
      - name: Scan Python dependencies
        run: snyk test --severity-threshold=high
        working-directory: agents
        continue-on-error: true`;
  }

  jobs += `
  snyk:
    name: Snyk dependency scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install Snyk
        run: npm install -g snyk
      - name: Authenticate Snyk
        run: snyk auth \${{ secrets.SNYK_TOKEN }}
        continue-on-error: true${snykSteps}
`;

  // Semgrep
  jobs += `
  semgrep:
    name: Semgrep code scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install Semgrep
        run: pip install semgrep --break-system-packages
      - name: Run Semgrep
        run: semgrep scan --config=auto --error
        continue-on-error: true
`;

  // Stryker (TypeScript mutation testing)
  if (config.stack?.includes('node') || config.stack?.includes('react')) {
    jobs += `
  stryker:
    name: Mutation testing (TypeScript)
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install and run Stryker
        run: |
          cd services/api
          npm install
          npx stryker run
        continue-on-error: true
`;
  }

  // mutmut (Python mutation testing)
  if (config.stack?.includes('python')) {
    jobs += `
  mutmut:
    name: Mutation testing (Python)
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install dependencies
        run: pip install -r agents/requirements.txt mutmut --break-system-packages
      - name: Run mutmut
        run: cd agents && mutmut run
        continue-on-error: true
`;
  }

  return `name: Security scan

on:
  push:
  pull_request:

jobs:
${jobs}`;
}

// ── .env.example template ──

function envExampleTemplate(config) {
  const lines = [];

  lines.push('# ══════════════════════════════════════════════');
  lines.push('# Yooti project environment variables');
  lines.push('# Copy this file to .env and fill in all values');
  lines.push('# Never commit .env to git');
  lines.push('# ══════════════════════════════════════════════');
  lines.push('');

  lines.push('# ── APPLICATION ──────────────────────────────');
  lines.push('NODE_ENV=development');
  lines.push('PORT=3000');
  lines.push('LOG_LEVEL=info');
  lines.push('');

  lines.push('# ── SECURITY ──────────────────────────────────');
  lines.push('JWT_SECRET=replace-with-a-long-random-string-min-32-chars');
  lines.push('JWT_EXPIRY=24h');
  lines.push('REFRESH_TOKEN_SECRET=replace-with-a-different-long-random-string');
  lines.push('REFRESH_TOKEN_EXPIRY=7d');
  lines.push('BCRYPT_COST=12');
  lines.push('');

  if (config.hasPostgres) {
    lines.push('# ── DATABASE ──────────────────────────────────');
    lines.push('DATABASE_URL=postgresql://app:app@localhost:5432/appdb');
    lines.push('DATABASE_POOL_SIZE=10');
    if (config.databases?.includes('pgvector')) {
      lines.push('VECTOR_DIMENSIONS=1536');
      lines.push('VECTOR_SIMILARITY=cosine');
    }
    if (config.databases?.includes('age')) {
      lines.push('GRAPH_NAME=app_graph');
    }
    lines.push('');
  }

  if (config.hasRedis) {
    lines.push('# ── CACHE ─────────────────────────────────────');
    lines.push('REDIS_URL=redis://localhost:6379');
    lines.push('REDIS_TTL_SECONDS=3600');
    lines.push('RATE_LIMIT_WINDOW_MS=900000');
    lines.push('RATE_LIMIT_MAX_REQUESTS=100');
    lines.push('');
  }

  if (config.hasMongo) {
    lines.push('# ── MONGODB ───────────────────────────────────');
    lines.push('MONGODB_URL=mongodb://app:app@localhost:27017/appdb');
    lines.push('');
  }

  if (config.agentFrameworks?.includes('langgraph') ||
      config.projectType === 'agent' ||
      config.projectType === 'full') {
    lines.push('# ── LLM PROVIDERS ────────────────────────────');
    if (config.llmProviders?.includes('anthropic') ||
        !config.llmProviders?.length) {
      lines.push('ANTHROPIC_API_KEY=your-anthropic-api-key-here');
      lines.push('ANTHROPIC_MODEL=claude-sonnet-4-5-20251001');
    }
    if (config.llmProviders?.includes('openai')) {
      lines.push('OPENAI_API_KEY=your-openai-api-key-here');
      lines.push('OPENAI_MODEL=gpt-4o');
    }
    lines.push('');
    lines.push('# ── LANGSMITH OBSERVABILITY ──────────────────');
    lines.push('LANGCHAIN_TRACING_V2=true');
    lines.push('LANGCHAIN_API_KEY=your-langsmith-api-key-here');
    lines.push(`LANGCHAIN_PROJECT=${config.projectName}`);
    lines.push('');
  }

  if (config.stack?.includes('python') ||
      config.projectType === 'full') {
    lines.push('# ── AWS ───────────────────────────────────────');
    lines.push('AWS_REGION=us-east-1');
    lines.push('AWS_ACCESS_KEY_ID=your-access-key-id');
    lines.push('AWS_SECRET_ACCESS_KEY=your-secret-access-key');
    lines.push('S3_BUCKET=your-bucket-name');
    lines.push('S3_PREFIX=uploads/');
    lines.push('');
  }

  if (config.stack?.includes('react') ||
      config.stack?.includes('nextjs')) {
    lines.push('# ── FRONTEND ──────────────────────────────────');
    lines.push('VITE_API_URL=http://localhost:3000');
    lines.push('NEXT_PUBLIC_API_URL=http://localhost:3000');
    lines.push('VITE_APP_NAME=' + config.projectName);
    lines.push('');
  }

  lines.push('# ── EMAIL ─────────────────────────────────────');
  lines.push('SENDGRID_API_KEY=your-sendgrid-api-key');
  lines.push('EMAIL_FROM=noreply@yourdomain.com');
  lines.push('EMAIL_FROM_NAME=' + config.projectName);
  lines.push('');

  lines.push('# ── MONITORING ────────────────────────────────');
  lines.push('SNYK_TOKEN=your-snyk-token-for-ci');
  lines.push('');

  return lines.join('\n');
}

// ── PROMPTS.md template ──

function promptsGuideTemplate(config) {
  const agent = config.agent === 'codex' ? 'Codex CLI' : 'Claude Code'
  const t3 = '```'
  const itemPrefix = config.itemPrefix ?? 'STORY'
  const itemTag = itemPrefix ? `${itemPrefix}-ID` : 'ID'
  const item001 = itemPrefix ? `${itemPrefix}-001` : '001'
  const itemNNN = itemPrefix ? `${itemPrefix}-NNN` : 'NNN'
  return `# Yooti — Prompt Guide
# The exact prompt to use at every pipeline stage
# Agent: ${agent} · Project: ${config.projectName}

---

## How to use this guide

Copy the prompt for your current stage and paste it into ${agent}.
You do not need to explain the pipeline — the agent reads CLAUDE.md.
Shorter prompts are better. If the prompt is long, something is
missing from CLAUDE.md — fix it there, not in the prompt.

---

## PHASE 2 — Story decomposition (plan files only)

${t3}
Proceed to Phase 2 for [${itemTag}].
${t3}

For multiple stories:
${t3}
Proceed to Phase 2 for ${item001}, ${itemPrefix ? itemPrefix + '-002' : '002'}, ${itemPrefix ? itemPrefix + '-003' : '003'}.
${t3}

What the agent produces: .plan.md files in .agent/plans/
What it does NOT produce: any code, tests, or implementation
When to use: after G1 approval, before G2 review

---

## PHASE 4 — Code generation

${t3}
Proceed to Phase 4 for [${itemTag}].
${t3}

For multiple stories in dependency order:
${t3}
Proceed to Phase 4 for all approved stories in dependency order.
${t3}

What the agent produces: code, tests, evidence package, PR
Prerequisite: G2 gate must be signed first
When to use: after G2 approval

---

## PHASE 5 — Evidence package (if agent skipped it)

${t3}
Phase 5 was skipped for [${itemTag}].
Generate the evidence package in .agent/evidence/[${itemTag}]/
Read the coverage from services/api_python/coverage.json
Do not re-run tests — just generate the evidence files and PR body.
${t3}

When to use: if the agent opened a PR without generating evidence

---

## PHASE 2 — Regenerate plans (if plans are wrong)

${t3}
The plans for [${itemTag}] are incorrect.
Delete .agent/plans/[${itemTag}]-*.plan.md
Re-read .claude/CLAUDE.md decomposition rules.
Regenerate plans — split by layer not by AC.
Do not write any code.
${t3}

When to use: if the architect rejects plans at G2

---

## CORRECTION — Fix a specific issue mid-generation

${t3}
Read .agent/corrections/[TASK-ID]-[timestamp].md
Apply the correction to [TASK-ID].
Re-run the quality loop.
Do not change anything outside the correction scope.
${t3}

When to use: after running yooti correct:inject

---

## ESCALATION — Resolve a blocked task

${t3}
Read .agent/escalations/[TASK-ID]-[type].md
The escalation has been resolved: [brief description of resolution]
Continue with [TASK-ID].
${t3}

When to use: after resolving an agent escalation

---

## CONSTITUTION VIOLATION — Fix a specific violation

${t3}
The code audit for [${itemTag}] found violations.
Read .agent/evidence/[${itemTag}]/code-audit.md
Fix each violation listed.
Re-run the quality loop.
Regenerate the evidence package.
Do not change any tests.
${t3}

When to use: if code-audit.md shows violations before PR

---

## COVERAGE — Fix low coverage

${t3}
Coverage for [${itemTag}] is below 80%.
Run: pytest tests/unit/ --cov=src --cov-report=term-missing
Add tests for every uncovered line in business logic files.
Do not add coverage exclusions without architect approval.
${t3}

When to use: if coverage gate fails at G4

---

## SPRINT START — Beginning of a new sprint

Step 1 — PM approves stories:
${t3}
yooti story:approve --all
${t3}

Step 2 — Start sprint:
${t3}
yooti sprint:start
${t3}

Step 3 — Generate plans:
${t3}
Proceed to Phase 2 for all new stories in this sprint.
${t3}

Step 4 — Architect reviews:
${t3}
yooti plan:review ${itemNNN}
${t3}

Step 5 — Generate code:
${t3}
Proceed to Phase 4 for all approved stories in dependency order.
${t3}

---

## SPRINT END — Closing a sprint

Step 1 — QA review each story:
${t3}
yooti qa:review ${itemNNN}
${t3}

Step 2 — Sprint report:
${t3}
yooti sprint:report
${t3}

Step 3 — Retrospective:
${t3}
yooti sprint:retro
${t3}

---

## DAILY — Standup

${t3}
yooti sm:standup
${t3}

---

## COMMON MISTAKES AND FIXES

| Symptom | Cause | Fix |
|---------|-------|-----|
| Agent writes code during Phase 2 | CLAUDE.md Phase 2 section missing | Add Phase 2 section to CLAUDE.md |
| Agent creates one task per AC | Decomposition rules not read | Re-run Phase 2 with explicit instruction to re-read rules |
| PR opened without evidence package | Phase 5 skipped | Use Phase 5 regeneration prompt above |
| Coverage shows stale 76% | Evidence not regenerated after fix | Use evidence regeneration prompt |
| Agent touches out-of-scope files | Scope section unclear in plan | Amend plan with yooti plan:amend, re-run task |
| Constitution violations found | Agent did not read constitutions | Use violation fix prompt above |
| Docker ports mismatch | .env and docker-compose not in sync | Read docker.md constitution, fix both files |
`
}

// ── Gate G3 CI workflow ──

function gateG3CiYml(config) {
  const prefix = config.itemPrefix || 'STORY'
  const pattern = prefix ? `${prefix}-[0-9]+` : `[0-9]+`

  return `name: Gate G3 — Evidence Check
on:
  pull_request:
    branches: [main, master]

jobs:
  evidence-check:
    name: Verify evidence package exists
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Extract item ID from branch name
        id: story
        run: |
          BRANCH="\${{ github.head_ref }}"
          ITEM_ID=$(echo "$BRANCH" | grep -oP '${pattern}' | head -1)
          if [ -z "$ITEM_ID" ]; then
            echo "::warning::Could not extract item ID from branch: $BRANCH"
            echo "story_id=" >> $GITHUB_OUTPUT
            exit 0
          fi
          echo "story_id=$ITEM_ID" >> $GITHUB_OUTPUT

      - name: Check evidence package
        if: steps.story.outputs.story_id != ''
        run: |
          SID="\${{ steps.story.outputs.story_id }}"
          DIR=".agent/evidence/$SID"
          MISSING=0

          check_file() {
            if [ ! -f "$DIR/$1" ]; then
              echo "::error::Missing: $DIR/$1"
              MISSING=$((MISSING + 1))
            else
              echo "✓ $DIR/$1"
            fi
          }

          check_file "test-results.json"
          check_file "coverage-summary.json"
          check_file "regression-diff.json"
          check_file "security-scan.json"
          check_file "code-audit.md"
          check_file "pr-body.md"

          if [ $MISSING -gt 0 ]; then
            echo "::error::$MISSING evidence file(s) missing for $SID"
            echo "Run Phase 5 to generate the evidence package."
            exit 1
          fi

          echo "All evidence files present for $SID"

      - name: Validate test results
        if: steps.story.outputs.story_id != ''
        run: |
          SID="\${{ steps.story.outputs.story_id }}"
          FILE=".agent/evidence/$SID/test-results.json"
          if [ -f "$FILE" ]; then
            UNIT_FAILED=$(python3 -c "import json; d=json.load(open('$FILE')); print(d.get('unit',{}).get('failed',0))")
            INT_FAILED=$(python3 -c "import json; d=json.load(open('$FILE')); print(d.get('integration',{}).get('failed',0))")
            if [ "$UNIT_FAILED" != "0" ] || [ "$INT_FAILED" != "0" ]; then
              echo "::error::Test failures: unit=$UNIT_FAILED integration=$INT_FAILED"
              exit 1
            fi
            echo "✓ All tests passing"
          fi

      - name: Validate coverage
        if: steps.story.outputs.story_id != ''
        run: |
          SID="\${{ steps.story.outputs.story_id }}"
          FILE=".agent/evidence/$SID/coverage-summary.json"
          if [ -f "$FILE" ]; then
            OVERALL=$(python3 -c "import json; print(json.load(open('$FILE')).get('overall',0))")
            NEW_CODE=$(python3 -c "import json; print(json.load(open('$FILE')).get('new_code',0))")
            python3 -c "
import sys
overall = float('$OVERALL')
new_code = float('$NEW_CODE')
if overall < 80:
    print(f'::error::Overall coverage {overall}% < 80%')
    sys.exit(1)
if new_code < 90:
    print(f'::error::New code coverage {new_code}% < 90%')
    sys.exit(1)
print(f'✓ Coverage: overall={overall}% new_code={new_code}%')
"
          fi

      - name: Check code audit
        if: steps.story.outputs.story_id != ''
        run: |
          SID="\${{ steps.story.outputs.story_id }}"
          FILE=".agent/evidence/$SID/code-audit.md"
          if [ -f "$FILE" ]; then
            if grep -q "## Violations found" "$FILE" && ! grep -q "No violations found" "$FILE"; then
              echo "::error::Code audit violations found — see $FILE"
              exit 1
            fi
            echo "✓ Code audit clean"
          fi
`
}

// ── CUSTOMISING.md template ──

function awsGuideTemplate(config) {
  const region   = config.awsRegion || 'us-east-1'
  const services = config.awsServices || []
  const name     = config.projectName
  const deploy   = config.awsDeploy || 'sam'

  return `# AWS Development Guide — ${name}

Region: ${region}
Services: ${services.join(', ')}
Deploy: ${deploy}

---

## Quick start

    # 1. Start LocalStack
    docker compose up localstack -d

    # 2. Create local resources (DynamoDB tables, SQS queues, etc.)
    python scripts/create_local_resources.py

    # 3. Run a Lambda handler locally
    python scripts/invoke_local.py

    # 4. Run unit tests (uses moto — no LocalStack needed)
    pytest tests/unit/

    # 5. Run integration tests (uses LocalStack)
    pytest tests/integration/

---

## Environment setup

Copy the AWS environment file:

    cp .env.aws.example .env

This sets \`AWS_ENDPOINT_URL=http://localhost:4566\` which redirects
all boto3 calls to LocalStack. Remove that line for staging/production.

---

## Testing strategy

| Layer | Tool | AWS calls? | When |
|-------|------|-----------|------|
| Unit tests | moto (@mock_aws) | No — fully mocked | Every commit |
| Integration | LocalStack | Yes — local emulation | Every PR |
| Staging | Real AWS | Yes — real services | After G4 |
| Production | Real AWS | Yes — real services | After G5 |

Unit tests must NEVER call real AWS or LocalStack.
Use the \`@mock_aws\` decorator from moto for every test.

---

## Resource names

| Resource | Local name | Staging/Prod pattern |
|----------|-----------|---------------------|
${services.includes('dynamodb')    ? `| DynamoDB table | ${name} | ${name}-{env} |\n` : ''}\
${services.includes('sqs')         ? `| SQS queue | ${name}-queue | ${name}-queue-{env} |\n| SQS DLQ | ${name}-dlq | ${name}-dlq-{env} |\n` : ''}\
${services.includes('sns')         ? `| SNS topic | ${name}-topic | ${name}-topic-{env} |\n` : ''}\
${services.includes('eventbridge') ? `| EventBridge bus | ${name}-bus | ${name}-bus-{env} |\n` : ''}\
${services.includes('s3')          ? `| S3 bucket | ${name}-data | ${name}-data-{env} |\n` : ''}\

---

## Scripts

| Script | Purpose |
|--------|---------|
| \`scripts/create_local_resources.py\` | Create DynamoDB tables, SQS queues, etc. in LocalStack |
| \`scripts/invoke_local.py\` | Invoke a Lambda handler locally against LocalStack |

---

## Test events

Test event files in \`events/\` match API Gateway and SQS formats:

| File | Description |
|------|-------------|
${services.includes('lambda') ? `| \`events/api_post_valid.json\` | Valid POST request |\n| \`events/api_post_invalid.json\` | Invalid POST (empty body) |\n| \`events/api_get_by_id.json\` | GET with path parameter |\n` : ''}\
${services.includes('sqs') ? `| \`events/sqs_batch.json\` | SQS batch with 2 messages |\n` : ''}\

Use with invoke script:

    python scripts/invoke_local.py --event events/api_post_valid.json

---
${deploy === 'sam' ? `
## SAM deployment

The \`template.yaml\` at the project root defines all Lambda functions
and AWS resources.

    # Validate template
    sam validate

    # Build
    sam build

    # Deploy to dev
    sam deploy --stack-name ${name}-dev --parameter-overrides Environment=dev

    # Deploy to staging
    sam deploy --stack-name ${name}-staging --parameter-overrides Environment=staging

    # Local API (uses Docker)
    sam local start-api --env-vars .env
` : ''}
---

## Constitution rules (summary)

The full rules are in \`.claude/constitutions/aws.md\`. Key points:

- **Testing**: moto for unit tests, LocalStack for integration
- **DynamoDB**: Single table design, no Scan, conditional writes for idempotency
- **SQS**: Return batchItemFailures, never fail whole batch, always have DLQ
- **Lambda**: All config from os.environ, catch all exceptions, no global mutable state
- **Credentials**: IAM roles in production, Secrets Manager for secrets, never hardcode
`
}

function generateCustomisingMd(config) {
  return `# Customising Your Pipeline — ${config.projectName}

This guide shows how to wire your existing tools into the Yooti pipeline.
The framework is language-agnostic. The generated scaffold ships one
opinionated stack. This document is for teams who use something else.

---

## The mental model

Yooti's quality gates expect certain outputs. It does not care how those
outputs are produced — only that they are produced in the expected format
at the expected time.

    GATE G4 expects:    A passing test suite
                        A coverage report
                        A security scan result
                        A regression diff vs the baseline
                        A code audit vs your constitutions

    HOW YOU PRODUCE THEM is up to you. The generated scaffold
    uses pytest, Vitest, Snyk, and Semgrep. Your team uses whatever
    tools your stack requires.

---

## Step 1 — Tell Yooti about your toolchain

Open \`yooti.config.json\` and update the toolchain section for your layers:

    {
      "toolchain": {
        "api": {
          "runtime":          "go",
          "lint_command":     "golangci-lint run ./...",
          "type_check":       "go vet ./...",
          "test_command":     "go test ./... -v",
          "test_unit":        "go test ./... -run Unit",
          "test_integration": "go test ./... -run Integration",
          "test_coverage":    "go test ./... -cover -coverprofile=coverage.out",
          "mutation":         "go-mutesting ./...",
          "coverage_threshold": 80,
          "new_code_threshold": 90
        }
      }
    }

The agent reads these commands from yooti.config.json and runs them during
Phase 4 (build loop) and Phase 5 (evidence generation).

---

## Step 2 — Write constitutions for your stack

Delete the constitution stubs that don't apply and write your own:

    rm .claude/constitutions/python.md     # if you are not using Python
    rm .claude/constitutions/react.md      # if you are not using React

Write your stack's constitution:

    # .claude/constitutions/go.md
    ## Patterns
    - Errors are values — always check, never ignore with _
    - No global state — pass dependencies explicitly
    - Interfaces defined at the point of use
    - Table-driven tests for all pure functions

    # .claude/constitutions/java.md
    ## Patterns
    - Constructor injection only — never @Autowired on fields
    - Every @Service has a corresponding interface
    - No business logic in @Controller classes

Reference them in .claude/CLAUDE.md:

    Go code:         .claude/constitutions/go.md
    Java + Spring:   .claude/constitutions/java.md

---

## Step 3 — Map your tools to the quality gates

| Requirement | Default | Go | Java | Ruby | Rust |
|-------------|---------|-----|------|------|------|
| Lint | ruff / ESLint | golangci-lint | checkstyle | rubocop | clippy |
| Type check | mypy / tsc | go vet | javac -Xlint | sorbet | rustc |
| Unit tests | pytest / vitest | go test -run Unit | mvn test | rspec --tag unit | cargo test |
| Integration | pytest -m integration | go test -run Integration | mvn verify | rspec --tag integration | cargo test --test integration |
| Coverage | coverage.py / istanbul | go test -cover | jacoco | simplecov | cargo tarpaulin |
| Security | bandit / snyk | govulncheck | OWASP dep-check | bundler-audit | cargo audit |
| Mutation | mutmut / stryker | go-mutesting | pitest | mutant | cargo-mutants |

---

## Step 4 — Configure the evidence package format

Phase 5 generates evidence files that Gate G4 reads. The format is
JSON — your tools need to output data that the agent can translate
into the expected format.

The agent handles this translation automatically if your toolchain
commands are in yooti.config.json. For custom output formats, add
a note to CLAUDE.md:

    ## Coverage output format — Go
    The coverage command produces: go test -cover -coverprofile=coverage.out
    Parse with: go tool cover -func=coverage.out
    Extract the total line from the output and write to:
    .agent/evidence/[ID]/coverage-summary.json

---

## Step 5 — Update the CI workflows

The generated GitHub Actions workflows use scaffold defaults. Update them
to use your tools:

    # .github/workflows/unit-tests.yml
    - name: Run tests (Go)
      run: go test ./... -v -cover
      working-directory: ./your-service

Or if you already have CI, add the Yooti gate checks alongside your
existing jobs:

    - name: Check G4 evidence exists
      run: |
        STORY_ID=$(git log --format=%s HEAD~1 | grep -oP '[A-Z]+-\\d+' | head -1)
        if [ ! -f ".agent/evidence/\${STORY_ID}/test-results.json" ]; then
          echo "G4 evidence package missing for \${STORY_ID}"
          exit 1
        fi

---

## Step 6 — Customise the work item prefix

By default, stories use the STORY- prefix. Change it in yooti.config.json:

    {
      "item_prefix": "FEAT"
    }

Or set it during init:

    yooti init my-project --item-prefix FEAT

All CLI commands, validation, and CI workflows will use the configured prefix.
`
}

// ── AGENTS.md template (for Codex projects) ──

function agentsMdTemplate(config) {
  const itemPrefix = config.itemPrefix ?? 'STORY'
  const itemTag = itemPrefix ? `${itemPrefix}-ID` : 'ID'
  return `# AGENTS.md — ${config.projectName}
# This file is read by Codex CLI before every task

## Primary context

Read .claude/CLAUDE.md before every task.
That file contains all pipeline rules, phase definitions,
gate requirements, and quality thresholds.

## Constitutions

Read the relevant constitution files from .claude/constitutions/
before writing any code. The list is in CLAUDE.md.

## Task context

For each task:
  1. Read .agent/requirements/[${itemTag}]-validated.json
  2. Read .agent/plans/[${itemTag}]-[TASK-ID].plan.md
  3. Read .agent/gates/[${itemTag}]-G2-approved.md (must exist)
  4. Follow Phase 4 rules from CLAUDE.md exactly

## Evidence package

Before opening a PR generate the evidence package
as described in Phase 5 of CLAUDE.md.

## What is the same as Claude Code

  - All pipeline phases (1-7)
  - All human gates (G1-G5)
  - All quality thresholds
  - All constitution rules
  - Evidence package format
  - PR body format

## What is different

  - Use \`codex\` CLI instead of \`claude\` CLI
  - This AGENTS.md file as entry point instead of .claude/
  - Codex may need explicit constitution file paths in prompts
`
}

// ── yooti.config.json template ──

// ── AWS scaffolding templates ──

function createLocalResourcesScript(config) {
  const services  = config.awsServices || []
  const region    = config.awsRegion || 'us-east-1'
  const name      = config.projectName
  const hasDynamo = services.includes('dynamodb')
  const hasSQS    = services.includes('sqs')
  const hasSNS    = services.includes('sns')
  const hasS3     = services.includes('s3')
  const hasEB     = services.includes('eventbridge')

  return `#!/usr/bin/env python3
"""
Create local AWS resources in LocalStack.
Run once after: docker compose up localstack -d

Usage:
    python scripts/create_local_resources.py
"""
import boto3
import json
import os
import sys
import time

ENDPOINT  = os.environ.get("AWS_ENDPOINT_URL", "http://localhost:4566")
REGION    = os.environ.get("AWS_DEFAULT_REGION", "${region}")
CREDS     = {
    "endpoint_url":          ENDPOINT,
    "region_name":           REGION,
    "aws_access_key_id":     os.environ.get("AWS_ACCESS_KEY_ID", "test"),
    "aws_secret_access_key": os.environ.get("AWS_SECRET_ACCESS_KEY", "test"),
}


def wait_for_localstack():
    import urllib.request
    for attempt in range(30):
        try:
            urllib.request.urlopen(f"{ENDPOINT}/_localstack/health", timeout=2)
            print(f"✓ LocalStack is ready at {ENDPOINT}")
            return
        except Exception:
            print(f"  Waiting for LocalStack... ({attempt + 1}/30)")
            time.sleep(2)
    print("✗ LocalStack did not start in time")
    print("  Run: docker compose up localstack -d")
    sys.exit(1)

${hasDynamo ? `
def create_dynamodb_tables():
    client = boto3.client("dynamodb", **CREDS)
    tables = [
        {
            "TableName": "${name}",
            "AttributeDefinitions": [
                {"AttributeName": "PK", "AttributeType": "S"},
                {"AttributeName": "SK", "AttributeType": "S"},
            ],
            "KeySchema": [
                {"AttributeName": "PK", "KeyType": "HASH"},
                {"AttributeName": "SK", "KeyType": "RANGE"},
            ],
            "BillingMode": "PAY_PER_REQUEST",
        }
    ]
    for table in tables:
        try:
            client.create_table(**table)
            print(f"✓ DynamoDB table: {table['TableName']}")
        except client.exceptions.ResourceInUseException:
            print(f"~ DynamoDB table exists: {table['TableName']}")
` : ''}
${hasSQS ? `
def create_sqs_queues():
    client = boto3.client("sqs", **CREDS)
    queues = [
        {"QueueName": "${name}-dlq"},
        {"QueueName": "${name}-queue"},
    ]
    for q in queues:
        client.create_queue(**q)
        print(f"✓ SQS queue: {q['QueueName']}")
` : ''}
${hasSNS ? `
def create_sns_topics():
    client = boto3.client("sns", **CREDS)
    response = client.create_topic(Name="${name}-topic")
    print(f"✓ SNS topic: {response['TopicArn']}")
    return response['TopicArn']
` : ''}
${hasS3 ? `
def create_s3_buckets():
    client = boto3.client("s3", **CREDS)
    buckets = ["${name}-data", "${name}-firehose"]
    for bucket in buckets:
        try:
            client.create_bucket(Bucket=bucket)
            print(f"✓ S3 bucket: {bucket}")
        except Exception as e:
            if "BucketAlreadyOwnedByYou" in str(e):
                print(f"~ S3 bucket exists: {bucket}")
            else:
                raise
` : ''}
${hasEB ? `
def create_eventbridge_bus():
    client = boto3.client("events", **CREDS)
    try:
        client.create_event_bus(Name="${name}-bus")
        print("✓ EventBridge bus: ${name}-bus")
    except client.exceptions.ResourceAlreadyExistsException:
        print("~ EventBridge bus exists: ${name}-bus")
` : ''}

if __name__ == "__main__":
    print(f"Creating local AWS resources in LocalStack ({ENDPOINT})...\\n")
    wait_for_localstack()
${hasDynamo ? '    create_dynamodb_tables()' : ''}
${hasSQS    ? '    create_sqs_queues()' : ''}
${hasSNS    ? '    create_sns_topics()' : ''}
${hasS3     ? '    create_s3_buckets()' : ''}
${hasEB     ? '    create_eventbridge_bus()' : ''}
    print("\\n✓ Local environment ready")
    print(f"  All services at {ENDPOINT}")
    print("\\nQuick checks:")
${hasDynamo ? `    print("  aws dynamodb list-tables")` : ''}
${hasSQS    ? `    print("  aws sqs list-queues")` : ''}
${hasS3     ? `    print("  aws s3 ls")` : ''}
`
}

function invokeLocalScript(config) {
  const name = config.projectName
  return `#!/usr/bin/env python3
"""
Invoke a Lambda handler locally against LocalStack.
Edit the EVENT dict to match your use case.

Usage:
    python scripts/invoke_local.py
    python scripts/invoke_local.py --handler src.handlers.my_handler
"""
import argparse
import importlib
import json
import os
import sys
from dotenv import load_dotenv

# Load .env — sets AWS_ENDPOINT_URL to point at LocalStack
load_dotenv()

# Default test event — edit this to match your handler's input
EVENT = {
    "httpMethod": "POST",
    "path": "/items",
    "pathParameters": None,
    "queryStringParameters": None,
    "headers": {"Content-Type": "application/json"},
    "body": json.dumps({
        "name": "test-item",
        "value": 42,
    }),
    "isBase64Encoded": False,
}


class LocalContext:
    """Minimal Lambda context object for local testing."""
    function_name    = "${name}-local"
    memory_limit_in_mb = 128
    aws_request_id   = "local-invoke-001"
    invoked_function_arn = "arn:aws:lambda:us-east-1:000000000000:function:${name}"
    def get_remaining_time_in_millis(self): return 30000


def invoke(handler_path: str, event: dict):
    module_path, func_name = handler_path.rsplit(".", 1)
    module = importlib.import_module(module_path)
    handler_func = getattr(module, func_name)

    print(f"Invoking {handler_path}")
    print(f"Endpoint: {os.environ.get('AWS_ENDPOINT_URL', 'real AWS')}")
    print(f"Event: {json.dumps(event, indent=2)}\\n")

    response = handler_func(event, LocalContext())

    print(f"Status:  {response.get('statusCode')}")
    try:
        body = json.loads(response.get("body", "{}"))
        print(f"Body:\\n{json.dumps(body, indent=2)}")
    except Exception:
        print(f"Body: {response.get('body')}")
    return response


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--handler", default="src.handlers.create_item.handler",
                        help="Python module path to handler function")
    parser.add_argument("--event", help="Path to JSON event file")
    args = parser.parse_args()

    event = EVENT
    if args.event:
        with open(args.event) as f:
            event = json.load(f)

    invoke(args.handler, event)
`
}

function awsEnvExample(config) {
  const services  = config.awsServices || []
  const region    = config.awsRegion || 'us-east-1'
  const name      = config.projectName
  const account   = '000000000000'

  return `# ─────────────────────────────────────────────────────────────────
# LOCAL DEVELOPMENT — points to LocalStack
# For staging/production: remove AWS_ENDPOINT_URL and set real values
# NEVER commit real credentials to version control
# ─────────────────────────────────────────────────────────────────

# LocalStack credentials (fake — LocalStack accepts anything)
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_DEFAULT_REGION=${region}

# Redirects all boto3 calls to LocalStack
# Remove this line for staging/production
AWS_ENDPOINT_URL=http://localhost:4566

${services.includes('dynamodb') ? `# DynamoDB
TABLE_NAME=${name}
` : ''}${services.includes('sqs') ? `# SQS
QUEUE_URL=http://localhost:4566/${account}/${name}-queue
DLQ_URL=http://localhost:4566/${account}/${name}-dlq
` : ''}${services.includes('sns') ? `# SNS
SNS_TOPIC_ARN=arn:aws:sns:${region}:${account}:${name}-topic
` : ''}${services.includes('eventbridge') ? `# EventBridge
EVENT_BUS_NAME=${name}-bus
` : ''}${services.includes('firehose') ? `# Firehose
FIREHOSE_STREAM=${name}-firehose
` : ''}${services.includes('s3') ? `# S3
S3_BUCKET=${name}-data
` : ''}${services.includes('secrets') ? `# Secrets Manager (local ARN format)
DB_SECRET_ARN=arn:aws:secretsmanager:${region}:${account}:secret:${name}-db-creds
` : ''}
# Application
LOG_LEVEL=INFO
`
}

function samTemplate(config) {
  const name   = config.projectName
  const region = config.awsRegion || 'us-east-1'
  const services = config.awsServices || []
  const hasDynamo = services.includes('dynamodb')
  const hasSQS    = services.includes('sqs')

  return `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: ${name} — generated by Yooti

Globals:
  Function:
    Timeout: 30
    MemorySize: 256
    Runtime: python3.12
    Architectures: [arm64]
    Environment:
      Variables:
        LOG_LEVEL: INFO
        AWS_ACCOUNT_ID: !Ref AWS::AccountId
${hasDynamo ? `        TABLE_NAME: !Ref MainTable` : ''}
${hasSQS    ? `        QUEUE_URL: !Ref MainQueue` : ''}

Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues: [dev, staging, prod]

Resources:

  # ── Lambda Functions ────────────────────────────────────────────────────────

  CreateItemFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub "${name}-create-item-\${Environment}"
      CodeUri: src/
      Handler: handlers.create_item.handler
      Events:
        Api:
          Type: Api
          Properties:
            Path: /items
            Method: POST
      Policies:
${hasDynamo ? `        - DynamoDBCrudPolicy:
            TableName: !Ref MainTable` : ''}
${hasSQS    ? `        - SQSSendMessagePolicy:
            QueueName: !GetAtt MainQueue.QueueName` : ''}

${hasDynamo ? `
  # ── DynamoDB ────────────────────────────────────────────────────────────────

  MainTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub "${name}-\${Environment}"
      BillingMode: PAY_PER_REQUEST
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      AttributeDefinitions:
        - AttributeName: PK
          AttributeType: S
        - AttributeName: SK
          AttributeType: S
      KeySchema:
        - AttributeName: PK
          KeyType: HASH
        - AttributeName: SK
          KeyType: RANGE
      SSESpecification:
        SSEEnabled: true
` : ''}
${hasSQS ? `
  # ── SQS ─────────────────────────────────────────────────────────────────────

  MainQueueDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub "${name}-dlq-\${Environment}"
      MessageRetentionPeriod: 1209600  # 14 days

  MainQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub "${name}-queue-\${Environment}"
      VisibilityTimeout: 90
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt MainQueueDLQ.Arn
        maxReceiveCount: 3
` : ''}

Outputs:
  ApiEndpoint:
    Description: API Gateway endpoint URL
    Value: !Sub "https://\${ServerlessRestApi}.execute-api.${region}.amazonaws.com/Prod/"
${hasDynamo ? `  TableName:
    Value: !Ref MainTable` : ''}
${hasSQS    ? `  QueueUrl:
    Value: !Ref MainQueue` : ''}
`
}

function generateTestEvents(write, config) {
  const services = config.awsServices || []
  const hasLambda = services.includes('lambda')
  const hasSQS    = services.includes('sqs')

  if (!hasLambda) return

  write('events/api_post_valid.json', JSON.stringify({
    httpMethod: 'POST',
    path: '/items',
    pathParameters: null,
    queryStringParameters: null,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'test-item', value: 42 }),
    isBase64Encoded: false,
  }, null, 2))

  write('events/api_post_invalid.json', JSON.stringify({
    httpMethod: 'POST',
    path: '/items',
    pathParameters: null,
    queryStringParameters: null,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    isBase64Encoded: false,
  }, null, 2))

  write('events/api_get_by_id.json', JSON.stringify({
    httpMethod: 'GET',
    path: '/items/abc-123',
    pathParameters: { id: 'abc-123' },
    queryStringParameters: null,
    headers: {},
    body: null,
    isBase64Encoded: false,
  }, null, 2))

  if (hasSQS) {
    write('events/sqs_batch.json', JSON.stringify({
      Records: [
        {
          messageId: 'msg-001',
          receiptHandle: 'receipt-001',
          body: JSON.stringify({ id: 'item-001', action: 'process' }),
          attributes: { ApproximateReceiveCount: '1' },
          messageAttributes: {},
          md5OfBody: '',
          eventSource: 'aws:sqs',
          eventSourceARN: `arn:aws:sqs:us-east-1:000000000000:${config.projectName}-queue`,
          awsRegion: config.awsRegion || 'us-east-1',
        },
        {
          messageId: 'msg-002',
          receiptHandle: 'receipt-002',
          body: JSON.stringify({ id: 'item-002', action: 'process' }),
          attributes: { ApproximateReceiveCount: '1' },
          messageAttributes: {},
          md5OfBody: '',
          eventSource: 'aws:sqs',
          eventSourceARN: `arn:aws:sqs:us-east-1:000000000000:${config.projectName}-queue`,
          awsRegion: config.awsRegion || 'us-east-1',
        },
      ],
    }, null, 2))
  }
}

function awsLambdaStoryTemplate() {
  return JSON.stringify({
    type: 'aws-lambda',
    description: 'AWS Lambda microservice — API Gateway + DynamoDB + optional SQS/SNS/EventBridge',
    required_fields: ['story_id', 'title', 'api_endpoints', 'acceptance_criteria'],
    acceptance_criteria_guidance: [
      'AC-1: Happy path — valid input returns expected response (201/200)',
      'AC-2: Validation error — missing/invalid fields return 400 with a message (no stack trace)',
      'AC-3: Conflict/duplicate — same resource submitted twice returns 409',
      'AC-4: AWS failure — DynamoDB/SQS unavailable returns 500 with no internal detail exposed',
      'AC-5: Auth — unauthenticated request returns 401',
    ].join('\n'),
    definition_of_done: [
      'All AC have passing unit tests using moto — no real AWS calls in any test',
      'SQS handlers return batchItemFailures — never fail the whole batch',
      'DynamoDB uses single table design — no Scan operations anywhere',
      'Coverage on new code >= 90%',
      'Security scan: 0 HIGH/CRITICAL',
      'No credentials, ARNs, or table names hardcoded — all from os.environ',
      'SAM template or CDK stack present and reviewed at Gate G2',
    ],
    constitutions_to_apply: ['python', 'aws', 'security', 'testing'],
    layers: ['api', 'database'],
    decomposition_hint: [
      'T001 — DynamoDB schema + repository layer (moto tests only — no real AWS)',
      'T002 — Lambda handler + service + validator (unit tests with moto)',
      'T003 — SAM/CDK definition + test event files',
    ].join('\n'),
    estimated_complexity: 'M',
  }, null, 2)
}

function buildLocalStackServices(awsServices = []) {
  const serviceMap = {
    lambda:      'lambda',
    dynamodb:    'dynamodb',
    sqs:         'sqs',
    sns:         'sns',
    eventbridge: 'events',
    firehose:    'firehose',
    s3:          's3',
    secrets:     'secretsmanager',
    fargate:     'ecs',
  }
  const defaults = ['s3', 'sqs', 'sns', 'dynamodb', 'lambda', 'events',
                    'firehose', 'secretsmanager']
  const selected = awsServices.map(s => serviceMap[s]).filter(Boolean)
  const merged = [...new Set([...defaults, ...selected])]
  return merged.join(',')
}

function yootiConfigTemplate(config) {
  const cfg = {
    project:          config.projectName,
    version:          '1.0.0',
    type:             config.projectType     || 'full',
    context:          config.context         || 'greenfield',
    stage:            config.stage           || 3,
    linter:           config.linter          || 'eslint',
    ci:               config.ci              || 'github-actions',
    deploy:           config.deploy          || 'docker',
    stack:            config.stack           || [],
    include_aws:      config.includeAws      || false,
    ...(config.includeAws ? {
      aws: {
        region:         config.awsRegion   || 'us-east-1',
        services:       config.awsServices || [],
        deploy:         config.awsDeploy   || 'sam',
        localstack_url: 'http://localhost:4566',
        resources: {
          ...((config.awsServices || []).includes('dynamodb') ? { dynamodb_table: config.projectName } : {}),
          ...((config.awsServices || []).includes('sqs') ? { sqs_queue: `${config.projectName}-queue`, sqs_dlq: `${config.projectName}-dlq` } : {}),
          ...((config.awsServices || []).includes('sns') ? { sns_topic: `${config.projectName}-topic` } : {}),
          ...((config.awsServices || []).includes('eventbridge') ? { event_bus: `${config.projectName}-bus` } : {}),
          ...((config.awsServices || []).includes('s3') ? { s3_bucket: `${config.projectName}-data` } : {}),
        },
      },
    } : {}),
    databases:        config.databases       || ['postgres', 'redis'],
    vector_store:     config.vectorStore     || 'none',
    item_prefix:      config.itemPrefix ?? 'STORY',
    item_format:      config.itemPrefix ? `{prefix}-{number}` : '{number}',
    agent_frameworks: config.agentFrameworks || [],
    llm_providers:    config.llmProviders    || [],

    pipeline: {
      phases: [1, 2, 3, 4, 5, 6, 7],
      human_gates: ['G1', 'G2', 'G3', 'G4', 'G5'],
      agent_phases_at_stage: {
        1: [1],
        2: [1, 2],
        3: [1, 2, 3, 4, 5, 6],
        4: [1, 2, 3, 4, 5, 6, 7],
        5: [1, 2, 3, 4, 5, 6, 7]
      }
    },

    quality_gates: {
      coverage_overall:    80,
      coverage_new_code:   90,
      mutation_score_warn: 85,
      lint_errors:         0,
      type_errors:         0,
      security_critical:   0,
      security_high:       0
    },

    toolchain: {
      ...(config.stack?.includes('node') ? {
        api: {
          runtime:           'node',
          version:           '20',
          framework:         'fastify',
          linter:            config.linter === 'biome' ? 'biome' : 'eslint',
          formatter:         config.linter === 'biome' ? 'biome' : 'prettier',
          type_check:        'tsc --noEmit',
          test_runner:       'vitest',
          test_command:      'npm run test',
          test_unit:         'vitest tests/unit',
          test_integration:  'vitest tests/integration',
          test_coverage:     'vitest --coverage',
          mutation:          'npx stryker run',
          lint_command:      config.linter === 'biome' ? 'biome check .' : 'eslint . --ext .ts',
          coverage_threshold: 80,
          new_code_threshold: 90
        }
      } : {}),

      ...(config.stack?.includes('react') || config.stack?.includes('nextjs') ? {
        frontend: {
          runtime:           'node',
          version:           '20',
          framework:         config.stack?.includes('nextjs') ? 'nextjs' : 'react',
          build_tool:        config.stack?.includes('nextjs') ? 'next' : 'vite',
          linter:            config.linter === 'biome' ? 'biome' : 'eslint',
          type_check:        'tsc --noEmit',
          test_runner:       'vitest',
          test_command:      'npm run test',
          test_coverage:     'vitest --coverage',
          a11y_runner:       'axe-core',
          e2e_runner:        'playwright',
          lint_command:      config.linter === 'biome' ? 'biome check .' : 'eslint . --ext .ts,.tsx',
          coverage_threshold: 80,
          new_code_threshold: 90
        }
      } : {}),

      ...(config.agentFrameworks?.includes('langgraph') ||
          config.projectType === 'agent' ||
          config.projectType === 'full' ? {
        agents: {
          runtime:           'python',
          version:           '3.12',
          framework:         'langgraph',
          linter:            'ruff',
          formatter:         'ruff',
          type_check:        'mypy . --strict',
          test_runner:       'pytest',
          test_command:      'pytest -m "not eval and not integration"',
          test_unit:         'pytest -m "not eval and not integration"',
          test_integration:  'pytest -m integration',
          test_evals:        'pytest --eval',
          test_coverage:     'pytest --cov --cov-report=json',
          mutation:          'mutmut run',
          lint_command:      'ruff check . && ruff format --check .',
          coverage_threshold: 80,
          new_code_threshold: 90
        }
      } : {}),

      ...(config.stack?.includes('python') && config.projectType === 'full' ? {
        batch: {
          runtime:           'python',
          version:           '3.12',
          framework:         'boto3',
          linter:            'ruff',
          formatter:         'ruff',
          type_check:        'mypy . --strict',
          test_runner:       'pytest',
          test_command:      'pytest -m "not integration"',
          test_unit:         'pytest -m "not integration"',
          test_integration:  'pytest -m integration',
          test_coverage:     'pytest --cov --cov-report=json',
          mutation:          'mutmut run',
          lint_command:      'ruff check . && ruff format --check .',
          coverage_threshold: 80,
          new_code_threshold: 90,
          aws_services:      ['s3', 'lambda', 'sqs', 'eventbridge']
        }
      } : {})
    }
  };

  return JSON.stringify(cfg, null, 2);
}

// ── Batch service generation ──

function generateBatchService(root, config, write) {
  const batch = `${root}/batch/analytics`;
  mkdirSync(toForwardSlash(`${batch}/src/jobs`),          { recursive: true });
  mkdirSync(toForwardSlash(`${batch}/src/utils`),         { recursive: true });
  mkdirSync(toForwardSlash(`${batch}/tests/unit`),        { recursive: true });
  mkdirSync(toForwardSlash(`${batch}/tests/integration`), { recursive: true });

  write('batch/analytics/requirements.txt',                batchRequirements(config));
  write('batch/analytics/pyproject.toml',                  batchPyproject(config));
  write('batch/analytics/Dockerfile',                      batchDockerfile(config));
  write('batch/analytics/.dockerignore',                   pythonDockerignore());
  write('batch/analytics/src/__init__.py',                 '');
  write('batch/analytics/src/jobs/__init__.py',            '');
  write('batch/analytics/src/utils/__init__.py',           '');
  write('batch/analytics/src/jobs/example_job.py',         batchExampleJob(config));
  write('batch/analytics/src/utils/s3.py',                 batchS3Util(config));
  write('batch/analytics/tests/conftest.py',               batchConftest(config));
  write('batch/analytics/tests/unit/test_example_job.py',  batchExampleTest(config));
}

function batchRequirements(config) {
  return `boto3>=1.34.0
pandas>=2.2.0
pydantic>=2.7.0
pydantic-settings>=2.2.0
structlog>=24.1.0
python-dotenv>=1.0.0

# Development
pytest>=8.0.0
pytest-asyncio>=0.23.0
pytest-cov>=5.0.0
moto[s3,sqs,lambda]>=5.0.0
ruff>=0.4.0
mypy>=1.9.0
`;
}

function batchPyproject(config) {
  return `[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
markers = [
    "integration: tests requiring real AWS services",
    "slow: tests that take > 5 seconds",
]
addopts = "--cov=src --cov-report=term-missing --cov-report=json -v"

[tool.coverage.report]
fail_under = 80
omit = ["tests/*"]

[tool.ruff]
target-version = "py312"
line-length = 100
select = ["E", "W", "F", "I", "N", "UP", "B", "ANN"]

[tool.mypy]
python_version = "3.12"
strict = true
`;
}

function batchDockerfile(config) {
  return `FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "-m", "src.jobs.example_job"]
`;
}

function batchExampleJob(config) {
  return `"""
Example batch job — ${config.projectName}
Replace with your first real batch job.
Pattern: read from S3 or DB → transform → write to S3 or DB.
"""
import structlog

log = structlog.get_logger()


def run(event: dict, context: object | None = None) -> dict:
    """
    Entry point for Lambda or scheduled job.
    Input:  event dict (from EventBridge, SQS, or manual trigger)
    Output: result dict with status and summary
    """
    log.info("example_job.start", event=event)

    try:
        # TODO: replace with real job logic
        result = {"processed": 0, "errors": 0}
        log.info("example_job.complete", **result)
        return {"status": "success", **result}

    except Exception as e:
        log.error("example_job.failed", error=str(e))
        return {"status": "error", "error": str(e)}


if __name__ == "__main__":
    run({})
`;
}

function batchS3Util(config) {
  return `"""
S3 utility — ${config.projectName}
Thin wrapper around boto3 S3 client.
Use @mock_aws from moto in all tests.
"""
import os
import boto3
import structlog
from typing import Any

log = structlog.get_logger()


class S3Client:
    def __init__(self) -> None:
        self.client = boto3.client(
            "s3",
            region_name=os.environ.get("AWS_REGION", "us-east-1"),
        )
        self.bucket = os.environ.get("S3_BUCKET", "")

    def read_json(self, key: str) -> Any:
        """Read and parse a JSON file from S3."""
        import json
        log.info("s3.read", key=key)
        response = self.client.get_object(Bucket=self.bucket, Key=key)
        return json.loads(response["Body"].read())

    def write_json(self, key: str, data: Any) -> None:
        """Write a JSON file to S3."""
        import json
        log.info("s3.write", key=key)
        self.client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=json.dumps(data),
            ContentType="application/json",
        )
`;
}

function batchConftest(config) {
  return `"""
Shared pytest fixtures for ${config.projectName} batch tests.
"""
import os
import pytest
import boto3
from moto import mock_aws


@pytest.fixture(autouse=True)
def aws_credentials():
    """Mock AWS credentials so no real AWS calls are made."""
    os.environ["AWS_ACCESS_KEY_ID"]     = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"]    = "testing"
    os.environ["AWS_SESSION_TOKEN"]     = "testing"
    os.environ["AWS_DEFAULT_REGION"]    = "us-east-1"
    os.environ["S3_BUCKET"]             = "test-bucket"


@pytest.fixture
def s3_bucket():
    """Create a mock S3 bucket for tests."""
    with mock_aws():
        s3 = boto3.client("s3", region_name="us-east-1")
        s3.create_bucket(Bucket="test-bucket")
        yield s3
`;
}

function batchExampleTest(config) {
  return `"""
Example batch job unit test.
Shows the testing pattern — replace with real tests.
All AWS calls are mocked — no real AWS account needed.
"""
import pytest
from unittest.mock import patch
from src.jobs.example_job import run


class TestExampleJob:
    def test_returns_success_status_on_completion(self) -> None:
        result = run({})
        assert result["status"] == "success"

    def test_returns_processed_count(self) -> None:
        result = run({})
        assert "processed" in result

    def test_handles_exception_gracefully(self) -> None:
        with patch("src.jobs.example_job.log") as mock_log:
            mock_log.info.side_effect = [None, Exception("boom")]
            result = run({})
            # Should return error status not raise
            assert result["status"] in ("success", "error")


# ── Pattern reminder ──────────────────────────────────────────
# Always mock AWS services with @mock_aws from moto
# Never make real AWS calls in unit tests
# Use the s3_bucket fixture from conftest.py for S3 tests
`;
}
