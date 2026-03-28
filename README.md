# Yooti

### Autonomous SDLC Pipeline — from story to production, with humans in control

---

## The problem Yooti solves

Small engineering teams are being asked to deliver more products, faster,
with fewer people. The tools exist — Claude Code, LangGraph, GitHub Actions,
Docker — but wiring them together into a coherent, repeatable delivery
system takes weeks. Every new project starts from scratch. Every new team
member needs onboarding. Every sprint the same manual steps: write the
requirement, break it into tasks, generate the code, write the tests,
open the PR, deploy to staging, approve for production.

Yooti replaces that setup time with one command.

It is not a code generator. It is not an AI assistant. It is a framework
that installs a complete autonomous delivery pipeline — agent context,
pipeline tooling, CI workflows, Docker infrastructure, example artifacts,
and team playbook docs — and then gets out of the way. Your team writes
stories. Agents execute. Humans approve. Products ship.

---

## Framework vs Reference Implementation

This is the most important thing to understand about Yooti.

```
┌─────────────────────────────────────────────────────────────────────┐
│  THE FRAMEWORK — language agnostic                                  │
│                                                                     │
│  The pipeline phases, human gates, adoption stages, agent context,  │
│  scope rules, and quality gate structure work with any language,    │
│  any framework, and any cloud provider.                             │
│                                                                     │
│  A team running Java + Spring + Go + Terraform can use the          │
│  Yooti pipeline. A team running Ruby + Rails + PostgreSQL can use   │
│  the Yooti pipeline. The framework does not care what you build     │
│  with — it cares how you deliver it.                                │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  THE REFERENCE IMPLEMENTATION — opinionated by design               │
│                                                                     │
│  yooti init generates a working codebase using a specific,          │
│  pre-wired toolchain. This is not a limitation — it is the          │
│  point. The RI exists so you can be productive in hours, not        │
│  weeks. The toolchain choices (TypeScript, React, Python,           │
│  LangGraph) reflect what moves fastest in production today.         │
│                                                                     │
│  If your team uses a different stack, you adopt the framework       │
│  and replace the RI toolchain with your own. The pipeline,          │
│  gates, and agent context work either way.                          │
└─────────────────────────────────────────────────────────────────────┘
```

Think of it like this:

```
HTTP is language agnostic.    Your app implements it in whatever you choose.
Rails is opinionated.         Ruby on Rails gets you to production fast.

Yooti is the same.
The pipeline is language agnostic.
The RI ships a pre-wired stack to get you moving in hours, not weeks.
```

---

## Install

```bash
npm install -g @yooti/cli
yooti --version
```

Requires: Node.js >= 20, Git, Docker, Python 3.12+

---

## Quick start

```bash
yooti init my-product          # wizard asks 8 questions
cd my-product
docker compose up -d           # full local stack in seconds
yooti story:add                # add your first story
code .                         # Claude Code reads .claude/ automatically
```

---

## What the framework provides

These components are language agnostic. They work regardless of what
stack your team uses.

```
COMPONENT              WHAT IT DOES                          LANGUAGE AGNOSTIC
─────────────────────  ────────────────────────────────────  ─────────────────
.claude/CLAUDE.md      Master agent context — role, rules,   Yes — adapts to
                       toolchain, gates, stage, handover      any stack via
                       points. Claude Code reads it auto.     config injection

.claude/agents/        Five agent prompt files:               Yes — prompts
                       requirements, codegen, testgen,        describe process,
                       diagnosis, deploy                      not language

.claude/rules/         Scope enforcement, greenfield rules,   Yes — rules are
                       brownfield rules                       structural, not
                                                              language-specific

.agent/                Pipeline artifacts: requirements       Yes — JSON schema
                       JSON, .plan.md files, snapshots,       contracts, not
                       evidence packages                      code

pipeline/schemas/      JSON contracts for all artifacts       Yes

pipeline/scripts/      preflight.js, snapshot.py,            Yes — tool-agnostic
                       regression-diff.py,                    cross-platform
                       generate-pr-body.py                    validation + diff

yooti.config.json      Stage, toolchain config, quality       Yes — you define
                       gate thresholds                         your own toolchain
                                                              commands here

docs/GATES.md          Gate criteria and checklists           Yes
```

