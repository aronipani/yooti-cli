# Yooti — Frequently Asked Questions

> **Yūti** (यूति) — Sanskrit for *joining, union, or mixture*.
> The act of bringing things together — humans and agents, each doing what they do best.

---

## Contents

1. What is Yooti?
2. Who is Yooti for?
3. How does Yooti compare to other tools?
4. Are all five gates required?
5. How do I customise Yooti for my team?
6. How does the pipeline handle bugs vs features?
7. What happens when the agent gets it wrong?
8. How does testing work?
9. Can I use Yooti with my existing codebase?
10. What about security and IP?
11. Pricing and licensing

---

---

## 1. What is Yooti?

---

### What is Yooti in one sentence?

Yooti is a Specification-Driven Development framework for teams — so you
ship features using AI agents without accumulating the technical debt that
slows you down later.

---

### What problem does Yooti solve?

Small teams using AI agents ship fast. Then three months in, the codebase
is inconsistent, tests are missing or meaningless, every new feature breaks
two existing ones, and the team is spending more time debugging production
than building the next thing.

This is vibe coding debt. The agent is capable. The problem is there are no
guardrails between "the agent generated something" and "it shipped to production."
Without structure, agents amplify inconsistency just as fast as they amplify output.

Yooti solves this with a pipeline that enforces consistent standards on every
story, every sprint — automatically. Not because you hired a QA team.
Because the pipeline does it.

---

### What is vibe coding and why does it cause problems?

Vibe coding is writing code by feel — accepting what the agent generates if
it seems to work, without tests, without review standards, without consistent
patterns. It is fast. It feels productive. It compounds into debt.

    THREE MONTHS OF VIBE CODING
    Every feature is written differently
    Tests either do not exist or test the wrong things
    New features break existing ones silently
    The agent learns from the inconsistency and compounds it
    Debugging takes longer than building
    New team members cannot read the codebase
    You are afraid to change anything that works

Yooti breaks this before it starts. The constitution files capture your
patterns on Day 1. The agent follows them on every story. The codebase
stays consistent even when the agent writes most of it.

---

### Is Yooti a code generator?

No. Yooti is a pipeline framework.

It does not write code. It installs the infrastructure that tells your
AI code agent — Claude Code or Codex — what to do, in what order, to
what quality standard, and when to stop and ask a human.

The agent writes the code. Yooti governs how that happens.

---

### Is Yooti an SDD tool?

Yes. Yooti is a Specification-Driven Development framework.

The core SDD loop is: write a spec, agent reads the spec, agent generates
code and tests, human reviews the output, deploy. Yooti implements exactly
this loop. The validated requirement JSON with its Given/When/Then acceptance
criteria and Definition of Done is the spec. Phase 4 is the generation.
Gate G3 is the review.

What Yooti adds on top of the SDD loop is a governance layer that makes it
safe to run with a team rather than just an individual:

    SDD LOOP              YOOTI GOVERNANCE LAYER (what most SDD tools omit)
    ─────────────         ──────────────────────────────────────────────────
    Spec as input         Constitution files — your patterns, enforced always
    Code generation       Scope enforcement — agent cannot drift
    Test generation       Evidence package — quality proof before every PR
    Human review          Five gates — at the right moments only
    Deploy                Escalation system — agent fails loudly not silently
                          Adoption stages — trust builds incrementally
                          Audit trail — compliance without extra work
                          Team role definitions — clarity on who owns what

---

### Does governance constrain developers?

Only if it is working badly. When it is working well, developers barely
notice it.

The constitutions are written by your team — not imposed on you. The agent
follows your patterns, not generic ones. You stop correcting the same style
decisions in every PR.

The gates exist at five specific moments where human judgement matters.
Everything between them is automated. At Stage 5, you write a story on Monday
and review a PR on Tuesday. The pipeline handles everything in between.

Governance is not the opposite of developer freedom.
Governance is what makes developer freedom at Stage 5 safe to reach.

    WITHOUT GOVERNANCE               WITH GOVERNANCE
    ──────────────────────────────   ────────────────────────────────────
    Agent writes differently every   Agent writes the way you would
    story — you correct it in PRs    You stop correcting style every PR

    Agent hallucinates silently      Escalation system — agent stops and
    You find it in production        explains what it cannot do

    You read every line in the PR    Evidence package handles the obvious
    Review is slow and exhausting    You focus on the interesting decisions

    You want more autonomy but       Five gates at moments that matter
    are afraid to let go             Governance makes letting go safe

---

### What does Yooti actually install?

    Agent context         .claude/CLAUDE.md — phases, gates, rules, toolchain
    Coding constitutions  .claude/constitutions/ — per language and framework
    Pipeline artifacts    .agent/ — requirements, plans, evidence, gates, audit
    Pipeline scripts      preflight, snapshot, regression diff, PR body generator
    CI workflows          unit tests, security scan, G3 gate automation
    Docker infrastructure docker-compose.yml — full local stack
    Team playbooks        GATES.md, PROMPTS.md — docs for every role

