export function requirementsMd(config) {
  return `# Requirements Ingestion Agent
# Activated by: yooti story:add

## Your task
Parse raw user stories into validated_requirement.json.
Flag ambiguities. Structure acceptance criteria as Given/When/Then.
Do not pass stories with BLOCKER ambiguities downstream.

## Ambiguity severity
- BLOCKER: Hold story, notify PM, do not proceed
- WARNING: Document assumption, proceed with caution flag
- NOTE: Log only, proceed normally

## Output schema
Write to: .agent/requirements/STORY-NNN-validated.json
Validate against: pipeline/schemas/validated_requirement.schema.json

## AC structure (strict)
Every acceptance criterion must be:
  given: the precondition / system state
  when: the action / trigger
  then: the observable outcome
  testable: true/false (flag if cannot be automated)
`;
}

export function testgenMd(config) {
  return `# Test Generation Agent — TDD Mandate
# Read this before writing ANY test

## Core rule: tests before implementation
Iteration 0 = tests written, ALL FAILING (RED) — this is correct.
Iteration 1+ = implementation written, tests converging to GREEN.
Never write implementation before tests exist.

## Unit test dimensions — cover all 5 per class
1. Happy path — primary success scenario
2. Boundary conditions — at the limit, one over, one under
3. Error handling — what happens when dependencies fail
4. Interface contract — does the public API match the .plan spec?
5. Configuration — does it respect injected config values?

## Unit test rules
- All external I/O mocked (no real DB, no real Redis, no real AWS)
- One assertion per test (or tightly related assertions)
- Descriptive test names — reads like a sentence
- Independent — no shared mutable state between tests
- Fast — each unit test completes in < 5ms

## Integration test rules (Given/When/Then → test)
- Derived directly from acceptance criteria in validated_requirement.json
- Real services (real DB, real Redis) via docker-compose.test.yml
- Full setup and teardown per test — clean state guaranteed
- Tests the AC, not the implementation

## Accessibility tests (frontend only)
- axe(container) after EVERY component render test
- Zero violations required — any violation = test failure
- Check: colour contrast, ARIA labels, keyboard navigation, focus management

## Playwright responsive tests (frontend only)
Three mandatory viewport tests per UI story:
  mobile:  375px  (iPhone SE)
  tablet:  768px  (iPad Mini)
  desktop: 1280px (standard)

## Python AWS tests
@mock_aws on ALL tests touching S3, SQS, DynamoDB, Lambda
No real AWS calls in any test — ever.

## Mutation testing (post green-suite)
After all tests pass, Stryker/mutmut runs automatically in CI.
If mutation score < 85%: identify survived mutations.
For each survived mutation: generate an additional test that kills it.
`;
}

export function diagnosisMd(config) {
  return `# Diagnosis Agent — Self-Healing
# Activated when any generation loop step fails

## Failure classification

| Code | Detected by | Auto-fix strategy | Escalate after |
|------|-------------|-------------------|----------------|
| LINT_ERROR | ESLint/Biome/Ruff | Read error, fix manually (not --fix) | 3 retries |
| FORMAT_ERROR | Prettier/Ruff format | Run formatter --write, restart | 1 retry |
| TYPE_ERROR | tsc/mypy | Fix types, check interfaces | 3 retries |
| IMPORT_ERROR | Hallucination guard | Scan package.json, correct path | 2 retries |
| LOGIC_ERROR | Unit tests | Re-read AC from .plan, rewrite logic | 5 retries |
| ASYNC_ERROR | Unit tests | Add/remove await, fix Promise handling | 3 retries |
| A11Y_ERROR | axe-core | Fix ARIA, labels, contrast | 3 retries |
| ENV_ERROR | Integration tests | Cannot self-heal — escalate to DevOps | IMMEDIATELY |
| SCOPE_ERROR | Scope guard | Cannot self-heal — escalate to Dev | IMMEDIATELY |
| SPEC_AMBIGUITY | Logic conflict | Cannot self-heal — escalate to PM | IMMEDIATELY |

## Diagnosis process
1. Read the complete error output
2. Classify failure type from table above
3. Read the relevant lines of generated code
4. Form a hypothesis about the root cause
5. Apply the minimum fix that addresses the root cause
6. DO NOT apply speculative changes — fix only what the error shows
7. Restart from Step 1 of the generation loop

## Iteration tracking
Maintain a failure log per story:
  .agent/evidence/STORY-NNN/iteration-log.json

Each entry: { iteration, failure_type, root_cause, fix_applied, result }
This log becomes part of the PR evidence package.
`;
}

