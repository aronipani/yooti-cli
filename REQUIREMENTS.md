# Yooti CLI — Requirements
# Version: 1.2.0
# Last updated: 2026-03-29
# Status: Living document — updated as CLI evolves

---

> **Yūti** (यूति) — Sanskrit for *joining, union, or mixture*.
> The blending of humans and agents — each doing what they do best.

---

## 1. Overview

Yooti is a CLI scaffold tool that installs a complete autonomous software
delivery pipeline in one command. It generates agent context, coding
constitutions, pipeline tooling, CI workflows, Docker infrastructure,
story type templates, and team playbook docs.

    npm install -g @yooti/cli
    yooti doctor           # verify prerequisites
    yooti init my-project  # scaffold in 2 minutes

---

## 2. Project types

| Flag | Type | Layers generated |
|------|------|-----------------|
| --type full | Full product | Frontend + API + Agents + Batch |
| --type web | Web + API | Frontend + API |
| --type agent | Agent service | Agents only |

---

## 3. Supported stacks

### Backend
| Flag value | Language | Framework |
|------------|----------|-----------|
| node | TypeScript 5 | Fastify 4 |
| python-api | Python 3.12 | FastAPI + Pydantic v2 + SQLAlchemy |

### Frontend
| Flag value | Language | Framework |
|------------|----------|-----------|
| react | TypeScript 5 | React 18 + Vite + shadcn/ui + Tailwind |
| nextjs | TypeScript 5 | Next.js 14 + shadcn/ui + Tailwind |

### AI Agents
| Flag value | Language | Framework |
|------------|----------|-----------|
| langgraph | Python 3.12 | LangGraph + LangChain + FastAPI |

### Databases
| Flag value | Service | Port |
|------------|---------|------|
| postgres | PostgreSQL 16 | 5432 |
| pgvector | PostgreSQL 16 + pgvector extension | 5432 |
| redis | Redis 7 | 6379 |
| mongodb | MongoDB 7 | 27017 |
| age | PostgreSQL 16 + Apache AGE | 5432 |

### Linters
| Flag value | Tools |
|------------|-------|
| eslint | ESLint + Prettier (TypeScript default) |
| biome | Biome (faster — replaces ESLint + Prettier) |
| ruff | Ruff + mypy (Python — always used regardless) |

### CI
| Flag value | Platform |
|------------|----------|
| github-actions | GitHub Actions (default) |
| gitlab | GitLab CI |
| none | No CI generated |

### Agent CLI
| Flag value | Agent |
|------------|-------|
| claude-code | Claude Code by Anthropic (default) |
| codex | Codex CLI by OpenAI |
| both | Claude Code primary, Codex fallback |

---

## 4. Command surface (27 commands)

### Project setup
| Command | Description |
|---------|-------------|
| yooti doctor | Check prerequisites — shows install instructions |
| yooti init [name] | Scaffold a new project — interactive wizard |
| yooti preflight | Run pre-flight checks on existing project |
| yooti configure | Change pipeline adoption stage |
| yooti snapshot [tag] | Capture regression baseline |
| yooti help:all | Show all commands grouped by role |

### Story management (PM — Gate G1)
| Command | Description |
|---------|-------------|
| yooti story:add | Add a story — interactive wizard |
| yooti story:approve [id] | Gate G1 — PM signs off one story |
| yooti story:approve --all | Gate G1 — approve all stories at once |
| yooti story:import --file path | Import stories from a JSON file |
| yooti story:sample --list | List all built-in sample apps |
| yooti story:sample --app name | Import built-in sample stories |

### Task and plan management (Architect — Gate G2)
| Command | Description |
|---------|-------------|
| yooti task:add [id] | Add a task to a story mid-sprint |
| yooti task:list [id] | List tasks and their status |
| yooti plan:amend task-id | Amend scope, steps, or annotations |
| yooti plan:review [id] | Interactive G2 review — walks through each task |
| yooti plan:approve id | Sign Gate G2 |

