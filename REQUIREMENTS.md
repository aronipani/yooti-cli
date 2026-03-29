# Yooti CLI — Requirements
# Version: 1.2.0
# Last updated: 2026-03-29
# Status: Living document — updated as CLI evolves

---

> **Yūti** (यूति) — Sanskrit for *joining, union, or mixture*.
> The blending of humans and agents — each doing what they do best.

---

## Important distinction — Engine vs Target

Yooti has two separate sets of requirements. Understanding this distinction
is what makes the framework feel plug-and-play for any team.

    ENGINE REQUIREMENTS
    What runs the Yooti CLI and pipeline itself.
    These are fixed — the CLI needs them regardless of what you are building.

    TARGET REQUIREMENTS
    What your application is built with.
    These are entirely yours. Yooti does not care what language or framework
    your product uses. A Java team, a Go team, a Ruby team — all can use Yooti.
    The Reference Implementation ships one opinionated stack as a starting point.
    That stack is not a requirement.

---

## 1. Engine requirements — what runs Yooti

These tools run the CLI, the pipeline scripts, and the CI workflows.
They are required regardless of what your application is built with.

### Required for all teams

| Tool | Version | Purpose | Install |
|------|---------|---------|---------|
| Node.js | >= 20 | Runs the Yooti CLI | nodejs.org |
| Git | any | Version control | git-scm.com |
| Claude Code | any | Code generation agent | npm i -g @anthropic-ai/claude-code |

### Required for specific features

| Tool | Version | Required for | Install |
|------|---------|-------------|---------|
| GitHub CLI (gh) | any | Automatic PR creation | cli.github.com |
| Python | >= 3.12 | Pipeline scripts (snapshot, regression diff) | python.org |
| Docker Desktop | any | Local stack (brownfield: optional) | docker.com |

Note on Python: Python runs three pipeline scripts — snapshot.py,
regression-diff.py, and generate-pr-body.py. It is not required because
your application uses Python. A Java team still needs Python >= 3.12 for
these pipeline scripts.

Note on Docker: Docker runs the local stack in the Reference Implementation.
Brownfield teams using their own infrastructure can skip Docker and run their
services directly.

### Quick install — engine only

    # Mac
    brew install node@20 git gh python@3.12
    npm install -g @anthropic-ai/claude-code @yooti/cli

    # Windows
    winget install OpenJS.NodeJS.LTS Git.Git GitHub.cli Python.Python.3.12
    npm install -g @anthropic-ai/claude-code @yooti/cli

    # Verify everything
    yooti doctor

---

## 2. Target requirements — what your application uses

Your application can use any language, any framework, any database.
Yooti governs the delivery process — not the technology choices.

Examples of teams using Yooti:

    Java + Spring Boot + PostgreSQL      ← add a java-spring.md constitution
    Go + Gin + MySQL                     ← add a go.md constitution
    Ruby + Rails + PostgreSQL            ← add a ruby.md constitution
    .NET + C# + SQL Server               ← add a dotnet.md constitution
    Python + FastAPI + PostgreSQL        ← included in Reference Implementation
    TypeScript + Node + PostgreSQL       ← included in Reference Implementation
    React + Next.js                      ← included in Reference Implementation

The framework adapts to your stack through constitution files — plain markdown
that tells the agent how to write code in your language and framework.

---

## 3. Reference Implementation stack (optional)

The Reference Implementation is an opinionated starting point for teams
beginning a new project. It is not required to use Yooti.

    Frontend      TypeScript + React 18 + Vite + shadcn/ui + Tailwind
    API           TypeScript + Node.js 20 + Fastify + Prisma + PostgreSQL
                  OR Python 3.12 + FastAPI + SQLAlchemy + Pydantic v2
    Agents        Python 3.12 + LangGraph + LangChain + FastAPI
    Batch         Python 3.12 + boto3 + pandas
    Database      PostgreSQL 16 + pgvector + Redis 7
    CI            GitHub Actions
    Containers    Docker + docker-compose

