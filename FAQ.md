# Yooti — Frequently Asked Questions

> **Yūti** (यूति) — Sanskrit for *joining, union, or mixture*.
> The act of bringing things together — humans and agents, each doing what they do best.

---

## Contents

1. What is Yooti?
2. How does Yooti compare to other tools?
3. How do I customise Yooti for my team?
4. Are all five gates required?
5. How does the pipeline handle bugs vs features?
6. What happens when the agent gets it wrong?
7. How does testing work?
8. Can I use Yooti with my existing codebase?
9. What about security and IP?
10. Pricing and licensing

---

---

## 1. What is Yooti?

---

### What is Yooti in one sentence?

Yooti is a CLI tool that installs a complete autonomous software delivery
pipeline in your repository in one command — so your team can ship features
using AI agents without spending weeks building the scaffolding yourself.

---

### What problem does Yooti solve?

The tools for AI-assisted development exist — Claude Code, LangGraph, GitHub
Actions, Docker, Snyk — but wiring them into a coherent, repeatable delivery
system takes weeks. Every new project starts from scratch. Every team figures
out the same things independently: how to structure agent context, how to
enforce quality gates, how to manage the human review loop, how to handle
escalations when agents fail.

Yooti installs that scaffolding in one command and gives every team member
a clear role in the resulting pipeline.

---

### What does Yooti actually install?

Running yooti init generates:

    Agent context         .claude/CLAUDE.md — phases, gates, rules, toolchain
    Coding constitutions  .claude/constitutions/ — per language and framework
    Pipeline artifacts    .agent/ — requirements, plans, evidence, gates, audit
    Pipeline scripts      pipeline/scripts/ — preflight, snapshot, regression diff
    CI workflows          .github/workflows/ — tests, security, G3 gate automation
    Docker infrastructure docker-compose.yml — full local stack
    Team playbooks        docs/ — GATES.md, PROMPTS.md, README, Getting Started

It is not a template. It is a working pipeline that runs from Day 1.

---

### Who is Yooti for?

Yooti is for engineering teams of 2-10 people who want to ship faster using
AI agents without sacrificing code quality, security, or human oversight.

It is especially useful for:
- Startups moving from 0 to 1 with a small team
- Scale-ups adding new products alongside their existing codebase
- Agencies who want a repeatable delivery system across client projects
- Enterprises piloting AI-assisted development before rolling it out broadly

---

### What is the difference between the framework and the Reference Implementation?

The framework is language agnostic. The pipeline phases, human gates,
constitution system, and quality gate structure work with any language.

The Reference Implementation (RI) is opinionated. When you run yooti init,
it generates a working codebase using TypeScript, React, Python, LangGraph,
PostgreSQL, and Docker. This is a deliberate starting point — not a constraint.

If your team uses a different stack, you adopt the framework and replace
the RI layers with your own. The pipeline and gates work either way.

---

### Is Yooti an AI assistant, a code generator, or something else?

None of the above. Yooti is a pipeline framework.

It does not write code itself. It installs the infrastructure that tells
your AI code agent (Claude Code or Codex) exactly what to do, in what
order, to what quality standard, and when to stop and ask a human.

The agent writes the code. Yooti governs how that happens.

---

---

## 2. How does Yooti compare to other tools?

---

### The landscape

The AI-assisted development space has several overlapping categories:

    Specification-driven dev (SDD)   Human writes a spec. Agent turns it into code.
    AI-first IDEs                    IDE with AI assistance built in.
    Agentic coding tools             Agent writes full features autonomously.
    Pipeline frameworks              Governs how agents deliver across the SDLC.

Yooti is in the fourth category. Most tools below are in the first three.
They are not competitors — they are complementary. Yooti is the governance
layer that wraps around whichever code generation tool your team uses.

---

### Kiro (AWS)

What Kiro is:
Kiro is an AI-first IDE from AWS that uses a spec-driven development approach.
You write a spec file describing a feature and Kiro generates code from it.
It includes hooks for pre/post events, agent steering, and GitHub integration.

What Kiro does well:
The spec to code workflow is clean, the IDE integration is tight, and the
AWS ecosystem support is strong. Kiro is genuinely excellent at the code
generation step for individual features.