### Context and corrections (All roles)
| Command | Description |
|---------|-------------|
| yooti context:add id | Attach external context to a story |
| yooti context:list id | List attached context |
| yooti correct:inject task-id | Inject a developer correction mid-generation |
| yooti test:require [id] | Add a QA test requirement |

### Sprint management
| Command | Description |
|---------|-------------|
| yooti sprint:start | Preflight + baseline + validate stories |
| yooti sprint:report | Sprint summary — gates, coverage, DoD status |
| yooti sprint:retro | Sprint retrospective with team input |
| yooti sm:standup | Daily standup summary from pipeline data |

### QA (SDET — Gate G4)
| Command | Description |
|---------|-------------|
| yooti qa:plan [id] | Create a QA test plan for a story |
| yooti qa:review [id] | Gate G4 — review evidence package |

### Audit and reporting
| Command | Description |
|---------|-------------|
| yooti audit id | Full audit trail for a story |
| yooti audit id --gates | Gate decisions only |
| yooti audit id --diff | File changes only |
| yooti log:event [id] | Manually log a pipeline event |

---

## 5. Ticket ID format

Yooti accepts any ticket ID format.

    STORY-001     Yooti default
    BUG-042       Bug fix
    FEAT-007      Feature
    PROJ-123      Jira-style project key
    ISS-007       GitHub issue style

Rules: no spaces, no path separators, no quotes, max 50 characters.

Import sample stories with a custom prefix:

    yooti story:sample --app ecommerce --prefix PROJ
    # Creates PROJ-001, PROJ-002 etc.

---

## 6. Generated file structure

### Framework components (all project types)

    .claude/
      CLAUDE.md                   Master agent context
      agents/                     Agent prompt files
      rules/                      Scope enforcement rules
      constitutions/
        security.md               Always
        testing.md                Always
        config.md                 Always — .env, pyproject.toml rules
        docker.md                 If deploy=docker
        typescript.md             If stack includes node or react
        react.md                  If stack includes react
        python.md                 If stack includes python or agents
        langgraph.md              If type=full or agent
        postgresql.md             If any database selected

    .agent/
      examples/
        good-decomposition.md
        bad-decomposition.md
      requirements/               [ID]-validated.json files
      plans/                      [ID]-T001.plan.md files
      templates/                  6 story type templates
      context/                    Human-attached context
      corrections/                Developer corrections
      test-requirements/          QA test requirements
      gates/                      Gate sign-off files (G1-G5)
      escalations/                Agent escalation files
      logs/                       Structured audit event logs
      audit/                      Rendered audit + retro files
      evidence/[ID]/              Evidence package per story

    pipeline/scripts/
      preflight.js
      snapshot.py
      regression-diff.py
      generate-pr-body.py

    tests/regression/
      baseline/                   Sprint baseline snapshots
      suites/                     Smoke, API contract, security suites
      comparator/diff.py

    docs/
      README.md
      GATES.md
      PROMPTS.md                  Exact prompts for each pipeline stage

    .github/workflows/
      unit-tests.yml
      security-scan.yml           Snyk + Semgrep + mutation testing
      gate-g3.yml                 Auto-creates G3 gate file on PR merge

    docker-compose.yml
    yooti.config.json
    .env.example
    AGENTS.md                     Codex projects only

### Code layers (varies by type and stack)

    services/api/                 Node.js Fastify API
    services/api_python/          Python FastAPI
    frontend/dashboard/           React or Next.js
    agents/                       LangGraph agent service
    batch/analytics/              Python batch (type=full only)

### Approximate file counts

| Type | Stack | Files |
|------|-------|-------|
| web | node + react | ~45 |
| full | node + react + python + langgraph | ~95 |
| agent | python + langgraph | ~25 |
| brownfield | any | +4 overlay files |

---

## 7. Evidence package (Phase 5)