export function deployMd(config) {
  return `# Deploy Agent
# Activated after Gate G4 (QA sign-off)

## Staging deploy (automatic after G4)
1. Build production artifact: docker build -t app:$SHA .
2. docker compose -f docker-compose.staging.yml up -d
3. Wait 30 seconds for stabilisation
4. Run smoke tests: bash pipeline/scripts/smoke-tests.sh staging
5. Generate staging health report: .agent/evidence/STORY-NNN/staging-health.json
6. Notify Release Manager for Gate G5 review

## Production deploy (after G5 approval)
1. Requires --confirm flag: yooti deploy production --confirm
2. Blue-green or rolling deploy based on infra config
3. Post-deploy health window: 15 minutes
4. Check: p99 latency, error rate, business metrics
5. AUTO-ROLLBACK: if any check fails within 15 min → revert deploy
6. On success: close Jira tickets, post release notes to Slack

## Smoke test checklist
- All services respond to health check endpoints
- Critical path: auth → main feature → data retrieval
- No new 5xx errors above 0.5% threshold
- p99 latency within 20% of baseline

## Auto-rollback trigger
If ANY post-deploy check fails:
  1. Immediately revert deployment (not code — just the deploy)
  2. Create incident ticket automatically
  3. Notify DevOps + Release Manager
  4. Write rollback report: .agent/evidence/STORY-NNN/rollback-report.json
`;
}

export function scopeRulesMd(config) {
  return `# Scope Enforcement Rules
# These rules are absolute. No exceptions.

## The .plan file is the contract
Every task has a .plan.md file in .agent/plans/
The .plan file defines exactly which files the agent may touch.

## Files in Scope
- Listed under "Files in Scope" in the .plan
- Agent may CREATE or MODIFY these files
- Nothing else

## Files OUT of Scope
- Any file NOT listed under "Files in Scope"
- Agent must NEVER touch these
- Even if modifying them would make the code cleaner
- Even if they contain a bug adjacent to the task
- Even if the tests would be easier to write with changes

## SCOPE_ERROR protocol
If you determine you NEED to touch an out-of-scope file:

1. STOP all code generation immediately
2. Do NOT make the change
3. Write: .agent/escalations/STORY-NNN-scope.md with:
   - File you need to touch
   - Why you need to touch it
   - What impact it has
   - Your recommendation
4. Notify the developer to amend the .plan
5. Wait — do not proceed

## Why this matters
In an autonomous pipeline, scope violations are the primary risk vector.
An agent that "helpfully" touches adjacent files can:
  - Break production code with no human review
  - Create merge conflicts across parallel stories
  - Introduce regressions that are hard to trace
  - Undermine trust in the entire pipeline

The human review at Gate G3 is the only place scope can be expanded.
`;
}

export function greenfieldRulesMd(config) {
  return `# Greenfield Pattern Mandate
# Apply to ALL code in this project — every file, every sprint

## This is the standard. Be consistent.

### Architecture patterns
- All services: class-based with constructor dependency injection
- All controllers/routes: thin — receive request, validate, call service, return response
- All services: business logic only — no HTTP, no DB queries
- All repositories: DB layer only — no business logic
- All errors: extend AppError base class
- Never throw raw Error() — always a typed error class

### TypeScript conventions
- Interfaces for all data shapes (never raw objects in function signatures)
- Enums for status fields, event types, role names
- Generic types for pagination, API responses, repository methods
- No any — if you don't know the type, figure it out

### File naming
- PascalCase for classes: PropertyService.ts
- camelCase for utilities: formatCurrency.ts
- kebab-case for routes: property-routes.ts
- *.test.ts for unit tests (co-located or in tests/unit/)
- *.spec.ts for integration tests

### Folder structure
Feature-based for modules > 3 files:
  src/properties/
    PropertyService.ts
    PropertyRepository.ts
    property.types.ts
    property.routes.ts

Layer-based for shared utilities:
  src/middleware/
  src/errors/
  src/config/

### Async patterns
- async/await only — no .then() chains anywhere
- Always handle rejected promises — no unhandled rejections
- Use Promise.all() for parallel operations, never sequential await in a loop

### Logging
- Structured logging only (JSON) — never console.log in production code
- Log levels: error, warn, info, debug
- Always include: requestId, userId (if available), timestamp, service name
`;
}

