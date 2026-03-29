# Yooti

### Autonomous SDLC Pipeline — from story to production, with humans in control

> **Yūti** (यूति) — Sanskrit for *joining, union, or mixture*.  
> Derived from the root *yu* (to join) — the blending of elements,  
> the act of bringing things together.  
> In Yooti, that union is humans and agents — each doing what they do best.

---

## The problem Yooti solves

Small engineering teams are being asked to deliver more, faster, with fewer people.
The tools exist — Claude Code, LangGraph, GitHub Actions, Docker — but wiring them
into a coherent, repeatable delivery system takes weeks. Every new project starts
from scratch. Every new team member needs onboarding. Every sprint the same manual
steps: write the requirement, break it into tasks, generate the code, write the
tests, open the PR, deploy to staging, approve for production.

Yooti replaces that setup time with one command.

It is not a code generator. It is not an AI assistant. It is a framework that
installs a complete autonomous delivery pipeline — agent context, pipeline tooling,
CI workflows, Docker infrastructure, coding constitutions, and team playbook docs —
and then gets out of the way.

**Your team writes stories. Agents execute. Humans approve. Products ship.**

---

## Framework vs Reference Implementation

```
┌─────────────────────────────────────────────────────────────────────┐
│  THE FRAMEWORK — language agnostic                                  │
│                                                                     │
│  Pipeline phases, human gates, adoption stages, agent context,      │
│  coding constitutions, scope rules, and quality gates work with     │
│  any language, any framework, and any cloud provider.               │
│                                                                     │
│  Java + Spring, Ruby + Rails, Go + Postgres — all supported.        │
│  The framework cares how you deliver, not what you build with.      │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  THE REFERENCE IMPLEMENTATION — opinionated by design               │
│                                                                     │
│  yooti init generates a working codebase using a specific,          │
│  pre-wired toolchain. This gets you productive in hours, not weeks. │
│                                                                     │
│  If your team uses a different stack, adopt the framework and       │
│  replace the RI layers with your own. The pipeline, gates, and      │
│  agent context work either way.                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

```bash
yooti doctor    # checks everything and shows install instructions
```

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | >= 20 | Yooti CLI |
| Git | any | Version control |
| GitHub CLI (gh) | any | Automatic PR creation |
| Docker Desktop | any | Local stack |
| Python | >= 3.12 | Python layers + pipeline scripts |
| Claude Code | any | Code generation agent |

```bash
# Mac
brew install node@20 git gh python@3.12
npm install -g @anthropic-ai/claude-code

# Windows
winget install OpenJS.NodeJS.LTS Git.Git GitHub.cli Python.Python.3.12
npm install -g @anthropic-ai/claude-code

# Install Yooti
npm install -g @yooti/cli
yooti doctor     # verify prerequisites
```

---

## Quick start

```bash
yooti init my-product                            # wizard — 2 minutes
cd my-product
docker compose up -d                             # full local stack
yooti story:sample --app ecommerce --sprint 1   # 9 demo stories
yooti story:approve --all                        # Gate G1
yooti sprint:start                               # capture baseline
```

Then in Claude Code:
```
Proceed to Phase 2 for all new stories.
```

---

## The pipeline

Every story goes through seven phases. Same seven phases, every sprint, every story.

```
PHASE 1   Requirements ingestion
          Agent validates the story, generates structured AC in
          Given/When/Then format, flags ambiguities, estimates complexity.
          Automated — no human gate.

PHASE 2   Story decomposition
          Agent breaks story into tasks by layer, writes .plan.md files.
          Each plan defines exact file scope, AC coverage, implementation steps.
          Plans only — no code written yet.
          ── STOP → Gate G2 (Architect reviews plans) ──────────────────────

PHASE 3   Environment setup
          Feature branch created, preflight checks run,
          regression baseline captured. Automated.

PHASE 4   Code generation
          Agent writes failing tests first (TDD), then implementation.
          Runs lint → type check → unit tests → self-heals up to 5 times.
          Escalates to developer if it cannot converge.

PHASE 5   Test orchestration + evidence package
          Full test suite, coverage, regression diff, security scan,
          accessibility check, code audit against constitutions.
          Evidence package written to .agent/evidence/[ID]/
          ── STOP → Gate G3 (Developer reviews PR in GitHub) ───────────────

PHASE 6   PR review
          PR opened with complete evidence package as the PR body.
          Developer reads code, edits if needed, approves or rejects.
          Gate G3 happens entirely in GitHub — no CLI required.
          ── STOP → Gate G4 (QA reviews evidence) ─────────────────────────

PHASE 7   Deploy
          Staging deploy, smoke tests, health report generated.
          ── STOP → Gate G5 (Release Manager approves production) ──────────
```

---

## The five human gates

```
GATE    ROLE              WHEN                        DECISION
──────  ────────────────  ──────────────────────────  ────────────────────────────
G1      Product Manager   Before sprint starts        Stories are complete + ready
G2      Architect         After plans, before code    Plans are structurally sound
G3      Developer         After agent opens PR        Code is correct + safe
G4      QA / SDET         After evidence package      Quality evidence is sufficient
G5      Release Manager   After staging deploy        Safe to deploy to production
```

These are real decisions — not rubber stamps.

---

## Ticket IDs — use your own convention

Yooti accepts any ticket ID format.

```bash
STORY-001   BUG-042   FEAT-007   PROJ-123   ISS-007
```

All commands accept any format:
```bash
yooti plan:review BUG-042
yooti qa:review FEAT-007
yooti story:approve PROJ-123