Generated before every PR. Gate G4 reads it.

    .agent/evidence/[ID]/
      test-results.json       Unit + integration pass/fail
      coverage-summary.json   Overall % and new code %
      regression-diff.json    Newly failing vs baseline
      security-scan.json      Snyk + Semgrep findings
      accessibility.json      axe-core violations (frontend only)
      code-audit.md           Constitution compliance check
      pr-body.md              Complete PR body

PR will not open if: tests fail, coverage < 80%, regressions found,
HIGH/CRITICAL security findings, or code audit violations.

---

## 8. Quality gates enforced in CI

| Check | Tool | Threshold | Blocks PR |
|-------|------|-----------|-----------|
| Lint | ESLint / Biome / Ruff | 0 warnings | Yes |
| Type check | tsc / mypy | 0 errors | Yes |
| Unit tests | Vitest / pytest | 100% pass | Yes |
| Integration tests | Vitest / pytest | 100% pass | Yes |
| Coverage overall | Istanbul / pytest-cov | >= 80% | Yes |
| Coverage new code | Istanbul / pytest-cov | >= 90% | Yes |
| Regression diff | diff.py | 0 newly failing | Yes |
| Security deps | Snyk | 0 HIGH/CRITICAL | Yes |
| Security code | Semgrep | 0 findings | Yes |
| Accessibility | axe-core | 0 violations | Yes (frontend) |
| Code audit | Phase 5 self-audit | 0 violations | Yes |
| Mutation score | Stryker / mutmut | >= 85% | Warn |

---

## 9. Pipeline adoption stages

| Stage | Name | Agent does | Human controls |
|-------|------|------------|----------------|
| 1 | Foundation | Parse requirements | All code, all deploys |
| 2 | Build | Requirements + plans | All code, all deploys |
| 3 | Review* | Code + tests + PRs | All deploys |
| 4 | Deploy | Code + staging | Production only |
| 5 | Autonomous | Full pipeline | 5 gates only |

* Recommended starting point.

---

## 10. Built-in sample apps

| App | Stories | Sprints | Coverage |
|-----|---------|---------|---------|
| ecommerce | 13 | 2 | Catalogue, cart, auth, checkout, search, admin, design system |

    yooti story:sample --app ecommerce           # all 13 stories
    yooti story:sample --app ecommerce --sprint 1  # Sprint 1 only (9 stories)
    yooti story:sample --app ecommerce --prefix PROJ  # custom prefix

---

## 11. Definition of done for v1.2.0

### Completed
- [x] yooti init — all 3 project types
- [x] 27 commands registered and functional
- [x] Flexible ticket ID format — any prefix accepted
- [x] Constitution files: security, testing, python, react, typescript,
      langgraph, postgresql, config, docker
- [x] Story type templates: 6 types
- [x] Phase 2/3/4/5 explicitly defined in CLAUDE.md
- [x] Gate G3 — GitHub only, no CLI required
- [x] Code audit in Phase 5 before PR opens
- [x] Evidence package — 6 files required before PR
- [x] gate-g3.yml — auto-creates G3 gate on PR merge
- [x] sprint:start runs preflight + captures baseline
- [x] sprint:retro command
- [x] sprint:report validates definition of done
- [x] yooti doctor prerequisite checker
- [x] Codex CLI support + AGENTS.md
- [x] plan:review interactive G2 walk-through
- [x] story:approve --all bulk G1 approval
- [x] story:sample --prefix custom ID prefix
- [x] Security CI: Snyk + Semgrep + mutation testing
- [x] batch/analytics/ scaffold for type=full
- [x] Docker constitution — port matching
- [x] Config constitution — .env and pyproject.toml
- [x] docs/PROMPTS.md generated per project
- [x] Cross-platform: Mac, Linux, Windows

### Roadmap
- [ ] upgrade command — regenerate pipeline in existing project (v1.3)
- [ ] Jira / Linear import via API (v1.3)
- [ ] Java + Spring constitution files (v2.0)
- [ ] .NET constitution files (v2.0)
- [ ] Community constitution library (v2.0)
