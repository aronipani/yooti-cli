# Yooti

### Agile delivery with AI agents — stories, sprints, and human gates your team already knows.

> **Yūti** (यूति) — Sanskrit for *joining, union, or mixture*.
> The blending of humans and agents — each doing what they do best.

---

## What Yooti is

Yooti brings together two things your engineering team already knows:

**Agile delivery** — user stories, sprint cadence, PR review, and human
sign-off at the right decision points.

**Specification-Driven Development** — the agent reads a precise spec,
generates the code, writes the tests, and proves the quality before
anyone reviews it.

Together they give you a pipeline where agents handle the execution and
your team handles the decisions — using the same roles and review points
your team already owns.

Works with your existing codebase. Works with any language or framework.
Works with your existing Jira or Linear tickets.

---

## Who this is for

    Already have a codebase?      Start here → Minimum Viable Setup (3 steps)
    Starting a new project?       Start here → Quick start
    Evaluating the framework?     Start here → The five gates
    Want to see it running?       Start here → Demo app

---

---

## Minimum Viable Setup — 3 steps

The fastest path to running Yooti on your existing project.
No Docker required. No sample app. No 13 stories.
Just your codebase, one constitution, and your next ticket.

**Step 1 — Install and initialise**

    npm install -g @yooti/cli
    cd your-existing-project
    yooti init . --context brownfield

This adds only the framework files. Nothing in your existing codebase
is touched — no source files, no tests, no configuration.

What gets added:

    .claude/CLAUDE.md          Agent context — phases, gates, rules
    .claude/constitutions/     Your coding standards (you write these)
    .agent/                    Pipeline artifacts — stories, plans, gates
    pipeline/scripts/          Preflight, snapshot, regression diff
    docs/GATES.md              Gate criteria for your team
    docs/PROMPTS.md            Exact prompts for every pipeline stage

**Step 2 — Write one constitution for your main language**

    cat > .claude/constitutions/global.md << 'EOF'
    # Global Constitution
    # The agent reads this before writing any code in this project.

    ## Standards that apply to every file in every language

    TESTS
    - Every new function has a unit test before implementation (TDD)
    - No new library or dependency without Gate G2 approval
    - Tests must assert behaviour — not just that code runs

    SECURITY
    - No secrets, passwords, or API keys in code or config files
    - All external input is validated before use
    - Errors never expose internal details, stack traces, or file paths

    CODE QUALITY
    - Every public function has a doc comment
    - No commented-out code blocks in production files
    - All configuration via environment variables — never hardcoded

    SCOPE
    - Only modify files listed in the task plan
    - If a file outside scope is needed, escalate — do not touch it

    ## Language-specific additions
    # Add your language here — or create a separate constitution file:
    # .claude/constitutions/python.md
    # .claude/constitutions/java.md
    # .claude/constitutions/go.md
    EOF

**Step 3 — Add your next ticket as a story**

    yooti story:add

The wizard asks for the story ID (your Jira/Linear ticket number works),
title, acceptance criteria, and priority. Takes 3 minutes.

Then approve it and start the sprint:

    yooti story:approve PROJ-123
    yooti sprint:start

Then in Claude Code:

    Proceed to Phase 2 for PROJ-123.

That is it. The pipeline runs from there.

---

---

## The five gates — a philosophy, not just commands

The gates are the core of the Yooti framework. They are not CLI features —
they are a philosophy about where human judgement belongs in an AI-assisted
delivery pipeline.

**The principle:** Agents handle execution. Humans handle decisions.
The gates are the five decision points where human judgement is irreplaceable.
Everything between them is the agent's job.

---

**Gate G1 — The PM decides stories are ready**

Before any code is written, a human confirms the stories are complete,
unambiguous, and ready to build. Not the agent — the PM. Agents do not
decide what to build. People do.

    Philosophy:  Nothing starts without explicit human intent
    In practice: yooti story:approve --all
    Or manually: create .agent/gates/[ID]-G1-approved.md

---

**Gate G2 — The Architect decides plans are sound**

Before any code is written, a human reviews the implementation plan.
The plan says which files the agent can touch, which are out of scope,
and what the steps are. The architect approves or corrects it.

    Philosophy:  Humans own the architecture. Agents execute it.
    In practice: yooti plan:review PROJ-123
    Or manually: create .agent/gates/[ID]-G2-approved.md

