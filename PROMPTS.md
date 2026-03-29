# Yooti — Prompt Library
# The exact prompt to use at every stage of the pipeline
# Copy and paste directly into Claude Code or Codex CLI

---

## How to use this guide

These are the only prompts you need to run the full pipeline.
Keep them short — the agent reads CLAUDE.md for everything else.
If you find yourself writing a long explicit prompt, something is
missing from CLAUDE.md — fix it there, not in the prompt.

A good prompt is one sentence. A prompt longer than three sentences
is a signal that CLAUDE.md needs updating.

---

---

# SPRINT SETUP

---

## Import stories

Import built-in sample stories:

    yooti story:sample --app ecommerce
    yooti story:sample --app ecommerce --sprint 1      # Sprint 1 only
    yooti story:sample --app ecommerce --prefix PROJ   # custom ID prefix

Import your own stories from a JSON file:

    yooti story:import --file my-stories.json
    yooti story:import --file my-stories.json --overwrite   # replace existing

---

## Gate G1 — PM approves stories

    yooti story:approve --all          # approve all stories at once
    yooti story:approve STORY-001      # approve one story

---

## Start the sprint

    yooti sprint:start

Runs preflight, captures regression baseline, validates all G1 gates.

---

---

# PHASE 2 — STORY DECOMPOSITION

The agent generates .plan.md files — one per task, split by layer.
No code is written. Plans only.

---

## Generate plans for one story

    Proceed to Phase 2 for STORY-001.

---

## Generate plans for multiple stories

    Proceed to Phase 2 for STORY-001, STORY-002, STORY-003.

---

## Generate plans for all new sprint stories

    Proceed to Phase 2 for all new stories in this sprint.

---

## Generate plans in dependency order (when stories depend on each other)

    Proceed to Phase 2 for all new Sprint 2 stories.
    Dependency order: STORY-011 first, then STORY-012 and STORY-013,
    then STORY-006, STORY-007, STORY-008, STORY-009.

---

## Regenerate plans — architect rejected at G2

    The plans for STORY-001 were rejected at Gate G2.
    Read the feedback in .agent/escalations/STORY-001-G2-revision.md
    Delete .agent/plans/STORY-001-*.plan.md
    Regenerate plans for STORY-001 following the decomposition rules.
    No code.

---

## Regenerate plans — wrong decomposition (one task per AC)

    The plans for STORY-001 are incorrect — tasks are split by AC not by layer.
    Delete .agent/plans/STORY-001-*.plan.md
    Re-read the decomposition rules in .claude/CLAUDE.md.
    An M-complexity story has 2-3 tasks maximum, split by layer.
    Regenerate plans for STORY-001. No code.

---

---

# GATE G2 — ARCHITECT REVIEW

The architect reviews each plan interactively.

---

## Review plans for one story

    yooti plan:review STORY-001

---

## Review plans for all Sprint 2 stories

    yooti plan:review STORY-006
    yooti plan:review STORY-007
    yooti plan:review STORY-008
    yooti plan:review STORY-009
    yooti plan:review STORY-011
    yooti plan:review STORY-012
    yooti plan:review STORY-013

---

## Add an annotation to a specific task plan

    yooti plan:amend STORY-001-T002

Choose: Add role annotation. Enter your constraint.
Example annotation: Use repository pattern — no direct DB queries in routes.

---

---

# PHASE 4 — CODE GENERATION

The agent writes tests first (TDD), then implementation.
Runs lint, type check, tests, self-heals up to 5 iterations.
Opens a PR after Phase 5 completes. Stops at Gate G3.

---

## Generate code for one story

    Proceed to Phase 4 for STORY-001.

---

## Generate code for all approved stories

    Proceed to Phase 4 for all approved stories in dependency order.

---

## Generate code for Sprint 2 with explicit dependency order

    Proceed to Phase 4 for all approved Sprint 2 stories
    in this dependency order:
      STORY-011 first (design system — no dependencies)
      STORY-012 and STORY-013 after STORY-011 completes
      Then STORY-006, STORY-007, STORY-008, STORY-009

