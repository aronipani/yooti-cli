# Yooti — Getting Started Guide

> **Yūti** (यूति) — Sanskrit for *joining, union, or mixture*.
> The act of bringing things together — humans and agents, each doing what they do best.

---

## How to use this guide

This guide is written in modules. Each module is for a specific role.
On Day 1, the whole team reads Module 00 together. Then each person reads their
own module. After that, the pipeline runs itself.

    MODULE    ROLE                  READ TIME    WHEN
    00        Whole team            20 minutes   Day 1 morning — together
    01        Tech Lead             45 minutes   Day 1 morning — solo
    02        Product Manager       20 minutes   Day 1 afternoon — solo
    03        Architect             25 minutes   Day 1 afternoon — solo
    04        Developer             30 minutes   Day 1 afternoon — solo
    05        QA / SDET             20 minutes   Day 1 afternoon — solo
    06        DevOps                20 minutes   Day 1 afternoon — solo
    07        Tech Lead             30 minutes   Brownfield only
    08        Whole team            15 minutes   When advancing stages
    09        Whoever needs it      As needed    When something goes wrong

By end of Day 1 your team should have a running local stack, at least one
validated story, every person knowing their gate, and the agent ready to go.

---

---

# MODULE 00 — The whole team

## What Yooti is and how your team fits into it

**Read together. 20 minutes.**

---

### The goal

You are here because you want to ship more, faster, with the team you have.
Yooti gives you a pipeline where agents handle execution — writing code, writing
tests, self-healing failures, generating PR bodies — and humans handle decisions.
Five decisions per sprint per story. Everything else is automated.

---

### The pipeline in plain English

Every story your product manager writes goes through seven phases.

    Phase 1 — Requirements ingestion
      The agent reads the story and converts it into a structured contract:
      acceptance criteria in Given/When/Then format, a Definition of Done,
      ambiguity flags, and a complexity estimate.
      If the story is ambiguous, the agent flags it and tells the PM what
      is missing. Nothing moves forward until resolved.

    Phase 2 — Story decomposition
      The agent breaks the story into tasks by layer and writes a .plan.md
      file for each one. The plan says exactly which files the agent is
      allowed to touch, which are out of scope, and what the steps are.
      Plans only at this phase — no code written yet.

    Phase 3 — Environment setup
      Feature branch created, preflight checks run, regression baseline
      captured. Fully automated. No human input needed.

    Phase 4 — Code generation
      The agent writes failing tests first (TDD), then implementation to
      make them pass. It runs lint, type checks, and tests — self-healing
      up to five times. If it cannot converge, it escalates and stops.

    Phase 5 — Test orchestration + evidence package
      Full test suite, coverage report, regression diff, security scan,
      accessibility check, and a code audit against the constitution files.
      All results packaged into .agent/evidence/[ID]/
      A PR is not opened until all hard checks pass.

    Phase 6 — PR review
      The agent opens a PR with the complete evidence package as the body.
      The developer reads the code, edits if needed, and approves or rejects.
      This happens entirely in GitHub — no CLI command needed.

    Phase 7 — Deploy
      After PR merge, staging deploy runs, smoke tests execute, and a
      health report is generated. The release manager approves production.

---

### The five human gates

    GATE G1 — Product Manager
      When:     Before the sprint starts
      Decision: These stories are complete and unambiguous
      Command:  yooti story:approve --all

    GATE G2 — Architect
      When:     After agent writes plans — before any code runs
      Decision: These implementation plans are structurally sound
      Command:  yooti plan:review STORY-001

    GATE G3 — Developer
      When:     After the agent opens the PR
      Decision: This code is correct and safe to merge
      Where:    GitHub — no CLI command needed
      Note:     You can edit code directly in the branch before approving

    GATE G4 — QA / SDET
      When:     After evidence package is generated
      Decision: Quality evidence is sufficient
      Command:  yooti qa:review STORY-001

    GATE G5 — Release Manager
      When:     After staging deploy and health report
      Decision: Safe to deploy to production

---

### Ticket IDs — use your own convention

Yooti accepts any ticket ID format. Use whatever your team already uses.

    STORY-001   BUG-042   FEAT-007   PROJ-123   ISS-007

All commands accept any format. Import sample stories with a custom prefix:

    yooti story:sample --app ecommerce --prefix PROJ
    # Creates PROJ-001, PROJ-002 etc.

---

