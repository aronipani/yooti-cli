import chalk from 'chalk'
import inquirer from 'inquirer'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import { evidencePackageComplete } from './sprint.js'

export async function qaPlan(storyId) {
  if (!storyId) {
    const ans = await inquirer.prompt([{
      type: 'input',
      name: 'storyId',
      message: 'Story ID (e.g. STORY-001)',
      validate: v => /^STORY-\d+$/.test(v) || 'Format: STORY-NNN'
    }])
    storyId = ans.storyId
  }

  const reqPath = `.agent/requirements/${storyId}-validated.json`
  if (!existsSync(reqPath)) {
    console.log(chalk.red(`\n  ✗ Story ${storyId} not found.\n`))
    process.exit(1)
  }

  const story = JSON.parse(readFileSync(reqPath, 'utf8'))
  const qaDir = '.agent/qa'
  mkdirSync(qaDir, { recursive: true })

  console.log(chalk.cyan(`\n◆ Creating QA test plan for ${storyId}\n`))

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'qaName',
      message: 'Your name',
      validate: v => v.length > 0
    },
    {
      type: 'input',
      name: 'filesChanged',
      message: 'Files this story touches (comma-separated)',
      default: ''
    },
    {
      type: 'checkbox',
      name: 'testLayers',
      message: 'Which test layers does this story require?',
      choices: [
        { name: 'Unit tests', value: 'unit', checked: true },
        { name: 'Integration tests', value: 'integration', checked: true },
        { name: 'Accessibility tests (frontend)', value: 'accessibility', checked: false },
        { name: 'Performance tests', value: 'performance', checked: false },
        { name: 'Security tests', value: 'security', checked: true },
        { name: 'Regression tests', value: 'regression', checked: true },
        { name: 'Eval tests (agent stories)', value: 'evals', checked: false },
      ]
    },
    {
      type: 'input',
      name: 'regressionScope',
      message: 'Existing test files at risk of regression (comma-separated)',
      default: ''
    },
    {
      type: 'input',
      name: 'testData',
      message: 'Test data requirements (blank if none)',
      default: ''
    },
  ])

  const now = new Date().toISOString().split('T')[0]
  const files = answers.filesChanged
    ? answers.filesChanged.split(',').map(f => `- ${f.trim()}`).join('\n')
    : '- (list files this story touches)'

  const regressionScope = answers.regressionScope
    ? answers.regressionScope.split(',').map(f =>
        `| ${f.trim()} | (why at risk) |`
      ).join('\n')
    : '| (file) | (why at risk) |'

  const acTable = story.acceptance_criteria
    ? story.acceptance_criteria.map(ac =>
        `| ${ac.id} | ${ac.then || ac.id} | API + DB |`
      ).join('\n')
    : '| AC-1 | (describe test) | (services) |'

  const content = `# QA Test Plan — ${storyId}
Created by: ${answers.qaName}
Date: ${now}
Status: DRAFT

## Story summary
${story.title || storyId}

## Test scope — files this story touches
${files}

## Test layers required
${answers.testLayers.map(l => `- [x] ${l}`).join('\n')}

---

## Unit test scenarios
<!-- Agent uses these scenarios when writing unit tests -->
| Scenario | Input | Expected output | Priority |
|----------|-------|-----------------|----------|
| (happy path) | | | P0 |
| (boundary condition) | | | P0 |
| (error path) | | | P0 |
| (security edge case) | | | P0 |

## Integration test scenarios (AC coverage)
| AC | Test description | Services involved |
|----|-----------------|------------------|
${acTable}

${answers.testLayers.includes('accessibility') ? `## Accessibility tests
| Component | Requirement | WCAG criterion |
|-----------|-------------|----------------|
| (component) | (requirement) | (criterion) |
` : ''}
${answers.testLayers.includes('performance') ? `## Performance tests
| Scenario | Threshold | Method |
|----------|-----------|--------|
| (endpoint) | < 200ms P95 | Supertest timing |
` : ''}
## Security tests
| Vulnerability | Test approach | Priority |
|---------------|--------------|----------|
| (injection) | (parameterised query test) | P0 |
| (auth bypass) | (unauthenticated request test) | P0 |

## Regression scope — existing tests that must still pass
| Test file | Why at risk |
|-----------|-------------|
${regressionScope}

## Test data requirements
${answers.testData || '- No special test data required'}

---

## Definition of done for QA
- [ ] All P0 unit scenarios implemented and passing
- [ ] All AC have at least one integration test
- [ ] Security tests passing
- [ ] No regression in files listed above
- [ ] Coverage on new code >= 90%
- [ ] Mutation score >= 85%
- [ ] Evidence package complete in .agent/evidence/${storyId}/
`

  const planPath = `${qaDir}/${storyId}-test-plan.md`
  writeFileSync(planPath, content)

  console.log(`\n  ${chalk.green('✓')} QA test plan created: ${planPath}`)
  console.log(chalk.dim(`\n  Next steps:`))
  console.log(chalk.dim(`  1. Fill in test scenarios before Phase 4 starts`))
  console.log(chalk.dim(`  2. Add test requirements: yooti test:require ${storyId}`))
  console.log(chalk.dim(`  3. Review evidence at G4: yooti audit ${storyId}\n`))
}