---

## What the Reference Implementation provides

The RI is the opinionated starting point. It generates working, runnable
code using specific technology choices. These choices are deliberate —
they represent the fastest path to a production-ready autonomous pipeline
for teams starting from scratch.

```
LAYER               RI CHOICE                    WHY THIS CHOICE
──────────────────  ───────────────────────────  ────────────────────────────────
Frontend            TypeScript + React 18         Largest ecosystem, best
                    Vite + shadcn/ui              toolchain support, fastest
                    Tailwind CSS                  component generation by agents

API service         TypeScript + Node.js 20       Same language as frontend —
                    Express or Fastify            agents need less context
                    Prisma ORM                    switching. Strong typing
                    Zod validation                catches agent errors early.

Agents              Python 3.12 + LangGraph       LangGraph is the most mature
                    LangChain + FastAPI            stateful agent framework.
                    Pydantic v2                   Python has the widest AI
                                                  library ecosystem.

Batch               Python 3.12 + boto3           Shares agent runtime.
                    pandas + PostgreSQL            No extra language to maintain.

Database            PostgreSQL 16 + pgvector       One database for relational
                    Redis 7                        data AND vector embeddings.
                                                  Zero extra infrastructure.

CI                  GitHub Actions                 Widest adoption. Free for
                                                  public repos.

Containers          Docker + docker-compose        Runs on any machine.
                                                  One command to start.
```

**If your team uses a different stack**, you use `yooti init` to install
the framework components (`.claude/`, `.agent/`, `pipeline/`, `docs/`)
and replace the RI code layers with your own. The pipeline, gates, and
agent context work with any language your team configures.

---

## Project types — choose what you are building

The RI supports three project types. The wizard asks at init time.

---

### Type 1 — Full product

```bash
yooti init my-product --type full
```

Generates all four layers: frontend, API, agents, and batch. Use when
you are building a complete AI-powered product end to end.

```
┌─────────────────────────────────────────────────────────────────────┐
│  FULL PRODUCT                                                       │
│                                                                     │
│  Layer       RI Language / Framework         Purpose                │
│  ──────────  ─────────────────────────────  ───────────────────────│
│  Frontend    TypeScript + React 18           User interface         │
│              Vite + shadcn/ui + Tailwind     Components + styling   │
│                                                                     │
│  API         TypeScript + Node.js 20         Business logic         │
│              Express or Fastify              HTTP server            │
│              Prisma + PostgreSQL 16          Data persistence       │
│              Redis 7                         Cache + sessions       │
│                                                                     │
│  Agents      Python 3.12 + LangGraph         AI orchestration       │
│              LangChain + FastAPI             Tools + API endpoint   │
│              pgvector or Chroma              Vector store           │
│                                                                     │
│  Batch       Python 3.12 + boto3 + pandas    Data processing        │
│              PostgreSQL 16 (shared)          Analytics              │
│                                                                     │
│  Scaffold:  28 files (greenfield) · 32 files (brownfield)          │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Type 2 — Web and API

```bash
yooti init my-api --type web
```

Generates frontend, API, and batch — no agents. Use for products that
do not need an AI agent layer, or for teams adopting the framework on
a conventional service stack.

```
┌─────────────────────────────────────────────────────────────────────┐
│  WEB + API                                                          │
│                                                                     │
│  Layer       RI Language / Framework         Purpose                │
│  ──────────  ─────────────────────────────  ───────────────────────│
│  Frontend    TypeScript + React 18           User interface         │
│              Vite + shadcn/ui + Tailwind     Components + styling   │
│                                                                     │
│  API         TypeScript + Node.js 20         Business logic         │
│              Express or Fastify              HTTP server            │
│              Prisma + PostgreSQL 16          Data persistence       │
│              Redis 7                         Cache + sessions       │
│                                                                     │
│  Batch       Python 3.12 + boto3 + pandas    Data processing        │
│              PostgreSQL 16 (shared)          Analytics              │
│                                                                     │
│  Scaffold:  22 files (greenfield) · 26 files (brownfield)          │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Type 3 — Agent service

