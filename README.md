# Yooti

### Agile delivery with AI agents — stories, sprints, and human gates your team already knows.

> **Yūti** (यूति) — Sanskrit for *joining, union, or mixture*.
> The blending of humans and agents — each doing what they do best.

---

## What Yooti is

Yooti brings together two things your engineering team already knows:

**Agile delivery** — user stories, sprint cadence, PR review, and human
sign-off at the right moments.

**Specification-Driven Development** — the agent reads a precise spec,
generates the code, writes the tests, and proves the quality before
anyone reviews it.

Together they give you a pipeline where agents handle the execution
and your team handles the decisions — using the same roles and review
points your team already owns.

    Your team writes stories and approves them at sprint start.
    The agent reads the spec, writes the code and tests, opens the PR.
    Your architect, developer, QA, and release manager review at five gates —
    the same decisions they already make, now faster and better supported.

---

## The familiar agile workflow — accelerated

Yooti does not replace your agile process. It runs inside it.

    AGILE STEP                        WHAT CHANGES WITH YOOTI
    ───────────────────────────────   ────────────────────────────────────────
    PM writes user stories            Same — story:add wizard helps structure them
    Architect reviews the approach    Same — Gate G2, plan files make it faster
    Sprint starts                     Same — sprint:start captures the baseline
    Developer builds the feature      Agent builds it — developer reviews the PR
    QA verifies quality               Agent generates evidence — QA reviews it
    Code review                       Same — Gate G3, PR in GitHub as always
    Release to production             Same — Gate G5, release manager approves

The rhythm is the same. The standup still happens. The retro still happens.
The sprint report still shows what is done and what is not.
What changes is who does the building between your decision points.

---

## The five gates your team already owns

Gates are not new. Every agile team already has these decision points.
Yooti makes them explicit, logged, and enforced — so nothing slips through.

    GATE G1   Product Manager
              Before sprint: stories are complete, unambiguous, and ready to build
              Command: yooti story:approve --all

    GATE G2   Architect
              Before code: implementation plans are structurally sound
              Command: yooti plan:review STORY-001

    GATE G3   Developer
              Before merge: code is correct and safe to ship
              Where: GitHub — review the PR exactly as you do today

    GATE G4   QA / SDET
              Before release: quality evidence is sufficient
              Command: yooti qa:review STORY-001

    GATE G5   Release Manager
              Before production: safe to deploy
              Where: your existing release process

Nothing crosses a gate without a human choosing to let it through.
The agent executes everything between the gates. Humans own the gates.

---

## The problem it solves

Small teams using AI agents ship fast. Then three months in:

    Every feature is written differently — no consistent patterns
    Tests are missing or do not test anything meaningful
    New features break existing ones silently
    The agent compounds the inconsistency — it learned from the mess
    Debugging takes longer than building
    You are afraid to change anything that works

This is vibe coding debt. Shipping fast without guardrails is fast until
it is not. The cost comes later and it comes at the worst time.

Yooti installs the guardrails on Day 1. Not as process overhead — as automation.
Your coding standards are captured in constitution files. The agent reads them
before writing any file. Every story. Every sprint.
The codebase stays consistent even when the agent writes most of it.

**Ship fast AND ship clean. You do not have to choose.**

---

## How the pipeline runs

Seven phases inside your sprint. The gates are where your team decides.
Everything between is the agent's job.

    PHASE 1   Requirements
              Agent validates the story into a structured spec with
              Given/When/Then acceptance criteria and a Definition of Done.
              Ambiguities flagged before any code is written.

              ── GATE G1: PM confirms stories are ready ──────────────────

    PHASE 2   Task planning
              Agent breaks the story into tasks by layer — database, API,
              frontend. Writes a plan file for each task: which files it
              can touch, which are out of scope, what the steps are.
              Plans only — no code written yet.

              ── GATE G2: Architect confirms plans are sound ─────────────

    PHASE 3   Environment setup
              Feature branch created, pre-flight checks run, regression
              baseline captured. Fully automated.

    PHASE 4   Build
              Agent writes failing tests first (TDD — always), then
              implementation. Runs lint, type check, tests — self-heals
              up to 5 iterations. Escalates if it cannot converge.

    PHASE 5   Quality check
              Full test suite, coverage report, regression diff against
              baseline, security scan, accessibility check, code audit
              against your coding standards. All packaged into an evidence
              file. No PR opens until every hard check passes.

    PHASE 6   Review
              Agent opens a PR with the complete quality evidence as the body.
              Developer reads the code, edits if needed, approves or rejects.

              ── GATE G3: Developer reviews and merges in GitHub ─────────
              ── GATE G4: QA reviews quality evidence ────────────────────

    PHASE 7   Ship
              Staging deploy, smoke tests, health report generated.

              ── GATE G5: Release Manager approves production ─────────────

---

## Adoption stages — how much you hand to the agent

This is where Yooti differs from tools that assume you go all-in on Day 1.
You choose how much the agent does. You advance one stage at a time.

    STAGE 1   Foundation
              Agent parses and validates your stories.
              Your team writes all the code — same as today.
              Better CI and structure from Day 1.

    STAGE 2   Planning
              Agent writes the task plans. Your team writes the code from them.
              Architect reviews plans at Gate G2. Nothing changes about
              who writes code — the plans just make it faster.

    STAGE 3   Review  ← where most teams start
              Agent writes the code and tests.
              Your developer reviews the PR at Gate G3.
              Your team controls every deployment.
              Five decisions per story. Everything between them is automated.

    STAGE 4   Deploy
              Agent deploys to staging automatically.
              Your release manager approves production only.

    STAGE 5   Autonomous
              Agent runs all seven phases.
              Write a story Monday. Review a PR Tuesday.
              Your team owns five gate decisions — nothing else.

