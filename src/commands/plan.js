// src/commands/plan.js
import chalk from 'chalk'
import inquirer from 'inquirer'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { logGate } from '../audit/logger.js'

export async function planAmend(taskId) {
  const planPath = `.agent/plans/${taskId}.plan.md`
  if (!existsSync(planPath)) {
    console.log(chalk.red(`\n  ✗ Plan not found: ${planPath}`))
    console.log(chalk.dim('  Run: yooti task:list to see available tasks\n'))
    process.exit(1)
  }

  let content = readFileSync(planPath, 'utf8')
  console.log(chalk.cyan(`\n◆ Amending plan: ${taskId}\n`))

  // Show current status
  const currentStatus = (content.match(/## Status\n(\w+)/) || [])[1] || 'UNKNOWN'
  console.log(chalk.dim(`  Current status: ${currentStatus}\n`))

  const { amendType } = await inquirer.prompt([{
    type: 'list', name: 'amendType',
    message: 'What do you want to change?',
    choices: [
      { name: '+ Add file to CREATE scope',              value: 'add-create' },
      { name: '+ Add file to MODIFY scope',              value: 'add-modify' },
      { name: '+ Add directory to OUT OF SCOPE',         value: 'add-oos' },
      { name: '+ Add implementation step',               value: 'add-step' },
      { name: '+ Add role annotation / constraint',      value: 'annotate' },
      { name: '↔ Change task status',                    value: 'status' },
      { name: '↔ Change depends-on',                     value: 'depends' },
    ]
  }])

  const now = new Date().toISOString().split('T')[0]
  let changed = false

  if (amendType === 'add-create') {
    const { value } = await inquirer.prompt([{ type: 'input', name: 'value', message: 'File path to add to CREATE' }])
    content = content.replace(/^CREATE:\n/m, `CREATE:\n- ${value}\n`)
    changed = true
  }
  else if (amendType === 'add-modify') {
    const { value } = await inquirer.prompt([{ type: 'input', name: 'value', message: 'File path to add to MODIFY' }])
    content = content.replace(/^MODIFY:\n/m, `MODIFY:\n- ${value}\n`)
    changed = true
  }
  else if (amendType === 'add-oos') {
    const { value } = await inquirer.prompt([{ type: 'input', name: 'value', message: 'Directory to add to OUT OF SCOPE' }])
    content = content.replace(/^OUT OF SCOPE \(do not touch\):\n/m, `OUT OF SCOPE (do not touch):\n- ${value}\n`)
    changed = true
  }
  else if (amendType === 'add-step') {
    const { value } = await inquirer.prompt([{ type: 'input', name: 'value', message: 'Implementation step to add' }])
    const stepCount = (content.match(/^\d+\./gm) || []).length
    content = content.replace(/^## Dependencies/m, `${stepCount + 1}. ${value}\n\n## Dependencies`)
    changed = true
  }
  else if (amendType === 'annotate') {
    const { role, note } = await inquirer.prompt([
      { type: 'list', name: 'role', message: 'Your role', choices: ['ARCHITECT', 'DEVELOPER', 'QA', 'PM', 'DEVOPS'] },
      { type: 'input', name: 'note', message: 'Annotation / constraint for the agent', validate: v => v.length > 0 }
    ])
    const annotation = `[${role} G2 ${now}]: ${note}`
    const placeholder = `<!-- Add annotations with: yooti plan:amend ${taskId} -->`
    if (content.includes(placeholder)) {
      content = content.replace(placeholder, annotation)
    } else {
      content = content.trimEnd() + `\n${annotation}\n`
    }
    changed = true
  }
  else if (amendType === 'status') {
    const { status } = await inquirer.prompt([{
      type: 'list', name: 'status', message: 'New status',
      choices: ['PENDING', 'IN_PROGRESS', 'COMPLETE', 'BLOCKED', 'REJECTED']
    }])
    content = content.replace(/^(## Status\n)\w+/m, `$1${status}`)
    changed = true
  }
  else if (amendType === 'depends') {
    const { depends } = await inquirer.prompt([{ type: 'input', name: 'depends', message: 'Depends on (e.g. T001, or "none")' }])
    content = content.replace(/^Depends on: .+/m, `Depends on: ${depends}`)
    changed = true
  }

  if (changed) {
    writeFileSync(planPath, content)
    console.log(`\n  ${chalk.green('✓')} Plan updated: ${planPath}\n`)
  }
}

export async function planApprove(storyId) {
  const gatesDir = '.agent/gates'
  mkdirSync(gatesDir, { recursive: true })

  console.log(chalk.cyan(`\n◆ Gate G2 — Architecture Review: ${storyId}\n`))

  const answers = await inquirer.prompt([
    { type: 'input', name: 'name', message: 'Your name', validate: v => v.length > 0 },
    {
      type: 'list', name: 'decision',
      message: 'Decision',
      choices: [
        { name: 'Approve — plans are structurally sound, proceed to code generation', value: 'approved' },
        { name: 'Reject — plans need revision before code generation', value: 'rejected' }
      ]
    },
    { type: 'input', name: 'notes', message: 'Notes', default: 'Plans reviewed and approved.' }
  ])

  const now = new Date().toISOString()
  const filename = `${storyId}-G2-${answers.decision}.md`
  const content = `# Gate G2 — Architecture Review\nStory: ${storyId}\nDecision: ${answers.decision.toUpperCase()}\nReviewed by: ${answers.name}\nDate: ${now}\nNotes: ${answers.notes}\n`

  writeFileSync(`${gatesDir}/${filename}`, content)

  // Log gate decision to audit trail
  logGate(storyId, 2, 'G2', answers.decision.toUpperCase(), answers.name, 'Architect', answers.notes)

  if (answers.decision === 'approved') {
    console.log(`\n  ${chalk.green('✓')} Gate G2 signed: .agent/gates/${filename}`)
    console.log(chalk.dim('  The agent will proceed to code generation for this story.\n'))
  } else {
    console.log(`\n  ${chalk.yellow('⚠')} Gate G2 rejected: .agent/gates/${filename}`)
    console.log(chalk.dim('  Update the plan files then run this command again.\n'))
  }
}