---

## Generate code for specific stories only

    Proceed to Phase 4 for STORY-003 and STORY-004.
    STORY-003 first — STORY-004 depends on it.

---

## Resume after a break or context reset

    Read .claude/CLAUDE.md.
    Check .agent/plans/ for tasks with Status: PENDING or IN_PROGRESS.
    Resume Phase 4 from where it stopped.
    Do not restart completed tasks.

---

## Resume after resolving an escalation

    The escalation in .agent/escalations/STORY-001-T002-ENV_ERROR.md
    has been resolved. Continue Phase 4 for STORY-001-T002.

---

## Resume after installing a new dependency

    The package listed in .agent/escalations/STORY-001-T001-INSTALL_REQUIRED.md
    has been installed. Continue Phase 4 for STORY-001-T001.

---

---

# PHASE 5 — EVIDENCE PACKAGE

The agent runs the full test suite, generates coverage, regression diff,
security scan, code audit, and PR body. Opens the PR.

Phase 5 runs automatically after Phase 4. These prompts are for when
it was skipped or needs to be regenerated.

---

## Generate evidence package — Phase 5 was skipped

    Phase 5 was skipped for STORY-001.
    Read the current test results from services/api_python/coverage.json
    Generate the evidence package in .agent/evidence/STORY-001/
    Do not re-run tests — read from existing coverage.json.
    Open the PR after evidence is complete.

---

## Regenerate evidence — stale coverage numbers

    The coverage numbers in .agent/evidence/STORY-001/coverage-summary.json
    are stale. The pyproject.toml coverage config was updated.
    Read the current coverage from services/api_python/coverage.json
    Update .agent/evidence/STORY-001/coverage-summary.json only.
    Do not re-run tests. Do not change other evidence files.

---

## Regenerate evidence for all Sprint 1 stories — stale numbers

    The coverage-summary.json in all Sprint 1 evidence packages is stale.
    Read the current coverage from services/api_python/coverage.json
    Update coverage-summary.json for:
      .agent/evidence/STORY-001/
      .agent/evidence/STORY-002/
      .agent/evidence/STORY-003/
      .agent/evidence/STORY-004/
      .agent/evidence/STORY-005/
      .agent/evidence/STORY-010/
    Use the same numbers for all — they share the same test suite.
    Do not re-run tests. Do not change other evidence files.

---

## Fix code audit violations before PR

    The code audit for STORY-001 found violations.
    Read .agent/evidence/STORY-001/code-audit.md
    Fix each violation listed.
    Re-run the quality loop.
    Regenerate the evidence package with updated audit report.
    Do not change any tests.

---

## Open PR after evidence is ready

    The evidence package for STORY-001 is complete and all hard gates pass.
    Open the PR now. Branch: feature/STORY-001.
    Use .agent/evidence/STORY-001/pr-body.md as the PR body.
    Do not merge.

---

---

# GATE G3 — DEVELOPER PR REVIEW

Gate G3 happens entirely in GitHub. No CLI command required.
Review the PR, edit if needed, approve and merge.
The gate-g3.yml Action creates the gate file automatically on merge.

---

## Inject a correction mid-generation

    yooti correct:inject STORY-001-T002

Describe the specific issue. The agent reads the correction file on its
next iteration and applies it before continuing.

---

## After injecting a correction

    Read .agent/corrections/STORY-001-T002-[timestamp].md
    Apply the correction to STORY-001-T002.
    Re-run the quality loop from the beginning.
    Do not change anything outside the correction scope.

---

## Request a specific fix before approving

    Read .agent/corrections/STORY-001-T002-[timestamp].md
    The PR for STORY-001 has one issue that must be fixed before merge:
    [describe the issue]
    Fix it. Re-run tests. Update the evidence package. Do not change anything else.

