# Yooti CLI — Requirements
Version: 1.1.0
Last updated: 2026-03-28
Status: Living document — updated as CLI evolves

---

## 1. Overview

Yooti is a CLI scaffold tool that installs a complete autonomous
software delivery pipeline in one command. It generates agent context,
pipeline tooling, CI workflows, Docker infrastructure, coding
constitutions, story type templates, and team playbook docs.

The CLI is installed globally via npm:
  npm install -g @yooti/cli
  yooti init my-project

---

## 2. Project types

| Flag | Type | Layers generated |
|------|------|-----------------|
| --type full | Full product | API + Frontend + Agents + Batch |
| --type web | Web + API | API + Frontend + Batch |
| --type agent | Agent service | Agents only |

---

## 3. Supported stacks

### Backend
| Flag value | Language | Framework |
|------------|----------|-----------|
| node | TypeScript | Fastify / Express |
| python-api | Python 3.12 | FastAPI + Pydantic v2 |

### Frontend
| Flag value | Language | Framework |
|------------|----------|-----------|
| react | TypeScript | React 18 + Vite + shadcn/ui |
| nextjs | TypeScript | Next.js 14 + shadcn/ui |

### AI Agents
| Flag value | Language | Framework |
|------------|----------|-----------|
| langgraph | Python 3.12 | LangGraph + LangChain |

### Databases
| Flag value | Service | Port |
|------------|---------|------|
| postgres | PostgreSQL 16 | 5432 |
| pgvector | PostgreSQL 16 + pgvector | 5432 |
| redis | Redis 7 | 6379 |
| mongodb | MongoDB 7 | 27017 |
| age | PostgreSQL + Apache AGE | 5432 |

### Linters
| Flag value | Tools |
|------------|-------|
| eslint | ESLint + Prettier |
| biome | Biome (replaces ESLint + Prettier) |
| ruff | Ruff (Python — always used) |

### CI
| Flag value | Platform |
|------------|----------|
| github-actions | GitHub Actions |
| gitlab | GitLab CI |
| none | No CI generated |

---

## 4. Command surface (22 commands)

### Project setup
| Command | Description |
|---------|-------------|
| yooti init [name] | Scaffold a new project — wizard |
| yooti preflight | Run pre-flight checks |
| yooti configure | Change pipeline adoption stage |
| yooti snapshot [tag] | Capture regression baseline |

### Story management (PM — Gate G1)
| Command | Description |
|---------|-------------|
| yooti story:add | Add a story — interactive wizard |
| yooti story:approve [story-id] | Gate G1 — PM signs off stories |
| yooti story:import --file path | Import stories from JSON file |
| yooti story:sample --app name | Import built-in sample stories |

### Task and plan management (Architect — Gate G2)
| Command | Description |
|---------|-------------|
| yooti task:add [story-id] | Add a task to a story mid-sprint |
| yooti task:list [story-id] | List tasks and their status |
| yooti plan:amend task-id | Amend scope, steps, or annotations |
| yooti plan:approve story-id | Sign Gate G2 |
| yooti plan:review [story-id] | Interactive G2 review — walks through each task |

### Context and corrections (All roles)
| Command | Description |
|---------|-------------|
| yooti context:add story-id | Attach external context to a story |
| yooti context:list story-id | List attached context |
| yooti correct:inject task-id | Inject a correction mid-generation |
| yooti test:require [story-id] | Add a QA test requirement |

### Sprint management
| Command | Description |
|---------|-------------|
| yooti sprint:start | Run preflight + capture baseline + validate stories |
| yooti sprint:report | Sprint summary across all stories |

### QA (SDET — Gate G4)
| Command | Description |
|---------|-------------|
| yooti qa:plan [story-id] | Create a QA test plan |
| yooti qa:review [story-id] | Gate G4 — review evidence package |

### Audit and reporting
| Command | Description |
|---------|-------------|
| yooti audit story-id | Full audit trail for a story |
| yooti log:event [story-id] | Manually log a pipeline event |

### Scrum Master
| Command | Description |
|---------|-------------|
| yooti sm:standup | Daily standup summary from pipeline data |

---

## 5. Generated file structure

### Framework components (all project types — language agnostic)

