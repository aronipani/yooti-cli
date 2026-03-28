# Yooti — Getting Started Guide

### A modular playbook for the whole team

---

## How to use this guide

This guide is written in modules. Each module is for a specific role.
On Day 1, the whole team reads Module 00 together. Then each person
reads their own module. After that, the pipeline runs itself.

```
MODULE    ROLE                  READ TIME    WHEN
────────  ────────────────────  ───────────  ──────────────────────
00        Whole team            20 minutes   Day 1 morning — together
01        Tech Lead             45 minutes   Day 1 morning — solo
02        Product Manager       20 minutes   Day 1 afternoon — solo
03        Architect             20 minutes   Day 1 afternoon — solo
04        Developer             30 minutes   Day 1 afternoon — solo
05        QA / SDET             20 minutes   Day 1 afternoon — solo
06        DevOps                20 minutes   Day 1 afternoon — solo
07        Tech Lead             30 minutes   Brownfield only
08        Whole team            15 minutes   When advancing stages
09        Whoever needs it      As needed    When something goes wrong
```

By end of Day 1 your team should have:
- A running local stack
- One validated story in the queue
- Every person knowing their gate and what they do at it
- The agent ready to generate code

---

---

# MODULE 00 — The whole team

## What Yooti is and how your team fits into it

**Read together. 20 minutes.**

---

### The goal

You are here because you want to ship more, faster, with the team you have.
Yooti gives you a pipeline where agents handle execution — writing code,
writing tests, self-healing failures, generating PR bodies, deploying to
staging — and humans handle decisions. Five decisions per sprint per story.
Everything else is automated.

This module explains the pipeline, the gates, and what each person does.
It is the only module everyone reads. After this, each person reads their
own module and gets to work.

---

### The pipeline in plain English

Every story your product manager writes goes through seven phases before
it is deployed to production. The same seven phases, every sprint, every
story.

```
Phase 1 — Requirements ingestion
  The agent reads the story your PM wrote and converts it into a precise
  JSON contract: acceptance criteria in Given/When/Then format, a
  Definition of Done, ambiguity flags, and a complexity estimate.
  If the story is ambiguous, the agent holds it and tells the PM what
  is missing. Nothing moves forward until the PM resolves it.

Phase 2 — Story decomposition
  The agent breaks the validated story into tasks and writes a .plan.md
  file for each one. The plan says exactly which files the agent is
  allowed to touch, which are out of scope, and what the implementation
  steps are. The architect reviews the plans before any code is written.

Phase 3 — Environment setup
  The pipeline creates a feature branch, runs pre-flight checks, and
  captures a baseline snapshot of the current test suite. If any
  baseline tests are failing, the story is blocked until DevOps fixes
  the environment. Agents do not write code in broken environments.

Phase 4 — Code generation loop
  The agent writes code, runs lint and type checks, runs unit tests, and
  self-heals failures — up to five times. If it cannot get to green in
  five iterations, it escalates to the developer and stops.

Phase 5 — Test orchestration
  The agent runs unit tests, integration tests, regression diff against
  the baseline, mutation testing, coverage checks, and a security scan.
  It packages all results into an evidence file.

Phase 6 — PR review
  The agent opens a PR with a generated body showing every test result,
  coverage number, mutation score, and security scan outcome. The
  developer reads the code, edits anything they want to change, and
  approves or rejects.

Phase 7 — Deploy
  After the PR merges, the agent deploys to staging, runs smoke tests,
  and generates a health report. The release manager approves production.
  The agent deploys, monitors for 15 minutes, and auto-rolls back if
  anything fails.
```

---

### The five human gates — where your team decides

The pipeline stops at five points and waits for a human. These are
not rubber stamps — they are real decisions. Nothing crosses a gate
without a person choosing to let it through.

```
GATE G1 — Product Manager
  Happens: Before the sprint starts
  Decision: These stories are complete, unambiguous, and ready to build
  If you reject: Story goes back to the backlog with a flag explaining why

GATE G2 — Architect
  Happens: After the agent writes .plan.md files — before any code runs
  Decision: These implementation plans are structurally sound
  If you reject: Plans go back to the agent for a rewrite

GATE G3 — Developer
  Happens: After the agent opens the PR
  Decision: This code is correct and safe to merge
  If you reject: The agent gets your comments as a correction prompt
  Special: You can edit the code directly in the branch before approving

GATE G4 — QA / SDET
  Happens: After the agent produces the evidence package
  Decision: The quality evidence is sufficient — test results, coverage,
            mutation score, security scan
  If you reject: Story goes back to Phase 4 for a rewrite

GATE G5 — Release Manager
  Happens: After staging deploy and health report
  Decision: Safe to deploy to production
  If you reject: Story stays in staging for investigation
```

---

### Your team map

```
WHO YOU ARE           YOUR GATE    YOUR MODULE    TIME COMMITMENT PER STORY
────────────────────  ───────────  ─────────────  ──────────────────────────
Product Manager       G1           Module 02      20 min (story writing)
                                                  10 min (ambiguity review)

Architect             G2           Module 03      30 min (.plan review)

Developer             G3           Module 04      45 min (PR review + edit)

QA / SDET             G4           Module 05      20 min (evidence review)

DevOps                G5 support   Module 06      Setup only, then on-call

Release Manager       G5           Module 06      10 min (deploy approval)

Tech Lead             Setup        Module 01      Day 1 setup, then G3 too
```

---

### What changes at each adoption stage

Your team chose a starting stage. Here is what that means in practice:

```
STAGE 1 — FOUNDATION
  You installed Yooti for the framework and CI.
  The agent parses your stories. Your team writes all the code.
  This is the same as your current workflow with better structure.
  When ready to advance: run yooti configure --stage 2

STAGE 2 — BUILD
  The agent writes .plan.md files. Your team writes the code from plans.
  Your architect reviews plans at Gate G2 before you start coding.
  When ready to advance: run yooti configure --stage 3

STAGE 3 — REVIEW  ← most teams start here
  The agent writes the code and tests. Your developer reviews the PR.
  Your team controls every deployment — staging and production.
  This is the recommended starting point for most teams.

STAGE 4 — DEPLOY
  The agent codes, tests, and deploys to staging automatically.
  Your release manager approves production only.

STAGE 5 — AUTONOMOUS
  The agent runs all seven phases.
  Your team owns the five gates and nothing else.
```

Now each person reads their own module. See you at the first sprint.

---

---

# MODULE 01 — Tech Lead

## Day 1 setup — scaffold, local stack, and first preflight

**You are the person who runs yooti init. 45 minutes.**

---

### Before you start

Make sure you have:

```bash
node --version          # must be >= 20
git --version           # any recent version
docker --version        # must be running
python3 --version       # must be >= 3.12
```

If anything is missing, install it before continuing. The scaffold will
work without Docker and Python but the local stack will not run.

---

### Step 1 — Install Yooti

```bash
npm install -g @yooti/cli
yooti --version
# Should show the Yooti banner and version number
```

If you see a conflict with an existing `yooti` command on
your PATH, see the Troubleshooting module (Module 09).

---

### Step 2 — Run the wizard

Navigate to wherever your team keeps projects and run:

```bash
cd ~/projects
yooti init
```

The wizard asks eight questions. Here is what each one means:

```
QUESTION                  WHAT TO CHOOSE                    WHY
────────────────────────  ────────────────────────────────  ─────────────────────
Project type              full / web / agent                What you are building
Project context           greenfield (new)                  New repo from scratch
                          brownfield (existing)             See Module 07
Project name              your-product-name                 Creates a folder
Application stack         node, react, python               Tick all that apply
Linter                    eslint (default) or biome         biome is faster
CI provider               github-actions (default)          Where your CI runs
Pipeline stage            3 — Review (recommended)          Start here
Git repository            init + commit (recommended)       First commit included
```

When the wizard finishes you will see a checklist of generated files
and a "Ready" message with next steps.

---

### Step 3 — Open in VS Code

```bash
cd your-product-name
code .
```

VS Code will detect the `.claude/` folder. If you have Claude Code
installed it will read `CLAUDE.md` automatically. You should see
Claude Code load the project context in the sidebar.

If you do not have Claude Code installed:
- Go to the VS Code Extensions panel
- Search for "Claude Code" by Anthropic
- Install and sign in

---

### Step 4 — Configure your environment

```bash
cp .env.example .env
```

Open `.env` and fill in the required values:

```bash
# Required for the API service
DATABASE_URL=postgresql://app:app@localhost:5432/appdb
REDIS_URL=redis://localhost:6379
NODE_ENV=development
PORT=3000

# Required for agents (if type=full or type=agent)
ANTHROPIC_API_KEY=your-key-here        # from console.anthropic.com
# or
OPENAI_API_KEY=your-key-here           # from platform.openai.com

# Required for agent observability
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your-key-here        # from smith.langchain.com
LANGCHAIN_PROJECT=your-product-name

# Frontend
VITE_API_URL=http://localhost:3000
```

Do not commit `.env`. It is already in `.gitignore`.

---

### Step 5 — Start the local stack

```bash
docker compose up -d
```

This starts all services defined in `docker-compose.yml`. Depending on
your project type this includes some combination of:

```
postgres    → http://localhost:5432   (database)
redis       → http://localhost:6379   (cache)
api         → http://localhost:3000   (Node.js API)
frontend    → http://localhost:5173   (React dev server)
agents      → http://localhost:8001   (LangGraph API)
chroma      → http://localhost:8000   (vector store, if selected)
```

Check everything is running:

```bash
docker compose ps
# All services should show "running"
```

If any service fails to start, check the logs:

```bash
docker compose logs api         # check API logs
docker compose logs postgres    # check database logs
```

---

### Step 6 — Run pre-flight checks

```bash
yooti preflight
```

This runs seven checks and reports pass or fail for each:

```
✓ Git repository exists
✓ Working tree is clean
✓ docker-compose.yml exists
✓ .claude/CLAUDE.md exists
✓ yooti.config.json exists and is valid JSON
✓ Pipeline scripts exist
✓ Example artifacts exist
```

If any check fails, the preflight output tells you exactly what to fix.
Do not move to the next step until all checks pass.

---

### Step 7 — Install dependencies

```bash
# Node.js layers
cd services/api && npm install && cd ../..
cd frontend/dashboard && npm install && cd ../..

# Python layers (agents and/or batch)
cd agents && pip install -r requirements.txt && cd ..
cd batch/analytics && pip install -r requirements.txt && cd ../..
```

---

### Step 8 — Run the baseline tests

Before the team writes any stories, make sure the baseline is clean:

```bash
# Node.js unit tests
cd services/api && npm test && cd ../..

# React unit tests
cd frontend/dashboard && npm test && cd ../..

# Python tests (agents)
cd agents && pytest tests/unit/ -m "not eval" && cd ..
```

All tests should pass. If they do not, check the Troubleshooting module.

---

### Step 9 — Take the baseline snapshot

```bash
yooti sprint:start
# This captures a regression baseline in .agent/snapshots/
```

This baseline is used by the pipeline to run regression diffs. Every
time the agent generates code, it diffs the new test results against
this snapshot to catch regressions before the PR opens.