### Your team map

    WHO YOU ARE           YOUR GATE    YOUR MODULE    TIME PER STORY
    Product Manager       G1           Module 02      20 min writing + 10 min review
    Architect             G2           Module 03      30 min plan review
    Developer             G3           Module 04      45 min PR review + edit
    QA / SDET             G4           Module 05      20 min evidence review
    DevOps                G5 support   Module 06      Setup only, then on-call
    Release Manager       G5           Module 06      10 min deploy approval
    Tech Lead             Setup        Module 01      Day 1 setup, then G3 too

---

### Adoption stages

    STAGE 1 — Foundation
      Agent parses stories. Team writes all code. Same as current workflow
      with better structure and CI. yooti configure --stage 2 when ready.

    STAGE 2 — Build
      Agent writes plan files. Team writes code from the plans.
      Architect reviews plans at G2 before coding starts.
      yooti configure --stage 3 when ready.

    STAGE 3 — Review  <- most teams start here
      Agent writes code and tests. Developer reviews the PR.
      Team controls every deployment. Recommended starting point.

    STAGE 4 — Deploy
      Agent codes, tests, and deploys to staging automatically.
      Release manager approves production only.

    STAGE 5 — Autonomous
      Agent runs all seven phases. Team owns five gates only.

Now each person reads their own module. See you at the first sprint.

---

---

# MODULE 01 — Tech Lead

## Day 1 setup

**You run yooti init. 45 minutes.**

---

### Step 1 — Check prerequisites

    yooti doctor

Or manually:

    node --version          # must be >= 20
    git --version           # any recent version
    gh --version            # GitHub CLI — for automatic PRs
    docker --version        # must be running
    python3 --version       # must be >= 3.12
    claude --version        # Claude Code

Install anything missing:

    # Mac
    brew install node@20 git gh python@3.12
    npm install -g @anthropic-ai/claude-code

    # Windows
    winget install OpenJS.NodeJS.LTS Git.Git GitHub.cli Python.Python.3.12
    npm install -g @anthropic-ai/claude-code

---

### Step 2 — Install Yooti

    npm install -g @yooti/cli
    yooti doctor      # verify everything is ready

---

### Step 3 — Run the wizard

    cd ~/projects
    yooti init

The wizard asks eight questions:

    Project name      your-product-name
    Project type      full / web / agent
    Context           greenfield (new repo) or brownfield (see Module 07)
    Stack             node, react, python — tick all that apply
    Linter            eslint (default) or biome (faster)
    CI                github-actions (default)
    Stage             3 — Review (recommended)
    Agent             claude-code (default) or codex

---

### Step 4 — Start the local stack

    cd your-product-name
    cp .env.example .env
    # Edit .env — add API keys and secrets

    docker compose up -d
    docker compose ps     # all services should show: healthy

---

### Step 5 — Run preflight

    yooti preflight

Expected output:

    ✓ Git repository exists
    ✓ Working tree is clean
    ✓ docker-compose.yml exists
    ✓ .claude/CLAUDE.md exists
    ✓ yooti.config.json is valid
    ✓ Pipeline scripts exist
    ✓ Example artifacts exist
    7/7 checks passed

---

### Step 6 — Import demo stories (optional)

    yooti story:sample --app ecommerce --sprint 1
    yooti story:approve --all
    yooti sprint:start

Then in Claude Code:

    Proceed to Phase 2 for all new stories.

---

### Step 7 — Hand off to the team

Send each person their module link. Your role from here is Gate G3
plus unblocking the team when escalations arise.

---

---

# MODULE 02 — Product Manager

## Writing stories and Gate G1

**Your gate is G1. 20 minutes.**

---

### How to write a good story

Stories must be specific enough for the agent to generate code from them.

**Good — specific and testable:**

    As a registered shopper
    I want to add items to my cart and see the updated item count
    So that I can track what I intend to buy

**Bad — too vague:**

    As a user I want a shopping cart so that I can shop

The agent needs: what triggers the action, what the result is, what
error states look like, and performance expectations.

---

### Adding stories

    yooti story:add

The wizard asks for ID, title, type, acceptance criteria in Given/When/Then
format, non-functional requirements, priority, and complexity.

Or import from a JSON file:

    yooti story:import --file my-stories.json

Or see the format with demo stories:

    yooti story:sample --app ecommerce --sprint 1

---

### Gate G1 — approving stories

