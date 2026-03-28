# REQUIREMENTS — @yooti/cli
# Version: 1.0.0
# Status: In development — Sprint 0
# This document is the source of truth for what the CLI must do

---

## 1. Product vision

`yooti init` is to autonomous software delivery what `create-react-app`
was to React projects. One command gives a small team everything they need
to start building with an autonomous SDLC pipeline:

- AI agent context (Claude Code reads .claude/ automatically)
- Pipeline tooling (schemas, scripts, CI workflows)
- Local Docker stack (runs immediately)
- Example artifacts (team can edit and go)
- Team playbook docs

**Target user:** A developer or team lead starting a new project or adopting
the framework on an existing codebase. They should be productive in under
30 minutes from `npm install -g @yooti/cli`.

**Not required:** Yooti OS account. The CLI works standalone.
Yooti OS is an optional enhancement, not a dependency.

---

## 2. Technology stack

```
Runtime:        Node.js >= 20 (ES Modules, "type": "module" in package.json)
CLI framework:  commander ^12
Wizard:         inquirer ^9 (or @inquirer/prompts ^5)
Terminal UI:    chalk ^5, ora ^8
Shell exec:     execa ^8
Templates:      Inline JS template strings in generator.js (no EJS)
Publish:        npm (@yooti/cli)
```

---

## 3. Supported application stacks

The CLI scaffolds projects for these technology combinations:

| Layer | Options |
|-------|---------|
| API service | Node.js 20 + TypeScript + Express or Fastify |
| Frontend | React 18 + TypeScript + Vite + shadcn/ui |
| Batch / analytics | Python 3.12 + boto3 + pandas |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Cloud | AWS (ECS, S3, Lambda) |

The team selects which layers they need at init time.

---

## 4. Command surface — complete list

### 4.1 yooti init [project-name]

The primary command. Scaffolds a new project or adopts an existing one.

**Wizard questions (shown when corresponding flag not provided):**

| Question | Options | Default |
|----------|---------|---------|
| Project context | greenfield, brownfield | greenfield |
| Project name | text input | cwd folder name or 'my-project' |
| Application stack | node, react, python (multi-select) | all three |
| Node.js linter | eslint, biome | eslint |
| CI/CD provider | github-actions, gitlab, none | github-actions |
| Deploy target | docker, aws-ecs | docker |
| AI agent tooling | claude-code, codex, both | claude-code |
| Yooti OS integration | yes/no | no |

**Flags (all flags bypass their corresponding wizard question):**

```
--context <greenfield|brownfield>
--stack <node,react,python>          comma-separated
--linter <eslint|biome>
--ci <github-actions|gitlab|none>
--deploy <docker|aws-ecs>
--agent <claude-code|codex|both>
--yooti-os                         boolean flag, enables Yooti OS
```

**Critical behaviour:** If ALL required flags are provided, skip Inquirer
wizard entirely. No prompts. Go straight to file generation.

**Brownfield detection:** If `yooti init .` is run inside a directory
that has a `package.json`, auto-suggest brownfield context in the wizard.

**Brownfield scan (runs before generation when context=brownfield):**
- Detect: language, framework, test runner, coverage percentage
- Identify: high-risk files (low coverage + many dependents)
- Show scan results to user before generating files
- Generate additional brownfield-specific files (risk-surface.json, baseline.json)

**Output on success:**
- Checklist of generated items (green checkmarks)
- File count
- "Next steps" instructions specific to context (greenfield vs brownfield)

---

### 4.2 yooti story:add

Adds and validates a user story through the Requirements Ingestion Agent prompt.

**Behaviour:**
1. Prompt for: story ID, title, type, priority, AC-1 (Given/When/Then)
2. Show spinner: "Running Requirements Ingestion Agent..."
3. Produce: `.agent/requirements/STORY-NNN-validated.json`
4. Validate against: `pipeline/schemas/validated_requirement.schema.json`
5. Report: ambiguity flags, validation status
6. Fail gracefully if `yooti.config.json` not found (not inside a yooti project)