---

### Step 10 — Send team onboarding links

Your setup is complete. Now send each team member their module:

```
Product Manager  → Module 02
Architect        → Module 03
Developer        → Module 04 (you also read this)
QA / SDET        → Module 05
DevOps           → Module 06
```

Tell them the repo URL, tell them to clone it, and tell them their
first task is to read their module. The tech lead's job on Day 1 is
done when the stack is running and the team is reading.

---

### What success looks like at end of Day 1

```
✓ yooti preflight passes all 7 checks
✓ docker compose ps shows all services running
✓ All baseline tests pass
✓ .agent/snapshots/ has a baseline file
✓ Team members have cloned the repo and read their modules
✓ First story added by PM (Module 02)
```

---

---

# MODULE 02 — Product Manager

## Writing stories that the agent can actually build

**You own Gate G1. 20 minutes to read, then ongoing.**

---

### Your role in the pipeline

You are the starting point. Nothing the agent builds exists without a
story you wrote. Your job at Gate G1 is to make sure every story is
complete, unambiguous, and ready to build before the sprint starts.

The agent is very good at building things. It is not good at guessing
what you meant. A vague story produces vague code. A precise story
produces precise code. This module shows you what precise looks like.

---

### Step 1 — Add your first story

From the project root:

```bash
yooti story:add
```

The wizard asks for:

```
FIELD               WHAT TO ENTER
──────────────────  ────────────────────────────────────────────────────
Story ID            STORY-001 (increment for each story)
Title               Short description — "User can reset their password"
Type                feature / bugfix / refactor / chore
Priority            P0 (critical) / P1 (high) / P2 (medium) / P3 (low)
Acceptance criteria At least one Given/When/Then statement
```

---

### Step 2 — Write acceptance criteria the agent can test

The most important part of your story is the acceptance criteria. Each
criterion must be testable — the agent writes a test for each one.

**Format that works:**

```
Given: [starting state]
When:  [action taken]
Then:  [expected outcome]
```

**Example — good:**

```
STORY-001: User can reset their password

Given: a registered user who has forgotten their password
When:  they submit their email address on the reset password page
Then:  they receive an email with a reset link within 60 seconds
       the reset link expires after 24 hours
       submitting an invalid email shows an error message
       submitting a valid email always shows a success message
       (even if no account exists — security requirement)
```

**Example — too vague:**

```
STORY-001: Password reset

Given: a user
When:  they reset their password
Then:  it works
```

The agent cannot write a test for "it works." It can write a test for
"they receive an email with a reset link within 60 seconds."

---

### Step 3 — Review the validation output

After you submit the story, the agent validates it and produces a
`.agent/requirements/STORY-001-validated.json` file. It also prints
a summary showing:

```
✓ Story parsed successfully
✓ 4 acceptance criteria found
✓ All criteria are testable
⚠ 1 ambiguity flag: "within 60 seconds" — is this a hard requirement
  or a guideline? If the email arrives at 61 seconds, does the test fail?
```

If there are ambiguity flags, you must resolve them before the sprint
starts. Edit the story to make the flagged criteria explicit, then
run `yooti story:add` again with the corrected version.

---

### Step 4 — Sign off at Gate G1

Before the sprint starts, review all validated stories in
`.agent/requirements/`. For each one, confirm:

```
□ The title describes what the user can do — not what the system does
□ Every acceptance criterion has a Given, When, and Then
□ Every Then is something you could verify by looking at the screen
  or checking a database — not "it feels right" or "it works"
□ Edge cases are explicit — what happens when input is invalid?
□ Security requirements are spelled out — not implied
□ The priority reflects actual business impact
```

When you are satisfied, tell the Tech Lead that Gate G1 is signed.
The sprint can start.

---

### What to do when a story comes back from the agent

Sometimes the agent flags a story as blocked mid-sprint because it
discovered an ambiguity during code generation that was not visible
at requirements time. When this happens you will see a file in
`.agent/escalations/` with a specific question.

Read the question. Answer it in plain English. Give your answer to
the developer, who feeds it back to the agent as a correction prompt.
The agent resumes from where it stopped.

---

### Common PM mistakes

```
MISTAKE                               FIX
────────────────────────────────────  ────────────────────────────────────
Writing from the system's perspective  Write from the user's perspective
"The system sends an email"            "The user receives an email"

Implicit edge cases                    Make every edge case explicit
"Invalid input shows an error"         "An email address without @ shows
                                        the message 'Please enter a valid
                                        email address'"

Vague time requirements                Use measurable numbers
"The page loads quickly"               "The page loads in under 2 seconds
                                        on a 4G connection"

Missing security requirements          State them explicitly
(implied by other stories)             "Unauthenticated users cannot access
                                        this endpoint"
```

---

---

# MODULE 03 — Architect

## Reviewing .plan files before the agent writes a single line of code

**You own Gate G2. 20 minutes to read, then 30 minutes per sprint.**

---

### Your role in the pipeline

You are the second gate. After the PM signs off stories, the agent writes
`.plan.md` files — one per task — that describe exactly what it intends
to do before it does it. Your job is to review those plans and decide
whether the implementation approach is sound before any code is written.

This is the highest-leverage gate in the pipeline. A correction at G2
takes 10 minutes. The same correction after the agent has written 400
lines of code takes much longer.

---

### Step 1 — Find the plans to review

After the PM signs off and the sprint starts, plans appear in:

```
.agent/plans/
├── STORY-001-T001.plan.md    ← Task 1 of Story 001
├── STORY-001-T002.plan.md    ← Task 2 of Story 001
└── STORY-001-T003.plan.md    ← Task 3 of Story 001
```

