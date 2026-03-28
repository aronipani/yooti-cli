export function gatesMd(config) {
  return `# Human Decision Gates — ${config.projectName}

Five gates where a human makes a decision before the pipeline continues.
Nothing crosses these boundaries autonomously.

---

## G1 — PM Requirements Sign-Off
**Owner:** Product Manager · **Timing:** Before sprint starts

- [ ] All stories have Given/When/Then acceptance criteria
- [ ] Every story has a Definition of Done checklist  
- [ ] All ambiguity blockers resolved
- [ ] UX mockups linked for UI stories
- [ ] Business priority order confirmed

**FAIL →** Sprint does not start. Stories with blockers held.

---

## G2 — Architecture Review
**Owner:** Solution Architect · **Timing:** End of Days 1-2

- [ ] ${config.context === 'greenfield' ? 'ADRs written and approved for all stack decisions' : 'Risk surface report reviewed and risk accepted'}
- [ ] .plan files reviewed for M/L complexity stories
- [ ] No breaking cross-system changes without explicit approval
- [ ] Performance budgets defined per story

**FAIL →** Code generation does not begin.

---

## G3 — Developer PR Review
**Owner:** Developer · **Timing:** Days 6-8

Review the auto-generated PR body at .agent/evidence/STORY-NNN/pr-body.md

- [ ] Code correctness — matches stated intent
- [ ] No files modified outside .plan scope
- [ ] Patterns consistent with codebase and ADRs
- [ ] Error handling adequate for edge cases
- [ ] No hardcoded secrets or obvious security issues
- [ ] Known gaps documented explicitly

**APPROVE →** Continue to QA
**REQUEST CHANGES →** Corrections fed back to agent Phase 4 loop
**REJECT (major) →** Return to Phase 2, full replan

---

## G4 — QA Sign-Off
**Owner:** QA / SDET · **Timing:** Day 9

Check evidence package at .agent/evidence/STORY-NNN/

- [ ] Coverage overall ≥ 80%
- [ ] Coverage new code ≥ 90%
- [ ] Mutation score > 85%
- [ ] 0 security findings (Snyk + Semgrep)
- [ ] 0 regression failures vs baseline snapshot
- [ ] All ACs have at least one passing test
- [ ] Uncovered branches documented and accepted

**FAIL →** Agent generates additional tests. Security findings escalate immediately.

---

## G5 — Deployment Approval
**Owner:** Release Manager · **Timing:** Day 10

Review staging health report at .agent/evidence/STORY-NNN/staging-health.json

- [ ] Staging stable > 30 minutes
- [ ] All smoke tests passing
- [ ] p99 latency within 20% of production baseline
- [ ] Error rate < 0.5% on affected endpoints
- [ ] Rollback plan confirmed

**GO →** Agent deploys to production, monitors 15 min, auto-rollback on failure
**NO-GO →** Release Manager decides: fix-forward or carry to next sprint
`;
}