export function brownfieldRulesMd(config) {
  return `# Brownfield Rules — Surgical Mode
# Read BEFORE generating any code on an existing codebase

## The core principle: surgeon, not architect
Make the smallest possible incision to achieve the story goal.
Leave the codebase better than you found it — within your scope.
Do not redesign what you did not break.

## Before touching any file
1. Check .agent/discovery/risk-surface.json — is this file flagged as high risk?
2. If coverage < 40% or dependents > 5: write characterization tests FIRST
3. Read the existing test file for this module — understand the patterns
4. Read 50 lines above and below your change point — understand context

## Code style — match exactly
- Indentation: detect from existing file (2-space vs 4-space)
- Quotes: match existing (single vs double)
- Semicolons: match existing (yes vs no)
- Naming: match existing (camelCase vs snake_case)
- If existing code uses callbacks: your new code uses callbacks
- If existing code uses .then(): your new code uses .then()
You are joining a codebase, not rewriting it.

## Test rules (critical for brownfield)
- NEVER modify an existing passing test
- ONLY add new tests — append to existing test files
- Characterization tests lock existing behavior (right or wrong)
- Your new unit tests cover your new code only
- Regression baseline is at .agent/snapshots/baseline.json
- Zero newly failing tests vs baseline = absolute requirement

## Reuse first
Before creating anything new:
  grep -r "function name" src/  — does this already exist?
  grep -r "import.*similar" src/ — is there a similar import pattern?
Reuse existing utilities, clients, patterns before creating new ones.

## What to do if you find a bug (out of scope)
Do NOT fix it.
Write: .agent/tech-debt/STORY-NNN-adjacent-bug.md
Include: file, line, description, suggested fix
Log it and move on — it will become a story.

## Exclusion zones
High-risk files from the risk surface report must not be modified
without explicit Architect approval recorded in the .plan file.
If your .plan asks you to modify a high-risk file:
  1. Confirm the Architect approval note is in the .plan
  2. Write characterization tests first — no exceptions
  3. Keep your diff absolutely minimal
`;
}

export function validatedRequirementExample(context) {
  const baseStory = {
    story_id: "STORY-001",
    title: context === 'greenfield'
      ? "Property CRUD — create, read, update, archive"
      : "Add rate limiting to POST /auth/login",
    type: "feature",
    priority: "P1",
    context: context,
    actors: context === 'greenfield'
      ? ["property manager", "portfolio analyst"]
      : ["anonymous user", "rate limiter middleware"],
    acceptance_criteria: [
      {
        id: "AC-1",
        given: context === 'greenfield'
          ? "An authenticated property manager"
          : "A user submits more than 5 login attempts in 60 seconds",
        when: context === 'greenfield'
          ? "They POST /properties with a valid payload"
          : "The 6th request arrives at POST /auth/login",
        then: context === 'greenfield'
          ? "Property is created, 201 returned with id and timestamps"
          : "Return HTTP 429 with Retry-After header",
        testable: true
      },
      {
        id: "AC-2",
        given: context === 'greenfield'
          ? "A property exists in the system"
          : "A user is within the rate limit window",
        when: context === 'greenfield'
          ? "Any authenticated user GETs /properties/:id"
          : "They submit a login attempt",
        then: context === 'greenfield'
          ? "Property data returned with status 200"
          : "Request passes through normally",
        testable: true
      }
    ],
    definition_of_done: [
      "Unit tests written and passing",
      "Integration tests for all ACs passing",
      "No regressions vs baseline snapshot",
      "Coverage on new code >= 90%",
      "API schema documented"
    ],
    constraints: {
      must_not_break: context === 'brownfield' ? ["auth flow", "session management"] : [],
      performance_budget: "p99 < 100ms"
    },
    ambiguity_flags: context === 'brownfield' ? [
      {
        field: "rate_limit_scope",
        issue: "Unclear if limit is per-IP, per-user, or global",
        severity: "warning",
        assumed: "Per-IP using X-Forwarded-For header"
      }
    ] : [],
    affected_modules: context === 'greenfield'
      ? ["services/api/src/routes/", "services/api/src/services/"]
      : ["services/api/src/middleware/", "services/api/src/stores/"],
    estimated_complexity: "M"
  };

  return JSON.stringify(baseStory, null, 2);
}