---

---

# GATE G4 — QA REVIEW

---

## Create a QA test plan before Phase 4

    yooti qa:plan STORY-001

---

## Add a specific test requirement

    yooti test:require STORY-001

---

## Review evidence at Gate G4

    yooti qa:review STORY-001

---

## Review all Sprint 1 stories at G4

    yooti qa:review STORY-001
    yooti qa:review STORY-002
    yooti qa:review STORY-003
    yooti qa:review STORY-004
    yooti qa:review STORY-005
    yooti qa:review STORY-010

---

---

# CORRECTIONS AND FIXES

---

## Fix low coverage

    Coverage for STORY-001 is below 80%.
    Run: pytest tests/unit/ --cov=src --cov-report=term-missing
    Add tests for every uncovered line in business logic files.
    Do not add coverage exclusions without architect approval.
    Do not touch any existing tests.

---

## Fix a lint error the agent cannot resolve

    STORY-001-T002 has a lint error it cannot resolve after 5 iterations.
    Read the escalation: .agent/escalations/STORY-001-T002-*.md
    The specific lint error is: [paste the error]
    Fix only this error. Re-run the quality loop. Continue.

---

## Fix a type error the agent cannot resolve

    STORY-001-T002 has a type error it cannot resolve.
    The error is: [paste the error]
    Fix only this error. Do not change any tests or other files.
    Re-run: tsc --noEmit (or mypy . --strict)

---

## Fix a regression introduced by the agent

    STORY-001 introduced a regression.
    Read: .agent/evidence/STORY-001/regression-diff.json
    The newly failing test is: [test name]
    The files changed in STORY-001 that likely caused it: [file names]
    Fix the regression. Verify the previously passing test passes again.
    Do not change the test itself — only the implementation.

---

## Fix a scope violation — agent touched the wrong file

    STORY-001-T002 touched files outside its plan scope.
    Read: .agent/plans/STORY-001-T002.plan.md
    The out-of-scope file that was modified: [file path]
    Revert the changes to that file only.
    Achieve the same result without touching out-of-scope files.
    If the task cannot be completed without touching that file,
    write a scope expansion escalation and stop.

---

## Fix a security finding

    The security scan for STORY-001 found a HIGH severity issue.
    Read: .agent/evidence/STORY-001/security-scan.json
    The finding is: [paste the finding]
    Fix the vulnerability. Re-run the security scan.
    Update the evidence package. Do not change any tests.

---

## Fix an accessibility violation

    The accessibility scan for STORY-001 found violations.
    Read: .agent/evidence/STORY-001/accessibility.json
    The violations are: [paste violations]
    Fix each violation. All axe-core tests must pass.
    Do not change any non-accessibility code.

---

---

# CONTEXT AND KNOWLEDGE

---

## Attach a URL for the agent to read

    yooti context:add STORY-001 --url https://docs.example.com/api-spec

---

## Attach a note or constraint

    yooti context:add STORY-001 --note "Use the existing AuthService pattern from STORY-003"

---

## Attach a file

    yooti context:add STORY-001 --file ./specs/payment-api-contract.json

---

## Tell the agent about a constraint mid-sprint

    Before starting STORY-005, read this constraint:
    The cart service must use Redis for guest carts with a 7-day TTL.
    Do not use PostgreSQL for guest cart storage.
    This applies to all tasks in STORY-005.

---

---

# SPRINT END

---

## Check standup

    yooti sm:standup

---

## Generate sprint report

    yooti sprint:report

---

## Run sprint retrospective

    yooti sprint:retro

---

## View full audit trail for a story

    yooti audit STORY-001             # full trail
    yooti audit STORY-001 --gates     # gate decisions only
    yooti audit STORY-001 --diff      # file changes only

---

---

# ESCALATION RESPONSES

These prompts are used after a human resolves an agent escalation.

---