---

**Gate G3 — The Developer decides code is correct**

The agent opens a PR with the complete quality evidence as the body.
The developer reads the code, edits if needed, and approves or rejects.
Gate G3 is not a command — it is the PR review that already happens in GitHub.

    Philosophy:  A human must read and approve every line before it ships
    In practice: Review and merge the PR in GitHub — no CLI command needed
    Automated:   Merging the PR creates the gate file automatically

---

**Gate G4 — QA decides quality evidence is sufficient**

The agent generates a complete evidence package before any PR opens:
test results, coverage, regression diff, security scan, accessibility check,
code audit against your constitutions. QA reviews this evidence and decides
if the quality bar has been met.

    Philosophy:  Quality is verified, not assumed
    In practice: yooti qa:review PROJ-123
    Or manually: review .agent/evidence/[ID]/ and create the gate file

---

**Gate G5 — The Release Manager decides it is safe to ship**

After staging deploy and smoke tests, a human approves production.
No agent deploys to production without explicit human approval.

    Philosophy:  Production is always a human decision
    In practice: create .agent/gates/[ID]-G5-approved.md
    Or automated: wire to your existing release approval workflow

---

**The gates work without the CLI.** The CLI makes them faster. But a team
can run the full framework using only markdown files in .agent/gates/.
The agent checks for those files. The CI checks for those files. The
sprint report reads those files. The tool is the philosophy — the CLI
is the convenience layer on top.

---

---

## Adding Yooti to your existing project

Most professional teams are not starting from scratch. This is the
brownfield path — Yooti wraps around your existing codebase.

---

### What brownfield mode does

    yooti init . --context brownfield

Adds the framework overlay only. Does not touch:
- Any existing source files
- Any existing tests
- Any existing CI configuration
- Any existing configuration files

What it adds:

    .claude/          Agent context and your constitutions
    .agent/           Pipeline artifacts — stories, plans, gates, evidence
    pipeline/         Preflight and regression scripts
    docs/             GATES.md and PROMPTS.md for your team

---

### Mapping your existing process to Yooti gates

You likely already have informal versions of all five gates.
Yooti makes them explicit and automated.

    YOUR EXISTING PROCESS              YOOTI EQUIVALENT
    ───────────────────────────────    ──────────────────────────────────
    PM approves sprint backlog         Gate G1 — story:approve --all
    Architect review in planning       Gate G2 — plan:review [ticket]
    PR review + approval               Gate G3 — happens in GitHub as always
    QA sign-off or testing done        Gate G4 — qa:review [ticket]
    Release approval / change control  Gate G5 — gate file or your process

---

### Mapping your Jira or Linear tickets

Your existing ticket IDs work directly as Yooti story IDs:

    yooti story:add
    # Story ID: PROJ-123      ← your Jira ticket number
    # Title:    [ticket title]
    # AC:       [from the ticket description]

Or import a whole sprint from your existing tickets as a JSON file:

    yooti story:import --file this-sprint.json

Format:

    [
      {
        "story_id": "PROJ-123",
        "title": "As a user I want to reset my password",
        "type": "feature",
        "priority": "P0",
        "acceptance_criteria": [
          {
            "id": "AC-1",
            "given": "a user who has forgotten their password",
            "when": "they submit their email address",
            "then": "they receive a reset link within 60 seconds"
          }
        ]
      }
    ]

---

### Writing constitutions for your existing stack

The constitution files capture how your team writes code. You write them.
The agent follows them. They are the answer to vibe coding inconsistency.

**Generic template — works for any language:**

    # .claude/constitutions/global.md

    ## Principles that apply to every file

    TESTS
    - Every new function has a unit test before implementation (TDD)
    - No external service calls in unit tests — mock everything
    - Tests assert observable behaviour, not implementation details
    - No new dependency without Gate G2 approval

    SECURITY
    - No secrets, passwords, or tokens in any code or config file
    - All user input validated before use
    - Error messages never expose stack traces or file paths

    QUALITY
    - Every public function has a doc comment
    - No commented-out code in production files
    - All config from environment variables — never hardcoded values

    SCOPE
    - Only touch files listed in the task plan (CREATE or MODIFY)
    - If a file outside scope is needed: escalate, do not touch it