One command. Working pipeline from Day 1.

---

---

## 2. Who is Yooti for?

---

### Is Yooti for startups?

Yes — and this is where Yooti has the most impact.

Startups are the teams most likely to vibe code under pressure, and most
likely to pay the price later. Yooti gives a 3-5 person team the delivery
discipline of a 15-person team with a dedicated QA function — without hiring
anyone new.

Specifically useful for:

    Seed stage teams moving from 0 to 1
    Founders who are also developers and need structure without overhead
    Small teams who have already accumulated vibe coding debt and want out
    Teams preparing a codebase for their first enterprise design partner
    CTOs who are about to hire and want patterns in place first

The constitution files are particularly valuable at this stage. They capture
the founding team's patterns before more engineers join. New hires code to
the same standard from Day 1 instead of learning by osmosis over months.

---

### Is Yooti for enterprise teams?

Yes — but the pitch is different.

For enterprise, the value is governance and auditability:
- Every gate decision is logged with a timestamp and reviewer name
- The audit trail exists without anyone manually maintaining it
- Quality thresholds are enforced in CI — not on the honour system
- The adoption stage model lets a large team pilot AI-assisted development
  on one product before rolling it out broadly

---

### Is Yooti for solo developers?

Yooti works for a team of one — but the value is lower. Many of the gates
collapse when one person owns all of them. The constitution system and
quality enforcement still add value, but the pipeline overhead may outweigh
the benefit until you add a second person.

For solo developers, Stage 3 with self-approval at G1 and G2 is the lightest
configuration. The CI quality gates and evidence package still run automatically.

---

---

## 3. How does Yooti compare to other tools?

---

### The honest position

Yooti is SDD. It does not compete with other SDD tools — it extends them
with a governance layer most SDD tools leave out.

The right mental model:

    Story writing        Your existing process or Yooti's story:add wizard
    Specification        Yooti story validation — produces the spec
    Code generation      Claude Code or Codex or Kiro
    Pipeline governance  Yooti
    Quality gates        Yooti — enforced in CI
    Team coordination    Yooti — roles, gates, audit trail

Yooti is most valuable as the layer that wraps around whichever code
generation tool your team already uses or wants to use.

---

### Kiro (AWS)

Kiro is excellent SDD for individuals and AWS-native teams. The spec-to-code
workflow is clean, the IDE integration is tight, and the AWS ecosystem support
is strong.

Yooti is SDD for teams. The difference is the governance layer: five human
gates with team role ownership, constitution files that capture your patterns,
evidence packages that make PR review fast, adoption stages so the team moves
together, and an audit trail for compliance.

They work well together. Kiro generates the code. Yooti governs the pipeline
around it.

    KIRO                              YOOTI
    SDD for individuals               SDD for teams with governance
    IDE-level tool                    Repository-level framework
    AWS ecosystem native              Cloud agnostic
    No gate system                    Five human gates with role ownership
    No constitution system            Constitutions capture team patterns
    No evidence packaging             Evidence package before every PR
    No adoption stages                Five stages — trust builds incrementally

---

### Spec-Kit

Spec-Kit focuses on specification quality — making specs precise enough for
agents to work from reliably. This is exactly the right problem to solve.

Yooti's Phase 1 does the same thing: it converts a user story into a validated
requirement JSON with Given/When/Then AC, Definition of Done, and ambiguity flags.
This is the spec.

Teams using Spec-Kit can import their specs directly into .agent/requirements/
and wrap the full Yooti governance layer around their existing specification workflow.

    SPEC-KIT                          YOOTI
    Specification quality focus       Full SDD lifecycle including spec step
    Strong on requirements layer      Strong on governance across all layers
    Spec to code                      Spec to gate to plan to gate to code
    No gate system                    Five human gates
    No constitution enforcement       Constitutions enforce implementation patterns

---

### GitHub Copilot Workspace

GitHub Issues to code — smooth for individual feature implementation.
Not SDD, not governed. Different audience and use case.

---

### Claude Code standalone

Claude Code is the engine. Yooti is the SDD framework that runs it.

Without Yooti, Claude Code has no phase structure, no constitution enforcement,
no gate system, and no evidence packaging. Quality depends on how precisely
you prompt each session. Every session starts fresh.

With Yooti, Claude Code reads CLAUDE.md and the constitutions automatically.
It knows the phases, the gates, your team's coding patterns, and when to escalate.
The SDD loop runs consistently without you orchestrating it manually.

---

### Devin

Devin maximises autonomy. Yooti maximises appropriate autonomy per stage.