After stories are written and ready:

    yooti story:approve --all     # approve all at once
    yooti story:approve STORY-001 # or one at a time

For each story, confirm it is:
- Complete — all AC defined
- Testable — each AC can be verified with a test
- Unambiguous — the agent can implement without guessing

If a story has ambiguity flags, resolve them before approving.

---

### When the agent flags an ambiguity

    ls .agent/escalations/
    cat .agent/escalations/STORY-001-AMBIGUITY.md

Update the story, delete the escalation file. The agent resumes.

---

---

# MODULE 03 — Architect

## Reviewing plans at Gate G2

**Your gate is G2. 25 minutes.**

---

### What a plan file contains

Each task has a .plan.md file in .agent/plans/:

    STORY-001-T001 — Product Database Models
    Status: PENDING
    Layer: database

    Files in scope:
      CREATE: src/models/product.py
      CREATE: src/models/category.py
      MODIFY: src/models/__init__.py
      OUT OF SCOPE: API routes, frontend

    AC covered:
      AC-1 — product fields established
      AC-2 — category enables filtering

    Implementation steps:
      1. Write failing tests for Product model
      2. Create Product model
      3. Create migration

    Dependencies:
      Depends on: none
      Blocks: STORY-001-T002

---

### The G2 review command

    yooti plan:review STORY-001

Walks through each task interactively. For each task choose:
- Approve
- Approve with annotation — add a constraint for the agent
- Request revision — plan needs changes

After all tasks approved, Gate G2 is signed automatically.

---

### The G2 checklist

    DECOMPOSITION
    □ Tasks split by layer — not by AC
    □ Task count matches complexity (M = 2-3, L = 3-4, XL = 4-5)
    □ Each task touches no more than 5-7 files
    □ Every AC covered by at least one task

    SCOPE
    □ Files in CREATE/MODIFY are necessary
    □ OUT OF SCOPE section is complete
    □ No file appears in two tasks

    DEPENDENCIES
    □ Database before API, API before frontend
    □ No circular dependencies

---

### Adding annotations

    yooti plan:amend STORY-001-T002
    # Choose: Add role annotation
    # Enter: Use repository pattern — no direct DB queries in routes

The annotation is written into the plan file. The agent reads it
before writing any code for that task.

---

---

# MODULE 04 — Developer

## Reviewing PRs at Gate G3

**Your gate is G3. 30 minutes.**

---

### Gate G3 happens in GitHub

When the agent opens a PR, review it in GitHub as you normally would.
Read the code. Edit if needed. Approve and merge. No CLI command required.

When you merge, the gate-g3.yml GitHub Action automatically creates the
gate file and the pipeline continues.

---

### What to look for in a PR

The PR body shows: AC coverage, test results, coverage %, security scan,
files changed, and deliberate decisions the agent made.

**G3 checklist:**

    □ Code does what the AC says — not just passes tests
    □ Tests test meaningful behaviour — not just coverage numbers
    □ No security issues — auth checks, SQL injection, hardcoded secrets
    □ All packages in requirements.txt or package.json
    □ Patterns match the constitution files for this layer
    □ No files outside plan scope
    □ Error handling correct — no bare except or empty catch
    □ No hardcoded values that should be env vars
    □ Error messages are user-friendly — no stack traces exposed

---

### Your four options at G3

**Approve as-is:**
Click Approve + Merge in GitHub.

**Edit and approve:**

    git checkout feature/STORY-001
    # Make changes
    git add . && git commit -m "fix: correct edge case"
    git push
    # Then approve in GitHub

**Inject a correction:**

    yooti correct:inject STORY-001-T002
    # Describe the issue precisely
    # Agent fixes and updates the PR
    # Review again

**Reject:**
Close the PR in GitHub with a comment. Story returns to Phase 4.

---

### Prompt library for Phase 4

Your docs/PROMPTS.md has the exact prompt for every situation.

    # Start code generation
    Proceed to Phase 4 for all approved stories in dependency order.

    # After resolving an escalation
    Read .agent/escalations/STORY-001-INSTALL_REQUIRED.md
    The issue has been resolved. Continue with STORY-001-T002.

    # After injecting a correction
    Read .agent/corrections/STORY-001-T002-[timestamp].md
    Apply the correction. Re-run the quality loop.

---