**Language-specific additions — add as separate files:**

    # .claude/constitutions/java.md
    - Use constructor injection — never field injection (@Autowired on field)
    - Every @Service has a corresponding interface
    - Repository methods return Optional<T> for nullable results
    - No raw SQL — use JPA/QueryDSL

    # .claude/constitutions/go.md
    - Errors are values — always check, never ignore
    - No global state — pass dependencies explicitly
    - Table-driven tests for all pure functions
    - Interfaces defined at the point of use, not the point of implementation

    # .claude/constitutions/ruby.md
    - No callbacks in ActiveRecord models — use service objects
    - RSpec — describe/context/it format always
    - No N+1 queries — use includes() or eager_load()
    - ENV[] for all configuration — never Rails.application.config directly

Reference them in .claude/CLAUDE.md:

    Global rules:   .claude/constitutions/global.md
    Java + Spring:  .claude/constitutions/java.md

---

### Setting the adoption stage for your team

Start at the stage that matches your team's current comfort with AI agents:

    yooti configure --stage 2

    Stage 1 — Agent parses stories, your team writes all code
    Stage 2 — Agent writes task plans, your team writes code
    Stage 3 — Agent writes code and tests, your team reviews PRs
    Stage 4 — Agent deploys to staging, team approves production
    Stage 5 — Agent runs everything, team owns five gates

Most teams adopting into an existing codebase start at Stage 1 or 2.
Build a test baseline. Learn the gate rhythm. Advance when ready.

---

---

## The problem Yooti solves

Small teams using AI agents ship fast. Then three months in:

    Every feature written differently — no consistent patterns
    Tests missing or not testing anything meaningful
    New features break existing ones silently
    The agent compounds the inconsistency — it learned from the mess
    Debugging takes longer than building

This is vibe coding debt. Shipping without guardrails is fast until it is not.

Yooti installs the guardrails. Not as overhead — as automation.
Your standards in constitution files. The agent reads them before every file.
Every story. Every sprint. Codebase stays consistent even when the agent
writes most of it.

**Ship fast AND ship clean. You do not have to choose.**

---

---

## How the pipeline runs

Seven phases inside your sprint. Gates are where your team decides.
Everything between them is the agent's job.

    PHASE 1   Requirements
              Agent validates the story into a structured spec.
              Acceptance criteria in Given/When/Then format.
              Ambiguities flagged before any code is written.
              ── Gate G1 ─────────────────────────────────────────────────

    PHASE 2   Task planning
              Agent breaks the story into tasks by layer — database, API,
              frontend. Plan file per task: scope, steps, dependencies.
              Plans only — no code yet.
              ── Gate G2 ─────────────────────────────────────────────────

    PHASE 3   Environment setup
              Feature branch, pre-flight checks, regression baseline.
              Fully automated.

    PHASE 4   Build
              Agent writes failing tests first (TDD — always), then
              implementation. Self-heals up to 5 iterations.
              Escalates if it cannot converge.

    PHASE 5   Quality check
              Full test suite, coverage, regression diff, security scan,
              accessibility, code audit against constitutions.
              No PR opens until every hard check passes.

    PHASE 6   Review
              PR opened with complete evidence package as the body.
              Developer reads code, edits, approves or rejects.
              ── Gate G3 (GitHub) → Gate G4 ──────────────────────────────

    PHASE 7   Ship
              Staging deploy, smoke tests, health report.
              ── Gate G5 ─────────────────────────────────────────────────

---

---

## Quick install

    # 1. Install the core engine
    npm install -g @anthropic-ai/claude-code @yooti/cli

    # 2. Verify your environment
    yooti doctor

The doctor command checks every prerequisite and outputs a copy-paste
install command for anything missing. Fix everything it flags before continuing.

---

## Choose your entry point

| I want to... | Run this |
|-------------|----------|
| See a full demo — ecommerce app built from scratch | `yooti init my-demo` then follow Path A in Getting Started |
| Add Yooti to my existing project right now | `yooti init . --context brownfield` then follow Path B |
| Just try the planning engine on one ticket | `yooti story:add --title "Test Story"` |

---

