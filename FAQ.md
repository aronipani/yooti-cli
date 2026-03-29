# Yooti — Frequently Asked Questions

> **Yūti** (यूति) — Sanskrit for *joining, union, or mixture*.
> The act of bringing things together — humans and agents, each doing what they do best.

---

## Contents

1. What is Yooti?
2. Who is Yooti for?
3. Privacy, security and the "black box" questions
4. Integration — Jira, Linear, and existing tools
5. How does Yooti compare to other tools?
6. Are all five gates required?
7. How do I customise Yooti for my team?
8. What happens when the agent gets it wrong?
9. How does testing work?
10. Can I use Yooti with my existing codebase?
11. Pricing and licensing

---

---

## 1. What is Yooti?

---

### What is Yooti in one sentence?

Yooti is an agile delivery framework powered by AI agents — your team
writes stories, the agent generates code and tests, and humans review
at the same five decision points they already own.

---

### Is Yooti an SDD tool, an agile tool, or something else?

Both. Yooti combines Specification-Driven Development with the agile
delivery rhythm most engineering teams already use.

The SDD part: the agent reads a structured spec (your validated story),
generates code from it, writes tests, and proves quality before any human
sees the output.

The agile part: stories, sprint cadence, PR review, and five human gates
at the decision points your team already owns — requirements sign-off,
architecture review, code review, QA, and release approval.

Neither alone is enough. SDD without human gates produces code no one
reviewed. Agile without agent execution is the same pace as before.
Together they give you a pipeline where agents handle execution and
humans handle decisions.

---

### What does "Specification-Driven Development" mean?

SDD is the practice of writing a precise, structured specification before
any code is generated. The agent reads the spec — not an ad-hoc prompt —
and generates code from it consistently.

In Yooti, the validated requirement JSON is the spec. It contains:
- Acceptance criteria in Given/When/Then format
- Definition of Done
- Ambiguity flags
- Complexity estimate
- Non-functional requirements (performance, security, accessibility)

The spec is the source of truth. The constitutions tell the agent how
to implement it. Together they replace the ad-hoc prompting that produces
inconsistent results.

---

### Is Yooti a library I import into my source code?

No. Yooti is a process framework — not a runtime dependency.

It lives in .claude/ and .agent/ inside your repository. It manages the
lifecycle of your code — requirements to plan to build to QA to deploy —
rather than being something your code imports or calls at runtime.

Your application has no dependency on Yooti. Remove the framework files
and your application is unchanged. Yooti governs the process around your
code, not the code itself.

---

### How is Yooti different from just using Claude Code or Copilot?

The sharpest way to see the difference:

| Feature | Yooti Framework | Typical AI Copilot |
|---------|----------------|-------------------|
| Logic unit | The user story — structured spec | The line of code — chat prompt |
| Governance | Human-in-the-loop gates | Direct accept on ghost text |
| Consistency | Constitutions — your team's standards | LLM vibes — different every session |
| Verification | Automated evidence package before PR | Does it compile? |
| Failure mode | Escalation file — loud, routed, explained | Silent hallucination |
| Audit trail | Gate files + event logs + sprint retro | None |

Copilots are ungated. They suggest code and you hope it is right.
Yooti is a pipeline. The agent passes through five human gates and an
automated constitutional audit before a single PR is opened.

---

### What does Yooti actually install?

    .claude/CLAUDE.md          Agent context — phases, gates, rules, your toolchain
    .claude/constitutions/     Your coding standards — agent reads before every file
    .agent/                    Pipeline artifacts — stories, plans, gates, evidence
    pipeline/scripts/          Preflight, snapshot, regression diff, PR body generator
    .github/workflows/         CI — unit tests, security scan, G3 gate automation
    docs/GATES.md              Gate criteria for your team
    docs/PROMPTS.md            Exact prompts for every pipeline stage

Brownfield teams get only these files. Nothing in your existing codebase
is touched.

---

---

## 2. Who is Yooti for?

---

### Is Yooti for startups?

Yes — this is where Yooti has the most impact.

Startups are the teams most likely to vibe code under pressure and most
likely to pay the price later. Three months of unstructured agent usage
produces an inconsistent codebase that slows down faster than it was built.

Yooti gives a 3-5 person team the delivery discipline of a 15-person team
with a dedicated QA function — without hiring anyone new.

The constitution files are particularly valuable here. They capture the
founding team's patterns before more engineers join. New hires code to
the same standard from Day 1 instead of learning by osmosis over months.

---

### Is Yooti for teams that already have a codebase?

Yes. The brownfield path is a first-class path in Yooti — not an afterthought.

    yooti init . --context brownfield