---

### 4.3 yooti sprint:start

Starts a sprint. Validates stories have G1 sign-off, captures baseline.

**Behaviour:**
1. Check `.agent/requirements/` for validated stories
2. Run pre-flight checks (delegates to preflight logic)
3. Capture baseline snapshot: `python pipeline/scripts/snapshot.py sprint-N`
4. Output confirmation checklist

---

### 4.4 yooti preflight

Runs pre-flight validation checks.

**Checks to run:**
- Git repository exists
- Working tree is clean (no uncommitted changes)
- docker-compose.yml exists
- .claude/CLAUDE.md exists
- yooti.config.json exists and is valid JSON
- Pipeline scripts exist (preflight.sh, snapshot.py)
- Example artifacts exist (.agent/examples/)

**Output:** Pass/fail per check, total count, exit code 1 if any fail.

---

### 4.5 yooti snapshot [tag]

Captures a regression baseline snapshot.

**Behaviour:**
- Delegates to `python pipeline/scripts/snapshot.py [tag]`
- Prints output path on success

---

### 4.6 yooti upgrade [--only-prompts]

Upgrades pipeline tooling in an existing project.

**Behaviour:**
- `--only-prompts`: regenerate .claude/ agent prompts only (no app files touched)
- Default: upgrade pipeline/, docs/ — never touch services/, frontend/, batch/
- Show diff of what will change before applying
- **NEVER modify application code files**

*Note: This command is v1.1 — implement last or stub for now.*

---

## 5. Generated file structure

### 5.1 Greenfield — full structure (28 files)

```
<project-name>/
│
├── .claude/                          ← Agent context (Claude Code auto-reads)
│   ├── CLAUDE.md                     ← Master context: role, tools, rules, gates
│   ├── agents/
│   │   ├── requirements.md           ← Requirements Ingestion Agent prompt
│   │   ├── codegen.md                ← Code Generation Agent prompt
│   │   ├── testgen.md                ← Test Generation Agent prompt (TDD)
│   │   ├── diagnosis.md              ← Self-Healing Diagnosis Agent prompt
│   │   └── deploy.md                 ← Deployment Agent prompt
│   └── rules/
│       ├── scope-enforcement.md      ← Zero-tolerance scope rules
│       ├── greenfield-rules.md       ← Pattern mandate for new codebases
│       └── brownfield-rules.md       ← Surgical mode rules for existing codebases
│
├── .agent/                           ← Pipeline artifacts (git-tracked)
│   ├── examples/
│   │   ├── greenfield/
│   │   │   ├── validated_requirement.json    ← Pre-filled STORY-001 (Property CRUD)
│   │   │   └── STORY-001-T001.plan.md        ← Pre-filled task plan
│   │   └── brownfield/
│   │       ├── validated_requirement.json    ← Pre-filled STORY-001 (rate limit)
│   │       └── STORY-001-T001.plan.md        ← Pre-filled brownfield task plan
│   ├── requirements/                 ← Runtime: STORY-NNN-validated.json
│   ├── plans/                        ← Runtime: STORY-NNN-T00N.plan.md
│   ├── snapshots/                    ← Runtime: regression baselines
│   └── evidence/                     ← Runtime: test evidence packages
│
├── pipeline/                         ← Framework tooling (stack-agnostic)
│   ├── schemas/
│   │   └── validated_requirement.schema.json
│   ├── scripts/
│   │   ├── preflight.sh              ← Pre-flight validation (bash)
│   │   ├── snapshot.py               ← Capture regression baseline (python)
│   │   ├── regression-diff.py        ← Diff current vs baseline (python)
│   │   └── generate-pr-body.py       ← Auto-generate PR description (python)
│   └── infra/
│       └── docker-compose.yml        ← Full local stack
│
├── services/api/                     ← Node.js API (if stack includes node)
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── stores/
│   │   └── types/
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── characterization/         ← BF only: lock existing behavior
│
├── frontend/dashboard/               ← React (if stack includes react)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── lib/
│   └── tests/
│       ├── unit/
│       └── e2e/
│
├── batch/analytics/                  ← Python (if stack includes python)
│   ├── src/jobs/
│   └── tests/
│       ├── unit/
│       └── integration/
│
├── .github/workflows/                ← CI (if ci=github-actions)
│   ├── unit-tests.yml
│   └── integration-tests.yml
│
├── docs/
│   ├── README.md                     ← Project entry point
│   └── GATES.md                      ← All 5 gate criteria + checklists
│
├── docker-compose.yml                ← Symlink/copy of pipeline/infra/docker-compose.yml
├── .env.example                      ← All env vars documented
├── .gitignore
└── yooti.config.json               ← Framework config
```