Devin assumes the agent should handle everything. Yooti assumes humans should
own specific decisions and the agent should own everything between those decisions.

The developer who wants Stage 5 freedom — write a story Monday, review a PR
Tuesday — gets there faster and more sustainably by building governance
incrementally than by jumping to full autonomy without it.

---

---

## 4. Are all five gates required?

---

### Can we skip gates?

Gates are designed to be relaxed as your team advances through stages.
No gate is universally required — it depends on your stage and risk tolerance.

    STAGE 3 — Review (recommended starting point)
    G1  PM approves stories          required
    G2  Architect reviews plans      required
    G3  Developer reviews PR         required — in GitHub, no CLI needed
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
    G3  Developer reviews PR         optional — can auto-merge on CI pass
    G4  QA reviews evidence          automated
    G5  Release Manager approves     required

---

### Where does a team define their own "done"?

At three levels:

Story level — in each validated requirement JSON:

    "definition_of_done": [
      "All AC have passing integration tests",
      "Coverage on new code >= 90%",
      "Security scan: 0 HIGH/CRITICAL",
      "Load test: P95 response < 200ms"
    ]

Sprint level — in docs/GATES.md — applies to all stories in the sprint.

Organisation level — in yooti.config.json — applies to all stories always.

yooti sprint:report checks all three levels before reporting the sprint complete.

---

### Can we skip G2 for small stories?

For XS stories — one task, one layer, under 7 files — some teams allow the
tech lead to self-approve. Add to docs/GATES.md:

    ## G2 waiver for XS stories
    XS stories may be waived from full G2 review at the tech lead's discretion.
    The tech lead still creates the gate file:
    echo "# Gate G2 — Waived (XS)" > .agent/gates/[ID]-G2-approved.md

The waiver is tracked. The audit trail is preserved.

---

### Can we merge G3 and G4 on a small team?

Yes. On a small team where developer and QA are the same person, run both
reviews in one session:

    git checkout feature/STORY-001
    # Review code (G3)
    # Read evidence package (G4)
    yooti qa:review STORY-001      # creates G4 gate file
    # Approve and merge in GitHub  # creates G3 gate file automatically

The gate files are still separate. The audit trail shows both reviews.

---

### Can the pipeline run without Docker?

Yes. Docker is required for the local stack but not for the pipeline.
The pipeline scripts run with Node.js and Python directly.

Set deploy: "none" in yooti.config.json if your team does not use Docker.

---

---

## 5. How do I customise Yooti for my team?

---

### Can I use my own ticket IDs?

Yes. Yooti accepts any format:

    STORY-001   BUG-042   FEAT-007   PROJ-123   ISS-007

Import sample stories with your own prefix:

    yooti story:sample --app ecommerce --prefix PROJ

---

### Can I use my own tech stack?

Yes. Use brownfield mode to install only the framework without the RI:

    yooti init . --context brownfield

Add custom constitutions for your stack:

    cat > .claude/constitutions/java-spring.md << 'EOF'
    # Java + Spring Constitution
    - Use constructor injection — not field injection
    - Every @Service class has a corresponding interface
    - Repository methods use Optional<T> for nullable returns
    EOF

Reference it in .claude/CLAUDE.md. The agent reads and applies it.

---

### Can I customise quality thresholds?

Yes. Edit yooti.config.json:

    {
      "quality_gates": {
        "coverage_overall":  80,
        "coverage_new_code": 90,
        "lint_errors":       0,
        "security_critical": 0,
        "mutation_score_warn": 85
      }
    }

---

### Can I change what the agent is allowed to do?

Yes. CLAUDE.md and the constitutions are plain markdown in your repo.
Edit them to add your team's rules, patterns, and compliance requirements.

The constitutions are written by your team. The agent follows them.
This is the core of the anti-vibe-coding model — your standards, enforced
automatically, without you repeating them in every prompt.

---

### Can I use GitLab instead of GitHub?

Yes:

    yooti init my-project --ci gitlab

Generates .gitlab-ci.yml. Quality gates are identical.

---

### Can I use Codex instead of Claude Code?

Yes:

    yooti init my-project --agent codex

Generates AGENTS.md for Codex. Pipeline is identical.

---

---

## 6. How does the pipeline handle bugs vs features?

---

### Is there a different flow for bugs?

Same pipeline, different story type. Bug fixes use bugfix-story.json which requires:

1. Write a failing test that reproduces the bug before any fix
2. Confirm the test fails with existing code
3. Write the minimum fix to make the test pass
4. Test added to regression suite permanently

The regression test is the most important output. The bug cannot reintroduce
itself silently in any future sprint.

---

### What about security patches?

Security patches use security-patch.json — treated as P0. Snyk and Semgrep
are hard blocks. G2 is mandatory regardless of story size.

---