```bash
yooti init my-agents --type agent
```

Generates an agent service only — no frontend, no Node.js API. Use when
the agents ARE the product: a LangGraph graph exposed as an API endpoint,
consumed by other services or platforms.

```
┌─────────────────────────────────────────────────────────────────────┐
│  AGENT SERVICE                                                      │
│                                                                     │
│  Layer       RI Language / Framework         Purpose                │
│  ──────────  ─────────────────────────────  ───────────────────────│
│  Agents      Python 3.12 + LangGraph         Stateful agent graphs  │
│              LangChain                       Tools + retrievers     │
│              FastAPI + Pydantic v2           API endpoint           │
│              structlog                       Structured logging     │
│                                                                     │
│  LLM         Anthropic Claude (default)      langchain-anthropic    │
│              OpenAI GPT-4o (alternative)     langchain-openai       │
│                                                                     │
│  Vector      pgvector (PostgreSQL 16)        Production RAG         │
│              Chroma (alternative)            Lightweight local      │
│                                                                     │
│  Tracing     LangSmith                       Automatic graph traces │
│                                                                     │
│  Scaffold:  18 files (greenfield)                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Adapting the RI to your stack

If your team uses a different language or framework, here is how to
use Yooti with your own stack:

```bash
# 1. Initialise — install framework components only
yooti init my-project --type web

# 2. Delete the RI code layers you are replacing
rm -rf services/api          # remove Node.js API
rm -rf frontend/dashboard    # remove React frontend

# 3. Add your own code in the same structure
mkdir -p services/api        # your Go / Java / Ruby service here

# 4. Update yooti.config.json — tell the agent your toolchain
{
  "toolchain": {
    "api": {
      "linter": "golangci-lint",
      "type_check": "go build ./...",
      "test_runner": "go test ./...",
      "coverage": "go tool cover"
    }
  }
}

# 5. The pipeline, gates, and .claude/ context now work with your stack
```

The agent reads `yooti.config.json` before every action. It uses the
toolchain commands you define. The framework — the pipeline phases, the
gates, the scope rules, the quality gate thresholds — remains the same
regardless of what language you configure.

---

## The RI toolchain — per layer

### Frontend (TypeScript + React)

```
TOOL                    PURPOSE                        THRESHOLD
──────────────────────  ─────────────────────────────  ──────────────
ESLint + jsx-a11y       Lint + catch a11y at lint time  0 warnings
Prettier                Format                          Enforced
TypeScript strict       Type check                      0 errors
Vitest                  Unit tests                      100% pass
Testing Library         Component tests                 100% pass
axe-core                Accessibility — WCAG 2.1 AA     0 violations
Playwright              E2E — 375px, 768px, 1280px      100% pass
Lighthouse CI           Performance                     Score >= 80
Lighthouse CI           Accessibility                   Score >= 90
Storybook               Component isolation             All stories render
Snyk                    Dependency security             0 HIGH/CRITICAL

Alternative: --linter biome  (faster, replaces ESLint + Prettier)
```

### API service (TypeScript + Node.js)

```
TOOL                    PURPOSE                        THRESHOLD
──────────────────────  ─────────────────────────────  ──────────────
ESLint + Prettier       Lint and format                 0 warnings
TypeScript strict       Type check                      0 errors
Vitest                  Unit tests                      100% pass
Supertest               Integration tests (HTTP)        100% pass
Stryker                 Mutation testing                >= 85% score
Snyk                    Dependency security             0 HIGH/CRITICAL
Semgrep                 Code security (SAST)            0 findings
```

### Agents + batch (Python 3.12)

```
TOOL                    PURPOSE                        THRESHOLD
──────────────────────  ─────────────────────────────  ──────────────
Ruff                    Lint + format                   0 warnings
                        (replaces Flake8 + Black)