Brownfield teams: use `yooti init . --context brownfield` to install only
the framework files without any of the RI stack.

---

## 4. Supported CI platforms

| Platform | Flag | Generated files |
|---------|------|----------------|
| GitHub Actions | --ci github-actions | .github/workflows/ |
| GitLab CI | --ci gitlab | .gitlab-ci.yml |
| None | --ci none | No CI files generated |

---

## 5. Supported code generation agents

| Agent | Flag | Config generated |
|-------|------|-----------------|
| Claude Code (Anthropic) | --agent claude-code | .claude/ folder |
| Codex CLI (OpenAI) | --agent codex | AGENTS.md |
| Both | --agent both | .claude/ + AGENTS.md |

---

## 6. Command surface (27 commands)

### Project setup
| Command | Description |
|---------|-------------|
| yooti doctor | Check engine prerequisites — shows copy-paste install commands |
| yooti init [name] | New project — interactive wizard |
| yooti init . --context brownfield | Add framework to existing project |
| yooti preflight | Run pre-flight checks |
| yooti configure | Change pipeline adoption stage |
| yooti snapshot [tag] | Capture regression baseline |
| yooti help:all | All commands grouped by role |

### Story management (Gate G1)
| Command | Description |
|---------|-------------|
| yooti story:add | Add story — wizard |
| yooti story:add --title "..." | Quick add with just a title |
| yooti story:approve [id] | Gate G1 — approve one story |
| yooti story:approve --all | Gate G1 — approve all at once |
| yooti story:import --file path | Import from JSON (Jira/Linear export) |
| yooti story:sample --list | List built-in sample apps |
| yooti story:sample --app name | Import sample stories |

### Task and plan management (Gate G2)
| Command | Description |
|---------|-------------|
| yooti task:add [id] | Add task mid-sprint |
| yooti task:list [id] | List tasks and status |
| yooti plan:amend task-id | Amend scope, steps, or annotations |
| yooti plan:review [id] | Interactive G2 review — walks each task |
| yooti plan:approve id | Sign Gate G2 |

### Context and corrections
| Command | Description |
|---------|-------------|
| yooti context:add id | Attach context to a story |
| yooti context:list id | List attached context |
| yooti correct:inject task-id | Inject a developer correction |
| yooti test:require [id] | Add a QA test requirement |

### Sprint management
| Command | Description |
|---------|-------------|
| yooti sprint:start | Preflight + baseline + validate stories |
| yooti sprint:report | Sprint summary — gates, coverage, DoD |
| yooti sprint:retro | Sprint retrospective |
| yooti sm:standup | Daily standup from pipeline data |

### QA (Gate G4)
| Command | Description |
|---------|-------------|
| yooti qa:plan [id] | Create QA test plan |
| yooti qa:review [id] | Gate G4 — review evidence package |

### Audit
| Command | Description |
|---------|-------------|
| yooti audit id | Full audit trail for a story |
| yooti audit id --gates | Gate decisions only |
| yooti log:event [id] | Manually log a pipeline event |

---

## 7. Ticket ID format

Any format works. Use your existing convention.

    STORY-001     Yooti default
    PROJ-123      Jira-style
    ISS-007       GitHub issue style
    BUG-042       Bug fix
    FEAT-007      Feature

Rules: no spaces, no path separators, no quotes, max 50 characters.

---

## 8. Generated file structure