How Yooti relates to Kiro:
Kiro governs the IDE. Yooti governs the pipeline. They operate at different
levels and can be used together. A team using Kiro for code generation could
wrap it in the Yooti pipeline for everything around the generation step:
story validation, task decomposition, quality gates, evidence packages,
gate sign-off, and audit trail.

    KIRO                              YOOTI
    Spec to code generation           Story to gate to plan to gate to code
    IDE-level tool                    Repository-level framework
    AWS ecosystem native              Cloud agnostic
    Great for individual stories      Great for team delivery across a sprint
    No gate system                    Five human gates with sign-off files
    No quality evidence packaging     Evidence package required before every PR
    No audit trail                    Full audit trail + sprint retro

---

### Spec-Kit

What Spec-Kit is:
Spec-Kit is a specification-driven development tool that helps teams write
structured specs and use them as the source of truth for AI code generation.
It focuses on specification quality and the spec to implementation loop.

What Spec-Kit does well:
Spec-Kit is strong on the requirements side. It provides structure for writing
specifications precise enough for AI agents to work from.

How Yooti relates to Spec-Kit:
Yooti's Phase 1 does something similar — it converts a human-written story
into a structured contract with Given/When/Then AC, a Definition of Done,
and ambiguity flags. Teams using Spec-Kit could import their specs into
Yooti's .agent/requirements/ folder and have the pipeline wrap around their
existing spec workflow.

    SPEC-KIT                          YOOTI
    Specification format              Full delivery pipeline
    Spec to code                      Spec to gate to plan to gate to code
    Strong on requirements            Strong on governance and quality
    No gate system                    Five human gates
    No CI/CD integration              CI workflows generated
    No audit trail                    Full audit trail + gate files

---

### Specification-Driven Development (SDD) as a practice

What SDD is:
SDD is a software development methodology — not a tool — where a precise,
machine-readable specification is the primary artifact. Code is generated
from the spec and the spec is the source of truth.

SDD is a compelling approach. When specifications are precise enough, agents
can generate correct code reliably. The challenge is that writing spec-quality
specifications is hard. Most teams find it harder than writing good stories.

How Yooti relates to SDD:
Yooti is spec-adjacent. The validated requirement JSON in .agent/requirements/
is a structured contract that functions like a spec. But Yooti starts from
user stories — which teams already know how to write — and converts them into
structured requirements through validation. The barrier to entry is lower.

Yooti's constitution system is also spec-like: it gives the agent precise,
non-negotiable rules about how to write code rather than what to write.

    SDD                               YOOTI
    Spec is primary artifact          Story is primary — spec generated from it
    Machine-readable from the start   Human-friendly stories + validation
    No gate system typically          Five human gates
    No pipeline tooling               Full pipeline: CI, Docker, scripts, audit
    High barrier to entry             Lower barrier — user stories as input

---

### GitHub Copilot Workspace

What Copilot Workspace is:
GitHub Copilot Workspace lets you start from a GitHub Issue and have Copilot
plan and implement a solution across your codebase. It is tightly integrated
with GitHub and works within the GitHub.com interface.

What Copilot Workspace does well:
The GitHub integration is seamless. Starting from an Issue is natural for
developers already working in GitHub. Low friction for individual contributors.

How Yooti relates to Copilot Workspace:
Copilot Workspace is excellent for individual story implementation.
Yooti is a team delivery framework.

    COPILOT WORKSPACE                 YOOTI
    GitHub Issues to code             Stories to validated requirements to code
    Individual contributor tool       Team delivery framework
    Browser-based                     CLI + repository files
    No gate system                    Five human gates with sign-off
    No quality evidence packaging     Evidence package required before PR
    No constitution system            Constitutions govern style and quality
    No audit trail                    Full audit trail + sprint retro
    Tied to GitHub Copilot            Model agnostic — Claude Code or Codex

---

### Claude Code (standalone)

What Claude Code is:
Claude Code is Anthropic's agentic coding tool. It reads your repository
and writes code from natural language instructions. It is the code generation
agent Yooti is designed to work with.