### 5.2 Brownfield additions (+4 files)

When `--context brownfield`:
```
.agent/
├── discovery/
│   └── risk-surface.json             ← Simulated scan results (real scan TBD)
└── snapshots/
    └── baseline.json                 ← Stub — team runs snapshot.py to populate
```

Total brownfield: 32 files.

---

## 6. Key generated file content requirements

### 6.1 .claude/CLAUDE.md

Must contain all of the following sections:
- Header: project name, context (GF/BF), stack, generated-by line
- "Your role" — 3-4 sentences: pipeline agent, not general assistant
- "Toolchain" — exact commands per service (lint, type check, test), in order
- "Absolute rules" — 6 non-negotiable rules (scope, TDD, no invented APIs, no secrets, zero warnings, escalate)
- "Escalation triggers" — table: trigger → file to write → who handles
- "Context" section — different content for GF vs BF
- "Quality gates" — table of all gates with thresholds and whether they block PR

### 6.2 .claude/agents/codegen.md

Must contain:
- "Before you write any code" checklist (5 steps including preflight)
- The generation loop (max 5 iterations): Generate → Lint → Type check → Hallucination check → Unit tests → Commit
- Commit message format
- SCOPE_ERROR protocol (stop immediately, write escalation file, do not proceed)

### 6.3 .claude/agents/testgen.md

Must contain:
- TDD mandate: tests before implementation, iteration 0 = RED
- 5 unit test dimensions: happy path, boundary, error, contract, config
- Rules: all I/O mocked, one assertion per test, independent
- Integration test rules: real services, full setup/teardown
- Accessibility tests (frontend): axe(container) after every render
- Playwright viewports: 375px, 768px, 1280px (mandatory)
- Python/AWS: @mock_aws on all tests touching AWS services

### 6.4 pipeline/schemas/validated_requirement.schema.json

JSON Schema with required fields:
- story_id (string, pattern: STORY-NNN)
- title (string, minLength 5)
- type (enum: feature, bugfix, refactor, chore)
- priority (enum: P0, P1, P2, P3)
- acceptance_criteria (array, minItems 1, each with id/given/when/then/testable)
- definition_of_done (array of strings)
- estimated_complexity (enum: XS, S, M, L, XL)

### 6.5 docker-compose.yml

Must include services based on selected stack:
- api (Node.js): port 3000, env DATABASE_URL + REDIS_URL + NODE_ENV, depends_on postgres+redis
- frontend (React): port 5173, env VITE_API_URL
- batch (Python): env DATABASE_URL + AWS vars, depends_on postgres
- postgres: image postgres:16-alpine, env POSTGRES_DB/USER/PASSWORD, port 5432, named volume
- redis: image redis:7-alpine, port 6379

### 6.6 yooti.config.json