### What about refactors?

Refactor stories enforce: no behaviour change, existing tests pass without
modification, regression diff shows zero newly failing tests. If a refactor
requires changing a test, that is a feature story.

---

---

## 7. What happens when the agent gets it wrong?

---

### What if the agent writes bad code?

The code audit in Phase 5 checks every file against the constitution files
before the PR opens. The developer reviews the PR at Gate G3. Both are
checkpoints that catch problems before production.

If bad code reaches G3, the developer injects a correction:

    yooti correct:inject STORY-001-T002

The agent applies the correction, re-runs the quality loop, and updates the PR.

---

### What if the agent cannot converge after 5 iterations?

The agent writes a structured escalation file describing the task, the failure
type, and what it recommends. The escalation routes to the correct human:

    SCOPE_ERROR       Developer + Architect decide on scope change
    ENV_ERROR         DevOps fixes the environment
    AMBIGUITY         PM clarifies the requirement
    ARCH_ERROR        Architect reviews the approach
    INSTALL_REQUIRED  Developer runs npm install or pip install

After resolution, delete the escalation file. The agent resumes.

---

### What if the agent hallucinates a package?

Constitutions enforce that no import can exist outside package.json or
requirements.txt. The type checker or import resolver fails immediately.
The agent writes an escalation file. The developer installs the real package.
This is caught before PR — not in production.

---

---

## 8. How does testing work?

---

### Does the agent write tests?

Yes — always first. TDD is mandatory. The agent writes failing tests before
any implementation. It must confirm they fail before writing a single line
of implementation code.

QA adds requirements before Phase 4:

    yooti qa:plan STORY-001       # QA test plan
    yooti test:require STORY-001  # specific test scenarios

Both are read by the agent before it writes tests. All P0 requirements
must pass before a PR is opened.

---

### What is the regression diff?

yooti sprint:start captures a baseline of all passing tests. After Phase 5,
the agent compares the full test suite against the baseline. Any previously
passing test that is now failing blocks the PR. Agent-introduced regressions
are caught before the developer opens the PR.

---

### What is mutation testing?

Stryker (TypeScript) and mutmut (Python) run in CI on every PR. A score
below 85% warns at G4 but does not block.

Coverage tells you code was executed. Mutation score tells you tests actually
catch bugs. High coverage with low mutation score means your tests assert
that code runs — not that it works correctly.

---

---

## 9. Can I use Yooti with my existing codebase?

---

### Does brownfield mode touch existing code?

No. It adds only: .claude/, .agent/, pipeline/, docs/, yooti.config.json,
.env.example. No existing source files are modified.

---

### What if my codebase has no tests?

Start at Stage 1 or 2. Build a test baseline manually first. When you have
a clean baseline — even a small one — advance to Stage 3 and let the agent
write tests for new features going forward. The regression diff needs a
clean baseline to be meaningful.

---

### When is the right time to adopt Yooti?

The best time is before the debt accumulates — Day 1 of a new product.

The second best time is now — before the next sprint starts. Brownfield mode
adds the framework without touching existing code. Start at Stage 1, build
a test baseline, advance stages as trust in the agent grows.

The wrong time is mid-sprint. Wait for a sprint boundary so the regression
baseline is clean.

---

---

## 10. What about security and IP?

---

### Does Yooti send my code anywhere?

No. Yooti is a CLI that runs entirely in your repository. All framework files
are local. The code generation agent (Claude Code or Codex) sends code to
Anthropic or OpenAI respectively — this is separate from Yooti.

---

### Can constitutions help with compliance requirements?

Yes. The security and docker constitutions align with SOC 2, ISO 27001, and
PCI DSS practices. Add your specific requirements directly:

    ## GDPR requirements
    All endpoints handling EU user data must:
      - Log the legal basis for processing in the audit log
      - Accept a right-to-erasure flag in the user model
      - Never store PII in application logs

The agent applies these on every task in scope.

---

---

## 11. Pricing and licensing

---

### How much does Yooti cost?

The Yooti CLI and all framework files are MIT licensed and free.

This includes all 27 CLI commands, all generated framework files, all
constitutions, all pipeline scripts, all CI workflows, and all sample apps.

---

### What is Yooti OS?

An optional commercial add-on that adds Statistical Process Control monitoring
of agent behavior — iteration counts, scope violations, test pass rates,
coverage deltas across every story and sprint. Surfaces drift before it becomes
a problem.

Enable: yooti init my-product --yooti-os

---

### Where can I get help?

    Documentation:   github.com/yooti/cli/docs
    Issues:          github.com/yooti/cli/issues
    Email:           hello@yooti.dev

When reporting an issue include: yooti preflight output, yooti.config.json,
Node.js/Docker/Python versions, and the specific error.

---

*Yooti FAQ — v1.2*