How Yooti relates to Claude Code:
Claude Code is the engine. Yooti is the chassis.

Without Yooti, Claude Code is powerful but unstructured. The quality of
output depends heavily on how precisely you prompt it each time.

With Yooti, Claude Code reads .claude/CLAUDE.md and the constitutions
automatically. It knows the phases, gates, quality thresholds, scope rules,
and when to escalate. The pipeline governs the agent so you do not have to.

    CLAUDE CODE STANDALONE            CLAUDE CODE + YOOTI
    Prompt to code                    Story to gate to plan to gate to code
    Quality depends on prompting      Quality governed by constitutions + gates
    No gate system                    Five human gates
    No audit trail                    Full audit trail
    Every session starts fresh        Every session reads the same CLAUDE.md
    You manage the process            Pipeline manages the process

---

### Devin (Cognition AI)

What Devin is:
Devin is a fully autonomous AI software engineer. Given a task, Devin plans
and implements it end to end with minimal human intervention.

How Yooti relates to Devin:
Yooti is not trying to replace human judgement — it is trying to structure
when human judgement is applied. This is a philosophical difference.

Devin maximises autonomy. Yooti maximises appropriate autonomy — the right
level of autonomy for the right stage of a team's AI adoption journey, with
clear human gates where human judgement matters most.

    DEVIN                             YOOTI
    Maximum autonomy                  Appropriate autonomy per adoption stage
    Fully autonomous end to end       Five human gates — team stays in control
    Closed platform                   Open framework — MIT licensed
    Expensive                         Free (CLI is open source)
    No team collaboration model       Team roles with explicit responsibilities
    No gate system                    Explicit gate system with sign-off files

---

### The honest summary

No single tool does everything. The right mental model is:

    Story writing           Your existing process or Yooti story:add wizard
    Specification           Yooti story validation OR Spec-Kit OR Kiro specs
    Code generation         Claude Code or Codex or Kiro or Copilot Workspace
    Pipeline governance     Yooti
    Quality gates           Yooti (enforced in CI via generated workflows)
    Team collaboration      Yooti (roles, gates, audit trail)

Yooti is the governance layer that wraps around whichever code generation
tool your team uses.

---

---

## 3. How do I customise Yooti for my team?

---

### Can I use my own ticket IDs instead of STORY-NNN?

Yes. Yooti accepts any ticket ID format:

    STORY-001   BUG-042   FEAT-007   PROJ-123   ISS-007

All CLI commands accept any format. Import sample stories with your own prefix:

    yooti story:sample --app ecommerce --prefix PROJ
    # Creates PROJ-001, PROJ-002 etc.

---

### Can I use my own tech stack?

Yes. The framework is language agnostic. Use brownfield mode:

    yooti init . --context brownfield

Then add custom constitutions for your stack:

    cat > .claude/constitutions/java-spring.md << 'EOF'
    # Java + Spring Constitution
    # The agent reads this before writing any Java code.

    ## Patterns to follow
    - Use constructor injection — not field injection
    - Every @Service class has a corresponding interface
    - Repository methods use Optional<T> for nullable returns
    EOF

Reference it in .claude/CLAUDE.md:

    Java + Spring:   .claude/constitutions/java-spring.md

The agent will read and apply it like any other constitution.

---

### Can I customise quality thresholds?

Yes. Edit yooti.config.json:

    {
      "quality_gates": {
        "coverage_overall":    80,
        "coverage_new_code":   90,
        "lint_errors":         0,
        "type_errors":         0,
        "security_critical":   0,
        "security_high":       0,
        "mutation_score_warn": 85
      }
    }

Note: lowering thresholds is discouraged. Raise them as your team builds
confidence — not lower them when they feel hard to meet.

---

### Can I change what the agent is allowed to do?

Yes. The constitutions and CLAUDE.md are plain markdown files. Edit them directly.

Add a custom rule:

    ## Custom rules — [company name]
    All API responses must include a request-id header.
    This header must be logged at every service boundary.

Add a technology pattern:

    ## Redis caching rules
    Cache keys must use the format: [service]:[entity]:[id]
    TTL must be set explicitly — never rely on no-expiry defaults.

