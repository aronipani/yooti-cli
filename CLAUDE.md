# CLAUDE — yooti Development Context
# You are building the @yooti/cli npm package
# Read this file completely before touching any code

---

## What this project is

`@yooti/cli` is a Node.js CLI tool (like create-react-app) that scaffolds
a fully wired autonomous SDLC pipeline for small engineering teams.

One command produces a complete project scaffold with:
- Agent context files (.claude/) that Claude Code reads automatically
- Pipeline tooling (schemas, scripts, CI)
- Docker local stack
- Example artifacts (requirement + plan files)
- Team playbook docs

It works standalone — no Yooti OS required. Yooti OS is optional.

---

## Repository structure

```
yooti/
├── bin/
│   └── yooti.js          ← CLI entry point (Commander.js)
├── src/
│   ├── commands/
│   │   ├── init.js         ← yooti init — scaffold generator wizard
│   │   ├── story.js        ← yooti story:add — requirement intake
│   │   └── preflight.js    ← yooti preflight — pre-flight checks
│   ├── generator.js        ← Core: generates all scaffold files
│   └── templates/
│       ├── all-templates.js    ← All template functions (inline strings)
│       ├── readme-md.js        ← Fixed: readme template
│       ├── gates-md.js         ← Fixed: gates template
│       ├── pr-body-py.js       ← Fixed: PR body Python script template
│       └── index.js            ← Re-exports from fixed files + all-templates.js
├── package.json
└── REQUIREMENTS.md         ← Full product spec (read this too)
```

---

## Current state — what works, what needs fixing

### WORKING ✓
- `yooti --version` — shows banner and version
- `yooti --help` — shows all commands
- `yooti sprint:start` — outputs sprint start message
- `yooti preflight` — runs pre-flight checks
- `generator.js` — generates all 28+ scaffold files (fully rewritten, inline templates)
- All template content is complete and correct

### NEEDS FIXING — your primary task

**1. Non-interactive init (PRIORITY 1 — needed for demo)**

When ALL flags are passed, skip the Inquirer wizard entirely:
```bash
yooti init my-project \
  --context greenfield \
  --stack node,react,python \
  --linter eslint \
  --ci github-actions \
  --deploy docker \
  --agent claude-code
```
Currently the wizard still prompts even when flags are provided.
Fix: in `src/commands/init.js`, if all required options are present in cliOptions,
bypass `inquirer.prompt()` entirely and go straight to `generateFiles(config)`.

**2. Test the full init flow**

After fixing #1, run:
```bash
node bin/yooti.js init test-project \
  --context greenfield --stack node,react,python \
  --linter eslint --ci github-actions \
  --deploy docker --agent claude-code
```
Verify: `test-project/` exists with all expected directories and files.
Verify: `.claude/CLAUDE.md` exists and has content.
Verify: `docker-compose.yml` exists.
Verify: `yooti.config.json` exists and is valid JSON.

**3. Brownfield init test**

```bash
mkdir existing-api && cd existing-api
echo '{"name":"existing-api"}' > package.json
node ../bin/yooti.js init . \
  --context brownfield --stack node --linter eslint \
  --ci github-actions --deploy docker --agent claude-code
```
Verify: `.agent/discovery/risk-surface.json` exists.
Verify: `.agent/snapshots/baseline.json` exists.
Verify: brownfield-specific content in `.claude/CLAUDE.md`.

**4. story:add command**

The current `src/commands/story.js` has a `require('fs')` call in an ES module
context which will fail. Fix: use `import { readFileSync } from 'fs'` at top
of file and remove inline require.

**5. npm link test**

After all fixes:
```bash
npm link
yooti init my-live-test --context greenfield \
  --stack node,react,python --linter eslint \
  --ci github-actions --deploy docker --agent claude-code
```
Should work from any directory.

---

## Code rules — follow these exactly

### ES Modules (critical)
- `package.json` has `"type": "module"` — ALL files use ES module syntax
- Import: `import { x } from './y.js'` (always include .js extension)
- No `require()` anywhere — use `createRequire` from 'module' only in bin/yooti.js for package.json
- No `__dirname` — use `fileURLToPath` + `dirname` from 'path'

### Template strings (critical — this caused the original bug)
- Templates are inline JS template literals inside generator.js
- Never put Python f-strings `f"""..."""` directly inside JS template literals
- Backticks inside template strings: use a variable `const t3 = '` + '`'.repeat(3) + '`' or escape them
- The generator.js already uses this pattern correctly — do not break it

### File generation
- All scaffold file generation is in `src/generator.js` — one self-contained file
- Templates are inline strings in `generateFiles()` — do not split into separate files
- `write(path, content)` helper: `writeFileSync(`${root}/${path}`, content, 'utf8')`

### No scope creep
- Do not add new commands beyond what's in REQUIREMENTS.md
- Do not add new dependencies without checking REQUIREMENTS.md
- Do not refactor the template system — it works, just fix the bugs listed above

---

## How to run and test