### Framework files (all project types — language agnostic)

    .claude/
      CLAUDE.md                   Agent context — phases, gates, rules
      constitutions/
        global.md                 High-level principles — any language
        security.md               Security rules — any stack
        testing.md                Testing rules — any stack
        [language].md             Language-specific additions

    .agent/
      requirements/               [ID]-validated.json — the specs
      plans/                      [ID]-T001.plan.md — task plans
      templates/                  6 story type templates
      gates/                      Gate sign-off files (G1-G5 per story)
      evidence/[ID]/              Evidence package per story
      escalations/                Agent escalation files
      logs/                       Audit event logs

    pipeline/scripts/
      preflight.js                Cross-platform (Node.js)
      snapshot.py                 Regression baseline
      regression-diff.py          Baseline comparator
      generate-pr-body.py         PR body generator

    docs/
      GATES.md                    Gate criteria for your team
      PROMPTS.md                  Exact prompts per pipeline stage

    yooti.config.json             Project config + quality thresholds
    .env.example                  Environment variable template

### Reference Implementation code layers (optional)

    services/api/                 Node.js API
    services/api_python/          Python FastAPI
    frontend/dashboard/           React or Next.js
    agents/                       LangGraph agents
    batch/analytics/              Python batch

---

## 9. Quality gates

| Check | Tool (RI default) | Your equivalent | Threshold | Blocks PR |
|-------|------------------|----------------|-----------|-----------|
| Lint | ESLint / Ruff | Any linter | 0 warnings | Yes |
| Type check | tsc / mypy | Any type checker | 0 errors | Yes |
| Unit tests | Vitest / pytest | Any test runner | 100% pass | Yes |
| Coverage overall | Istanbul / pytest-cov | Any coverage tool | >= 80% | Yes |
| Coverage new code | Istanbul / pytest-cov | Any coverage tool | >= 90% | Yes |
| Regression diff | diff.py | diff.py (engine) | 0 failing | Yes |
| Security deps | Snyk | Any SCA tool | 0 HIGH/CRITICAL | Yes |
| Security code | Semgrep | Any SAST tool | 0 findings | Yes |
| Accessibility | axe-core | Any a11y tool | 0 violations | Frontend |
| Code audit | Phase 5 self-audit | Phase 5 self-audit | 0 violations | Yes |
| Mutation score | Stryker / mutmut | Any mutation tool | >= 85% | Warn |

Thresholds are configurable in yooti.config.json.
RI defaults are replaced with your team's tools via toolchain config.

---

## 10. Pipeline adoption stages

| Stage | Agent does | Human controls | Recommended for |
|-------|------------|----------------|----------------|
| 1 | Parse stories | All code + all deploys | First week |
| 2 | Plans + parsing | All code + all deploys | Building confidence |
| 3 | Code + tests + PRs | All deploys | Most teams |
| 4 | Code + staging deploy | Production only | Established trust |
| 5 | Full pipeline | 5 gates only | Maximum autonomy |

---

## 11. Definition of done — v1.2.0

### Completed
- [x] Engine requirements clearly separated from target requirements
- [x] 27 commands including yooti doctor with copy-paste install output
- [x] Brownfield mode — no existing files touched
- [x] Generic global.md constitution template
- [x] Language-specific constitutions: python, react, typescript, langgraph,
      postgresql, config, docker, security, testing
- [x] Any ticket ID format accepted
- [x] Jira/Linear import via story:import --file
- [x] GitHub Actions, GitLab CI supported
- [x] Claude Code and Codex CLI supported
- [x] Phase 2/3/4/5 explicitly defined in CLAUDE.md
- [x] Gate G3 — GitHub only, no CLI required
- [x] Evidence package — 6 files required before PR
- [x] gate-g3.yml — auto-creates G3 gate on PR merge
- [x] sprint:retro command
- [x] sprint:report validates definition of done
- [x] Code audit in Phase 5 against constitutions
- [x] Cross-platform: Mac, Linux, Windows

### Roadmap
- [ ] upgrade command — regenerate pipeline in existing project (v1.3)
- [ ] Jira API import — pull tickets directly (v1.3)
- [ ] Java, Go, Ruby, .NET constitution templates (v1.3)
- [ ] GitLab G3 gate automation (v1.3)
- [ ] Community constitution library (v2.0)