Adds only the framework overlay files. Nothing in your existing codebase
is touched. Your existing ticket IDs, your existing CI, your existing
test suite — all work alongside Yooti.

Most professional teams start here. See Module 01-B in the Getting Started guide.

---

### Is Yooti for enterprise teams?

Yes — the pitch is different. Enterprise value is governance and auditability:
- Every gate decision logged with timestamp and reviewer name
- Audit trail generated automatically — no manual maintenance
- Quality thresholds enforced in CI — not on the honour system
- Adoption stage model for controlled AI rollout across teams

---

---

## 3. Privacy, security, and the "black box" questions

These are the questions professional teams ask before adopting any
AI-assisted framework. Answered directly.

---

### Does Yooti send my code to a third party?

No. Yooti is a CLI tool that runs entirely in your local repository.
The framework files — .claude/, .agent/, pipeline/ — are all local files.
Yooti itself never connects to any external service.

The code generation agent (Claude Code or Codex) sends code to Anthropic
or OpenAI respectively using your own API keys from your own .env file.
This is a direct connection between your machine and your AI provider.
Yooti is not in that connection and has no visibility into it.

What leaves your machine:
- Code sent to your AI provider (Anthropic/OpenAI) — via your API key
- CI logs sent to GitHub Actions or GitLab CI — same as any CI pipeline
- Snyk or Semgrep scans if configured — optional, via your own tokens

What never leaves your machine:
- Your .agent/ folder (stories, plans, evidence, gate files)
- Your .claude/ folder (CLAUDE.md and constitutions)
- Your source code except via the channels above

---

### Who owns the code the agent generates?

Consult your legal team and the terms of service for your AI provider.
Yooti does not generate code — it governs how code is generated.
The IP question is between your team and Anthropic or OpenAI.

---

### Can the agent access files outside the project?

No. Claude Code and Codex operate within the repository directory.
Yooti's scope enforcement adds a further constraint — the agent is
only permitted to touch files listed in its .plan.md task file.
If it needs to touch anything else, it writes an escalation and stops.

---

### What stops the agent from making a mistake that reaches production?

Five things — in order:

    1. Scope enforcement    The plan file lists exactly which files the agent
                            can touch. Anything else triggers an escalation.

    2. Self-healing loop    The agent runs lint, type check, and tests after
                            every iteration. It fixes failures automatically
                            up to 5 iterations.

    3. Evidence package     Phase 5 runs the full test suite, coverage check,
                            regression diff, security scan, and code audit
                            before the PR is opened. Hard failures block the PR.

    4. Gate G3              A human developer reads every line of code and
                            approves or rejects before anything merges.

    5. Gate G4              QA reviews the complete evidence package.
                            Nothing moves to staging without sign-off.

Nothing reaches production without passing all five. The gates are not
optional — they are the design.

---

### What if the agent gets stuck in a loop?

The agent has a hard limit of 5 self-healing iterations per task.

If it cannot get to green in 5 iterations, it writes a structured
escalation file — not a crash, not silent failure — and stops:

    .agent/escalations/PROJ-123-T002-TYPE_ERROR.md

The file describes: which task, which iteration it stopped at, the
specific failure, and what it recommends. The escalation routes to the
correct human based on the failure type:

    SCOPE_ERROR       Developer + Architect approve scope change
    ENV_ERROR         DevOps fixes the environment
    AMBIGUITY         PM clarifies the requirement
    ARCH_ERROR        Architect reviews the approach
    INSTALL_REQUIRED  Developer runs npm install or pip install
    TYPE_ERROR        Developer fixes the specific type error

After resolution, delete the escalation file. Tell the agent to continue.
The iteration counter resets.

The agent never loops indefinitely. It escalates with a clear explanation
and waits. This is by design — loud failure is safer than silent looping.

---

### What if the agent hallucinates a package or import?

The constitution files enforce: no import can exist outside package.json
or requirements.txt. If the agent tries to import something that does not
exist, the type checker or import resolver fails immediately in the quality loop.

The agent writes an escalation file specifying the package it needs
and the install command. The developer installs the real package.
This is caught before the PR — not in production.

---

---

## 4. Integration — Jira, Linear, and existing tools

---

### Can I use my Jira or Linear ticket numbers as story IDs?

Yes. Yooti accepts any ticket ID format:

    PROJ-123    Jira project key style
    ISS-007     Linear issue style
    STORY-001   Yooti default
    BUG-042     Bug tracking
    FEAT-007    Feature

Use your ticket number directly:

    yooti story:add
    # Story ID: PROJ-123   ← your Jira ticket number

All CLI commands accept any format:

    yooti plan:review PROJ-123
    yooti qa:review PROJ-123
    yooti audit PROJ-123

---