Must include:
- version, project, context
- stack.services (array of {name, lang, path})
- toolchain.api (linter, test_runner, security)
- toolchain.frontend (linter, e2e, accessibility, responsive_breakpoints, performance)
- toolchain.batch (linter, type_check, test_runner, aws_mock)
- quality_gates (coverage_threshold:80, new_code_coverage:90, mutation_score:85, lighthouse_performance:80, lighthouse_accessibility:90, max_agent_iterations:5)
- yooti_os.enabled (boolean)

### 6.7 .env.example

Must document all environment variables used across all services:
DATABASE_URL, REDIS_URL, NODE_ENV, PORT, JWT_SECRET, AWS_DEFAULT_REGION,
AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET, VITE_API_URL,
and Yooti OS vars (commented out by default).

---

## 7. Quality gates — enforced in CI

These are the gates the GENERATED project's CI pipeline enforces.
The CLI itself must generate correct CI YAML that enforces all of these.

| Check | Tool | Threshold | Blocks PR |
|-------|------|-----------|-----------|
| Lint | ESLint / Biome / Ruff | 0 warnings, 0 errors | YES |
| Type errors | tsc / mypy | 0 | YES |
| Unit tests | Vitest / pytest | 100% pass | YES |
| Integration tests | Vitest+Supertest / pytest | 100% pass | YES |
| Coverage overall | Istanbul / pytest-cov | >= 80% | YES |
| Coverage new code | Istanbul / pytest-cov | >= 90% | YES |
| Regression diff | regression-diff.py | 0 newly failing | YES |
| Accessibility | axe-core in Vitest | 0 violations | YES (frontend) |
| Responsive | Playwright 3 viewports | 100% pass | YES (frontend) |
| Security — deps | Snyk | 0 HIGH/CRITICAL | YES |
| Security — code | Semgrep | 0 findings | YES |
| Lighthouse perf | Lighthouse CI | >= 80 | YES (frontend) |
| Lighthouse a11y | Lighthouse CI | >= 90 | YES (frontend) |
| Mutation score | Stryker / mutmut | >= 85% | WARN only |

---

## 8. Human gates — documented in generated GATES.md

Five gates where a human must decide before the pipeline continues:

| Gate | Owner | Timing | Blocks |
|------|-------|--------|--------|
| G1 — PM Requirements Sign-Off | Product Manager | Pre-sprint | Sprint start |
| G2 — Architecture Review | Architect | Days 1-2 | Code generation |
| G3 — Developer PR Review | Developer | Days 6-8 | QA sign-off |
| G4 — QA Sign-Off | QA / SDET | Day 9 | Staging deploy |
| G5 — Deployment Approval | Release Manager | Day 10 | Production deploy |

The generated GATES.md must include checklist for each gate and FAIL actions.

---

## 9. Toolchain defaults

### Node.js API
| Tool | Purpose | Default | Alternative |
|------|---------|---------|-------------|
| ESLint | Lint | YES | Biome |
| Prettier | Format | YES (with ESLint) | Biome |
| TypeScript (tsc) | Type check | ALWAYS | — |
| Vitest | Unit + integration tests | YES | — |
| Supertest | HTTP integration tests | YES | — |
| Stryker | Mutation testing | YES (CI only) | — |
| Snyk | Dependency security | YES | — |
| Semgrep | SAST | YES | — |

### React Frontend
| Tool | Purpose | Default |
|------|---------|---------|
| ESLint + jsx-a11y | Lint + a11y lint-time | YES |
| TypeScript | Type check | ALWAYS |
| Vitest + Testing Library | Component tests | YES |
| axe-core | Accessibility (runtime) | YES |
| Playwright | E2E + responsive (3 viewports) | YES |
| Lighthouse CI | Performance scoring | YES |
| Storybook | Component isolation | YES |

### Python Batch
| Tool | Purpose | Default |
|------|---------|---------|
| Ruff | Lint + format (replaces Flake8+Black) | YES |
| mypy | Type checking (strict) | YES |
| pytest + pytest-cov | Tests + coverage | YES |
| moto | AWS service mocking | YES |

---

## 10. Error handling requirements