mypy strict             Type check                      0 errors
pytest                  Unit + integration tests        100% pass
pytest-cov              Coverage                        >= 80% overall
                                                        >= 90% new code
pytest-asyncio          Async support for LangGraph     Required
moto (@mock_aws)        AWS service mocking             All AWS mocked
mutmut                  Mutation testing                >= 85% score
Snyk                    Dependency security             0 HIGH/CRITICAL
Semgrep                 Code security                   0 findings
```

---

## The pipeline — seven phases

Every story goes through seven phases. The pipeline structure is part
of the framework — it works with any language or stack.

```
PRODUCT MANAGER          AGENT                         HUMAN GATE
──────────────           ──────────────────────────    ──────────────────────

 Writes story      ───▶  PHASE 1                       ◀── GATE G1
                          Requirements ingestion          PM signs off stories
                          Parses story → JSON             before sprint starts
                          Flags ambiguities
                          Holds blocked stories
                                 │
                                 ▼
                          PHASE 2                       ◀── GATE G2
                          Story decomposition             Architect reviews
                          Breaks story into tasks         .plan files before
                          Writes .plan.md files           any code runs
                                 │
                                 ▼
                          PHASE 3
                          Environment setup
                          Creates feature branch
                          Runs pre-flight checks
                          Captures baseline snapshot
                                 │
                                 ▼
                          PHASE 4
                          Code generation loop
                          ┌──────────────────────────┐
                          │ 1. Write code             │
                          │ 2. Lint + format          │ ← fail: fix, restart
                          │ 3. Type / static check    │ ← fail: fix, restart
                          │ 4. Hallucination guard    │ ← fail: fix, restart
                          │ 5. Unit tests             │ ← fail: diagnose, fix
                          │ 6. All green → commit     │
                          │    Max 5 iterations       │
                          └──────────────────────────┘
                                 │
                                 ▼
                          PHASE 5
                          Test orchestration
                          Unit + integration tests
                          Regression diff vs baseline
                          Mutation testing
                          Coverage gates
                          Security scan
                          Evidence package generated
                                 │
                                 ▼
                          PHASE 6                       ◀── GATE G3
                          PR opened automatically         Developer reviews
                          PR body from evidence           Reads every line
                                                          Edits code directly
                                                          Approves or rejects
                                 │
                                 ▼
                          PHASE 7                       ◀── GATE G4 + G5
                          Deploy to staging               QA signs off evidence
                          Smoke tests + health report     Release Manager
                          Deploy to production            approves production
                          15-min health monitor
                          Auto-rollback if unhealthy
                          Close tickets + release notes
```

---

## The five human gates

The pipeline is autonomous between gates. Agents generate code, write
tests, self-heal failures, produce PR bodies, deploy to staging, and
close tickets. Humans own decisions. Agents own execution.

```
 GATE   OWNER               TIMING       WHAT THEY DECIDE
 ─────  ──────────────────  ───────────  ──────────────────────────────────────

  G1    Product Manager     Pre-sprint   Stories are complete and unambiguous.
                                         Nothing starts until this is signed.

  G2    Architect           Days 1–2     .plan files are structurally sound.
                                         Agent cannot write code without this.

  G3    Developer           Days 6–8     Code is correct and safe to merge.
                                         Full read, edit, approve, or reject.

  G4    QA / SDET           Day 9        Quality evidence is sufficient.
                                         Tests, coverage, security scan.

  G5    Release Manager     Day 10       Safe to deploy to production.
                                         Final go/no-go before prod.