### Can I import a sprint from Jira or Linear?

Yes — via JSON import. Export your sprint tickets and format them:

    yooti story:import --file this-sprint.json

JSON format:

    [
      {
        "story_id": "PROJ-123",
        "title": "As a user I want to reset my password",
        "type": "feature",
        "priority": "P0",
        "sprint": 1,
        "acceptance_criteria": [
          {
            "id": "AC-1",
            "given": "a user who has forgotten their password",
            "when": "they submit their email address",
            "then": "they receive a reset link within 60 seconds"
          }
        ],
        "definition_of_done": [
          "All AC have passing integration tests",
          "Security scan: 0 HIGH/CRITICAL"
        ]
      }
    ]

Direct Jira API import (pull tickets automatically) is on the v1.3 roadmap.

---

### Can I use Yooti with GitLab instead of GitHub?

Yes:

    yooti init my-project --ci gitlab

Generates .gitlab-ci.yml. Quality gates are identical. The automatic
G3 gate file creation on PR merge is currently GitHub Actions only —
GitLab equivalent is on the v1.3 roadmap.

---

### Does Yooti work with my existing CI pipeline?

Yes. Brownfield mode does not touch your existing CI configuration.
The Yooti CI files are added alongside your existing ones.

If you already have CI running, you can run Yooti's CI separately or
merge the jobs into your existing pipeline. The CI files are standard
YAML — edit them as you would any CI configuration.

---

### Can I use Codex instead of Claude Code?

Yes:

    yooti init my-project --agent codex

Generates AGENTS.md that Codex reads before each task. The pipeline
phases, gates, and evidence package are identical regardless of which
agent generates the code.

---

---

## 5. How does Yooti compare to other tools?

---

### The honest position

Yooti is SDD with a governance layer. The right mental model:

    Spec / story writing     Your process or Yooti's story:add wizard
    Code generation          Claude Code, Codex, Kiro, or Copilot Workspace
    Pipeline governance      Yooti
    Quality gates            Yooti — enforced in CI
    Team coordination        Yooti — roles, gates, audit trail

Yooti wraps around whichever code generation tool your team uses.
It is the governance layer most SDD tools leave out.

---

### vs Kiro (AWS)

Kiro is excellent SDD for individuals. Spec-to-code, tight IDE integration,
strong AWS ecosystem. Genuinely good at the generation step.

Yooti is SDD for teams. The difference: five human gates with team role
ownership, constitution files, evidence packaging, adoption stages, audit trail.

They work together. Kiro generates. Yooti governs the pipeline around it.

---

### vs Spec-Kit

Spec-Kit focuses on specification quality — making specs precise enough
for agents to work from. The right problem to solve.

Yooti's Phase 1 does the same thing and extends into the full lifecycle.
Teams using Spec-Kit can import their specs into .agent/requirements/
and wrap the Yooti governance layer around them.

---

### vs Claude Code standalone

Claude Code is the engine. Yooti is the framework that runs it.

Without Yooti: quality depends on prompting, no phase structure,
no gates, no evidence, every session starts fresh.

With Yooti: Claude Code reads CLAUDE.md and constitutions automatically.
Consistent output without manual orchestration.

---

### vs GitHub Copilot Workspace

GitHub Issues to code — smooth for individuals, not governed.
Different audience and use case from Yooti.

---

---

## 6. Are all five gates required?

---

### Can we skip gates?

Gates relax as your team advances through stages.

    STAGE 3 (recommended start)
    G1  PM approves stories      required
    G2  Architect reviews plans  required
    G3  Developer reviews PR     required — in GitHub, no CLI needed
    G4  QA reviews evidence      required
    G5  Release Manager          required for production

    STAGE 5 (maximum autonomy)
    G1  PM approves stories      required
    G2  Architect reviews plans  optional
    G3  Developer reviews PR     optional — can auto-merge on CI pass
    G4  QA reviews evidence      automated via CI
    G5  Release Manager          required

---

### Can we skip G2 for small stories?

For XS stories — one task, one layer, under 7 files — some teams allow
the tech lead to self-approve. Still creates a gate file. Audit trail preserved.

---

### Can G3 and G4 be the same person on a small team?

Yes. On small teams where developer and QA are the same person, run both
reviews in one session. The gate files are still separate.

---

### Where does a team define their own "done"?

Three levels:

Story level — in the validated requirement JSON:

    "definition_of_done": [
      "All AC have passing integration tests",
      "Coverage on new code >= 90%",
      "Load test: P95 response < 200ms"
    ]

Sprint level — in docs/GATES.md — applies to all stories in the sprint.

Organisation level — in yooti.config.json — applies always:

    {
      "pipeline": {
        "required_gates_for_done": ["G1", "G2", "G3", "G4"]
      }
    }