Add a compliance requirement:

    ## GDPR requirements
    All endpoints handling EU user data must:
      - Log the legal basis for processing in the audit log
      - Accept a right-to-erasure flag in the user model
      - Never store PII in application logs

---

### Can I add my own story types?

Yes. Add a JSON file to .agent/templates/:

    {
      "type": "data-migration",
      "description": "Database migration with data transformation",
      "required_fields": ["story_id", "title", "affected_tables", "rollback_plan"],
      "definition_of_done": [
        "Migration runs on a copy of production data",
        "Rollback tested and documented",
        "No data loss — row counts match before and after"
      ],
      "constitutions_to_apply": ["postgresql", "security", "testing"]
    }

---

### Can I use Yooti with GitLab?

Yes. Generate with GitLab CI:

    yooti init my-project --ci gitlab

This generates .gitlab-ci.yml instead of .github/workflows/. The quality
gates are identical — only the CI platform changes.

---

### Can I use Codex instead of Claude Code?

Yes. Generate with Codex support:

    yooti init my-project --agent codex

This generates an AGENTS.md file. Codex reads this before each task.
The pipeline phases, gates, and evidence package are identical.

---

---

## 4. Are all five gates required?

---

### Can we skip gates?

The gates are designed to be relaxed as your team advances through stages.
No gate is universally required — it depends on your stage and risk tolerance.

    STAGE 3 — Review (recommended starting point)
    G1  PM approves stories          required
    G2  Architect reviews plans      required
    G3  Developer reviews PR         required (in GitHub — no CLI)
    G4  QA reviews evidence          required
    G5  Release Manager approves     required for production

    STAGE 4 — Deploy
    G1  PM approves stories          required
    G2  Architect reviews plans      optional for XS stories
    G3  Developer reviews PR         required
    G4  QA reviews evidence          automated via CI gates
    G5  Release Manager approves     required for production

    STAGE 5 — Autonomous
    G1  PM approves stories          required
    G2  Architect reviews plans      optional
    G3  Developer reviews PR         optional (can auto-merge on CI pass)
    G4  QA reviews evidence          automated
    G5  Release Manager approves     required (regulatory)

---

### Where can a team define their own definition of "done"?

At three levels:

Story level — in each validated requirement JSON:

    {
      "definition_of_done": [
        "All AC have passing integration tests",
        "Coverage on new code >= 90%",
        "Security scan: 0 HIGH/CRITICAL",
        "Load test: P95 response < 200ms"
      ]
    }

Sprint level — in docs/GATES.md:
Add sprint-level DoD that applies to all stories in the sprint.

Organisation level — in yooti.config.json:
Quality thresholds apply to all stories in all sprints.

The yooti sprint:report command checks all three levels before
reporting the sprint complete.

---

### Can we define our own "sprint complete" criteria?

Yes. Edit yooti.config.json:

    {
      "pipeline": {
        "required_gates_for_done": ["G1", "G2", "G3", "G4"]
      }
    }

If your team does not have a dedicated release manager and G5 is always the
tech lead's call, remove G5 from the required list and sign it yourself.

---

### Can we skip Gate G2 for small stories?

For XS stories (one task, one layer, under 7 files), some teams allow the
tech lead to self-approve. Add this to docs/GATES.md:

    ## Gate G2 — Waiver policy for XS stories
    XS complexity stories with a single task may be waived from full G2 review
    at the tech lead's discretion. The tech lead must still create the gate file:

    echo "# Gate G2 — Waived (XS)" > .agent/gates/[ID]-G2-approved.md

The waiver is tracked. The audit trail is preserved.

---

### Can we merge G4 into G3 for small teams?

Yes. On small teams where developer and QA are the same person, G3 and G4
can be a single review session:

    git checkout feature/STORY-001
    # Review code (G3)
    # Read evidence package (G4)
    yooti qa:review STORY-001      # creates G4 gate file
    # Approve and merge in GitHub  # creates G3 gate file automatically

The gate files are still separate. The audit trail shows who reviewed what.

---

### Can the pipeline run without Docker?