```bash
# From yooti/ directory:
node bin/yooti.js --version
node bin/yooti.js --help
node bin/yooti.js init test-gf --context greenfield --stack node,react,python --linter eslint --ci github-actions --deploy docker --agent claude-code
node bin/yooti.js preflight  # run from inside a generated project
```

## How to install globally for live testing

```bash
npm link                    # installs 'yooti' command globally
yooti --version             # verify
yooti init my-test ...      # test from any dir
npm unlink                  # when done
```

---

## Dependencies — do not add more without REQUIREMENTS.md approval

```json
{
  "commander": "^12",          // CLI command parser
  "@inquirer/prompts": "^5",   // Interactive wizard (or "inquirer": "^9")
  "chalk": "^5",               // Terminal colours
  "ora": "^8",                 // Spinner
  "ejs": "^3",                 // Template engine (available, not currently used)
  "execa": "^8",               // Shell commands
  "gradient-string": "^2"      // Banner gradient (optional)
}
```

---

## Escalation — when to stop and ask

STOP and flag if you find:
- A file in `src/generator.js` that generates incorrect content (wrong paths, wrong syntax)
- A dependency missing from package.json that is imported in code
- A conflict between REQUIREMENTS.md and the current implementation
- Any generated scaffold file that would break when a team uses it