Each `.plan.md` file has this structure:

```markdown
# STORY-001-T001 — Add password reset endpoint

## Scope
Files to CREATE:
- services/api/src/routes/auth/reset-password.ts
- services/api/src/services/email.service.ts

Files to MODIFY:
- services/api/src/routes/auth/index.ts

Files OUT OF SCOPE (do not touch):
- services/api/src/routes/users/
- frontend/dashboard/

## Implementation steps
1. Create the reset-password route handler
2. Add email service with SendGrid integration
3. Add expiry logic (24 hours)
4. Register route in auth index

## Acceptance criteria covered
- AC-1: User receives email within 60 seconds
- AC-2: Reset link expires after 24 hours

## Dependencies
- Requires STORY-001-T002 (email template) to be complete first
```

---

### Step 2 — Review each plan

For each plan, check:

```
□ SCOPE IS CORRECT
  The files listed make sense for this task.
  No files are missing that should be changed.
  No files are listed that should not be touched.

□ APPROACH IS SOUND
  The implementation steps describe the right solution.
  No existing patterns or conventions are being violated.
  No new dependencies are being introduced without discussion.

□ DEPENDENCIES ARE CORRECT
  Tasks that depend on other tasks are sequenced correctly.
  No circular dependencies.

□ AC COVERAGE IS COMPLETE
  Every acceptance criterion from the story is covered
  by at least one task in the plan set.

□ SCOPE DOES NOT BLEED
  The plan does not list files from unrelated services.
  The agent is not proposing to refactor things not in the story.
```

---

### Step 3 — Approve or correct

**If the plan is correct:**

Create a file `.agent/gates/STORY-001-G2-approved.md` with your sign-off:

```markdown
# Gate G2 — Architecture Review
Story: STORY-001
Approved by: [your name]
Date: [today]
Notes: Approach is sound. Approved to proceed.
```

**If the plan needs changes:**

Edit the `.plan.md` file directly with your corrections, or write your
feedback in `.agent/escalations/STORY-001-G2-feedback.md`. The agent
reads the escalations folder and rewrites the plan based on your feedback.

The agent then produces a new plan. Review again. Approve when satisfied.

---

### What to watch for as Architect

```
PATTERN                               ACTION
────────────────────────────────────  ────────────────────────────────────
Plan touches authentication code       Review extra carefully — auth bugs
                                        are security issues

Plan introduces a new dependency       Approve explicitly — note it in
(new npm package, new Python lib)      your G2 sign-off

Plan modifies a shared service         Check that other stories in the
                                        sprint are not touching the same
                                        files (merge conflict risk)

Plan proposes a new pattern            Decide if it belongs in the
not in the existing codebase           Pattern Mandate or should follow
                                        existing conventions

Plan scope seems too large for         Split the task — ask the agent to
one task (> 5 files)                   decompose further before approving
```

---

---

# MODULE 04 — Developer

## Reviewing what the agent built — your most important 45 minutes

**You own Gate G3. This is the highest-value gate in the pipeline.**

---

### Your role in the pipeline

The agent wrote the code. Your job is not to trust it — your job is to
verify it. You are the human who decides whether this code is correct,
safe to merge, and something you would be comfortable owning in production.

You have four options at Gate G3:

```
OPTION 1: Approve as-is
  The code is correct. The tests pass. Merge it.

OPTION 2: Edit and approve
  The code is almost right. Edit it directly in the branch,
  run the tests yourself, then approve.

OPTION 3: Request corrections
  The code has issues the agent can fix. Write your feedback
  as a comment on the PR. The agent generates a correction,
  opens a new commit on the same branch, and you review again.

OPTION 4: Reject and return to planning
  The implementation approach is fundamentally wrong.
  The story goes back to Phase 2 for a full replan.
  This should be rare if G2 was done correctly.
```

---

### Step 1 — Open the PR

The agent opens the PR automatically after Phase 5 completes. You will
receive a notification through GitHub (or your configured CI provider).

The PR body contains:

```
SECTION                 WHAT IT SHOWS
──────────────────────  ────────────────────────────────────────────────
Story summary           Which story, which tasks, which acceptance criteria
AC status table         Each acceptance criterion: PASS / FAIL / PARTIAL
Files changed           Every file the agent touched, with line counts
Test results            Unit: X/X pass, Integration: X/X pass
Coverage report         Overall: X%, New code: X%
Regression diff         0 newly failing tests (or list of regressions)
Mutation score          X% — how well tests catch deliberate bugs
Security scan           0 HIGH/CRITICAL findings (or list of issues)
Agent execution log     How many iterations, what failure types were fixed
Deliberate decisions    Choices the agent made that you should know about
Uncovered branches      Lines not covered — explained, not hidden
```

Read the entire PR body before looking at any code.

---

### Step 2 — Read the code

Go through every changed file. You are looking for:

```
□ CORRECTNESS
  Does the code do what the acceptance criteria say it should do?
  Not just "does it pass the tests" — does it actually do the right thing?

□ EDGE CASES
  Did the agent handle the edge cases the PM specified?
  Are there edge cases the PM missed that this code should handle?

□ SECURITY
  Are inputs validated?
  Are there any SQL injection, XSS, or CSRF risks?
  Are secrets handled correctly (env vars, not hardcoded)?
  Are authentication checks in the right places?

□ PERFORMANCE
  Any N+1 queries?
  Any operations that should be async but are not?
  Any missing indexes that would make this slow at scale?

□ CONVENTIONS
  Does the code follow your team's patterns?
  Are naming conventions consistent with the rest of the codebase?
  Are error messages in the right format?

□ TESTS
  Do the tests actually test what they claim to test?
  Are there missing test cases for important edge cases?
  Are mocks realistic?
```