Yes. Docker is required for the local stack but not for the pipeline itself.
The pipeline scripts run with Node.js and Python directly.

If your team does not use Docker:
1. Remove docker-compose.yml from the preflight check
2. Set deploy: "none" in yooti.config.json
3. Run services directly — the pipeline does not care how they start

---

### What if we only want the constitutions?

You can use the constitution files standalone. Copy them from
.claude/constitutions/ and reference them in your agent setup.

The constitutions are plain markdown. They work independently of the pipeline.

The value of the full pipeline is enforcement — the evidence package and code
audit in Phase 5 ensure constitutions are actually applied, not just available.
Without the pipeline, constitution compliance is on the honour system.

---

---

## 5. How does the pipeline handle bugs vs features?

---

### Is there a different flow for bugs?

The pipeline is the same. The story type changes how the agent approaches it.

Bug fix stories use bugfix-story.json which mandates:
1. Write a failing test that reproduces the bug before any fix
2. Confirm the test fails with existing code
3. Write the minimum fix to make the test pass
4. Add the test to the regression suite

The regression test is the most important output of a bug fix. It makes the
bug impossible to reintroduce silently in future sprints.

---

### What about security patches?

Security patches use security-patch.json and are treated as P0:
- Security scan runs before any other quality check
- Snyk and Semgrep findings are hard blocks
- The agent documents the vulnerability, attack vector, and fix
- G2 is mandatory regardless of story size

---

### What about refactors?

Refactor stories use refactor-story.json which enforces:
- No behaviour change — existing tests must pass without modification
- No new tests required unless the refactor exposes untested paths
- Regression diff must show zero newly failing tests

If a refactor requires changing a test, that is a signal the refactor changed
observable behaviour. It should be a feature story instead.

---

---

## 6. What happens when the agent gets it wrong?

---

### What if the agent writes code outside its plan scope?

The plan files have explicit CREATE, MODIFY, and OUT OF SCOPE sections.
If the agent needs to touch a file outside scope, it writes an escalation
file and stops. The escalation is routed to the developer and architect
to decide whether to expand scope or reject the approach.

---

### What if the agent cannot converge after 5 iterations?

The agent writes an escalation file describing the task, iteration count,
final failure type, and recommended action. The team resolves the issue,
deletes the escalation file, and tells the agent to continue.

Escalation types and owners:

    SCOPE_ERROR       Developer + Architect decide on scope change
    ENV_ERROR         DevOps fixes the environment
    AMBIGUITY         PM clarifies the requirement
    ARCH_ERROR        Architect reviews the approach
    INSTALL_REQUIRED  Developer runs npm install or pip install
    SECURITY_ERROR    Developer + Architect

---

### What if the agent hallucinates an import or package?

Constitutions enforce: no import can exist that is not in package.json or
requirements.txt. If the agent tries to import something that does not exist,
the type checker or import resolver fails immediately.

The agent writes an escalation file when it needs a new dependency. The
developer installs the package and the agent continues. This is intentional —
package hallucination is a real problem that the pipeline catches before PR.

---

### What if quality thresholds are too strict for our codebase right now?

Three options:

Option A — Lower temporarily with a documented TODO:

    [tool.coverage.report]
    fail_under = 70  # TODO: raise to 80 when auth module is tested — Sprint 4

Option B — Exclude legacy files from coverage (not business logic files).

Option C — Set globally in yooti.config.json.

Option A is recommended — it makes the compromise visible and time-bounded.

---

---

## 7. How does testing work?

---

### Does the agent write tests or do developers?

At Stage 3 and above, the agent writes the tests. Tests are written first (TDD)
and the agent must confirm they fail before writing implementation.

Developers and QA can add test requirements before Phase 4:

    yooti test:require STORY-001    # developer adds specific scenario
    yooti qa:plan STORY-001         # QA adds test layer requirements

Both are read by the agent before it writes any tests. All P0 requirements
must pass before a PR is opened.

---

### What is the three-layer agent testing model?