### CLI errors (user-facing)
- If not inside a yooti project (no yooti.config.json): show clear message, suggest `yooti init`
- If Node < 20: show version requirement, exit 1
- If Docker not running (detected via `docker info`): warn but don't block init
- If git not installed: warn but don't block init
- File write failures: show specific file path that failed, exit 1

### Generation errors
- If a required template produces empty content: throw with file name
- If output directory already exists (for `yooti init <name>`): ask user to confirm overwrite or abort
- Never silently skip files — fail loudly if any file cannot be written

---

## 11. Non-goals for v1.0

The following are explicitly out of scope for the first release:

- Jira / Linear integration (story:add accepts free text only)
- Real codebase scanning (brownfield discovery is simulated)
- Claude API calls during init (agent prompts are static templates)
- Yooti OS registration (yooti.config.json is generated but not sent)
- GitLab CI templates (stub only — GitHub Actions is the working template)
- AWS Terraform templates (generated as stubs, not functional)
- `yooti upgrade` command (stub for v1.1)
- `yooti deploy` command (stub for v1.1)
- `yooti retro` command (stub for v1.1)

---

## 12. Build sequence (priority order for Claude Code)

**Sprint 0 (now — must work for demo):**
1. Fix non-interactive init (all flags → skip wizard → generate files)
2. Verify all 28 generated files are correct
3. Verify brownfield generates 32 files
4. Fix story:add (ES module require() bug)
5. npm link works, `yooti` command runs from any directory

**Sprint 1 (next week):**
1. story:add produces valid JSON output matching schema
2. preflight runs all 7 checks correctly
3. sprint:start captures real snapshot (calls python script)
4. Full README.md and GREENFIELD.md + BROWNFIELD.md generated correctly

**Sprint 2 (week after):**
1. GitHub Actions YAML tested against a real repo
2. docker-compose.yml verified to start all services
3. yooti upgrade --only-prompts works
4. npm publish @yooti/cli

---

## 13. Testing the CLI itself

The CLI package needs its own tests (not the generated project's tests):

```bash
# Manual test checklist (run after every change)
node bin/proxiom.js --version             # banner + version
node bin/proxiom.js --help                # all commands listed

# Greenfield init
node bin/proxiom.js init test-gf \
  --context greenfield --stack node,react,python \
  --linter eslint --ci github-actions \
  --deploy docker --agent claude-code
ls test-gf/                               # directories exist
cat test-gf/.claude/CLAUDE.md             # has content
cat test-gf/yooti.config.json           # valid JSON
cat test-gf/docker-compose.yml            # has services
rm -rf test-gf/

# Brownfield init
mkdir test-bf && echo '{}' > test-bf/package.json && cd test-bf
node ../bin/proxiom.js init . \
  --context brownfield --stack node \
  --linter eslint --ci github-actions \
  --deploy docker --agent claude-code
ls .agent/discovery/                      # risk-surface.json exists
ls .agent/snapshots/                      # baseline.json exists
cd .. && rm -rf test-bf/

# Story add (inside a project)
cd test-gf-new/
node ../bin/proxiom.js story:add          # wizard fires
ls .agent/requirements/                   # JSON file created
```

---

## 14. Definition of done — v1.0 release

- [ ] `npm install -g @yooti/cli && yooti init my-project` works cleanly
- [ ] Greenfield generates exactly 28 files, brownfield 32 files
- [ ] All generated files have correct content (no template placeholders left unreplaced)
- [ ] `docker-compose.yml` starts cleanly with `docker compose up -d`
- [ ] `node bin/proxiom.js --help` shows all commands correctly
- [ ] Non-interactive mode (all flags) completes in < 5 seconds
- [ ] Interactive wizard completes correctly for both GF and BF
- [ ] `yooti story:add` produces valid JSON against the schema
- [ ] Published to npm as `@yooti/cli`
- [ ] README.md in CLI repo explains install + usage