Do NOT silently change template content — the agent prompt files in particular
(.claude/agents/*.md) are the highest-value output and must be reviewed before changing.

---

## Phase 2 — story decomposition output

Phase 2 produces PLAN FILES ONLY.
No code. No tests. No implementation. No imports.

For each story in scope:
  1. Read .agent/requirements/[STORY-ID]-validated.json
  2. Apply the decomposition rules above
  3. Write one .plan.md file per task to .agent/plans/
  4. Mark each plan Status: PENDING
  5. Stop — wait for Gate G2 before writing any code

Phase 2 is complete when:
  Every story has at least one .plan.md file
  Every plan has: Status, Layer, Scope (CREATE/MODIFY/OUT OF SCOPE),
    AC covered, Implementation steps, Dependencies
  No code files have been created or modified

Phase 4 starts ONLY after:
  Gate G2 is signed — .agent/gates/[STORY-ID]-G2-approved.md exists
  Architect has reviewed and approved the plans

If you find yourself writing code during Phase 2 — STOP.
  Delete the code.
  Write the plan file instead.
  Wait for G2 approval.

## Phase 3 — environment setup

Phase 3 runs automatically before Phase 4.
It does not require human input.

  1. Create feature branch: git checkout -b feature/[STORY-ID]
  2. Run preflight checks: node pipeline/scripts/preflight.js
  3. Confirm .agent/gates/[STORY-ID]-G2-approved.md exists
  4. Confirm .agent/plans/[STORY-ID]-*.plan.md files exist
  5. Proceed to Phase 4

If preflight fails: write escalation and stop.
If G2 gate is missing: write escalation and stop.

## Phase 5 — test orchestration and evidence package

Phase 5 runs after all tasks in a story are COMPLETE.
Phase 5 must complete before any PR is opened.
Never open a PR without a complete evidence package.

Steps in order:
  1. Run full test suite for all affected layers
  2. Run coverage report — save to coverage.json
  3. Run regression diff: python tests/regression/comparator/diff.py
  4. Run security scan if available (snyk, semgrep)
  5. Create .agent/evidence/[STORY-ID]/ folder
  6. Write evidence files:

     test-results.json
     {
       "story_id": "[STORY-ID]",
       "generated_at": "[ISO timestamp]",
       "unit": { "total": N, "passed": N, "failed": 0 },
       "integration": { "total": N, "passed": N, "failed": 0 }
     }

     coverage-summary.json
     {
       "story_id": "[STORY-ID]",
       "generated_at": "[ISO timestamp]",
       "overall": N.N,
       "new_code": N.N,
       "files": []
     }

     regression-diff.json
     {
       "story_id": "[STORY-ID]",
       "generated_at": "[ISO timestamp]",
       "baseline_sprint": "sprint-N",
       "newly_failing": [],
       "newly_passing": [],
       "total_tests_before": N,
       "total_tests_after": N
     }

     security-scan.json
     {
       "story_id": "[STORY-ID]",
       "generated_at": "[ISO timestamp]",
       "snyk": { "critical": 0, "high": 0, "medium": 0 },
       "semgrep": { "findings": 0 }
     }

     pr-body.md
     ## [STORY-ID] — [story title]

     ### Acceptance criteria coverage
     | AC | Status | Test |
     |----|--------|------|
     | AC-1 | PASS | test name |

     ### Test results
     Unit: N/N passing
     Integration: N/N passing
     Regression: 0 newly failing

     ### Coverage
     Overall: N.N%
     New code: N.N%

     ### Security
     Snyk: 0 critical, 0 high
     Semgrep: 0 findings

     ### Files changed
     List every file created or modified with line counts.

     ### Deliberate decisions
     List any non-obvious choices made.

  7. Hard blocks — do NOT open PR if any of these are true:
     test-results.json shows failed > 0
     coverage-summary.json shows overall < 80
     coverage-summary.json shows new_code < 90
     regression-diff.json shows newly_failing is not empty
     security-scan.json shows snyk.critical > 0 or snyk.high > 0

  8. Open the PR only after all evidence files exist and
     all hard blocks are clear

## Gate G3 — PR review

Gate G3 happens entirely in GitHub.
The developer reviews, approves, and merges the PR in GitHub.
No CLI command is required at Gate G3.
After the PR is merged, QA proceeds with: yooti qa:review [STORY-ID]

Do NOT wait for a CLI command at Gate G3.
Do NOT re-open the PR after it is merged.
Do NOT start the next story until G3 is complete.

---

## Phase 5 — mandatory before any PR is opened

Never open a PR before .agent/evidence/[STORY-ID]/ exists.
A PR without an evidence package is invalid.
The PR body must be generated FROM the evidence package.

Before opening a PR for any story run these steps in order:

STEP 1 — Run the full test suite
  Python:
    pytest -m "not eval" --cov --cov-report=json -q
  Node.js API:
    cd services/api && npx vitest run --coverage --reporter=json
  React frontend:
    cd frontend/dashboard && npx vitest run --coverage --reporter=json

STEP 2 — Create the evidence folder
  mkdir -p .agent/evidence/[STORY-ID]

STEP 3 — Write test-results.json
  {
    "story_id": "[STORY-ID]",
    "generated_at": "[ISO timestamp]",
    "unit": {
      "total": N,
      "passed": N,
      "failed": 0
    },
    "integration": {
      "total": N,
      "passed": N,
      "failed": 0
    }
  }
  If any failed > 0: do NOT open a PR. Fix failures first.

STEP 4 — Write coverage-summary.json
  {
    "story_id": "[STORY-ID]",
    "generated_at": "[ISO timestamp]",
    "overall": N.N,
    "new_code": N.N,
    "files": [
      { "file": "path/to/file.py", "lines": N.N, "branches": N.N }
    ]
  }
  If overall < 80 or new_code < 90: do NOT open a PR. Fix coverage first.

STEP 5 — Write regression-diff.json
  Run: python tests/regression/comparator/diff.py
  Write:
  {
    "story_id": "[STORY-ID]",
    "generated_at": "[ISO timestamp]",
    "baseline_sprint": "sprint-N",
    "newly_failing": [],
    "newly_passing": [],
    "total_tests_before": N,
    "total_tests_after": N
  }
  If newly_failing has any entries: do NOT open a PR. Fix regressions first.

STEP 6 — Write security-scan.json
  Run snyk and semgrep if available.
  Write:
  {
    "story_id": "[STORY-ID]",
    "generated_at": "[ISO timestamp]",
    "snyk": { "critical": 0, "high": 0, "medium": 0, "low": 0 },
    "semgrep": { "findings": 0 },
    "scanned_at": "[ISO timestamp]"
  }
  If snyk.critical > 0 or snyk.high > 0: do NOT open a PR. Fix first.
  If semgrep.findings > 0: do NOT open a PR. Fix first.
  If snyk or semgrep are not installed: write the file with a note
  and continue — do not block the PR for missing tools.

STEP 7 — Write accessibility.json (frontend stories only)
  Only write this file if the story touches the frontend layer.
  {
    "story_id": "[STORY-ID]",
    "generated_at": "[ISO timestamp]",
    "violations": 0,
    "passes": N,
    "viewports_tested": [375, 768, 1280]
  }

STEP 8 — Write pr-body.md
  Generate from all evidence files above.
  Format:

  ## [STORY-ID] — [story title]

  ### Acceptance criteria coverage
  | AC | Status | Test |
  |----|--------|------|
  | AC-1 | PASS | test_name |

  ### Test results
  Unit: N/N passing
  Integration: N/N passing
  Regression: 0 newly failing

  ### Coverage
  Overall: N.N%
  New code: N.N%

  ### Security
  Snyk: 0 critical, 0 high
  Semgrep: 0 findings

  ### Deliberate decisions
  List any non-obvious choices made during implementation.

  ### Files changed
  List every file created or modified with line counts.

STEP 9 — Open the PR
  Only open the PR after all evidence files are written.
  PR title: [STORY-ID] — [story title]
  PR body: content of .agent/evidence/[STORY-ID]/pr-body.md
  Branch: feature/[STORY-ID]
  Do NOT merge. Stop here. Gate G3 belongs to the developer.

EVIDENCE PACKAGE CHECKLIST — all must exist before PR opens:
  .agent/evidence/[STORY-ID]/test-results.json      required
  .agent/evidence/[STORY-ID]/coverage-summary.json  required
  .agent/evidence/[STORY-ID]/regression-diff.json   required
  .agent/evidence/[STORY-ID]/security-scan.json     required
  .agent/evidence/[STORY-ID]/accessibility.json     frontend only
  .agent/evidence/[STORY-ID]/pr-body.md             required
