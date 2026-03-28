export function stageDescription(stage) {
  const descriptions = {
    1: 'Foundation — scaffold and tooling only. Team writes all code manually.',
    2: 'Build — agent writes .plan files. Team writes code from plans.',
    3: 'Review — agent writes code and tests. Team reviews PR and controls all deploys.',
    4: 'Deploy — agent codes, tests, and deploys to staging. Team approves production.',
    5: 'Autonomous — full pipeline. Team owns 5 human decision gates only.'
  }
  return descriptions[stage] || descriptions[3]
}

export function stagePhases(stage) {
  const base = {
    requirements: 'agent',
    planning:     stage >= 2 ? 'agent' : 'human',
    codegen:      stage >= 3 ? 'agent' : 'human',
    testing:      stage >= 3 ? 'agent' : 'human',
    pr_review:    'human',
    staging:      stage >= 4 ? 'agent' : 'human',
    production:   stage >= 5 ? 'agent' : 'human'
  }
  return base
}

export function stageGates(stage) {
  return {
    g1_pm_signoff:      true,
    g2_arch_review:     stage >= 2,
    g3_pr_review:       true,
    g4_qa_signoff:      stage >= 4,
    g5_deploy_approval: stage >= 4
  }
}

export function stageAgentInstructions(stage) {
  if (stage === 1) return `- Parse user stories into validated_requirement.json
- Flag ambiguities and hold blocked stories
- Generate pipeline artifacts (schemas, scripts, docs)
- DO NOT generate implementation code — human writes all code`

  if (stage === 2) return `- Parse user stories into validated_requirement.json
- Decompose stories into .plan files with tasks and subtasks
- STOP after .plan files are written — human writes implementation code
- Run linting and type checking on human-written code when asked`

  if (stage === 3) return `- Parse stories, write .plan files
- Generate implementation code (full generation loop)
- Write tests TDD-first
- Generate PR body and evidence package
- STOP at PR — human reviews, edits, approves or rejects
- STOP at deploy — human controls all deployments`

  if (stage === 4) return `- Full code generation + testing
- Generate PR body and evidence package
- Deploy to staging automatically after G4 QA sign-off
- Run staging smoke tests and produce health report
- STOP at production — human approves G5 before prod deploy`

  return `- Full autonomous pipeline
- All phases run automatically
- Human owns 5 gates: G1 PM, G2 Arch, G3 PR, G4 QA, G5 Deploy`
}

export function stageHumanInstructions(stage) {
  if (stage === 1) return `- Write all implementation code
- Write all tests
- Open and review all PRs
- Control all deployments`

  if (stage === 2) return `- Review .plan files before writing any code (Gate G2)
- Write implementation code from the .plan files
- Write tests
- Open and review PRs
- Control all deployments`

  if (stage === 3) return `- Review and sign off requirements (Gate G1)
- Review architecture and .plan files (Gate G2)
- Review PR — audit code, make edits directly in the branch, approve or reject (Gate G3)
- Control ALL deployments — staging and production`

  if (stage === 4) return `- Review and sign off requirements (Gate G1)
- Review architecture and .plan files (Gate G2)
- Review PR — audit code, make edits, approve or reject (Gate G3)
- Sign off QA evidence package (Gate G4)
- Approve production deployment (Gate G5)`

  return `- Sign off requirements (Gate G1)
- Approve architecture and plans (Gate G2)
- Review and approve PR (Gate G3)
- Sign off QA evidence (Gate G4)
- Approve production deployment (Gate G5)`
}

export function stageHandoverPoints(stage) {
  if (stage === 1) return `STOP after: requirements parsing
Human takes over: all implementation`

  if (stage === 2) return `STOP after: .plan files written to .agent/plans/
Human takes over: implementation code, tests, PR, deployment`

  if (stage === 3) return `STOP after: PR body and evidence package generated
Human takes over: PR review (read, edit, approve/reject), ALL deployments
KEY POINT: Human may edit code directly in the feature branch before approving`

  if (stage === 4) return `STOP after: staging health report generated
Human takes over: production deployment approval only (Gate G5)`

  return `No automatic stops — gates G1-G5 are the only human checkpoints`
}