```

**Gate G3 is the most important gate.** The developer reads every line,
edits code directly in the feature branch if needed, and approves or
rejects. The agent is accountable to the developer — not the other way
around.

---

## The team — seven people, previously twenty

Each person owns a clear domain. Agents handle execution volume.
Humans own decisions.

```
 ROLE               OWNS                           AGENT DOES FOR THEM
 ─────────────────  ─────────────────────────────  ────────────────────────────────

 Product Manager    Vision, stories, Gate G1        Parses requirements → JSON
                                                    Flags ambiguities
                                                    Holds blocked stories

 UX Designer        Mockups, design tokens          Generates components to spec
                    Component specifications         Runs WCAG checks
                                                    Responsive at 3 viewports

 Architect          ADRs, plan review, Gate G2       Codebase discovery
                                                    Risk surface analysis
                                                    Pattern mandate enforcement

 Developer          PR review, Gate G3              All code generation
                                                    Self-healing (5 retries)
                                                    PR body + evidence package

 QA / SDET          Test strategy, Gate G4           TDD test writing
                                                    Mutation testing
                                                    Regression runs
                                                    Security scanning

 DevOps             Infrastructure, environments    Staging deploy automation
                                                    Smoke tests + health checks

 Release Manager    Go/no-go, Gate G5               Production deployment
                                                    Auto-rollback on failure
                                                    Ticket closure, release notes
```

---

## Pipeline adoption stages

Not every team hands code generation to an agent on day one. Yooti
supports five stages. Start where your team is. Advance when ready.
The framework — not the RI toolchain — determines which stage you are on.

```
 STAGE 1 — FOUNDATION
 ─────────────────────────────────────────────────────────────────────
 Agent:   Parses stories → JSON. Flags ambiguities.
 Human:   Writes ALL code, tests, PRs, and deployments.
 For:     "We want the framework and CI. We code manually."

 STAGE 2 — BUILD
 ─────────────────────────────────────────────────────────────────────
 Agent:   Requirements parsing + story decomposition → .plan files.
 Human:   Writes code from plans, tests, PRs, and deployments.
 For:     "We trust agent planning. We write all the code."

 STAGE 3 — REVIEW  ← recommended starting point
 ─────────────────────────────────────────────────────────────────────
 Agent:   Requirements, planning, code, tests, PR body.
 Human:   Reviews every PR (G3). Controls ALL deployments.
 For:     "Agent codes. Humans approve. We control every deploy."

 STAGE 4 — DEPLOY
 ─────────────────────────────────────────────────────────────────────
 Agent:   Everything + automatic staging deploy after Gate G4.
 Human:   Approves production only (Gate G5).
 For:     "We trust code quality. We control production."

 STAGE 5 — AUTONOMOUS
 ─────────────────────────────────────────────────────────────────────
 Agent:   Full pipeline — all seven phases.
 Human:   Five decision gates only (G1, G2, G3, G4, G5).
 For:     "Maximum output. 7 people doing the work of 20."
```

```bash
yooti init my-product --stage 3     # set at init
yooti configure --stage 4           # advance any time
```

---

## What one command generates

### Framework components (all project types)

```
my-project/
├── .claude/                        ← Framework — language agnostic
│   ├── CLAUDE.md                   ← Master agent context
│   ├── agents/                     ← Five agent prompt files
│   └── rules/                      ← Scope + greenfield/brownfield rules
│
├── .agent/                         ← Framework — language agnostic
│   ├── examples/
│   ├── requirements/
│   ├── plans/
│   ├── snapshots/
│   └── evidence/
│
├── pipeline/                       ← Framework — language agnostic
│   ├── schemas/
│   └── scripts/
│
├── docs/                           ← Framework — language agnostic
│   ├── README.md
│   └── GATES.md
│
├── yooti.config.json               ← Framework config (toolchain defined here)
└── .env.example
```

### RI code layers (varies by project type)

```
TYPE: FULL                TYPE: WEB                 TYPE: AGENT
──────────────────────    ──────────────────────    ──────────────────────
services/api/             services/api/             agents/
  TypeScript + Node.js      TypeScript + Node.js      Python + LangGraph
                                                       + LangChain
frontend/dashboard/       frontend/dashboard/
  TypeScript + React        TypeScript + React       .env.example
                                                       (LLM + vector keys)
agents/                   batch/analytics/
  Python + LangGraph         Python + boto3          docker-compose.yml
  + LangChain                                          (agents + vector store)

