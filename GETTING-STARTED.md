# Yooti — Getting Started Guide

> **Yūti** (यूति) — Sanskrit for *joining, union, or mixture*.
> The act of bringing things together — humans and agents, each doing what they do best.

---

## Choose your path

    PATH A — The Full Tour
    "I want to see Yooti build a complete app from scratch."
    Time: 2-3 hours | Audience: developers learning the mechanics
    → Jump to Module 01-A

    PATH B — The Integration
    "I want to add Yooti's gates to my existing project right now."
    Time: 30 minutes | Audience: tech leads evaluating adoption cost
    → Jump to Module 01-B

    PATH C — The Team Rollout
    "My team is adopting Yooti this sprint. We need role-specific guidance."
    Time: 20 min together + 20 min per role | Audience: whole team on Day 1
    → Start with Module 00 (whole team), then each person reads their module

---

## Module index

    MODULE    ROLE / PATH           READ TIME    WHEN
    00        Whole team            20 minutes   Day 1 — read together
    01-A      Tech Lead (Full Tour) 45 minutes   Path A — new project
    01-B      Tech Lead (Integrate) 30 minutes   Path B — existing project
    02        Product Manager       20 minutes   Day 1 afternoon
    03        Architect             25 minutes   Day 1 afternoon
    04        Developer             30 minutes   Day 1 afternoon
    05        QA / SDET             20 minutes   Day 1 afternoon
    06        DevOps                20 minutes   Day 1 afternoon
    08        Whole team            15 minutes   When advancing stages
    09        Whoever needs it      As needed    When something goes wrong

---

---

# MODULE 00 — The whole team

## What Yooti is and how your team fits into it

**Read together. 20 minutes.**

---

### The core idea

Yooti combines two things your team already knows:

**Agile delivery** — user stories, sprint cadence, PR review, and human
sign-off at the right decision points.

**Specification-Driven Development** — the agent reads a precise spec,
generates the code and tests, proves quality before review.

Together: agents handle the execution between your decision points.
Your team handles the decisions — using the same roles they already own.

---

### The five gates — your decision points

Gates are not new. Every agile team already has these decision points.
Yooti makes them explicit, signed, and enforced.

    GATE G1   Product Manager
              Before sprint: stories are complete and ready to build
              Philosophy: nothing starts without explicit human intent

    GATE G2   Architect
              Before code: implementation plans are structurally sound
              Philosophy: humans own the architecture, agents execute it

    GATE G3   Developer
              Before merge: code is correct and safe to ship
              Philosophy: a human must approve every line before it ships
              Where: GitHub — review and merge the PR as you do today

    GATE G4   QA / SDET
              Before release: quality evidence is sufficient
              Philosophy: quality is verified, not assumed

    GATE G5   Release Manager
              Before production: safe to deploy
              Philosophy: production is always a human decision

The gates are a philosophy first. The CLI commands are the convenience
layer on top. A team can run the full framework using only markdown files
in .agent/gates/ — the CLI is not mandatory.

---

### The adoption stages

You choose how much the agent does. You advance one stage at a time.

    STAGE 1   Agent parses stories. Your team writes all the code.
    STAGE 2   Agent writes plans. Your team writes code from them.
    STAGE 3   Agent writes code and tests. Your team reviews PRs.  ← start here
    STAGE 4   Agent deploys to staging. Team approves production.
    STAGE 5   Agent runs everything. Team owns five gates only.

---

### Your team map

    ROLE                  GATE     MODULE    TIME PER STORY
    Product Manager       G1       02        20 min writing + 10 min review
    Architect             G2       03        30 min plan review
    Developer             G3       04        45 min PR review
    QA / SDET             G4       05        20 min evidence review
    DevOps                support  06        Setup, then on-call
    Release Manager       G5       06        10 min deploy approval
    Tech Lead             setup    01-A/B    Day 1 setup, then G3 too

Now each person reads their own module.

---

---

# MODULE 01-A — Tech Lead (Full Tour)

## New project — see the full pipeline running

**Path A: starting fresh, want to see the complete demo. 45 minutes.**

---

### Step 1 — Check prerequisites

    yooti doctor

This is your most important first command. It checks every engine
requirement and outputs copy-paste install commands for anything missing.

    ◆ Yooti Doctor — prerequisite check

      ✓ Node.js 20.11.0
      ✓ Git 2.43.0
      ✓ GitHub CLI 2.45.0
      ✗ Python — not found
        Install: brew install python@3.12
      ✓ Docker 25.0.3
      ✓ Claude Code 1.2.0

      1 prerequisite missing. Install it then run: yooti doctor

