// src/commands/testrequire.js
import chalk from 'chalk'
import inquirer from 'inquirer'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { validateId, placeholderExample } from '../utils/itemId.js'

export async function testRequire(storyId) {
  if (!storyId) {
    const ans = await inquirer.prompt([{
      type: 'input', name: 'storyId', message: `Item ID (e.g. ${placeholderExample()})`,
      validate: v => validateId(v) === true || validateId(v)
    }])
    storyId = ans.storyId
  }

  const reqDir = `.agent/test-requirements`
  mkdirSync(reqDir, { recursive: true })

  console.log(chalk.cyan(`\n◆ Adding test requirement to ${storyId}\n`))

  const answers = await inquirer.prompt([
    {
      type: 'list', name: 'layer',
      message: 'Which test layer does this apply to?',
      choices: [
        { name: 'Unit test      — test a single function in isolation', value: 'unit' },
        { name: 'Integration    — test against real services end-to-end', value: 'integration' },
        { name: 'Accessibility  — WCAG / ARIA requirement',              value: 'a11y' },
        { name: 'Performance    — load time, query time, response time', value: 'performance' },
        { name: 'Security       — auth, injection, exposure check',      value: 'security' },
        { name: 'Eval           — agent output quality check (nightly)', value: 'eval' },
      ]
    },
    {
      type: 'input', name: 'acId',
      message: 'Which acceptance criterion does this test cover? (e.g. AC-2)',
      default: ''
    },
    {
      type: 'input', name: 'scenario',
      message: 'Test scenario — Given / When / Then (or describe in plain English)',
      validate: v => v.length > 10 || 'Be specific enough for the agent to write the test'
    },
    {
      type: 'input', name: 'file',
      message: 'Which file should the test go in? (blank = agent decides)',
      default: ''
    },
    {
      type: 'list', name: 'priority',
      message: 'Priority',
      choices: ['P0 — must pass before PR', 'P1 — must pass before G4', 'P2 — nice to have']
    },
    {
      type: 'list', name: 'addedBy',
      message: 'Your role',
      choices: ['QA / SDET', 'Developer', 'Architect', 'PM']
    }
  ])

  const now = new Date().toISOString()
  const filename = `${reqDir}/${storyId}-${Date.now()}-${answers.layer}.md`

  const content = `# Test requirement: ${storyId}
Layer: ${answers.layer}
AC covered: ${answers.acId || 'general'}
Priority: ${answers.priority}
Added by: ${answers.addedBy}
Date: ${now}

## Test scenario
${answers.scenario}

## Target file
${answers.file || '(agent decides based on layer and scenario)'}

## Instructions for agent
Write a ${answers.layer} test that covers the scenario above.
${answers.layer === 'unit' ? 'Do not use real LLM calls or external services — mock everything.' : ''}
${answers.layer === 'integration' ? 'Use real services. Full setup and teardown. No shared state between tests.' : ''}
${answers.layer === 'a11y' ? 'Use axe-core. Assert 0 violations. Test with assistive technology attributes.' : ''}
${answers.layer === 'security' ? 'Test both the attack vector and the mitigation. Assert the vulnerability is not present.' : ''}
${answers.layer === 'eval' ? 'Mark with @pytest.mark.eval. Use real LLM. Assert semantic correctness, not exact strings.' : ''}
This test must exist and must pass before the story can proceed past Gate G4.
`

  writeFileSync(filename, content)

  console.log(`\n  ${chalk.green('✓')} Test requirement written: ${filename}`)
  console.log(chalk.dim(`\n  The agent reads .agent/test-requirements/ before writing tests.`))
  console.log(chalk.dim(`  This requirement must pass before Gate G4 sign-off.\n`))
}
