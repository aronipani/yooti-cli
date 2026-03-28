// src/commands/audit.js
import chalk from 'chalk'
import { writeFileSync, mkdirSync } from 'fs'
import { readLog, listLogs } from '../audit/logger.js'
import {
  renderFullAudit,
  renderGateLog,
  renderDiffLog,
  renderSprintReport,
  renderMarkdown
} from '../audit/renderer.js'

export async function auditStory(storyId, options = {}) {
  if (!storyId) {
    console.log(chalk.red('\n  ✗ Story ID required. Example: yooti audit STORY-001\n'))
    process.exit(1)
  }

  const log = readLog(storyId)
  if (!log) {
    console.log(chalk.red(`\n  ✗ No audit log found for ${storyId}`))
    console.log(chalk.dim(`  Expected: .agent/logs/${storyId}.log.json`))
    console.log(chalk.dim('  Logs are created when yooti story:add is run.\n'))
    process.exit(1)
  }

  // Choose view based on flags
  let output
  if (options.gates)    output = renderGateLog(log)
  else if (options.diff) output = renderDiffLog(log)
  else                   output = renderFullAudit(log)

  // Print to terminal
  console.log(output)

  // Save persistent file
  if (!options.noSave) {
    const auditDir = '.agent/audit'
    mkdirSync(auditDir, { recursive: true })

    if (options.gates) {
      const path = `${auditDir}/${storyId}-gates.md`
      writeFileSync(path, '```\n' + output + '\n```\n')
      console.log(chalk.dim(`  Saved: ${path}`))
    } else if (options.diff) {
      const path = `${auditDir}/${storyId}-diff.md`
      writeFileSync(path, '```\n' + output + '\n```\n')
      console.log(chalk.dim(`  Saved: ${path}`))
    } else {
      // Full audit saves as proper markdown
      const md = renderMarkdown(log)
      const path = `${auditDir}/${storyId}-audit.md`
      writeFileSync(path, md)
      console.log(chalk.dim(`  Saved: ${path}\n`))
    }
  }
}

export async function sprintReport(options = {}) {
  const storyIds = listLogs()

  if (storyIds.length === 0) {
    console.log(chalk.dim('\n  No stories logged this sprint.\n'))
    return
  }

  const logs = storyIds.map(id => readLog(id)).filter(Boolean)
  const output = renderSprintReport(logs)

  console.log(output)

  // Save persistent sprint report
  if (!options.noSave) {
    const auditDir = '.agent/audit'
    mkdirSync(auditDir, { recursive: true })
    const now = new Date().toISOString().split('T')[0]
    const path = `${auditDir}/sprint-report-${now}.md`
    writeFileSync(path, '# Sprint Report\n\n```\n' + output + '\n```\n')
    console.log(chalk.dim(`  Saved: ${path}\n`))
  }
}