---

### Step 3 — Make your decision

**To edit code directly:**

```bash
git fetch origin
git checkout feature/STORY-001

# Make your changes
# Then run tests to verify
npm test                          # Node.js
pytest tests/unit/ -m "not eval"  # Python

git add .
git commit -m "fix: correct edge case in reset password route"
git push origin feature/STORY-001
```

Then approve the PR on GitHub. Your commits and the agent's commits
both appear in the PR history — this is intentional and correct.

**To request agent corrections:**

Write a PR comment that is specific and actionable:

```
GOOD comment:
"The expiry check on line 47 uses Date.now() which returns milliseconds
but the expires_at field is stored in seconds. This comparison will never
be true. Fix the comparison to use Date.now() / 1000."

BAD comment:
"The expiry logic seems wrong"
```

The agent reads specific comments and generates a targeted fix.
Vague comments produce vague fixes.

---

### Step 4 — After approval

Once you approve, the PR merges automatically. The Deploy Agent takes
over: staging deploy, smoke tests, health report, then Gate G5 for
the Release Manager.

You do not need to monitor the deployment. If anything fails in staging
you will be notified.

---

### Patterns that should always trigger a rejection

```
□ Agent hallucinated an import that does not exist in package.json
□ Agent used a function from a library that has a different API
  than what the agent wrote (check the actual library docs)
□ Authentication or authorisation logic is missing on a protected route
□ Agent wrote console.log or print statements with sensitive data
□ Agent hardcoded a value that should come from an environment variable
□ Test mocks return data that could never come from the real service
□ Coverage is technically >= 90% but the tests are not testing anything
  meaningful (assertions always pass, no edge cases covered)
```

---

---

# MODULE 05 — QA / SDET

## Reviewing the evidence package — quality sign-off at Gate G4

**You own Gate G4. 20 minutes to read, then 20 minutes per story.**

---

### Your role in the pipeline

By the time a story reaches you at Gate G4, the agent has already run
unit tests, integration tests, regression diff, mutation testing, coverage
analysis, and a security scan. Your job is not to run more tests — your
job is to evaluate whether the evidence the agent produced is sufficient
to ship this story.

You are the quality conscience of the team. The agent ran the tests.
You decide if the tests were the right tests.

---

### Step 1 — Find the evidence package

After Phase 5 completes, the evidence package is at:

```
.agent/evidence/STORY-001/
├── test-results.json         ← Pass/fail for every test
├── coverage-summary.json     ← Coverage per file
├── regression-diff.json      ← New failures vs baseline
├── mutation-score.json       ← Which mutations survived
├── security-scan.json        ← Snyk + Semgrep findings
└── pr-body.md                ← Generated PR body (human-readable summary)
```

Start with `pr-body.md` — it summarises everything in human-readable
format. Then dig into specific files if you need detail.

---

### Step 2 — Run the quality checklist

```
UNIT TESTS
□ All unit tests pass (100% required)
□ Test names describe what they are testing — not "test_1"
□ Each test has a meaningful assertion — not just "assert True"
□ Edge cases from the acceptance criteria have tests
□ Error paths have tests — not just happy paths

INTEGRATION TESTS
□ All integration tests pass (100% required)
□ Every acceptance criterion has at least one integration test
□ Tests run against real services (database, cache) not mocks
□ Setup and teardown are correct — tests do not pollute each other

REGRESSION DIFF
□ Zero newly failing tests (hard requirement)
□ If any tests were removed, there is an explanation in the PR body

MUTATION SCORE
□ Score is >= 85% (hard requirement for approval)
□ If score is 70–84%, review which mutations survived
  — are they testing trivial code, or is real logic uncovered?
□ If score is < 70%, reject — the tests exist but do not protect anything

COVERAGE
□ Overall coverage >= 80%
□ New code coverage >= 90%
□ Uncovered branches are documented and intentional — not gaps

SECURITY SCAN
□ Zero HIGH or CRITICAL Snyk findings (hard requirement)
□ Zero Semgrep findings (hard requirement)
□ MEDIUM findings: review and document if intentionally accepted

ACCESSIBILITY (frontend stories)
□ Zero axe-core violations
□ Playwright responsive tests pass at 375px, 768px, 1280px
□ Lighthouse performance score >= 80
□ Lighthouse accessibility score >= 90
```

---

### Step 3 — Approve or reject

**To approve at Gate G4:**

Create `.agent/gates/STORY-001-G4-approved.md`:

```markdown
# Gate G4 — QA Sign-off
Story: STORY-001
Approved by: [your name]
Date: [today]
Evidence reviewed: test-results, coverage, mutation, security
Notes: All gates pass. Mutation score 91%. Approved.
```

**To reject at Gate G4:**

Create `.agent/gates/STORY-001-G4-rejected.md` with specific reasons:

```markdown
# Gate G4 — QA Rejected
Story: STORY-001
Date: [today]
Reason: Mutation score 68%. The reset-password.service.ts has 12 surviving
mutations in the expiry logic. The tests need additional cases covering:
- Token expiry boundary (exactly at 24h)
- Token already used (should not be reusable)
Return to Phase 4 for test additions.
```

The story returns to Phase 4. The agent adds the missing tests,
re-runs the full test suite, and produces a new evidence package.

---

### Your ongoing responsibility: test strategy

The agent follows your test strategy as defined in `.claude/agents/testgen.md`.
If you see patterns in the agent's tests that are consistently weak —
always missing boundary conditions, always using shallow mocks, never
testing concurrent access — update the testgen prompt file. The agent
will follow updated instructions from the next story onward.