batch/analytics/          docker-compose.yml
  Python + boto3            (api + frontend
                            + batch + pg + redis)
docker-compose.yml
  (all services)
```

---

## Greenfield vs Brownfield

```
 DIMENSION            GREENFIELD                    BROWNFIELD
 ──────────────────   ────────────────────────────  ─────────────────────────────
 Context flag         --context greenfield           --context brownfield
 First agent action   Scaffold project structure     Scan codebase → risk surface
 Architect gate G2    ADR + Pattern Mandate           Risk surface acceptance
 Code generation      Creative within mandate         Surgical — minimal diff
 Pre-modification     None — files are new            Char. tests required before
                                                      touching any file < 40% cov
 Test approach        Write from scratch, TDD         Append-only — never modify
                                                      existing passing tests
 Regression baseline  Grows sprint by sprint          Captured from existing suite
 Extra files          —                               risk-surface.json
                                                      baseline.json
                                                      characterisation templates
```

---

## Building with the agent scaffold (RI)

The RI ships a working LangGraph agent you copy to create new agents.
Not a starter template — a running service with correct architecture,
test structure, and observability wiring already in place.

### Create a new agent

```bash
cp -r agents/template-agent agents/my-new-agent

# 1. Define state — what data flows through the graph
#    Edit: agents/my-new-agent/state.py

# 2. Implement nodes — one focused action per file
#    Edit: agents/my-new-agent/nodes/

# 3. Wire the graph — connect nodes with edges
#    Edit: agents/my-new-agent/graph.py

# 4. Write tests before running (TDD applies to agents too)
pytest agents/my-new-agent/tests/unit/
```

### Three-layer agent testing

```
 LAYER 1 — UNIT TESTS
 ─────────────────────────────────────────────────────────────────────
 When:      Every commit
 LLM calls: None — all mocked
 Asserts:   Each node function works correctly in isolation

 LAYER 2 — INTEGRATION TESTS
 ─────────────────────────────────────────────────────────────────────
 When:      Every PR
 LLM calls: Mocked via patch()
 Asserts:   Full graph executes, state flows correctly end-to-end

 LAYER 3 — EVALS
 ─────────────────────────────────────────────────────────────────────
 When:      Nightly CI schedule only — never on every commit
 LLM calls: Real — costs money
 Asserts:   Output is non-empty, useful, stable across runs
```

| CI Job | Trigger | LLM calls | API keys |
|--------|---------|-----------|---------|
| `agent-unit` | Every push | None | No |
| `agent-integration` | Every PR | Mocked | No |
| `agent-evals` | Nightly | Real | Yes |

### Agent architecture principles

```
STATE IS IMMUTABLE
  Nodes return dicts of updated fields. Never mutate in place.
  Every node independently testable. Every run replayable.

ONE NODE, ONE RESPONSIBILITY
  A node doing two things should be two nodes.

ERRORS ARE STATE, NOT EXCEPTIONS
  Every node returns {"error": str(e)} on failure. Never raises.

PROMPTS ARE FILES, NOT STRINGS
  System prompts in prompts/ as versioned text files.
  Prompt changes go through PR review. Fully auditable.

STRUCTURED LOGGING ON EVERY NODE
  Every node logs entry and exit with structlog.

MULTI-AGENT COORDINATION NEEDS ARCHITECT REVIEW
  A graph calling another graph needs a human decision.