### When the agent escalates

    ls .agent/escalations/
    cat .agent/escalations/STORY-001-T002-SCOPE_ERROR.md

    SCOPE_ERROR       Developer + Architect approve scope change
    ENV_ERROR         DevOps fixes the environment
    AMBIGUITY         PM clarifies the requirement
    ARCH_ERROR        Architect reviews the approach
    INSTALL_REQUIRED  Run the install command shown, then delete file

Fix the issue, delete the file, tell the agent to continue.

---

---

# MODULE 05 — QA / SDET

## Test planning and Gate G4

**Your gate is G4. 20 minutes.**

---

### Creating a QA test plan

Before Phase 4 starts:

    yooti qa:plan STORY-001

Choose: test layers, security tests, performance thresholds, accessibility
requirements, test data needs. Plan written to .agent/qa/STORY-001-test-plan.md.

---

### Adding specific test requirements

    yooti test:require STORY-001

Choose from: unit, integration, accessibility, performance, security, eval.
These are read by the agent before writing tests. All P0 requirements
must pass before a PR is opened.

---

### Gate G4 — reviewing evidence

After the PR is merged:

    yooti qa:review STORY-001

Expected output:

    Hard gates (any failure = reject):
    ✓ Unit tests 100% pass              46/46
    ✓ Integration tests 100% pass       12/12
    ✓ Zero regressions                  52 new tests added
    ✓ Overall coverage >= 80%           99.7%
    ✓ New code coverage >= 90%          100.0%
    ✓ Zero CRITICAL security findings   Snyk: 0 critical
    ✓ Zero HIGH security findings       Snyk: 0 high
    ✓ Zero Semgrep findings             0
    ✓ Zero accessibility violations     0
    ✓ Code audit — 0 violations         All constitution checks passed

    Soft gates:
    ✓ Mutation score >= 85%             89.2%

If all hard gates pass, you approve and the sprint moves forward.

---

### Evidence package contents

    .agent/evidence/STORY-001/
      test-results.json
      coverage-summary.json
      regression-diff.json
      security-scan.json
      accessibility.json      (frontend only)
      code-audit.md
      pr-body.md

---

---

# MODULE 06 — DevOps and Release Manager

## Environment setup and Gate G5

---

### DevOps responsibilities

Before Day 1:
- Docker Desktop installed and running with at least 4GB memory
- GitHub repository created, team has access
- Add SNYK_TOKEN to GitHub Actions secrets (optional but recommended)
- Ports free: 3000, 5173, 5432, 6379, 8000, 8001

After docker compose up, verify:

    curl http://localhost:3000/health      # Node.js API
    curl http://localhost:8000/health      # Python API

During sprints, own ENV_ERROR escalations:

    cat .agent/escalations/STORY-001-ENV_ERROR.md
    # Fix the environment, delete the file, agent resumes

---

### Release Manager — Gate G5

After staging deploy and smoke tests:

    cat .agent/evidence/STORY-001/staging-health-report.md
    # Verify staging is healthy before approving

Create the G5 gate file:

    # PowerShell
    $content = "# Gate G5`nStory: STORY-001`nDecision: APPROVED`n..."
    Set-Content ".agent/gates/STORY-001-G5-approved.md" $content

    # Mac / Linux
    echo "# Gate G5
    Story: STORY-001
    Decision: APPROVED
    Reviewed by: $(whoami)
    Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)" > .agent/gates/STORY-001-G5-approved.md

Do not approve G5 if staging health checks are failing.

---

---

# MODULE 07 — Tech Lead (Brownfield)

## Adopting Yooti in an existing codebase

---

### What brownfield mode does

    yooti init . --context brownfield

Adds only framework overlay files — .claude/, .agent/, pipeline/, docs/ —
without touching your existing source code.

---

### Step 1 — Document existing patterns

The wizard asks about your existing stack, test runner, linter, and patterns.
Be specific — the agent will follow what you document.

---

### Step 2 — Add custom constitutions

    cat > .claude/constitutions/your-framework.md << 'EOF'
    # Your Framework Constitution
    ## Patterns to follow
    ...
    EOF

Add a reference in .claude/CLAUDE.md:

    Your framework:   .claude/constitutions/your-framework.md

---

### Step 3 — Start at Stage 1 or 2

    yooti configure --stage 2

At Stage 2 the agent writes plans. Your team writes code from those plans.
Build confidence before advancing to Stage 3.

---

---

# MODULE 08 — Advancing stages