For LangGraph agent stories specifically:

    LAYER 1 — UNIT TESTS         Every commit
    No real LLM calls — mock everything.
    Test each node function in isolation.
    Fast — under 10 seconds for the full suite.

    LAYER 2 — INTEGRATION TESTS  Every PR
    Mock the LLM via patch() or test fixtures.
    Test full graph execution with controlled inputs.
    Assert state flows correctly end to end.

    LAYER 3 — EVALS              Nightly CI schedule only
    Real LLM calls — these cost money.
    Assert output quality — not just that it ran.
    Failures trigger investigation, not a broken build.

---

### What is the regression diff?

yooti sprint:start captures a baseline snapshot of all passing tests.
After Phase 5, the agent compares the full test suite against the baseline.

If any previously passing test is now failing, the PR cannot be opened.
Every agent-introduced regression is caught before the work can proceed.

---

### What is mutation testing?

Stryker (TypeScript) and mutmut (Python) run in CI on every PR. A score
below 85% generates a warning at G4 but does not block the PR.

The mutation score measures whether your tests actually catch bugs.
90% coverage with 60% mutation score means tests assert that code runs —
not that it works correctly.

---

---

## 8. Can I use Yooti with my existing codebase?

---

### Does brownfield mode touch my existing code?

No. yooti init . --context brownfield adds only framework overlay files:
.claude/, .agent/, pipeline/, docs/, yooti.config.json, .env.example

It does not modify any existing source files, tests, or configuration.

---

### How do I handle the baseline snapshot with existing tests?

Run yooti sprint:start after your existing tests are stable and passing.
Any test already failing before Yooti is not counted as a regression.

Stabilise flaky tests before running sprint:start. The regression diff is
only meaningful when the baseline is clean.

---

### What if my codebase does not have tests yet?

Start at Stage 1 or 2. Let the team write the first tests manually.
When you have a clean test baseline — even a small one — advance to Stage 3
and let the agent write tests for new features going forward.

---

---

## 9. What about security and IP?

---

### Does Yooti send my code anywhere?

No. Yooti is a CLI tool that runs entirely in your repository.
All framework files are local files in your repo.

The code generation agent (Claude Code or Codex) sends code to Anthropic
or OpenAI respectively. This is separate from Yooti. Consult their data
handling policies for privacy and IP terms.

---

### Who owns the code the agent generates?

Consult your legal team and the terms of service for your code generation
tool. Yooti does not generate code — it governs how code is generated.

---

### Can the constitution files help with compliance?

Yes. The security and docker constitutions enforce practices that align
with common compliance frameworks (SOC 2, ISO 27001, PCI DSS).

Add your specific requirements to the constitution files:

    ## GDPR requirements
    All endpoints handling EU user data must:
      - Log the legal basis for processing in the audit log
      - Accept a right-to-erasure flag in the user model
      - Never store PII in application logs

The agent applies these rules to every task in scope.

---

---

## 10. Pricing and licensing

---

### How much does Yooti cost?

The Yooti CLI and all framework files are MIT licensed and free.

Included at no cost:
- All 27 CLI commands
- All generated framework files
- All constitution templates
- All pipeline scripts and CI workflows
- All sample apps and story templates

---

### What is Yooti OS?

Yooti OS is an optional commercial add-on that adds:
- Agent behavioral quality monitoring using Statistical Process Control (SPC)
- SPC dashboards showing agent behavior trends over time
- Drift detection when agent behavior deviates from baseline
- Cross-sprint analytics
- Design partner onboarding support

Yooti works completely without Yooti OS.

Enable: yooti init my-project --yooti-os

---

### Can I contribute to Yooti?

Yes. The CLI is open source at github.com/yooti/cli.

Most valuable contributions:
- Constitution files for other languages (Java, Go, .NET, Ruby)
- New story type templates
- New sample apps
- Bug reports with reproduction steps

---

### Where can I get help?

    Documentation:   github.com/yooti/cli/docs
    Issues:          github.com/yooti/cli/issues
    Discussions:     github.com/yooti/cli/discussions
    Email:           hello@yooti.dev

When reporting an issue include: yooti preflight output, yooti.config.json,
your Node.js/Docker/Python versions, and the specific error message.

---

*Yooti FAQ — v1.2*