Start at Stage 3. Advance when your team is ready. The gates stay the same
at every stage. What changes is how much the agent does between them.

---

## What keeps the code consistent — the constitution system

The constitution files are how Yooti prevents vibe coding debt.

Your team writes them once. The agent reads them before writing any file.
They capture how your team writes code — not generic rules imposed on you.

    .claude/constitutions/
      security.md    No hardcoded secrets, parameterised queries, auth on every endpoint
      testing.md     TDD mandate, mocking rules, coverage thresholds
      python.md      Type hints, ruff, mypy strict
      react.md       Component patterns, axe-core in every component test
      config.md      .env conventions, pyproject.toml standards
      docker.md      Port matching between .env and docker-compose, health checks

When the agent violates a constitution, Phase 5 catches it before the PR opens.
Not a hope — an automated check.

---

## Prerequisites

    yooti doctor    # checks everything — shows install instructions per platform

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | >= 20 | Yooti CLI |
| Git | any | Version control |
| GitHub CLI (gh) | any | Automatic PR creation |
| Docker Desktop | any | Local stack |
| Python | >= 3.12 | Python layers + pipeline scripts |
| Claude Code | any | Code generation agent |

    # Mac
    brew install node@20 git gh python@3.12
    npm install -g @anthropic-ai/claude-code @yooti/cli

    # Windows
    winget install OpenJS.NodeJS.LTS Git.Git GitHub.cli Python.Python.3.12
    npm install -g @anthropic-ai/claude-code @yooti/cli

---

## Quick start

    yooti doctor                                    # verify prerequisites
    yooti init my-product                           # wizard — 2 minutes
    cd my-product
    docker compose up -d                            # full local stack
    yooti story:sample --app ecommerce --sprint 1  # 9 demo stories
    yooti story:approve --all                       # Gate G1 — PM approves
    yooti sprint:start                              # baseline captured

Then in Claude Code:

    Proceed to Phase 2 for all new stories.

That is the entire sprint setup. The pipeline takes it from there.

---

## Command reference

### Project setup
    yooti doctor                          # check prerequisites
    yooti init [name]                     # scaffold — interactive wizard
    yooti preflight                       # run pre-flight checks
    yooti configure                       # change adoption stage
    yooti snapshot [tag]                  # capture regression baseline

### Story management (PM — Gate G1)
    yooti story:add                       # add story — wizard
    yooti story:approve --all             # Gate G1 — approve all stories
    yooti story:import --file path        # import stories from JSON
    yooti story:sample --app ecommerce    # import built-in demo stories

### Task and plan management (Architect — Gate G2)
    yooti task:add [id]                   # add task mid-sprint
    yooti task:list [id]                  # list tasks and status
    yooti plan:review [id]                # interactive G2 review — walks each task
    yooti plan:amend task-id              # amend scope or annotations

### Sprint management
    yooti sprint:start                    # preflight + baseline + validate
    yooti sprint:report                   # sprint summary with DoD status
    yooti sprint:retro                    # retrospective
    yooti sm:standup                      # daily standup from pipeline data

### QA (SDET — Gate G4)
    yooti qa:plan [id]                    # create QA test plan
    yooti qa:review [id]                  # Gate G4 — review evidence

### Corrections and context
    yooti correct:inject task-id          # inject a developer correction
    yooti context:add id --url <url>      # attach URL as context for agent
    yooti context:add id --note "..."     # attach a freeform note
    yooti test:require [id]               # add QA test requirement

### Audit and reporting
    yooti audit id                        # full audit trail for a story
    yooti audit id --gates                # gate decisions only
    yooti log:event [id]                  # manually log a pipeline event

---

## Ticket IDs — use your own convention

Yooti accepts any format your team already uses:

    STORY-001   BUG-042   FEAT-007   PROJ-123   ISS-007

    yooti story:sample --app ecommerce --prefix PROJ
    # Imports as PROJ-001, PROJ-002 etc.

---

## Quality gates — enforced in CI on every PR

| Check | Threshold | Blocks PR |
|-------|-----------|-----------|
| Lint | 0 warnings | Yes |
| Type check | 0 errors | Yes |
| Unit tests | 100% pass | Yes |
| Coverage overall | >= 80% | Yes |
| Coverage new code | >= 90% | Yes |
| Regression diff | 0 newly failing | Yes |
| Security deps (Snyk) | 0 HIGH/CRITICAL | Yes |
| Security code (Semgrep) | 0 findings | Yes |
| Accessibility | 0 violations | Yes (frontend) |
| Code audit vs constitutions | 0 violations | Yes |
| Mutation score | >= 85% | Warn |

---

## Built-in demo — ecommerce app

    yooti story:sample --app ecommerce            # all 13 stories
    yooti story:sample --app ecommerce --sprint 1 # Sprint 1 — 9 stories

Sprint 1: catalogue, product detail, registration, login, cart,
rate limiting, design system, layout, loading states.
Sprint 2: checkout, order history, search, admin.

Run a full sprint in the demo app to see the pipeline before using it
on your own product.

---

## Framework vs Reference Implementation

The **framework** is language agnostic — the pipeline, gates, constitutions,
and quality standards work with any stack.

The **Reference Implementation** ships TypeScript, React, Python, LangGraph,
PostgreSQL, and Docker. An opinionated starting point so you are productive
in hours not weeks.

Using a different stack? Brownfield mode adds the framework without the RI:

    yooti init . --context brownfield

---

## Yooti OS (optional)

Yooti works completely standalone. Yooti OS is an optional commercial layer
that adds Statistical Process Control monitoring — tracking agent behavior
trends across every story and sprint. Surfaces drift before it becomes a problem.

    yooti init my-product --yooti-os

---

## License

MIT © Yooti