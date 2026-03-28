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