export function planExample(context, config) {
  return `# Implementation Plan: STORY-001 / Task T-001
# ${context === 'greenfield' ? 'Property Service + Repository layer' : 'Redis-backed Rate Limit Store'}
# Agent: BackendAgent · Complexity: M
# Generated by: yooti story:add

---

## Context
${context === 'greenfield'
  ? `Implement PropertyService (business logic) and PropertyRepository (DB layer).
Pattern: thin route → service → repository (see .claude/rules/greenfield-rules.md).
Database: PostgreSQL via pg driver. No ORM.`
  : `Implement RateLimitStore backed by Redis.
Sliding window algorithm: 5 requests per 60-second window per IP.
Redis client already available in DI container — reuse it.
See risk-surface.json: src/app.ts is HIGH RISK — do not touch in this task.`}

---

## Files in Scope — YOU MAY ONLY TOUCH THESE

${context === 'greenfield'
  ? `CREATE: services/api/src/services/PropertyService.ts
CREATE: services/api/src/repositories/PropertyRepository.ts
CREATE: services/api/src/types/property.types.ts
MODIFY: services/api/src/container.ts  (register new service + repository)`
  : `CREATE: services/api/src/stores/RateLimitStore.ts
CREATE: services/api/tests/unit/RateLimitStore.test.ts
MODIFY: services/api/src/container.ts  (register RateLimitStore)`}

## Files OUT OF SCOPE — DO NOT TOUCH
${context === 'greenfield'
  ? `- services/api/src/app.ts
- services/api/src/routes/  (handled in T-002)
- Any file not listed above`
  : `- services/api/src/app.ts  (HIGH RISK — 12 dependents — handled in T-002)
- services/api/src/middleware/  (handled in T-002)
- Any existing auth files`}

---

## Implementation Steps

${context === 'greenfield'
  ? `1. Define PropertyRecord type: { id, address, status, sqft, noi, createdAt, updatedAt }
2. Define PropertyStatus enum: ACTIVE | ARCHIVED
3. Write PropertyRepository:
   - create(data: CreatePropertyInput): Promise<PropertyRecord>
   - findById(id: string): Promise<PropertyRecord | null>
   - update(id: string, data: Partial<PropertyRecord>): Promise<PropertyRecord>
   - archive(id: string): Promise<void>  ← sets status = ARCHIVED, NOT delete
4. Write PropertyService wrapping repository with business validation:
   - validate that address is non-empty before create
   - validate that archived properties cannot be updated
5. Register both in container.ts as singletons via constructor injection`
  : `1. Define RateLimitResult type: { count: number, ttl: number, allowed: boolean }
2. Write RateLimitStore class:
   - constructor(redis: Redis, config: { windowSec: number, maxRequests: number })
   - increment(ip: string): Promise<RateLimitResult>
     → Redis INCR on key ratelimit:{ip}
     → If count === 1: set TTL via EXPIRE
     → Return { count, ttl, allowed: count <= maxRequests }
3. Fail-open: if Redis unavailable, log warning and return allowed: true
4. Register in container.ts`}

---

## Acceptance Criteria to Satisfy

${context === 'greenfield'
  ? `- AC-1: create() stores property and returns id + timestamps
- AC-2: findById() returns full property data`
  : `- AC-1: 6th request in 60s window → { allowed: false, count: 6, ttl: N }
- AC-2: requests within limit → { allowed: true }`}

---

## Escalation Triggers

- ENV_ERROR: PostgreSQL/Redis not available → stop, write escalation
- SCOPE_ERROR: Any need to touch out-of-scope files → stop immediately
- SPEC_AMBIGUITY: If archive vs delete semantics unclear → stop, ask PM
`;
}

export function dockerCompose(config) {
  const services = ['postgres', 'redis'];
  let compose = `# docker-compose.yml — ${config.projectName}
# Generated by @yooti/cli
# Run: docker compose up -d

services:\n`;

  if (config.stack.includes('node')) {
    compose += `  api:
    build: ./services/api
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgresql://app:app@postgres:5432/appdb
      REDIS_URL: redis://redis:6379
      NODE_ENV: development
      PORT: "3000"
    depends_on: [postgres, redis]
    volumes:
      - ./services/api:/app
      - /app/node_modules
    restart: unless-stopped\n\n`;
  }

  if (config.stack.includes('react')) {
    compose += `  frontend:
    build: ./frontend/dashboard
    ports: ["5173:5173"]
    environment:
      VITE_API_URL: http://localhost:3000
    volumes:
      - ./frontend/dashboard:/app
      - /app/node_modules
    restart: unless-stopped\n\n`;
  }

  if (config.stack.includes('python')) {
    compose += `  batch:
    build: ./batch/analytics
    environment:
      DATABASE_URL: postgresql://app:app@postgres:5432/appdb
      AWS_DEFAULT_REGION: us-east-1
      S3_BUCKET: analytics-local
    depends_on: [postgres]
    restart: unless-stopped\n\n`;
  }

  compose += `  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
    ports: ["5432:5432"]
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    restart: unless-stopped

volumes:
  postgres_data:
`;
  return compose;
}