```
.claude/
  CLAUDE.md                   Master agent context
  agents/                     Agent prompt files
  rules/                      Scope and context rules
  constitutions/              Per language/framework standards
    security.md               Always generated
    testing.md                Always generated
    typescript.md             If stack includes node or react
    react.md                  If stack includes react
    python.md                 If stack includes python or type=agent
    langgraph.md              If type=full or type=agent
    postgresql.md             If any database selected

.agent/
  examples/                   Reference examples
    good-decomposition.md     Correct task decomposition example
    bad-decomposition.md      Incorrect decomposition example
  requirements/               STORY-NNN-validated.json files
  plans/                      STORY-NNN-TNNN.plan.md files
  templates/                  Story type templates
  context/                    Human-attached context per story
  corrections/                Developer corrections mid-generation
  test-requirements/          QA test requirements per story
  gates/                      Gate sign-off files
  escalations/                Agent escalation files
  logs/                       Structured audit event logs
  audit/                      Rendered audit markdown files

pipeline/
  scripts/
    preflight.js              Cross-platform preflight (Node.js)
    snapshot.py               Regression baseline capture
    regression-diff.py        Baseline comparator
    generate-pr-body.py       PR body generator
  schemas/                    JSON contracts for artifacts

tests/
  regression/
    baseline/                 Sprint baseline snapshots
    suites/                   Regression test suites
    comparator/               Baseline comparator

docs/
  README.md                   Project README
  GATES.md                    Gate criteria and checklists

.github/workflows/
  unit-tests.yml              Unit tests per layer
  security-scan.yml           Snyk + Semgrep + mutation testing

docker-compose.yml
yooti.config.json
.env.example
```

### Code layers (varies by type and stack)

```
services/api/                 Node.js API (if stack includes node)
services/api_python/          Python FastAPI (if backend=python-api)
frontend/dashboard/           React or Next.js (if stack includes react/nextjs)
agents/                       LangGraph agents (if type=full or agent)
batch/analytics/              Python batch (if type=full)
```

### Approximate file counts

| Type | Context | Stack | File count |
|------|---------|-------|------------|
| web | greenfield | node,react | ~45 files |
| full | greenfield | node,react,python + langgraph | ~95 files |
| agent | greenfield | python + langgraph | ~25 files |
| any | brownfield | any | +4 files |

---

## 6. Configuration — yooti.config.json

The config file stores:
- Project metadata (name, type, context, version)
- Pipeline settings (stage, phases, gates)
- Quality gate thresholds
- Toolchain commands per layer (api, frontend, agents, batch)
- Stack and database selections

Toolchain sections: api, frontend, agents, batch
Each section has: test_command, test_unit, test_integration,
test_coverage, lint_command, type_check, mutation, coverage_threshold

---

## 7. Quality gates — enforced in CI

| Check | Tool | Threshold | Blocks PR |
|-------|------|-----------|-----------|
| Lint | ESLint / Biome / Ruff | 0 warnings | Yes |
| Type check | tsc / mypy | 0 errors | Yes |
| Unit tests | Vitest / pytest | 100% pass | Yes |
| Integration tests | Supertest / pytest | 100% pass | Yes |
| Coverage overall | Istanbul / pytest-cov | >= 80% | Yes |
| Coverage new code | Istanbul / pytest-cov | >= 90% | Yes |
| Regression diff | diff.py | 0 newly failing | Yes |
| Security deps | Snyk | 0 HIGH/CRITICAL | Yes |
| Security code | Semgrep | 0 findings | Yes |
| Accessibility | axe-core | 0 violations | Yes (frontend) |
| Mutation score | Stryker / mutmut | >= 85% | Warn |

---

## 8. Pipeline stages

| Stage | Name | Agent does | Human controls |
|-------|------|------------|----------------|
| 1 | Foundation | Parse requirements | All code, all deploys |
| 2 | Build | Requirements + plans | All code, all deploys |
| 3 | Review | Code + tests + PRs | All deploys (recommended start) |
| 4 | Deploy | Code + staging deploy | Production only |
| 5 | Autonomous | Full pipeline | 5 gates only |

---

## 9. Built-in sample apps

| App | Stories | Stack | Sprints |
|-----|---------|-------|---------|
| ecommerce | 10 | node + react | 2 |

Import with: yooti story:sample --app ecommerce

---

## 10. Definition of done for v1.1.0

- [x] yooti init generates complete scaffold for all 3 project types
- [x] All 22 commands registered and functional
- [x] Constitution files generated per stack selection
- [x] Story type templates generated
- [x] Unit test scaffold per language
- [x] Regression suite generated
- [x] Audit system (5 views, persistent files)
- [x] Cross-platform (Mac, Linux, Windows)
- [x] sprint:start runs preflight + captures baseline
- [x] Security CI jobs (Snyk + Semgrep + mutation)
- [x] batch/analytics/ scaffold for type=full
- [x] .env.example includes all required variables
- [x] yooti.config.json includes all toolchain sections
- [ ] upgrade command (v1.2 target)
- [ ] Jira/Linear import (v1.2 target)
- [ ] Community constitution library (v2.0 target)