```

---

## Quality gates — enforced in CI on every PR

| Check | Tool (RI default) | Threshold | Blocks PR |
|-------|-------------------|-----------|-----------|
| Lint | ESLint / Biome / Ruff | 0 warnings | **Yes** |
| Type / static check | tsc / mypy / your tool | 0 errors | **Yes** |
| Unit tests | Vitest / pytest / your runner | 100% pass | **Yes** |
| Integration tests | Supertest / pytest / your runner | 100% pass | **Yes** |
| Coverage overall | Istanbul / pytest-cov | ≥ 80% | **Yes** |
| Coverage new code | Istanbul / pytest-cov | ≥ 90% | **Yes** |
| Regression diff | regression-diff.py | 0 newly failing | **Yes** |
| Accessibility | axe-core | 0 violations | **Yes** (frontend) |
| Responsive | Playwright × 3 viewports | 100% pass | **Yes** (frontend) |
| Security — deps | Snyk | 0 HIGH/CRITICAL | **Yes** |
| Security — code | Semgrep | 0 findings | **Yes** |
| Lighthouse perf | Lighthouse CI | ≥ 80 | **Yes** (frontend) |
| Lighthouse a11y | Lighthouse CI | ≥ 90 | **Yes** (frontend) |
| Mutation score | Stryker / mutmut | ≥ 85% | Warn — QA reviews |

The thresholds are part of the framework. The tools are RI defaults.
Teams using different stacks replace the tool column with their own
equivalents in `yooti.config.json`.

---

## Command reference

```bash
# Initialise a project
yooti init <n>                       # interactive wizard (recommended)
yooti init <n> --type full           # full product
yooti init <n> --type web            # web + API
yooti init <n> --type agent          # agents only
yooti init .                         # adopt existing repo (brownfield)

# Story management
yooti story:add                      # add and validate a user story

# Sprint management
yooti sprint:start                   # validate stories, capture baseline
yooti preflight                      # run pre-flight checks

# Task management
yooti task:add [story-id]            # add a task to a story (PM, Architect, Dev)
yooti task:list [story-id]           # list tasks and status

# Plan management
yooti plan:amend <task-id>           # amend scope, steps, or annotations
yooti plan:approve <story-id>        # sign off Gate G2 — architecture review

# Context injection
yooti context:add <story-id>         # attach context (URL, file, note, etc.)
yooti context:add <id> --url <url>   # attach a URL directly
yooti context:add <id> --file <path> # attach a local file
yooti context:add <id> --note <text> # attach a freeform note
yooti context:list <story-id>        # list all context for a story

# Corrections
yooti correct:inject <task-id>       # inject a correction mid-generation

# Test requirements
yooti test:require [story-id]        # add a test requirement (QA, Developer)

# Pipeline adoption
yooti configure                      # change stage interactively
yooti configure --stage 4            # change stage directly
```

### All flags for yooti init

```
--type <full|web|agent>
--context <greenfield|brownfield>
--stack <node,react,python>
--linter <eslint|biome>
--ci <github-actions|gitlab|none>
--deploy <docker|aws-ecs>
--agent <claude-code|codex|both>
--stage <1|2|3|4|5>                  default: 3
--agent-frameworks <langgraph,...>
--llm-provider <anthropic|openai|both>
--vector-store <pgvector|chroma|none>
--git-mode <init-commit|init-only|skip>
--no-git
--yooti-os
```

---

## Yooti OS (optional)

Yooti works completely standalone. Yooti OS is an optional layer that
adds behavioral quality monitoring using Statistical Process Control (SPC).
It tracks iteration counts, scope violations, test pass rates, coverage
deltas, and deployment success rates across every agent, story, and sprint.
When behavior drifts from baseline, Yooti OS surfaces it before it
becomes a problem.

Enable with `--yooti-os` at init, or set `yooti_os.enabled: true`
in `yooti.config.json` at any time.

---

## Requirements

| Tool | Version | Mac | Linux | Windows |
|------|---------|-----|-------|---------|
| Node.js | >= 20 | ✓ | ✓ | ✓ |
| Git | any | ✓ | ✓ | ✓ |
| Docker | any | ✓ | ✓ | ✓ (Docker Desktop) |
| Python | >= 3.12 | ✓ | ✓ | ✓ |
| Claude Code | any | ✓ | ✓ | ✓ |

Yooti runs natively on Mac, Linux, and Windows.
All pipeline scripts are Node.js or Python — no bash, no WSL, no Git Bash required.

**Windows install:**
```powershell
npm install -g @yooti/cli
yooti --version
```

**Mac / Linux install:**
```bash
npm install -g @yooti/cli
yooti --version
```

---

## License

MIT © Yooti