## Path A — Full demo (new project)

    yooti init my-product                           # wizard — 2 minutes
    cd my-product
    docker compose up -d                            # full local stack
    yooti story:sample --app ecommerce --sprint 1  # 9 demo stories
    yooti story:approve --all                       # Gate G1
    yooti sprint:start                              # baseline captured

Then in Claude Code:

    Proceed to Phase 2 for all new stories.

---

## Path B — Integration (existing project)

    cd your-existing-project
    yooti init . --context brownfield              # adds framework only
    # Write .claude/constitutions/global.md        # your coding standards
    yooti story:add                                 # add your next ticket
    yooti story:approve --all
    yooti sprint:start

Then in Claude Code:

    Proceed to Phase 2 for [your-ticket-id].

---

---

## Command reference

### Project setup
    yooti doctor                          # check prerequisites
    yooti init [name]                     # new project — wizard
    yooti init . --context brownfield    # adopt existing project
    yooti preflight                       # run pre-flight checks
    yooti configure                       # change adoption stage

### Story management (Gate G1)
    yooti story:add                       # add story — wizard
    yooti story:approve --all             # Gate G1 — approve all stories
    yooti story:import --file path        # import from JSON (Jira export etc)
    yooti story:sample --app ecommerce    # import built-in demo stories

### Task and plan management (Gate G2)
    yooti task:add [id]                   # add task mid-sprint
    yooti task:list [id]                  # list tasks and status
    yooti plan:review [id]                # interactive G2 walk-through
    yooti plan:amend task-id              # amend scope or add annotations

### Sprint management
    yooti sprint:start                    # preflight + baseline + validate
    yooti sprint:report                   # sprint summary with DoD status
    yooti sprint:retro                    # retrospective
    yooti sm:standup                      # daily standup from pipeline data

### QA (Gate G4)
    yooti qa:plan [id]                    # create QA test plan
    yooti qa:review [id]                  # Gate G4 — review evidence

### Corrections and context
    yooti correct:inject task-id          # inject a developer correction
    yooti context:add id --url <url>      # attach URL for agent to read
    yooti context:add id --note "..."     # attach a note or constraint
    yooti test:require [id]               # add a QA test requirement

### Audit
    yooti audit id                        # full audit trail for a story
    yooti audit id --gates                # gate decisions only

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

Thresholds are configurable in yooti.config.json. The tools are the RI
defaults — teams on other stacks replace them with equivalents.

---

## Reference Implementation — opinionated starting point

The RI ships a pre-wired stack for teams starting from scratch:

    Frontend      TypeScript + React 18 + Vite + shadcn/ui + Tailwind
    API           TypeScript + Node.js 20 + Fastify + PostgreSQL
                  OR Python 3.12 + FastAPI + SQLAlchemy
    Agents        Python 3.12 + LangGraph + LangChain
    Database      PostgreSQL 16 + pgvector + Redis 7
    CI            GitHub Actions — tests, security, mutation testing
    Containers    Docker + docker-compose

The framework works with any stack. The RI is one opinionated choice
that gets you productive in hours — not weeks.

---

## Customising for your stack

The Reference Implementation uses TypeScript, React, Python, and Docker.
Your stack is different. That is expected.

See [docs/CUSTOMISING.md](docs/CUSTOMISING.md) for:
- How to wire Go, Java, Ruby, .NET, or any other stack into the pipeline
- Stack-specific constitution templates
- How to swap the RI test runners for your own
- The integration mapping table (your tools → Yooti phases)
- Complete examples for Go + Gin, Java + Spring, Ruby + Rails, .NET + C#

The short version:

    # Update yooti.config.json with your tools
    {
      "toolchain": {
        "api": {
          "lint_command":  "golangci-lint run ./...",
          "test_command":  "go test ./...",
          "test_coverage": "go test ./... -cover"
        }
      }
    }

    # Write a constitution for your language
    cat > .claude/constitutions/go.md

    # Everything else stays the same

---

## Yooti OS (optional)

Yooti works completely standalone. Yooti OS is an optional commercial layer
that adds Statistical Process Control monitoring of agent behavior across
every story and sprint. Surfaces drift before it becomes a problem.

    yooti init my-product --yooti-os

---

## License

MIT © Yooti