## ENV_ERROR — environment issue fixed

    The environment issue in .agent/escalations/STORY-001-T001-ENV_ERROR.md
    has been fixed. [Brief description of what was fixed.]
    Continue Phase 4 for STORY-001-T001.

---

## SCOPE_ERROR — scope expansion approved

    The scope expansion in .agent/escalations/STORY-001-T002-SCOPE_ERROR.md
    has been reviewed. The architect approves touching [file path].
    Update .agent/plans/STORY-001-T002.plan.md to add [file path] to MODIFY scope.
    Continue Phase 4 for STORY-001-T002.

---

## AMBIGUITY — PM has clarified the requirement

    The PM has clarified the ambiguity in STORY-001.
    [Paste the PM's clarification here.]
    Delete .agent/escalations/STORY-001-AMBIGUITY.md
    Continue Phase 4 for STORY-001.

---

## ARCH_ERROR — architect has reviewed the approach

    The architect has reviewed the approach in
    .agent/escalations/STORY-001-T002-ARCH_ERROR.md
    The correct approach is: [architect's guidance]
    Delete the escalation file. Restart STORY-001-T002 using the correct approach.

---

## INSTALL_REQUIRED — package installed

    The package in .agent/escalations/STORY-001-T001-INSTALL_REQUIRED.md
    has been installed. Continue Phase 4 for STORY-001-T001.

---

---

# BROWNFIELD — ADOPTING AN EXISTING CODEBASE

---

## Understand the existing codebase before writing any plans

    Before generating any plans, audit the existing codebase.
    Read the files in [existing service directory].
    Document the patterns you observe:
      - How are routes structured?
      - How are services injected?
      - How are errors handled?
      - What test patterns are used?
    Write your findings to .agent/context/[STORY-ID]/codebase-audit.md
    Do not write any code or plans yet.

---

## Match existing patterns — not RI defaults

    STORY-001 is in a brownfield codebase.
    The existing patterns are documented in .agent/context/STORY-001/codebase-audit.md
    Read them before generating plans.
    All new code must match existing patterns — not the RI defaults.
    If the existing pattern conflicts with a constitution, flag it as an
    escalation and wait for architect guidance.

---

---

# CODEX CLI — EQUIVALENT PROMPTS

If using Codex instead of Claude Code, prefix every prompt with:

    Read AGENTS.md and .claude/CLAUDE.md before starting.

Then use the same prompts as above. Example:

    Read AGENTS.md and .claude/CLAUDE.md before starting.
    Proceed to Phase 2 for STORY-001.

    Read AGENTS.md and .claude/CLAUDE.md before starting.
    Proceed to Phase 4 for all approved stories in dependency order.

---

---

# COMMON MISTAKES AND THE PROMPT TO FIX THEM

---

## Agent writes code during Phase 2

What happened: The agent created source files during the decomposition phase.

Fix:

    You have written code during Phase 2. This is not allowed.
    Phase 2 produces .plan.md files only.
    Delete any source files you created.
    Re-read the Phase 2 section in .claude/CLAUDE.md.
    Regenerate plans for [STORY-ID] — no code.

---

## Agent creates one task per AC

What happened: Plans show STORY-001-T001 for AC-1, T002 for AC-2 etc.

Fix:

    The plans for [STORY-ID] split by AC — this is wrong.
    Delete .agent/plans/[STORY-ID]-*.plan.md
    Re-read the decomposition rules in .claude/CLAUDE.md carefully.
    Tasks must split by layer: database, API, frontend.
    M-complexity = 2-3 tasks maximum.
    Regenerate plans. No code.

---

## Agent opens PR without evidence package

What happened: PR is open but .agent/evidence/[ID]/ is missing or incomplete.

Fix:

    The PR for [STORY-ID] was opened without a complete evidence package.
    Close the PR.
    Generate the evidence package in .agent/evidence/[STORY-ID]/
    Read existing test results from coverage.json — do not re-run tests.
    Re-open the PR using .agent/evidence/[STORY-ID]/pr-body.md as the body.

---

## Agent merged the PR itself

What happened: The agent merged the PR instead of stopping at Gate G3.

This cannot be undone via prompt — revert the merge in GitHub. Then add
this to .claude/CLAUDE.md explicitly:

    ## Gate G3 — PR review
    Gate G3 happens entirely in GitHub.
    Do NOT merge PRs. Do NOT auto-approve PRs.
    Open the PR, post the evidence as the body, and stop.
    Gate G3 belongs to the developer — it is a human decision.

---

## Agent started Phase 4 without G2 approval

What happened: Agent wrote code before the architect reviewed plans.

Fix:

    Stop all code generation immediately.
    Delete any code written for [STORY-ID] tasks.
    Gate G2 has not been signed.
    Wait for the architect to run: yooti plan:review [STORY-ID]
    Do not write any code until .agent/gates/[STORY-ID]-G2-approved.md exists.

---

## Agent keeps touching the same out-of-scope file

What happened: Repeated scope violations on the same file across iterations.

Fix:

    The file [file path] is explicitly out of scope for [TASK-ID].
    You have touched it in multiple iterations. Stop.
    Read .agent/plans/[TASK-ID].plan.md — OUT OF SCOPE section.
    Write .agent/escalations/[TASK-ID]-SCOPE_ERROR.md explaining
    why the task cannot be completed without touching [file path].
    Stop. Do not touch [file path] again without architect approval.

---

## Coverage stale — qa:review shows 76% but tests show 99%

What happened: The evidence package was generated before pyproject.toml was updated.

Fix:

    The coverage-summary.json is stale — it shows [X]% but actual is [Y]%.
    Read current coverage from services/api_python/coverage.json
    Update .agent/evidence/[STORY-ID]/coverage-summary.json with real numbers.
    Do not re-run tests.

Then:

    yooti qa:review [STORY-ID]

---

## Agent cannot resolve a failing test after 5 iterations

What happened: Escalation file written, agent has stopped.

Fix options:

Option A — Fix the test yourself and tell the agent:

    The failing test in [TASK-ID] has been fixed manually.
    Read .agent/corrections/[TASK-ID]-[timestamp].md for context.
    Resume from where you stopped. Re-run the quality loop.

Option B — Tell the agent the correct approach:

    The escalation for [TASK-ID] has been reviewed.
    The correct approach for the failing test is: [describe approach]
    Delete .agent/escalations/[TASK-ID]-*.md
    Restart [TASK-ID] using the correct approach.

Option C — Return the story to planning:

    [TASK-ID] cannot be implemented as planned.
    Mark the task Status: REJECTED in .agent/plans/[TASK-ID].plan.md
    Write a summary of why in the plan file.
    The architect will review and revise the approach.

---

---

# QUICK REFERENCE

---

## The complete sprint flow in prompts

    # Day 1 — setup
    yooti story:sample --app ecommerce --sprint 1
    yooti story:approve --all
    yooti sprint:start

    # Phase 2 — plans
    "Proceed to Phase 2 for all new stories."

    # Gate G2 — architect
    yooti plan:review STORY-001
    yooti plan:review STORY-002
    [etc.]

    # Phase 4 — code
    "Proceed to Phase 4 for all approved stories in dependency order."

    # Gate G3 — developer reviews PR in GitHub
    # (no prompt needed — happens in GitHub)

    # Gate G4 — QA
    yooti qa:review STORY-001
    [etc.]

    # Sprint end
    yooti sprint:report
    yooti sprint:retro

---

## The one-line prompt rule

If your prompt is longer than one sentence, ask:
Is this information already in CLAUDE.md?

If yes — the agent should already know it. Shorten the prompt.
If no — add it to CLAUDE.md. Then shorten the prompt.

The goal: every stage runs from a single sentence.
That sentence is the proof that CLAUDE.md is complete.

---

*Yooti Prompt Library — v1.2*