## Moving to the next adoption stage

Advance when your team has run at least 3 sprints at the current stage.

    FROM STAGE 1 TO 2
    □ Agent accurately parses all stories without ambiguity flags
    □ Team is comfortable with the .plan.md format
    □ CI is running clean

    FROM STAGE 2 TO 3
    □ Team has reviewed 10+ plan files and quality is consistent
    □ Developers can correct agent plans confidently
    □ CI quality gates are all green

    FROM STAGE 3 TO 4
    □ Team has approved 20+ PRs and agent code quality is trusted
    □ Staging deploy scripts are tested and reliable
    □ Rollback procedure is documented

    FROM STAGE 4 TO 5
    □ Staging deploy has succeeded 10+ times without intervention
    □ Rollback has been tested deliberately at least once

    yooti configure --stage 4     # advance when ready

---

---

# MODULE 09 — Troubleshooting

## When something goes wrong

---

### 9.1 — Prerequisites not met

    yooti doctor
    # Shows exactly what is missing and how to install it

---

### 9.2 — Preflight failing

    yooti preflight

    # "Working tree is not clean"
    git add . && git commit -m "chore: work in progress"

    # "yooti.config.json invalid"
    cat yooti.config.json | python3 -m json.tool

    # "Pipeline scripts not found"
    # Re-run yooti init to regenerate missing files

---

### 9.3 — Docker services not starting

    docker compose ps
    docker compose logs [service-name]

    # Port in use
    lsof -i :3000 && kill -9 [PID]

    # Volume corrupted (deletes all data)
    docker compose down -v && docker compose up -d

    # Not enough memory
    # Docker Desktop → Settings → Resources → Memory → 4GB minimum

---

### 9.4 — Agent writes code during Phase 2

Phase 2 should produce only .plan.md files. If the agent writes code:

Delete the code files, then tell the agent:
"You wrote code during Phase 2. This is not allowed.
Delete the code. Re-read CLAUDE.md Phase 2 section.
Regenerate plans only for [STORY-ID]."

---

### 9.5 — Agent creates one task per AC

The most common decomposition error. Delete the wrong plans, then:
"Plans for STORY-001 are wrong — each task covers one AC.
Re-read decomposition rules in CLAUDE.md.
Tasks split by layer: database, API, frontend.
M-complexity = 2-3 tasks maximum. Regenerate."

---

### 9.6 — Evidence package shows stale numbers

    # Tell the agent:
    # "Coverage in .agent/evidence/STORY-001/ is stale.
    #  Read current coverage from services/api_python/coverage.json
    #  Update coverage-summary.json. Do not re-run tests."

    yooti qa:review STORY-001   # re-run after agent updates evidence

---

### 9.7 — Coverage below 80% at G4

    cd services/api_python
    pytest tests/unit/ --cov=src --cov-report=term-missing
    # Missing column shows uncovered lines

Add scaffold files to pyproject.toml omit list:

    [tool.coverage.report]
    fail_under = 80
    omit = ["tests/*", "src/__init__.py", "src/config.py",
            "src/database.py", "alembic/*", "scripts/*"]

Never omit business logic files — add tests instead.

---

### 9.8 — Story stuck in escalation

    ls .agent/escalations/
    cat .agent/escalations/STORY-001-SCOPE_ERROR.md

    SCOPE_ERROR       Developer + Architect decide
    ENV_ERROR         DevOps fixes environment
    AMBIGUITY         PM clarifies requirement
    ARCH_ERROR        Architect reviews approach
    INSTALL_REQUIRED  Run install command shown, delete file

After fixing, delete the file. Tell the agent: "Escalation resolved. Continue."

---

### 9.9 — Regression introduced by agent

    cat .agent/evidence/STORY-001/regression-diff.json

    # Agent caused it → return story to Phase 4 with specific correction
    # Flaky test → document in .agent/known-flaky-tests.md
    # Pre-existing bug → open new story to fix separately

---

### Getting help

    1. Check .agent/escalations/ — specific error the agent encountered
    2. Check GitHub Actions logs for the failing CI job
    3. Run docker compose logs [service]
    4. Run yooti doctor
    5. Open an issue at github.com/yooti/cli with:
       - Output of: yooti preflight
       - Output of: cat yooti.config.json
       - The specific error message
       - Node.js, Docker, and Python versions

---

*Yooti v1.2 — Getting Started Guide*