---

---

# MODULE 06 — DevOps and Release Manager

## Environment ownership and production deployment

**You own the infrastructure and Gate G5. 20 minutes to read.**

---

### DevOps — your responsibilities

You own the environment. The agent deploys to it — but you control
what that environment looks like, what secrets are in it, and what
health checks it must pass.

**Day 1 — environment setup:**

```bash
# Verify local stack starts
docker compose up -d
docker compose ps      # all services should show "running"

# Verify environment variables are populated
cat .env               # should have all values from .env.example

# Verify pipeline scripts run
bash pipeline/scripts/preflight.sh
```

**Your ongoing responsibilities:**

```
□ Keep infrastructure config in version control
  (docker-compose.yml, Terraform, etc.)

□ Own the secrets — never let application code handle secrets
  Use AWS Secrets Manager, Vault, or GitHub Actions secrets

□ Maintain staging environment parity with production
  Same database version, same Redis version, same Python version

□ Set up the nightly eval CI job
  In .github/workflows/agent-evals.yml
  Add ANTHROPIC_API_KEY as a GitHub Actions secret

□ Monitor staging health after every deploy
  The agent produces a health report — you receive it

□ If the agent escalates an ENV_ERROR, you own the fix
  These appear in .agent/escalations/ with ENV_ERROR type
```

**If a pre-flight check fails:**

```bash
yooti preflight
# Read the specific failure message
# Fix the environment issue
# Run preflight again until all checks pass
```

---

### Release Manager — Gate G5

After QA signs off at Gate G4, the agent deploys to staging, runs
smoke tests, and produces a staging health report. You review the
report and decide whether to approve production deployment.

**What the staging health report contains:**

```
Staging deploy: SUCCESS / FAILED
Smoke tests:    X/X passing
Health checks:
  API /health       → 200 OK, response < 200ms
  Database          → connected, migrations applied
  Cache             → connected
  Agent endpoint    → responding (if applicable)
Performance:
  P50 response time → Xms
  P95 response time → Xms
  Error rate        → X%
```

**To approve at Gate G5:**

```bash
# Review the health report
cat .agent/evidence/STORY-001/staging-health-report.md

# If satisfied, approve in GitHub
# OR create the gate file
echo "Approved for production — [your name] [date]" \
  > .agent/gates/STORY-001-G5-approved.md
```

**Production deployment happens automatically after your approval.**

The agent monitors production for 15 minutes after deployment. If any
health check fails during this window, it automatically rolls back to
the previous version and notifies you. You do not need to watch it —
you will be notified if a rollback occurs.

---

---

# MODULE 07 — Brownfield adoption

## Adding Yooti to an existing codebase without breaking anything

**For tech leads adopting on an existing project. 30 minutes.**

---

### What brownfield means

Brownfield means you have an existing codebase. Tests may exist or not.
Coverage may be good or bad. The agent's job in brownfield mode is
surgical — it touches as little as possible, makes targeted changes,
and never modifies tests that are currently passing.

The risk in brownfield is regression — the agent changes something and
breaks behaviour that was working before. The entire brownfield process
is designed to prevent this.

---

### Step 1 — Initialise in brownfield mode

From inside your existing project root:

```bash
yooti init . --context brownfield
```

The `--context brownfield` flag changes what the scaffold generates:

```
ADDITIONAL FILES IN BROWNFIELD
────────────────────────────────────────────────────────────────────
.agent/discovery/risk-surface.json     Simulated scan of your codebase
.agent/snapshots/baseline.json         Template — you populate this
.claude/rules/brownfield-rules.md      Surgical mode rules for the agent
```

---

### Step 2 — Capture the real baseline

The most important step in brownfield adoption. Run your existing tests
and capture the results as the baseline:

```bash
# Run your existing test suite
npm test > /tmp/test-results.txt 2>&1    # Node.js
# or
pytest --json-report > /tmp/test-results.txt 2>&1    # Python

# Capture the baseline
yooti sprint:start
```

This baseline is sacred. Any test that is passing today must still be
passing after every story the agent delivers. A regression against
this baseline blocks the PR — automatically, without you having to
check manually.

---

### Step 3 — Understand the risk surface

Open `.agent/discovery/risk-surface.json`. This file identifies:

```json
{
  "high_risk_files": [
    {
      "file": "src/services/payment.service.ts",
      "reason": "Low coverage (12%) with high dependency count (8 files import this)",
      "recommendation": "Write characterisation tests before allowing agent to touch"
    }
  ],
  "safe_to_modify": [
    {
      "file": "src/routes/health.ts",
      "reason": "High coverage (94%), low dependencies"
    }
  ]
}
```

High-risk files require characterisation tests before the agent can
touch them. Do not skip this step — it is what prevents regressions.

---

### Step 4 — Write characterisation tests for high-risk files

A characterisation test captures what the code currently does —
not what you wish it did. It documents existing behaviour so you
know if the agent changes it.

```typescript
// Example characterisation test
describe('PaymentService (characterisation)', () => {
  it('returns the exact response format currently produced', async () => {
    const result = await paymentService.process({ amount: 100 })
    // Capture the exact current output — not what you think it should be
    expect(result).toMatchSnapshot()
  })

  it('throws the exact error currently thrown on invalid input', async () => {
    await expect(paymentService.process({ amount: -1 }))
      .rejects.toThrow('Invalid amount')  // whatever it currently throws
  })
})
```

Run these tests to establish they pass. Then commit them. Now the agent
is protected from accidentally changing this behaviour.