Fix anything missing. Run yooti doctor again until everything is green.

---

### Step 2 — Understand what you are installing

Yooti has two layers:

    FRAMEWORK (language agnostic)
    .claude/CLAUDE.md, .agent/, pipeline/, docs/
    Works with any language. This is the pipeline.

    REFERENCE IMPLEMENTATION (opinionated)
    services/, frontend/, agents/, docker-compose.yml
    TypeScript + React + Python + LangGraph + PostgreSQL.
    A starting point — not a requirement.

The Full Tour uses both. Path B (Module 01-B) uses only the framework.

---

### Step 3 — Run the wizard

    yooti init my-product

Eight questions. Two minutes.

    Project name:     my-product
    Project type:     full (Frontend + API + Agents + Batch)
    Context:          greenfield (new project)
    Stack:            node, react, python
    Linter:           eslint
    CI:               github-actions
    Stage:            3 (recommended starting point)
    Agent:            claude-code

---

### Step 4 — Start the local stack

    cd my-product
    cp .env.example .env
    # Add your API keys — ANTHROPIC_API_KEY at minimum

    docker compose up -d
    docker compose ps     # all services should show: healthy

---

### Step 5 — Run preflight

    yooti preflight

Expected:

    ✓ Git repository exists
    ✓ Working tree is clean
    ✓ docker-compose.yml exists
    ✓ .claude/CLAUDE.md exists
    ✓ yooti.config.json is valid
    ✓ Pipeline scripts exist
    ✓ Example artifacts exist
    7/7 checks passed

---

### Step 6 — Import the demo app stories

    yooti story:sample --app ecommerce --sprint 1
    # Imports 9 Sprint 1 stories

    yooti story:approve --all
    # Gate G1 — PM approves all stories

    yooti sprint:start
    # Runs preflight, captures regression baseline

---

### Step 7 — Open Claude Code and start the pipeline

Open VS Code in the project. Claude Code reads .claude/ automatically.

    Proceed to Phase 2 for all new stories.

The agent generates plan files in .agent/plans/ — one per task. No code yet.

---

### Step 8 — Architect reviews plans at Gate G2

    yooti plan:review STORY-001
    # Walks through each task interactively
    # Approve, annotate, or request revision

    yooti plan:review STORY-002
    # Repeat for each story

---

### Step 9 — Generate code

Back in Claude Code:

    Proceed to Phase 4 for all approved stories in dependency order.

Agent writes tests first (TDD), then implementation. Self-heals up to
5 iterations. Opens PRs when Phase 5 evidence is complete.

---

### Step 10 — Review PRs and run G4

For each PR in GitHub: review the code, approve, merge.

Then:

    yooti qa:review STORY-001
    # Gate G4 — reads evidence package, runs checklist

---

### Step 11 — Hand off to the team

Send each person their module number from the Module Index above.
Your role from here is Gate G3 (code review) plus unblocking escalations.

---

---

# MODULE 01-B — Tech Lead (Integration)

## Existing project — add Yooti's gates in 30 minutes

**Path B: you have a codebase. You want the pipeline around it. 30 minutes.**

---

### What this does to your existing code

Nothing. `yooti init . --context brownfield` adds only framework overlay files.

It does NOT touch:
- Any existing source files
- Any existing tests
- Any existing CI configuration
- Any existing package.json, Gemfile, pom.xml, go.mod etc.

What it adds:

    .claude/          Agent context + constitutions (you write these)
    .agent/           Pipeline artifacts — stories, plans, gates, evidence
    pipeline/         Preflight and regression scripts
    docs/             GATES.md and PROMPTS.md for your team
    yooti.config.json Configuration
    .env.example      Environment variable template

---

### Step 1 — Check engine prerequisites

    yooti doctor

Your application's stack is irrelevant here. The engine needs:
- Node.js >= 20 (runs the CLI)
- Python >= 3.12 (runs three pipeline scripts)
- Git (version control)
- Claude Code (code generation agent)

Docker is optional in brownfield mode if you run your own services.

---

### Step 2 — Install the framework

    cd your-existing-project
    yooti init . --context brownfield

The wizard asks about your existing stack so it can generate the right
constitution stubs. Answer honestly — it does not change what it installs,
only what it pre-populates in the constitution files.

---

### Step 3 — Write your global constitution

The most important file in the framework. Open it and fill it in:

    code .claude/constitutions/global.md

