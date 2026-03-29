# Yooti

### Ship products, not debugging sessions.

> **Yūti** (यूति) — Sanskrit for *joining, union, or mixture*.
> The blending of humans and agents — each doing what they do best.

---

## The problem

Small teams using AI agents ship fast. Then three months in, the codebase
is inconsistent, tests are missing or meaningless, every new feature breaks
two existing ones, and the team is debugging production at 2am instead of
building the next feature.

This is vibe coding debt. The faster you shipped without guardrails, the
slower you go now.

Yooti breaks the spiral.

---

## What Yooti is

Yooti is a Specification-Driven Development framework for teams. One command
installs a complete autonomous delivery pipeline — so your team ships features
using AI agents without accumulating the technical debt that slows you down later.

    Your team writes stories.
    The agent reads the spec, generates code, writes tests, and opens a PR.
    Your team reviews the output at five decision points.
    Clean, tested, consistent code ships to production.

Not because you have a QA team or a dedicated architect.
Because the pipeline enforces your standards automatically on every story.

---

## Ship fast AND ship clean

    VIBE CODING                       YOOTI
    ─────────────────────────────     ────────────────────────────────────
    Ship fast — fix later             Ship fast — already fixed
    Tests when you have time          Tests before every merge, always
    Consistent when you remember      Consistent by default — every story
    Security audit after incident     Security scan on every PR
    Debug production at 2am           Catch it in CI before it ships
    Technical debt compounds          Technical quality compounds
    Agent amplifies inconsistency     Agent amplifies your patterns
    Fear of touching working code     Confidence to ship on Friday

---

## How it works

Yooti implements the Specification-Driven Development loop with a governance
layer that makes it safe to run with a team:

    PHASE 1   You write a story. The agent validates it into a structured spec
              with Given/When/Then acceptance criteria and a Definition of Done.
              Ambiguities flagged before any code is written.

    PHASE 2   Agent breaks the story into tasks by layer, writes plan files.
              Architect reviews the plans. Gate G2 — plans must be approved
              before any code runs.

    PHASE 3   Feature branch created, pre-flight checks run, regression
              baseline captured. Automated.

    PHASE 4   Agent writes failing tests first (TDD), then implementation.
              Runs lint, type check, tests — self-heals up to 5 iterations.
              Escalates if it cannot converge.

    PHASE 5   Full test suite, coverage, regression diff, security scan,
              accessibility check, code audit against your coding patterns.
              Everything packaged into an evidence file before the PR opens.

    PHASE 6   Agent opens a PR with the complete evidence as the body.
              Developer reviews code, edits if needed, approves.
              Gate G3 — happens in GitHub, no extra CLI step.

    PHASE 7   Staging deploy, smoke tests, health report.
              Gate G5 — release manager approves production.

---

## The five human decisions

The pipeline stops at five points and waits for a human. These are the
decisions that require judgement. Everything else is automated.

    G1   PM — stories are complete and unambiguous before sprint starts
    G2   Architect — implementation plans are sound before code is written
    G3   Developer — code is correct and safe to merge (in GitHub)
    G4   QA — quality evidence is sufficient
    G5   Release Manager — safe to deploy to production

---

## What makes agent code consistent

The **constitution system** is the answer to vibe coding inconsistency.

Constitution files capture how your team writes code — security patterns,
test patterns, error handling, config rules, Docker port conventions —
and the agent reads them before writing any file.

    .claude/constitutions/
      security.md       No hardcoded secrets, parameterised queries, auth on endpoints
      testing.md        TDD, mocking rules, coverage thresholds
      python.md         Type hints, ruff, mypy strict
      react.md          Component patterns, axe-core in every test
      config.md         .env rules, pyproject.toml standards
      docker.md         Port matching, health checks, Dockerfile rules

You write the constitutions. The agent follows them. Every story, every sprint.
The codebase stays consistent even when the agent writes most of it.

---

## What Yooti installs

One command. Everything your team needs.

    Agent context         .claude/CLAUDE.md — phases, gates, rules, toolchain
    Coding constitutions  .claude/constitutions/ — your patterns, enforced
    Pipeline tooling      .agent/ — requirements, plans, evidence, gates, audit
    Pipeline scripts      preflight, snapshot, regression diff, PR body generator
    CI workflows          unit tests, security scan, mutation testing, G3 automation
    Docker infrastructure docker-compose.yml — full local stack
    Team playbooks        GATES.md, PROMPTS.md — exact prompts for every stage

---

