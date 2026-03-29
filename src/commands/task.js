// src/commands/task.js
import chalk from 'chalk'
import inquirer from 'inquirer'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { logAgentAction } from '../audit/logger.js'
import { validateId, placeholderExample } from '../utils/itemId.js'

export async function taskAdd(storyId, cliOptions = {}) {
  if (!existsSync('yooti.config.json')) {
    console.log(chalk.red('\n  ✗ Not inside a Yooti project. Run yooti init first.\n'))
    process.exit(1)
  }

  // Prompt for story ID if not provided
  if (!storyId) {
    const ans = await inquirer.prompt([{
      type: 'input', name: 'storyId',
      message: `Item ID (e.g. ${placeholderExample()})`,
      validate: v => validateId(v) === true || validateId(v)
    }])
    storyId = ans.storyId
  }

  // Verify story exists
  const reqPath = `.agent/requirements/${storyId}-validated.json`
  if (!existsSync(reqPath)) {
    console.log(chalk.red(`\n  ✗ Story ${storyId} not found.\n`))
    console.log(chalk.dim(`  Expected: ${reqPath}`))
    console.log(chalk.dim('  Run: yooti story:add to create a new story\n'))
    process.exit(1)
  }

  // Find next task number
  const plansDir = '.agent/plans'
  mkdirSync(plansDir, { recursive: true })
  const existing = readdirSync(plansDir).filter(f => f.startsWith(storyId) && f.endsWith('.plan.md'))
  const nextNum = String(existing.length + 1).padStart(3, '0')
  const taskId = `${storyId}-T${nextNum}`

  console.log(chalk.cyan(`\n◆ Adding task ${taskId}\n`))

  const answers = await inquirer.prompt([
    {
      type: 'input', name: 'title',
      message: 'Task title',
      validate: v => v.length >= 5 || 'Must be at least 5 characters'
    },
    {
      type: 'list', name: 'addedBy',
      message: 'Your role',
      choices: ['PM', 'Architect', 'Developer', 'QA', 'DevOps', 'Other']
    },
    {
      type: 'input', name: 'acCovered',
      message: 'Acceptance criteria covered (e.g. AC-1, AC-3)',
      default: 'see story'
    },
    {
      type: 'input', name: 'filesToCreate',
      message: 'Files to CREATE (comma-separated, blank if none)',
      default: ''
    },
    {
      type: 'input', name: 'filesToModify',
      message: 'Files to MODIFY (comma-separated, blank if none)',
      default: ''
    },
    {
      type: 'input', name: 'outOfScope',
      message: 'Directories OUT OF SCOPE (comma-separated, blank if none)',
      default: ''
    },
    {
      type: 'input', name: 'steps',
      message: 'Implementation steps (comma-separated)',
      validate: v => v.trim().length > 0 || 'At least one step required'
    },
    {
      type: 'input', name: 'dependsOn',
      message: `Depends on (e.g. T001 — blank if none)`,
      default: ''
    },
    {
      type: 'input', name: 'blocks',
      message: 'Blocks which tasks? (blank if none)',
      default: ''
    },
    {
      type: 'input', name: 'note',
      message: 'Notes for the agent (blank if none)',
      default: ''
    }
  ])

  const now = new Date().toISOString().split('T')[0]

  const fmt = (csv, prefix = '-') =>
    csv.trim()
      ? csv.split(',').map(s => `${prefix} ${s.trim()}`).join('\n')
      : `${prefix} (none)`

  const stepLines = answers.steps
    .split(',').map((s, i) => `${i + 1}. ${s.trim()}`).join('\n')

  const planContent = `# ${taskId} — ${answers.title}

## Status
PENDING

## Added by
${answers.addedBy} on ${now}

## Scope

CREATE:
${fmt(answers.filesToCreate)}

MODIFY:
${fmt(answers.filesToModify)}

OUT OF SCOPE (do not touch):
${fmt(answers.outOfScope)}

## Acceptance criteria covered
${fmt(answers.acCovered)}

## Implementation steps
${stepLines}

## Dependencies
Depends on: ${answers.dependsOn || 'none'}
Blocks: ${answers.blocks || 'none'}

## Role annotations
${answers.note
    ? `[${answers.addedBy.toUpperCase()} ${now}]: ${answers.note}`
    : '<!-- Add annotations with: yooti plan:amend ' + taskId + ' -->'}
`

  const planPath = `${plansDir}/${taskId}.plan.md`
  writeFileSync(planPath, planContent)

  // Log task creation to audit trail
  logAgentAction(storyId, 2, `Task ${taskId} created: ${answers.title}`, {
    added_by: answers.addedBy,
    files_in_scope: answers.filesToCreate.split(',').filter(Boolean).length
      + answers.filesToModify.split(',').filter(Boolean).length
  })

  console.log(`\n  ${chalk.green('✓')} Task created: ${planPath}`)
  console.log(`  ${chalk.green('✓')} Task ID: ${taskId}`)
  console.log(chalk.dim(`\n  Next steps:`))
  console.log(chalk.dim(`  - Architect reviews: yooti plan:amend ${taskId}`))
  console.log(chalk.dim(`  - Sign off G2:       yooti plan:approve ${storyId}\n`))
}

export async function taskList(storyId) {
  const plansDir = '.agent/plans'
  if (!existsSync(plansDir)) {
    console.log(chalk.dim('\n  No plans directory found. Run yooti sprint:start first.\n'))
    return
  }

  const plans = readdirSync(plansDir)
    .filter(f => f.endsWith('.plan.md'))
    .filter(f => !storyId || f.startsWith(storyId))
    .sort()

  if (plans.length === 0) {
    console.log(chalk.dim(`\n  No tasks found${storyId ? ` for ${storyId}` : ''}.\n`))
    return
  }

  const statusIcon = {
    PENDING:     chalk.yellow('○'),
    IN_PROGRESS: chalk.cyan('◉'),
    COMPLETE:    chalk.green('✓'),
    BLOCKED:     chalk.red('✗'),
    REJECTED:    chalk.red('✗'),
  }

  console.log(chalk.cyan(`\n◆ Tasks${storyId ? ` — ${storyId}` : ' — all stories'}\n`))

  plans.forEach(f => {
    const content = readFileSync(`${plansDir}/${f}`, 'utf8')
    const status = (content.match(/## Status\n(\w+)/) || [])[1] || 'UNKNOWN'
    const title  = (content.match(/^# (.+)/m) || [])[1] || f.replace('.plan.md', '')
    const deps   = (content.match(/Depends on: (.+)/) || [])[1] || 'none'
    const icon   = statusIcon[status] || chalk.white('?')
    console.log(`  ${icon} ${chalk.white(title)}`)
    if (deps !== 'none') console.log(chalk.dim(`      depends on: ${deps}`))
  })
  console.log('')
}