export async function qaReview(storyId) {
  if (!storyId) {
    const ans = await inquirer.prompt([{
      type: 'input',
      name: 'storyId',
      message: 'Story ID (e.g. STORY-001)',
      validate: v => /^STORY-\d+$/.test(v) || 'Format: STORY-NNN'
    }])
    storyId = ans.storyId
  }

  const { complete, missing } = evidencePackageComplete(storyId)
  if (!complete) {
    console.log(chalk.red(`\n  ✗ Evidence package incomplete for ${storyId}`))
    console.log(chalk.dim('\n  Missing files:'))
    missing.forEach(f => console.log(chalk.dim(`    ${f}`)))
    console.log(chalk.yellow('\n  Phase 5 must complete before Gate G4 review.'))
    console.log(chalk.dim('  Tell the agent: generate the evidence package for ' + storyId + '\n'))
    process.exit(1)
  }

  const evidenceDir = `.agent/evidence/${storyId}`

  console.log(chalk.cyan(`\n◆ Gate G4 Review — ${storyId}\n`))

  // Read evidence files
  const read = (file) => {
    const path = `${evidenceDir}/${file}`
    return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null
  }

  const testResults  = read('test-results.json')
  const coverage     = read('coverage-summary.json')
  const regression   = read('regression-diff.json')
  const mutation     = read('mutation-score.json')
  const security     = read('security-scan.json')
  const a11y         = read('accessibility.json')

  const results = []

  // Hard gates
  const hardGate = (name, pass, detail = '') => {
    results.push({ name, pass, hard: true, detail })
  }

  // Soft gates (QA judgement)
  const softGate = (name, pass, detail = '') => {
    results.push({ name, pass, hard: false, detail })
  }

  if (testResults) {
    hardGate('Unit tests 100% pass',
      testResults.unit?.failed === 0,
      testResults.unit ? `${testResults.unit.passed}/${testResults.unit.total}` : 'missing')
    hardGate('Integration tests 100% pass',
      testResults.integration?.failed === 0,
      testResults.integration ? `${testResults.integration.passed}/${testResults.integration.total}` : 'missing')
  } else {
    hardGate('Test results file exists', false, 'test-results.json not found')
  }

  if (regression) {
    hardGate('Zero regressions',
      regression.newly_failing?.length === 0,
      regression.newly_failing?.length > 0
        ? `${regression.newly_failing.length} newly failing: ${regression.newly_failing.join(', ')}`
        : `${regression.total_tests_after - regression.total_tests_before} new tests added`)
  } else {
    hardGate('Regression diff exists', false, 'regression-diff.json not found')
  }

  if (coverage) {
    hardGate('Overall coverage >= 80%',
      coverage.overall >= 80,
      `${coverage.overall?.toFixed(1)}%`)
    hardGate('New code coverage >= 90%',
      coverage.new_code >= 90,
      `${coverage.new_code?.toFixed(1)}%`)
  } else {
    hardGate('Coverage report exists', false, 'coverage-summary.json not found')
  }

  if (security) {
    hardGate('Zero CRITICAL security findings',
      security.snyk?.critical === 0,
      `Snyk: ${security.snyk?.critical} critical`)
    hardGate('Zero HIGH security findings',
      security.snyk?.high === 0,
      `Snyk: ${security.snyk?.high} high`)
    hardGate('Zero Semgrep findings',
      security.semgrep?.findings === 0,
      `Semgrep: ${security.semgrep?.findings} findings`)
  } else {
    hardGate('Security scan exists', false, 'security-scan.json not found')
  }

  if (a11y) {
    hardGate('Zero accessibility violations',
      a11y.violations === 0,
      `${a11y.violations} violations`)
  }

  if (mutation) {
    softGate('Mutation score >= 85%',
      mutation.score >= 85,
      `${mutation.score?.toFixed(1)}% (${mutation.survived} mutants survived)`)
  }

  // Print results
  const hardFails = results.filter(r => r.hard && !r.pass)
  const softFails = results.filter(r => !r.hard && !r.pass)

  console.log('  Hard gates (any failure = reject):\n')
  results.filter(r => r.hard).forEach(r => {
    const icon = r.pass ? chalk.green('✓') : chalk.red('✗')
    console.log(`  ${icon} ${r.name.padEnd(40)} ${chalk.dim(r.detail)}`)
  })

  console.log('\n  QA judgement gates (review required):\n')
  results.filter(r => !r.hard).forEach(r => {
    const icon = r.pass ? chalk.green('✓') : chalk.yellow('⚠')
    console.log(`  ${icon} ${r.name.padEnd(40)} ${chalk.dim(r.detail)}`)
  })

  console.log('')

  if (hardFails.length > 0) {
    console.log(chalk.red(`  ✗ ${hardFails.length} hard gate(s) failed — cannot approve\n`))
    console.log(chalk.dim('  Fix the failures above and rerun Phase 5 before G4 review.\n'))
    return
  }

  // Ask for decision
  const { decision, reviewer, notes } = await inquirer.prompt([
    {
      type: 'list',
      name: 'decision',
      message: softFails.length > 0
        ? `${softFails.length} soft gate(s) need review. Your decision:`
        : 'All gates green. Your decision:',
      choices: [
        { name: 'Approve — quality evidence is sufficient', value: 'approved' },
        { name: 'Reject — specify what must be fixed', value: 'rejected' }
      ]
    },
    { type: 'input', name: 'reviewer', message: 'Your name', validate: v => v.length > 0 },
    { type: 'input', name: 'notes', message: 'Notes', default: 'All gates reviewed. Approved.' }
  ])

  const gatesDir = '.agent/gates'
  mkdirSync(gatesDir, { recursive: true })

  const now = new Date().toISOString()
  const filename = `${storyId}-G4-${decision}.md`
  const gateContent = `# Gate G4 — QA Sign-off\nStory: ${storyId}\nDecision: ${decision.toUpperCase()}\nReviewer: ${reviewer}\nDate: ${now}\nNotes: ${notes}\n\nHard gates: ${results.filter(r => r.hard && r.pass).length}/${results.filter(r => r.hard).length} passed\nSoft gates: ${results.filter(r => !r.hard && r.pass).length}/${results.filter(r => !r.hard).length} passed\n`

  writeFileSync(`${gatesDir}/${filename}`, gateContent)

  const icon = decision === 'approved' ? chalk.green('✓') : chalk.yellow('⚠')
  console.log(`\n  ${icon} Gate G4 ${decision}: .agent/gates/${filename}\n`)
}