yooti sprint:report checks all three before reporting the sprint complete.

---

---

## 7. How do I customise Yooti for my team?

---

### Can I use my own tech stack?

Yes. Yooti is language agnostic. Use brownfield mode:

    yooti init . --context brownfield

Then write constitution files for your stack. They are plain markdown.
The agent reads them before writing any code.

Generic template that works for any language:

    # .claude/constitutions/global.md
    ## Tests
    - Every new function has a unit test before implementation (TDD)
    - No external service calls in unit tests
    - No new dependency without Gate G2 approval

    ## Security
    - No secrets in code or config files
    - All user input validated before use
    - Errors never expose stack traces

    ## Quality
    - Every public function has a doc comment
    - All config from environment variables

Language-specific additions:

    # .claude/constitutions/java.md
    - Constructor injection only — never field injection
    - Every @Service has a corresponding interface

    # .claude/constitutions/go.md
    - Errors are values — always check, never ignore
    - No global state

---

### Can I customise quality thresholds?

Yes — in yooti.config.json:

    {
      "quality_gates": {
        "coverage_overall":  80,
        "coverage_new_code": 90,
        "lint_errors":       0,
        "security_critical": 0
      }
    }

---

---

## 8. What happens when the agent gets it wrong?

---

### What if the agent writes bad code?

The code audit in Phase 5 checks every file against your constitution files
before the PR opens. The developer reviews the PR at Gate G3. Both are
checkpoints before production.

If the developer catches something at G3:

    yooti correct:inject PROJ-123-T002
    # Describe the specific issue
    # Agent fixes, re-runs quality loop, updates the PR

---

### What if the agent gets stuck in a loop?

Hard limit: 5 self-healing iterations per task. Then the agent writes an
escalation file and stops. Never loops indefinitely. See Section 3 above
for the full explanation and escalation routing.

---

### What if the agent hallucinates an import?

Caught immediately by the type checker in the quality loop. Agent writes
an escalation file specifying what it needs. Developer installs the real
package. Caught before PR — not in production. See Section 3.

---

---

## 9. How does testing work?

---

### Does the agent write tests?

Yes — always first. TDD is mandatory. Failing tests before any implementation.

QA adds requirements before Phase 4:

    yooti qa:plan PROJ-123        # full QA test plan
    yooti test:require PROJ-123   # specific test scenarios

Both are read by the agent before it writes tests.

---

### What is the regression diff?

yooti sprint:start captures a baseline of all passing tests. After Phase 5,
the agent compares the full test suite against the baseline. Any previously
passing test now failing blocks the PR. Agent-introduced regressions caught
before the developer even opens the PR.

---

### What is mutation testing?

Stryker (TypeScript) and mutmut (Python) run in CI on every PR.
Score below 85% warns at G4 but does not block.

Coverage tells you code was executed. Mutation score tells you tests
actually catch bugs. 90% coverage with 60% mutation score means your
tests assert that code runs — not that it works.

---

---

## 10. Can I use Yooti with my existing codebase?

---

### Does brownfield mode touch existing code?

No. Adds only: .claude/, .agent/, pipeline/, docs/, yooti.config.json,
.env.example. No source files, tests, or configuration touched.

---

### What if my codebase has no tests?

Start at Stage 1 or 2. Build a baseline manually. When you have a clean
baseline — even small — advance to Stage 3 and let the agent write tests
for new features. The regression diff needs a clean baseline to be meaningful.

---

### When is the right time to adopt?

Best: Day 1 of a new product. Before any debt accumulates.

Second best: Now — before the next sprint. Brownfield adds the framework
without touching existing code. Start at Stage 1, build a test baseline,
advance stages as trust grows.

Wrong time: Mid-sprint. Wait for a sprint boundary so the baseline is clean.

---

---

## 11. Pricing and licensing

---

### How much does Yooti cost?

The Yooti CLI and all framework files are MIT licensed and free.

Included at no cost: all 27 commands, all framework files, all constitution
templates, all pipeline scripts, all CI workflows, all sample apps.

---

### What is Yooti OS?

Optional commercial add-on. Statistical Process Control monitoring of agent
behavior — iteration counts, scope violations, test pass rates, coverage
trends across every story and sprint. Surfaces drift before it becomes a problem.

    yooti init my-product --yooti-os

---

### Where can I get help?

    Documentation:  github.com/yooti/cli/docs
    Issues:         github.com/yooti/cli/issues
    Email:          hello@yooti.dev

When reporting an issue include: yooti preflight output, yooti.config.json,
Node.js/Docker/Python versions, and the specific error message.

---

*Yooti FAQ — v1.2*