---

### Step 5 — Start with low-risk stories

For your first few brownfield stories, only assign work to files in the
`safe_to_modify` list. This builds your team's confidence in the agent
before it touches critical code.

After 2–3 successful stories on safe files, start introducing stories
that touch medium-risk files (coverage 40–70%). High-risk files (< 40%
coverage) should have characterisation tests written before the agent
touches them.

---

### Brownfield rules the agent follows

These are baked into `.claude/rules/brownfield-rules.md`:

```
RULE 1 — NEVER modify a test that is currently passing
  The agent can ADD tests. It cannot change existing ones.

RULE 2 — MINIMAL DIFF
  Change only what is required for the acceptance criteria.
  Do not refactor surrounding code unless it is in the plan.

RULE 3 — MATCH EXISTING PATTERNS
  If the codebase uses callbacks, do not introduce promises.
  If the codebase uses snake_case, do not introduce camelCase.
  Match the existing style, even if it is not ideal.

RULE 4 — CHARACTERISATION TESTS FIRST
  Before modifying any file with < 40% coverage, write
  characterisation tests and get them passing. Then proceed.

RULE 5 — ESCALATE ON TANGLED CODE
  If implementing the acceptance criteria requires changing
  more than the plan scope, escalate. Do not expand scope.
```

---

---

# MODULE 08 — Changing adoption stage

## Moving from where you started to where you want to be

**For the whole team. Read together before advancing. 15 minutes.**

---

### When to advance stages

Do not advance because you think you should. Advance when the evidence
shows you are ready. Here is what ready looks like for each transition:

```
ADVANCING FROM STAGE 1 TO STAGE 2
Ready when:
□ The team has run 2+ sprints with the pipeline framework
□ Everyone is comfortable with the .agent/ artifacts
□ The PM is writing well-structured stories consistently
□ The architect has a clear view of .plan.md format
Not ready if:
□ Pre-flight checks are failing regularly
□ The PM is still writing ambiguous stories
□ Gate G1 is being rubber-stamped rather than reviewed

ADVANCING FROM STAGE 2 TO STAGE 3
Ready when:
□ The team has reviewed 5+ agent-generated .plan.md files
□ The architect is comfortable approving plans at Gate G2
□ The developer has reviewed agent-generated code in experiments
□ The team has discussed and agreed on the PR review process
Not ready if:
□ Gate G2 is taking more than 45 minutes per story
□ Plans are being rejected more than twice per story
□ The team does not yet trust the quality gate thresholds

ADVANCING FROM STAGE 3 TO STAGE 4
Ready when:
□ The team has merged 10+ agent PRs with zero production incidents
□ Gate G3 reviews are taking < 30 minutes per story
□ The developer is not regularly finding the same type of issue
□ Staging deploys are consistently healthy
Not ready if:
□ The developer is still finding security issues in agent code
□ Regression rate is > 0 per sprint
□ Mutation scores are regularly below 85%

ADVANCING FROM STAGE 4 TO STAGE 5
Ready when:
□ The team has run 3+ sprints at Stage 4 with no incidents
□ Gate G5 approvals are taking < 5 minutes (health report is clean)
□ Auto-rollbacks have happened 0 times or were handled automatically
□ The team is genuinely constrained by gate time, not quality concerns
Not ready if:
□ Any gate is being skipped rather than properly reviewed
□ The release manager does not feel confident in the health reports
□ There are open security findings in any recent story
```

---

### How to change stage

```bash
# Interactive — wizard shows current stage and asks for new one
yooti configure

# Direct — change without wizard
yooti configure --stage 4
```

When you run configure, it:
1. Updates `yooti.config.json` with the new stage
2. Shows a diff of which phases changed from human to agent
3. Tells you to run `yooti upgrade --only-prompts` to regenerate `.claude/`

```bash
# Regenerate agent context for the new stage
yooti upgrade --only-prompts
```

This updates `.claude/CLAUDE.md` with new handover point instructions
for the agent. The agent reads its own config — after this command it
knows exactly what changed.

---

### Have a team conversation before advancing

Changing stage affects every person on the team. Before running
`yooti configure`, have a 15-minute team conversation covering:

```
□ What motivated this change? (Evidence, not impatience)
□ Is everyone comfortable with what we are delegating to the agent?
□ What is our rollback plan if we encounter issues?
   (Answer: yooti configure --stage [previous stage])
□ What will we watch closely in the first sprint at the new stage?
□ When will we review whether the advance was the right call?
```

---

---

# MODULE 09 — Troubleshooting

## When something goes wrong

**Anyone reads this. Use the index to find your issue.**

---

### Index

```
Issue                                           Section
──────────────────────────────────────────────  ────────
yooti command not found after install           9.1
Command conflict with existing tool             9.2
Docker services not starting                    9.3
Pre-flight checks failing                       9.4
Agent not generating code                       9.5
Tests failing in baseline                       9.6
Agent looping without converging                9.7
PR body missing test results                    9.8
Staging deploy failing                          9.9
LangSmith traces not appearing                  9.10
Story stuck in escalation                       9.11
Regression introduced by agent                  9.12
```

---

### 9.1 — yooti command not found after install

```bash
# Check npm global bin is on your PATH
npm bin -g
# Copy the output path

# Add to your shell config
echo 'export PATH="$(npm bin -g):$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify
which yooti
yooti --version
```

---

### 9.2 — Command conflict with existing tool

If another tool named `yooti` exists on your PATH:

```bash
# Find what is conflicting
which -a yooti

# Check if the conflicting one is a Python package
pip show yooti 2>/dev/null

# If it is an old unused package, remove it
pip uninstall yooti

# If you need to keep it, rename it
sudo mv $(which yooti) $(which yooti)-old

# Reinstall the CLI
npm link
```