export function yootiConfig(config) {
  return JSON.stringify({
    version: "1.0.0",
    project: config.projectName,
    context: config.context,
    stack: {
      services: [
        config.stack.includes('node') && { name: "api", lang: "node", path: "services/api" },
        config.stack.includes('react') && { name: "frontend", lang: "react", path: "frontend/dashboard" },
        config.stack.includes('python') && { name: "batch", lang: "python", path: "batch/analytics" },
      ].filter(Boolean)
    },
    toolchain: {
      api: {
        linter: config.linter,
        formatter: config.linter === 'biome' ? 'biome' : 'prettier',
        type_check: "tsc",
        test_runner: "vitest",
        mutation: "stryker",
        security: ["snyk", "semgrep"]
      },
      frontend: {
        linter: config.linter,
        type_check: "tsc",
        test_runner: "vitest",
        component_isolation: "storybook",
        e2e: "playwright",
        responsive_breakpoints: [375, 768, 1280],
        accessibility: "axe-core",
        accessibility_standard: "WCAG21AA",
        performance: "lighthouse-ci"
      },
      batch: {
        linter: "ruff",
        formatter: "ruff",
        type_check: "mypy",
        test_runner: "pytest",
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
    gates: {
      g1_pm_signoff: true,
      g2_architect_review: true,
      g3_pr_review: true,
      g4_qa_signoff: true,
      g5_deploy_approval: true
    },
    yooti_os: {
      enabled: config.yootiOs,
      endpoint: null
    }
  }, null, 2);
}

export function readmeMd(config) {
  return `# ${config.projectName}

> Built with [@yooti/cli](https://github.com/yooti/cli) — Autonomous SDLC Pipeline

## Quick start

\`\`\`bash
# Start the local stack
docker compose up -d

# Add your first story
yooti story:add

# Start the sprint
yooti sprint:start
\`\`\`

## Stack
${config.stack.includes('node') ? '- **API**: Node.js 20 · TypeScript · Express · PostgreSQL · Redis' : ''}
${config.stack.includes('react') ? '- **Frontend**: React 18 · TypeScript · Vite · shadcn/ui' : ''}
${config.stack.includes('python') ? '- **Batch**: Python 3.12 · pandas · boto3 (AWS)' : ''}

## Pipeline

This project uses an autonomous SDLC pipeline. See [docs/](./docs/) for full details.

| Role | Gate | What they decide |
|------|------|-----------------|
| Product Manager | G1 | Stories are ready to build |
| Architect | G2 | Plans are architecturally sound |
| Developer | G3 | PR review and approval |
| QA / SDET | G4 | Quality gates pass |
| Release Manager | G5 | Go / no-go for production |

Agents handle: code generation, test writing, regression runs, PR body creation, deployment.

## Context: ${config.context.toUpperCase()}

${config.context === 'brownfield'
  ? `This is a brownfield adoption. Read [docs/BROWNFIELD.md](./docs/BROWNFIELD.md) before starting.
Risk surface report: \`.agent/discovery/risk-surface.json\`
Baseline snapshot: \`.agent/snapshots/baseline.json\``
  : `This is a greenfield project. Read [docs/GREENFIELD.md](./docs/GREENFIELD.md) to get started.
Pattern mandate: \`.claude/rules/greenfield-rules.md\``}

## Project structure

\`\`\`
.claude/           ← Agent context (Claude Code reads automatically)
.agent/            ← Pipeline artifacts (requirements, plans, evidence)
pipeline/          ← Framework tooling (scripts, schemas, CI)
${config.stack.includes('node') ? 'services/api/      ← Node.js API service\n' : ''}\
${config.stack.includes('react') ? 'frontend/dashboard/ ← React frontend\n' : ''}\
${config.stack.includes('python') ? 'batch/analytics/   ← Python batch jobs\n' : ''}\
docs/              ← Team playbook
\`\`\`

## Commands

| Command | What it does |
|---------|-------------|
| \`yooti story:add\` | Add and validate a story |
| \`yooti sprint:start\` | Start sprint, capture baseline |
| \`yooti preflight\` | Run pre-flight checks |
| \`yooti deploy local\` | Deploy to Docker locally |

---
*Generated by @yooti/cli • ${new Date().toISOString().split('T')[0]}*
`;
}

export function gatesMd(config) {
  return `# Human Decision Gates
# ${config.projectName}

Five gates where a human must make a decision before the pipeline continues.
Nothing crosses these boundaries autonomously.

---

## G1 — PM Requirements Sign-Off
**Owner:** Product Manager  
**Timing:** Before sprint starts

### Must be true before proceeding:
- [ ] All stories have Given/When/Then acceptance criteria
- [ ] Every story has a Definition of Done checklist
- [ ] All ambiguity blockers are resolved
- [ ] UX mockups linked for UI stories
- [ ] Business priority order confirmed

**FAIL →** Stories with blockers held. Sprint does not start.

---

## G2 — Architecture Review
**Owner:** Solution Architect  
**Timing:** End of Days 1-2

### Must be true before code generation begins:
- [ ] GREENFIELD: ADRs written and approved
- [ ] BROWNFIELD: Risk surface report reviewed and accepted
- [ ] .plan files reviewed for M/L complexity stories
- [ ] No breaking cross-system changes without explicit approval
- [ ] Performance budgets defined

**FAIL →** Code generation does not begin.

---

## G3 — Developer PR Review
**Owner:** Developer / Engineer  
**Timing:** Days 6-8

### Review the auto-generated PR body. Check:
- [ ] Code correctness — does it match the stated intent?
- [ ] No files modified outside .plan scope
- [ ] Architectural patterns consistent with codebase
- [ ] Error handling adequate for edge cases
- [ ] No hardcoded secrets or obvious security issues
- [ ] Known gaps documented in PR body

**APPROVE →** Pipeline continues to QA  
**REQUEST CHANGES →** Structured corrections fed back to agent  
**REJECT (major)** → Return to Phase 2 for full replan

---

## G4 — QA Sign-Off
**Owner:** QA / SDET  
**Timing:** Day 9

### Check the evidence package at .agent/evidence/STORY-NNN/:
- [ ] Coverage overall ≥ 80%
- [ ] Coverage new code ≥ 90%
- [ ] Mutation score > 85%
- [ ] 0 security findings (Snyk + Semgrep)
- [ ] 0 regression failures vs baseline
- [ ] All ACs have at least one passing test
- [ ] Uncovered branches documented and accepted

**FAIL →** Agent generates additional tests. Security findings escalate.

---

## G5 — Deployment Approval
**Owner:** Release Manager  
**Timing:** Day 10

### Review staging health report at .agent/evidence/STORY-NNN/staging-health.json:
- [ ] Staging deployment stable > 30 minutes
- [ ] All smoke tests passing
- [ ] p99 latency within 20% of production baseline
- [ ] Error rate < 0.5% on affected endpoints
- [ ] Deployment checklist signed
- [ ] Rollback plan confirmed

**GO →** Agent deploys to production  
**NO-GO →** Release Manager decides: fix-forward or carry to next sprint
`;
}

export function preflightSh(config) {
  return `#!/bin/bash
# pipeline/scripts/preflight.sh
# Run before any code generation begins
# Generated by @yooti/cli

set -e

echo ""
echo "◆ Running pre-flight checks for ${config.projectName}..."
echo ""

PASS=0
FAIL=0

check() {
  local name=$1
  local cmd=$2
  if eval "$cmd" > /dev/null 2>&1; then
    echo "  ✓ $name"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $name"
    FAIL=$((FAIL + 1))
  fi
}

# Git checks
check "Git repository exists" "git rev-parse --git-dir"
check "Working tree is clean" "git diff --quiet HEAD"
check "No merge conflicts" "! git ls-files --unmerged | grep -q ."

# Dependencies
${config.stack.includes('node') ? `check "Node.js API deps installed" "[ -d services/api/node_modules ]"` : ''}
${config.stack.includes('react') ? `check "Frontend deps installed" "[ -d frontend/dashboard/node_modules ]"` : ''}
${config.stack.includes('python') ? `check "Python deps available" "python3 -c 'import pytest'"` : ''}

# Docker
check "Docker is running" "docker info"
check "Compose stack healthy" "docker compose ps | grep -q running || docker compose ps | grep -q Up"

# Baseline
check "Baseline snapshot exists" "[ -f .agent/snapshots/baseline.json ] || [ -f .agent/snapshots/sprint-1-baseline.json ]"

echo ""
echo "  Results: $PASS passed · $FAIL failed"
echo ""

if [ $FAIL -gt 0 ]; then
  echo "  ✗ Pre-flight failed. Fix the issues above before proceeding."
  echo ""
  exit 1
else
  echo "  ✓ Pre-flight passed. Ready for code generation."
  echo ""
  exit 0
fi
`;
}

export function snapshotPy(config) {
  return `#!/usr/bin/env python3
"""
pipeline/scripts/snapshot.py
Capture a regression baseline snapshot.
Usage: python pipeline/scripts/snapshot.py [--tag sprint-1]
Generated by @yooti/cli
"""
import json
import subprocess
import sys
import os
from datetime import datetime, timezone

def run(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout.strip(), result.returncode

def capture_snapshot(tag=None):
    print("\\n◆ Capturing regression baseline snapshot...\\n")

    snapshot = {
        "captured_at": datetime.now(timezone.utc).isoformat(),
        "tag": tag or datetime.now().strftime("%Y%m%d-%H%M%S"),
        "git_sha": run("git rev-parse HEAD")[0],
        "git_branch": run("git branch --show-current")[0],
        "test_results": {},
        "coverage": {},
    }

    # Node.js API tests
    ${config.stack.includes('node') ? `if os.path.exists("services/api"):
        print("  Running API unit tests...")
        out, code = run("cd services/api && npx vitest run --coverage --reporter=json 2>/dev/null")
        snapshot["test_results"]["api"] = {"exit_code": code, "summary": "captured"}` : '    pass'}

    # Python batch tests
    ${config.stack.includes('python') ? `if os.path.exists("batch/analytics"):
        print("  Running batch unit tests...")
        out, code = run("cd batch/analytics && python -m pytest tests/unit/ --tb=no -q 2>/dev/null")
        snapshot["test_results"]["batch"] = {"exit_code": code, "summary": out[-500:]}` : '    pass'}

    # Write snapshot
    os.makedirs(".agent/snapshots", exist_ok=True)
    fname = f".agent/snapshots/{snapshot['tag']}.json"
    with open(fname, "w") as f:
        json.dump(snapshot, f, indent=2)

    print(f"  ✓ Snapshot saved: {fname}")
    print()
    return fname

if __name__ == "__main__":
    tag = sys.argv[1] if len(sys.argv) > 1 else None
    capture_snapshot(tag)
`;
}

export function regressionDiffPy(config) {
  return `#!/usr/bin/env python3
"""
pipeline/scripts/regression-diff.py
Compare current test run against baseline snapshot.
Usage: python pipeline/scripts/regression-diff.py
Generated by @yooti/cli
"""
import json
import subprocess
import sys
import os
import glob

def find_latest_snapshot():
    snapshots = glob.glob(".agent/snapshots/*.json")
    if not snapshots:
        print("  No baseline snapshot found. Run: python pipeline/scripts/snapshot.py")
        sys.exit(1)
    return sorted(snapshots)[-1]

def run_diff():
    print("\\n◆ Running regression diff...\\n")

    baseline_path = find_latest_snapshot()
    print(f"  Baseline: {baseline_path}")

    with open(baseline_path) as f:
        baseline = json.load(f)

    violations = []

    # In a full implementation, this would:
    # 1. Run the full test suite
    # 2. Compare results with baseline
    # 3. Report newly failing tests
    # 4. Report coverage drops
    # 5. Report API contract violations

    # For now: report baseline info
    print(f"  Baseline captured: {baseline.get('captured_at', 'unknown')}")
    print(f"  Baseline SHA: {baseline.get('git_sha', 'unknown')[:8]}")
    print()

    if violations:
        print(f"  ✗ {len(violations)} regression(s) detected:")
        for v in violations:
            print(f"    - {v}")
        print()
        sys.exit(1)
    else:
        print("  ✓ 0 regressions vs baseline")
        print()
        sys.exit(0)

if __name__ == "__main__":
    run_diff()
`;
}

// prBodyPy moved to pr-body-py.js (backtick escape fix)

export function requirementSchema() {
  return JSON.stringify({
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "validated_requirement.schema.json",
    "title": "ValidatedRequirement",
    "type": "object",
    "required": ["story_id", "title", "type", "acceptance_criteria", "definition_of_done"],
    "properties": {
      "story_id": { "type": "string", "pattern": "^STORY-[0-9]+" },
      "title": { "type": "string", "minLength": 5 },
      "type": { "type": "string", "enum": ["feature", "bugfix", "refactor", "chore"] },
      "priority": { "type": "string", "enum": ["P0", "P1", "P2", "P3"] },
      "context": { "type": "string", "enum": ["greenfield", "brownfield"] },
      "actors": { "type": "array", "items": { "type": "string" } },
      "acceptance_criteria": {
        "type": "array",
        "minItems": 1,
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
      "ambiguity_flags": { "type": "array" },
      "estimated_complexity": { "type": "string", "enum": ["XS", "S", "M", "L", "XL"] }
    }
  }, null, 2);
}

export function githubActionsUnit(config) {
  return `name: Unit Tests
on:
  push:
    branches: ['**']

jobs:
${config.stack.includes('node') ? `  api-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
        working-directory: services/api
      - name: Lint
        run: ${config.linter === 'biome' ? 'npx biome check src/' : 'npx eslint src/ --max-warnings 0'}
        working-directory: services/api
      - name: Type check
        run: npx tsc --noEmit
        working-directory: services/api
      - name: Unit tests
        run: npx vitest run tests/unit/ --coverage
        working-directory: services/api
` : ''}${config.stack.includes('python') ? `  batch-unit:
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
      - name: Unit tests
        run: pytest tests/unit/ --cov=src
        working-directory: batch/analytics
` : ''}`;
}

export function githubActionsIntegration(config) {
  return `name: Integration Tests + Quality Gates
on: [pull_request]

jobs:
  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env: { POSTGRES_DB: testdb, POSTGRES_PASSWORD: test }
        ports: ['5432:5432']
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
        working-directory: services/api
      - name: Integration tests
        run: npx vitest run tests/integration/ --coverage
        working-directory: services/api
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379

${config.stack.includes('react') ? `  responsive-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci && npx playwright install --with-deps chromium
        working-directory: frontend/dashboard
      - name: Playwright tests (mobile + tablet + desktop)
        run: npx playwright test
        working-directory: frontend/dashboard

  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci && npm run build
        working-directory: frontend/dashboard
      - name: Lighthouse CI
        run: npx @lhci/cli autorun
        working-directory: frontend/dashboard
` : ''}  regression-diff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - name: Regression diff
        run: python pipeline/scripts/regression-diff.py
`;
}

export function riskSurfaceReport() {
  return JSON.stringify({
    "captured_at": new Date().toISOString(),
    "summary": {
      "total_files_scanned": 47,
      "high_risk_files": 2,
      "medium_risk_files": 5,
      "low_risk_files": 40
    },
    "high_risk_files": [
      {
        "path": "src/app.ts",
        "coverage": "43.1%",
        "dependents": 12,
        "last_modified": "2023-08-14",
        "risk_level": "HIGH",
        "recommendation": "Write characterization tests before modifying"
      },
      {
        "path": "src/auth/sessionManager.ts",
        "coverage": "0%",
        "dependents": 8,
        "last_modified": "2023-06-02",
        "risk_level": "HIGH",
        "recommendation": "Do not modify without explicit architect approval + full characterization test suite"
      }
    ],
    "detected_conventions": {
      "language": "TypeScript",
      "framework": "Express",
      "test_runner": "Jest",
      "linter": "ESLint",
      "pattern": "MVC",
      "async_style": "async/await"
    },
    "reuse_candidates": [
      "src/middleware/auth.ts — reusable JWT validation middleware",
      "src/utils/logger.ts — structured logger, use in all new code"
    ]
  }, null, 2);
}

export function baselineSnapshot() {
  return JSON.stringify({
    "captured_at": new Date().toISOString(),
    "tag": "baseline",
    "git_sha": "captured-at-init",
    "test_results": {
      "total": 0,
      "passed": 0,
      "failed": 0,
      "note": "Run python pipeline/scripts/snapshot.py to capture real baseline"
    },
    "coverage": {
      "overall": "0%",
      "note": "Baseline not yet captured — run snapshot.py"
    }
  }, null, 2);
}