## Adoption stages — start where your team is

You do not have to go all-in on Day 1.

    STAGE 1   Agent parses stories. Team writes all the code.
              Same workflow, better structure and CI.

    STAGE 2   Agent writes implementation plans. Team writes code from plans.

    STAGE 3   Agent writes code and tests. Team reviews PRs.  ← start here
              Recommended for most teams. Five gates, everything else automated.

    STAGE 4   Agent deploys to staging. Team approves production.

    STAGE 5   Agent runs all seven phases. Team owns five gates only.
              Write a story Monday. Review a PR Tuesday.

Trust builds incrementally. You advance a stage when your team is ready.
The governance layer is what makes Stage 5 safe to reach — not a barrier to it.

---

## Prerequisites

    yooti doctor    # checks everything and shows install instructions

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | >= 20 | Yooti CLI |
| Git | any | Version control |
| GitHub CLI (gh) | any | Automatic PR creation |
| Docker Desktop | any | Local stack |
| Python | >= 3.12 | Python layers + pipeline scripts |
| Claude Code | any | Code generation agent |

---

## Quick start

    npm install -g @yooti/cli
    yooti doctor                                    # verify prerequisites
    yooti init my-product                           # wizard — 2 minutes
    cd my-product
    docker compose up -d                            # full local stack
    yooti story:sample --app ecommerce --sprint 1  # 9 demo stories
    yooti story:approve --all                       # Gate G1
    yooti sprint:start                              # capture baseline

Then in Claude Code:

    Proceed to Phase 2 for all new stories.

---

## Command reference

### Project setup
    yooti doctor                          # check prerequisites
    yooti init [name]                     # scaffold new project
    yooti preflight                       # run pre-flight checks
    yooti configure                       # change adoption stage
    yooti snapshot [tag]                  # capture regression baseline

### Story management (PM — Gate G1)
    yooti story:add                       # add story — interactive wizard
    yooti story:approve --all             # Gate G1 — approve all stories
    yooti story:import --file path        # import from JSON file
    yooti story:sample --app ecommerce    # import demo stories

### Task and plan management (Architect — Gate G2)
    yooti task:add [id]                   # add a task mid-sprint
    yooti task:list [id]                  # list tasks and status
    yooti plan:review [id]                # interactive G2 review
    yooti plan:amend task-id              # amend scope or annotations

### Sprint management
    yooti sprint:start                    # preflight + baseline + validate
    yooti sprint:report                   # sprint summary
    yooti sprint:retro                    # sprint retrospective
    yooti sm:standup                      # daily standup from pipeline data

### QA (SDET — Gate G4)
    yooti qa:plan [id]                    # create QA test plan
    yooti qa:review [id]                  # Gate G4 — review evidence

### Corrections and context
    yooti correct:inject task-id          # inject a developer correction
    yooti context:add id --url <url>      # attach URL context
    yooti context:add id --note "..."     # attach a note
    yooti test:require [id]               # add QA test requirement

### Audit and reporting
    yooti audit id                        # full audit trail
    yooti audit id --gates                # gate decisions only
    yooti log:event [id]                  # manually log a pipeline event

---

## Ticket IDs — use your own convention

    STORY-001   BUG-042   FEAT-007   PROJ-123   ISS-007

All commands accept any format:

    yooti story:approve BUG-042
    yooti plan:review FEAT-007
    yooti story:sample --app ecommerce --prefix PROJ   # custom prefix

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

## Built-in demo app

    yooti story:sample --app ecommerce    # 13 stories, 2 sprints

Sprint 1: catalogue, product detail, registration, login, cart,
rate limiting, design system, layout, loading states.

Sprint 2: checkout, order history, search, admin.

---

## Framework vs Reference Implementation

The **framework** is language agnostic — the pipeline phases, human gates,
constitution system, and quality gates work with any stack.

The **Reference Implementation** is opinionated — TypeScript, React, Python,
LangGraph, PostgreSQL, Docker. A deliberate starting point, not a constraint.

If your team uses a different stack, adopt the framework in brownfield mode
and replace the RI layers with your own:

    yooti init . --context brownfield

---

## Yooti OS (optional)

Yooti works completely standalone. Yooti OS is an optional commercial layer
that adds Statistical Process Control monitoring — tracking agent iteration
counts, scope violations, test pass rates, and coverage deltas across every
story and sprint. Surfaces behavioral drift before it becomes a problem.

Enable: `yooti init my-product --yooti-os`

---

## License

MIT © Yooti