Template:

    # Global Constitution
    # The agent reads this before writing any code.
    # These rules apply to every file in every language.

    ## Tests
    - Every new function has a unit test before implementation (TDD)
    - No external service calls in unit tests — mock everything
    - No new dependency without Gate G2 approval

    ## Security
    - No secrets, passwords, or tokens in any code or config file
    - All user input validated before use
    - Errors never expose stack traces or file paths

    ## Code quality
    - Every public function has a doc comment
    - No commented-out code in production files
    - All config from environment variables

    ## Scope
    - Only touch files in the task plan scope
    - If a file outside scope is needed: escalate, do not touch it

    ## [Your language] specific rules
    - [Add your team's actual patterns here]
    - [These are your rules — not generic ones imposed on you]

Spend 10 minutes on this. It is the difference between consistent output
and vibe coding.

---

### Step 4 — Map your existing process to Yooti gates

You likely already have informal versions of all five gates.

    YOUR PROCESS NOW                   YOOTI EQUIVALENT
    PM approves sprint backlog         Gate G1 — yooti story:approve --all
    Architect/tech lead review         Gate G2 — yooti plan:review [id]
    PR review + approval               Gate G3 — GitHub, as you do today
    QA or testing done                 Gate G4 — yooti qa:review [id]
    Release approval                   Gate G5 — gate file or your process

---

### Step 5 — Map your Jira or Linear tickets

Your existing ticket IDs work directly:

    yooti story:add
    # Story ID: PROJ-123   ← your Jira ticket number, works as-is

Or import a sprint from a JSON file:

    yooti story:import --file this-sprint.json

JSON format (map from your Jira export):

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

### Step 6 — Set your adoption stage

    yooti configure --stage 2

Start at Stage 1 or 2 for brownfield adoption. The agent validates stories
and writes plans. Your team writes the code exactly as before. Build a test
baseline. Learn the gate rhythm. Advance to Stage 3 when ready.

---

### Step 7 — Run your first sprint

    yooti story:approve --all    # Gate G1
    yooti sprint:start           # captures baseline from your existing tests

Then in Claude Code:

    Proceed to Phase 2 for PROJ-123.

The agent generates a plan file. You review it at Gate G2:

    yooti plan:review PROJ-123

Your team writes the code from the plan. When done, the PR review is Gate G3
— in GitHub, exactly as today. After merge, QA reviews at Gate G4:

    yooti qa:review PROJ-123

That is the brownfield sprint. Everything familiar. Gates made explicit.

---

### Step 8 — Hand off to the team

Send each person their module number. Your role from here is Gate G3
plus writing constitution files as you learn what the agent needs.

---

---

# MODULE 02 — Product Manager

## Writing stories and Gate G1

**Your gate is G1. 20 minutes.**

---

### Writing stories that work

Stories must be specific enough for the agent to generate code from.
Vague stories produce vague code.

**Good — specific and testable:**

    As a registered user
    I want to reset my password via email
    So that I can regain access to my account

    AC-1: Given a user submits their email address
          When the email is registered in the system
          Then they receive a reset link within 60 seconds

**Bad — too vague:**

    As a user I want to reset my password

The agent needs: what triggers the action, what the result is,
what error states look like, performance expectations.

---

### Your ticket ID works as-is

    yooti story:add
    # Story ID: PROJ-123   ← your Jira/Linear ticket number

Or import a whole sprint from Jira:

    yooti story:import --file sprint-23.json

---

### Gate G1 — approving stories

    yooti story:approve --all     # approve all at once
    yooti story:approve PROJ-123  # or one at a time

For each story confirm: complete, testable, unambiguous.

---

### When the agent flags an ambiguity

    ls .agent/escalations/
    cat .agent/escalations/PROJ-123-AMBIGUITY.md

Update the story, delete the escalation file. Agent resumes.

---

---

# MODULE 03 — Architect

## Reviewing plans at Gate G2

**Your gate is G2. 25 minutes.**

---

### What a plan file contains

    PROJ-123-T001 — User model and database schema
    Status: PENDING
    Layer: database

    Files in scope:
      CREATE: src/models/user.py
      MODIFY: src/models/__init__.py
      OUT OF SCOPE: API routes, frontend

    AC covered:
      AC-1 — user model stores account data

    Implementation steps:
      1. Write failing tests for User model
      2. Create User model with required fields
      3. Create migration

    Dependencies:
      Depends on: none
      Blocks: PROJ-123-T002

---

### The G2 review command

    yooti plan:review PROJ-123

Walks through each task interactively. For each task:
- Approve
- Approve with annotation — add a constraint the agent must follow
- Request revision — plan needs changes before any code runs

After all tasks approved, Gate G2 is signed automatically.

---

### The G2 checklist

    □ Tasks split by layer — not by acceptance criterion
    □ Task count matches complexity (M = 2-3 tasks, L = 3-4)
    □ Each task touches no more than 5-7 files
    □ Every AC from the story is covered
    □ OUT OF SCOPE section is complete
    □ Dependencies are in the correct order

---

### Adding a constraint to a plan

    yooti plan:amend PROJ-123-T001
    # Add role annotation:
    # "Use repository pattern — no direct DB queries in routes"

The agent reads this before writing any code for that task.

---

---

# MODULE 04 — Developer

## Reviewing PRs at Gate G3

**Your gate is G3. 30 minutes.**

---

### Gate G3 is just your normal PR review

Gate G3 happens in GitHub. Review the PR as you do today. Read the code.
Edit if needed. Approve and merge. The gate-g3.yml Action creates the gate
file automatically when you merge. No CLI command needed.

---

### What the PR body shows

The agent generates the PR body from the evidence package:
- Acceptance criteria coverage table
- Test results (unit + integration pass counts)
- Coverage percentage
- Security scan results (Snyk, Semgrep)
- Code audit against constitution files
- Files changed with line counts
- Deliberate decisions the agent made

The evidence handles the obvious checks. You focus on whether the code
does the right thing — not whether it passes a linter.

---

### The G3 checklist

    □ Code does what the AC says — not just passes tests
    □ Tests test real behaviour — not just coverage numbers
    □ No security issues — auth checks, SQL injection, hardcoded secrets
    □ All packages in requirements.txt or package.json — no hallucinated imports
    □ Patterns match your team's constitution files
    □ No files outside plan scope
    □ Error messages user-friendly — no stack traces exposed

---

### Your options at G3

    Approve as-is         Approve and merge in GitHub
    Edit and approve      Checkout branch, fix, push, then approve
    Inject a correction   yooti correct:inject PROJ-123-T002 — agent fixes it
    Reject                Close the PR with a comment — story returns to Phase 4

---

### When the agent escalates to you

    ls .agent/escalations/
    cat .agent/escalations/PROJ-123-T002-SCOPE_ERROR.md

    SCOPE_ERROR       Developer + Architect decide on scope change
    ENV_ERROR         DevOps fixes the environment
    AMBIGUITY         PM clarifies the requirement
    INSTALL_REQUIRED  Run: npm install or pip install -r requirements.txt

Fix the issue, delete the file, tell the agent to continue.

---

### Phase 4 prompts

Your docs/PROMPTS.md has the exact prompt for every situation:

    # Start code generation
    Proceed to Phase 4 for all approved stories in dependency order.

    # After resolving an escalation
    The escalation in .agent/escalations/PROJ-123-INSTALL_REQUIRED.md
    has been resolved. Continue Phase 4 for PROJ-123-T001.

---

---

# MODULE 05 — QA / SDET

## Test planning and Gate G4

**Your gate is G4. 20 minutes.**

---

### Before Phase 4 — add test requirements

    yooti qa:plan PROJ-123       # full QA test plan
    yooti test:require PROJ-123  # add specific scenarios

The agent reads these before writing tests. All P0 requirements must pass
before a PR opens.

---

### Gate G4 — reviewing evidence

    yooti qa:review PROJ-123

Expected output:

    Hard gates (any failure = reject):
    ✓ Unit tests 100% pass
    ✓ Integration tests 100% pass
    ✓ Zero regressions vs baseline
    ✓ Overall coverage >= 80%
    ✓ New code coverage >= 90%
    ✓ Zero CRITICAL/HIGH security findings
    ✓ Zero accessibility violations (frontend)
    ✓ Code audit — 0 constitution violations

If all hard gates pass you approve. The sprint moves forward.

---

### What the evidence package contains

    .agent/evidence/PROJ-123/
      test-results.json       Pass/fail counts
      coverage-summary.json   Overall and new code percentages
      regression-diff.json    Tests newly failing vs baseline
      security-scan.json      Snyk + Semgrep findings
      accessibility.json      axe-core violations (frontend only)
      code-audit.md           Constitution compliance check
      pr-body.md              Complete PR body

---

---

# MODULE 06 — DevOps and Release Manager

---

### DevOps — environment setup

Before Day 1:
- Docker Desktop running with >= 4GB memory (Full Tour only)
- GitHub repository created
- Add SNYK_TOKEN to GitHub Actions secrets (optional)
- Ports free: 3000, 5173, 5432, 6379, 8000

During sprints, own ENV_ERROR escalations:

    cat .agent/escalations/PROJ-123-ENV_ERROR.md
    # Fix the environment, delete the file, agent resumes

---

### Release Manager — Gate G5

After staging deploy and smoke tests:

    # Verify staging is healthy
    cat .agent/evidence/PROJ-123/staging-health-report.md

    # Create the G5 gate file
    # PowerShell
    Set-Content ".agent/gates/PROJ-123-G5-approved.md" `
      "# Gate G5`nStory: PROJ-123`nDecision: APPROVED`nReviewed by: [name]"

    # Mac / Linux
    echo "# Gate G5
    Story: PROJ-123
    Decision: APPROVED
    Reviewed by: $(whoami)
    Date: $(date -u)" > .agent/gates/PROJ-123-G5-approved.md

Do not approve G5 if staging health checks are failing.

---

---

# MODULE 08 — Advancing stages

Advance when your team has run 3+ sprints at the current stage and:

    FROM STAGE 1 TO 2
    □ Agent accurately parses all stories — no ambiguity flags
    □ Team comfortable with the .plan.md format

    FROM STAGE 2 TO 3
    □ Team has reviewed 10+ plan files — quality is consistent
    □ Developers can correct agent plans confidently

    FROM STAGE 3 TO 4
    □ Team has approved 20+ PRs — agent code quality is trusted
    □ Staging deploy scripts are tested and reliable

    FROM STAGE 4 TO 5
    □ Staging has succeeded 10+ times without intervention
    □ Rollback tested deliberately at least once

    yooti configure --stage 3    # advance when ready

---

---

# MODULE 09 — Troubleshooting

---

### The doctor command is your first stop

    yooti doctor

Shows every engine prerequisite, its current status, and a copy-paste
install command for anything missing. Run this before anything else.

---

### 9.1 — Prerequisites missing

    yooti doctor
    # Shows exactly what is missing and how to install it

---

### 9.2 — Preflight failing

    yooti preflight

    # "Working tree is not clean"
    git add . && git commit -m "chore: work in progress"

    # "yooti.config.json invalid"
    cat yooti.config.json | python3 -m json.tool
    # Shows the line with the syntax error

---

### 9.3 — Docker services not starting (Full Tour only)

    docker compose ps
    docker compose logs [service-name]

    # Port in use
    lsof -i :3000    # Mac/Linux
    # Find PID, kill it, then docker compose up -d

    # Not enough memory
    # Docker Desktop → Settings → Resources → Memory → 4GB minimum

---

### 9.4 — Agent writes code during Phase 2

Phase 2 produces .plan.md files only. If agent writes code:

    "You wrote code during Phase 2. This is not allowed.
     Delete the code files.
     Re-read the Phase 2 section in .claude/CLAUDE.md.
     Generate plans only for [ID]. No code."

---

### 9.5 — Agent creates one task per AC

Most common decomposition error. Plans should be split by layer not by AC.

    "Plans for [ID] split by AC — this is wrong.
     Delete .agent/plans/[ID]-*.plan.md
     Re-read decomposition rules in .claude/CLAUDE.md.
     M-complexity = 2-3 tasks maximum, split by layer. Regenerate."

---

### 9.6 — Story stuck in escalation

    ls .agent/escalations/
    cat .agent/escalations/[ID]-SCOPE_ERROR.md

    SCOPE_ERROR       Developer + Architect decide
    ENV_ERROR         DevOps fixes environment
    AMBIGUITY         PM clarifies requirement
    ARCH_ERROR        Architect reviews approach
    INSTALL_REQUIRED  Run the install command shown, delete the file

Fix the issue. Delete the file. Tell the agent: "Escalation resolved. Continue."

---

### 9.7 — Coverage below 80% at G4

    cd [your-service]
    pytest tests/unit/ --cov=src --cov-report=term-missing
    # Missing column shows uncovered lines

Add scaffold files (not business logic) to the omit list in pyproject.toml:

    [tool.coverage.report]
    fail_under = 80
    omit = ["tests/*", "src/__init__.py", "src/config.py", "alembic/*"]

Never omit business logic. Add tests instead.

---

### Getting help

    1. yooti doctor — check engine prerequisites
    2. ls .agent/escalations/ — read the specific error
    3. docker compose logs [service] — service-level errors
    4. github.com/yooti/cli/issues — open an issue with:
       - Output of: yooti preflight
       - Output of: cat yooti.config.json
       - Node.js, Docker, Python versions
       - The specific error message

---

*Yooti v1.2 — Getting Started Guide*
