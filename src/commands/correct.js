// src/commands/correct.js
import chalk from 'chalk'
import inquirer from 'inquirer'
import { writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync } from 'fs'

export async function correctInject(taskId) {
  if (!taskId) {
    console.log(chalk.red('\n  ✗ Task ID required. Example: yooti correct:inject STORY-001-T001\n'))
    process.exit(1)
  }

  const correctionsDir = '.agent/corrections'
  mkdirSync(correctionsDir, { recursive: true })

  console.log(chalk.cyan(`\n◆ Injecting correction for ${taskId}\n`))
  console.log(chalk.dim('  The agent reads all corrections before its next iteration.\n'))

  const answers = await inquirer.prompt([
    {
      type: 'list', name: 'failureType',
      message: 'What type of issue is this?',
      choices: [
        { name: 'Logic error     — code does the wrong thing',                value: 'LOGIC_ERROR' },
        { name: 'Type error      — wrong type, interface, or signature',      value: 'TYPE_ERROR' },
        { name: 'Import error    — wrong module or missing dependency',       value: 'IMPORT_ERROR' },
        { name: 'Scope error     — agent touched a file it should not have', value: 'SCOPE_ERROR' },
        { name: 'Pattern error   — wrong pattern for this codebase',         value: 'PATTERN_ERROR' },
        { name: 'Security issue  — missing auth check or vulnerability',      value: 'SECURITY_ERROR' },
        { name: 'Test error      — tests not testing what they claim',        value: 'TEST_ERROR' },
        { name: 'Performance     — N+1 query, missing index, sync blocking',  value: 'PERF_ERROR' },
        { name: 'Other',                                                       value: 'OTHER' },
      ]
    },
    { type: 'input', name: 'file',   message: 'Affected file (blank if general)',        default: '' },
    { type: 'input', name: 'line',   message: 'Affected line number (blank if unknown)', default: '' },
    { type: 'list',  name: 'by',     message: 'Your role', choices: ['Developer', 'Architect', 'QA', 'PM', 'DevOps'] },
    {
      type: 'editor', name: 'description',
      message: 'Describe the issue and the correct behaviour (be specific — opens editor)'
    },
    {
      type: 'confirm', name: 'isBlocker',
      message: 'Is this a blocker? (agent cannot proceed without fixing this)',
      default: true
    }
  ])

  const now = new Date().toISOString()
  const filename = `${correctionsDir}/${taskId}-${Date.now()}.md`

  const content = `# Correction: ${taskId}
Type: ${answers.failureType}
File: ${answers.file || 'general'}
Line: ${answers.line || 'n/a'}
Is blocker: ${answers.isBlocker ? 'YES — do not proceed without fixing' : 'NO — fix before next commit'}
Corrected by: ${answers.by}
Date: ${now}

## Issue and required fix
${answers.description}

## Instructions for agent
Read this correction before your next iteration.
Fix the specific issue described above.
Do not change anything outside the scope of this correction.
${answers.failureType === 'SCOPE_ERROR'
    ? 'This is a SCOPE_ERROR. Revert any changes to files outside your plan scope. Do not re-touch those files.'
    : 'If fixing this requires a scope change, write an escalation file and wait for architect review.'}
${answers.isBlocker
    ? '\nThis is marked as a BLOCKER. Do not continue with other tasks until this is resolved.'
    : ''}
`

  writeFileSync(filename, content)

  console.log(`\n  ${chalk.green('✓')} Correction written: ${filename}`)
  console.log(chalk.dim(`\n  The agent will read this before iteration ${taskId}.\n`))
}