# Import sample stories with a custom prefix
yooti story:sample --app ecommerce --prefix PROJ
# Creates PROJ-001, PROJ-002 etc.
```

---

## Coding constitutions

Constitution files tell the agent exactly how to write code for your stack.
The agent reads them before writing any file. Phase 5 audits every file against
them before a PR is opened.

```
.claude/constitutions/
  security.md       Always — no secrets, parameterised queries, auth on endpoints
  testing.md        Always — TDD, mocking, coverage thresholds
  python.md         Python stack — type hints, ruff, mypy strict
  react.md          React — component patterns, axe-core in every test
  typescript.md     Node — types, ESLint
  langgraph.md      Agents — state immutability, node rules
  postgresql.md     Database — query patterns, migration rules
  config.md         Always — .env rules, pyproject.toml standards
  docker.md         Docker — port matching, health checks, Dockerfile rules
```

---

## Project types

```bash
yooti init my-product --type full     # Frontend + API + Agents + Batch
yooti init my-api     --type web      # Frontend + API
yooti init my-agent   --type agent    # Agents only
```

### Full stack (type=full)

```
Frontend      TypeScript + React 18 + Vite + shadcn/ui + Tailwind
API           TypeScript + Node.js 20 + Fastify + Prisma + PostgreSQL
              OR Python 3.12 + FastAPI + SQLAlchemy
Agents        Python 3.12 + LangGraph + LangChain + FastAPI
Batch         Python 3.12 + boto3 + pandas
Database      PostgreSQL 16 + pgvector + Redis 7
CI            GitHub Actions — unit tests + security scan + mutation testing
Containers    Docker + docker-compose
```

---

## Pipeline adoption stages

Start at Stage 3. Advance when your team is ready.

```
STAGE 1 — Foundation     Agent parses stories. Team writes all code.
STAGE 2 — Build          Agent writes plans. Team writes code from plans.
STAGE 3 — Review ★       Agent writes code + tests. Team reviews PRs.
                         Recommended starting point for most teams.
STAGE 4 — Deploy         Agent deploys to staging. Team approves production.
STAGE 5 — Autonomous     Agent runs all seven phases. Team controls 5 gates only.
```

```bash
yooti configure --stage 4    # advance when ready
```

---

## Command reference

### Project setup
```bash
yooti doctor                          # check all prerequisites
yooti init [name]                     # scaffold new project — wizard
yooti init [name] --type full         # full product (no wizard)
yooti init [name] --type web          # web + API (no wizard)
yooti init [name] --type agent        # agents only (no wizard)
yooti preflight                       # run pre-flight checks
yooti configure                       # change adoption stage interactively
yooti snapshot [tag]                  # capture regression baseline
```

### Story management (PM — Gate G1)
```bash
yooti story:add                       # add a story — interactive wizard
yooti story:approve [id]              # Gate G1 — approve one story
yooti story:approve --all             # Gate G1 — approve all stories
yooti story:import --file path        # import stories from JSON file
yooti story:sample --list             # list built-in sample apps
yooti story:sample --app ecommerce    # import ecommerce demo stories
yooti story:sample --app ecommerce --sprint 1     # Sprint 1 only
yooti story:sample --app ecommerce --prefix PROJ  # custom ID prefix
```

### Task and plan management (Architect — Gate G2)
```bash
yooti task:add [id]                   # add a task to a story
yooti task:list [id]                  # list tasks and their status
yooti plan:amend <task-id>            # amend scope, steps, or annotations
yooti plan:review [id]                # interactive G2 review — walks each task
yooti plan:approve <id>               # sign Gate G2
```

### Context and corrections (All roles)
```bash
yooti context:add <id> --url <url>    # attach a URL as context
yooti context:add <id> --file <path>  # attach a local file
yooti context:add <id> --note "..."   # attach a freeform note
yooti context:list <id>               # list all context for a story
yooti correct:inject <task-id>        # inject a developer correction
yooti test:require [id]               # add a QA test requirement
```

### Sprint management
```bash
yooti sprint:start                    # preflight + baseline + validate stories
yooti sprint:report                   # sprint summary — gates + coverage + DoD
yooti sprint:retro                    # sprint retrospective
yooti sm:standup                      # daily standup from pipeline data
```

### QA (SDET — Gate G4)
```bash
yooti qa:plan [id]                    # create a QA test plan
yooti qa:review [id]                  # Gate G4 — review evidence package
```

### Audit and reporting
```bash
yooti audit <id>                      # full audit trail for a story
yooti audit <id> --gates              # gate decisions only
yooti audit <id> --diff               # file changes only
yooti log:event [id]                  # manually log a pipeline event
```

---

## Quality gates — enforced in CI on every PR

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

## Built-in sample apps

```bash
yooti story:sample --list
yooti story:sample --app ecommerce           # all 13 stories
yooti story:sample --app ecommerce --sprint 1   # Sprint 1 — 9 stories
```

| App | Stories | Sprints | What it covers |
|-----|---------|---------|----------------|
| ecommerce | 13 | 2 | Catalogue, cart, auth, checkout, search, admin, design system |

---

## Yooti OS (optional)

Yooti works completely standalone. Yooti OS is an optional commercial layer that
adds behavioral quality monitoring using Statistical Process Control (SPC).
It tracks iteration counts, scope violations, test pass rates, coverage deltas,
and deployment success rates across every agent, story, and sprint.

Enable at init: `yooti init my-product --yooti-os`

---

## License

MIT © Yooti