---

### 9.3 — Docker services not starting

```bash
# Check which service is failing
docker compose ps
docker compose logs [service-name]

# Common fixes:
# Port already in use
lsof -i :3000          # find what is using port 3000
kill -9 [PID]          # kill it

# Database volume corrupted
docker compose down -v  # WARNING: deletes all data
docker compose up -d

# Not enough memory
# Increase Docker Desktop memory to at least 4GB
# Docker Desktop → Settings → Resources → Memory
```

---

### 9.4 — Pre-flight checks failing

```bash
yooti preflight
# Read the specific failure for each check

# Common failures and fixes:
#
# "Git repository does not exist"
git init

# "Working tree is not clean"
git status              # see what is uncommitted
git add . && git commit -m "chore: initial setup"

# "yooti.config.json is not valid JSON"
cat yooti.config.json | python3 -m json.tool
# The output will show the exact line with the syntax error

# "Pipeline scripts not found"
ls pipeline/scripts/    # check what is missing
# Re-run: yooti init to regenerate missing files
```

---

### 9.5 — Agent not generating code

The agent generates code when it is in a project at Stage 3 or above
AND there is a validated story in `.agent/requirements/`.

Check:

```bash
# Check the stage
cat yooti.config.json | grep stage

# Check for validated stories
ls .agent/requirements/

# If no stories exist
yooti story:add

# If stage is 1 or 2
yooti configure --stage 3
```

---

### 9.6 — Tests failing in baseline

If your baseline tests are failing before the agent has written anything:

```bash
# Run tests manually to see the failure
npm test                           # Node.js
pytest tests/ -m "not eval"        # Python

# Read the failure output carefully
# Common causes:
# - Missing environment variable
# - Database not seeded
# - Service not running

# Fix the environment, then retake the baseline
yooti sprint:start
```

---

### 9.7 — Agent looping without converging

If the agent reaches 5 iterations without getting to green:

1. Check `.agent/escalations/` for an escalation file
2. Read the escalation — it describes exactly which failure the agent
   could not self-heal and why
3. The developer reads the escalation and either:
   - Fixes the specific issue themselves
   - Feeds the agent a more specific correction prompt
   - Returns the story to planning if the approach is wrong

The escalation file format:

```
Story:          STORY-001
Task:           T002
Iterations:     5
Final failure:  IMPORT_ERROR
Detail:         Cannot resolve module '@company/shared-types'.
                Package exists in package.json but is not in node_modules.
                Likely cause: npm install has not been run after package.json
                was updated in a recent commit.
Recommended:    Run npm install and verify the import resolves.
```

---

### 9.8 — PR body missing test results

If the PR body does not include test results, the evidence package was
not generated correctly:

```bash
ls .agent/evidence/STORY-001/
# Check which files are present

# If test-results.json is missing, the test run failed silently
# Check the CI logs for the story
```

---

### 9.9 — Staging deploy failing

```bash
# Check the staging health report
cat .agent/evidence/STORY-001/staging-health-report.md

# Common causes:
# Missing environment variable in staging
# Database migration not applied
# New dependency not installed in staging container

# Fix the staging environment, then manually trigger redeploy
# DO NOT approve Gate G5 until staging is healthy
```

---

### 9.10 — LangSmith traces not appearing

```bash
# Check environment variables
grep LANGCHAIN .env

# Should see:
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your-key
LANGCHAIN_PROJECT=your-project

# Verify the key is valid
curl -H "x-api-key: $LANGCHAIN_API_KEY" \
  https://api.smith.langchain.com/api/v1/ping

# Restart the agents container to pick up env changes
docker compose restart agents
```

---

### 9.11 — Story stuck in escalation

A story stuck in `.agent/escalations/` means the agent stopped and
is waiting for a human input it cannot determine itself.

```bash
ls .agent/escalations/

# Read the escalation file
cat .agent/escalations/STORY-001-blocked.md

# The file will say which type of escalation it is:
# SCOPE_ERROR  → Developer and Architect decide scope change
# ENV_ERROR    → DevOps fixes the environment
# AMBIGUITY    → PM clarifies the requirement
# ARCH_ERROR   → Architect reviews the approach
```

Each escalation type has a clear owner. Route it to the right person.
When they resolve it, delete the escalation file and the agent resumes.

---

### 9.12 — Regression introduced by agent

If the regression diff shows newly failing tests:

```bash
cat .agent/evidence/STORY-001/regression-diff.json

# This shows exactly which tests were passing before and are failing now
# and which files were changed that might have caused the regression

# Options:
# 1. The agent caused the regression — return the story to Phase 4
#    with a specific correction prompt explaining which tests regressed

# 2. The regression existed before (flaky test) — document it
#    cat "Known flaky: [test name] — [reason]" \
#      >> .agent/known-flaky-tests.md
#    Update the baseline to exclude the flaky test

# 3. The regression reveals a bug in existing code — open a new story
#    to fix the pre-existing bug separately
```

---

### Getting help

If your issue is not covered here:

```
1. Check .agent/escalations/ for any escalation files — they often
   contain the specific error the agent encountered

2. Check the CI logs in GitHub Actions for the specific job that failed

3. Check docker compose logs [service] for service-level errors

4. Open an issue at github.com/yooti/cli with:
   - The output of: yooti preflight
   - The output of: cat yooti.config.json
   - The specific error message you are seeing
   - Your Node.js, Docker, and Python versions
```

---

*End of Getting Started Guide — Yooti v1.0*
