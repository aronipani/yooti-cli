// src/commands/audit.js
import chalk from 'chalk'
import { writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync } from 'fs'
import inquirer from 'inquirer'
import { readLog, listLogs } from '../audit/logger.js'
import { placeholderExample } from '../utils/itemId.js'
import {
  renderFullAudit,
  renderGateLog,
  renderDiffLog,
  renderSprintReport,
  renderMarkdown
} from '../audit/renderer.js'

export async function auditStory(storyId, options = {}) {
  if (!storyId) {
    console.log(chalk.red(`\n  ✗ Item ID required. Example: yooti audit ${placeholderExample()}\n`))
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
  const reqDir   = '.agent/requirements'
  const gatesDir = '.agent/gates'

  // Load all stories
  const stories = existsSync(reqDir)
    ? readdirSync(reqDir)
        .filter(f => f.endsWith('-validated.json'))
        .map(f => {
          const sid   = f.replace('-validated.json', '')
          const story = JSON.parse(readFileSync(`${reqDir}/${f}`, 'utf8'))
          const log   = readLog(sid)

          // Check gates
          const g1 = existsSync(`${gatesDir}/${sid}-G1-approved.md`)
          const g2 = existsSync(`${gatesDir}/${sid}-G2-approved.md`)
          const g3 = existsSync(`${gatesDir}/${sid}-G3-approved.md`)
          const g4 = existsSync(`${gatesDir}/${sid}-G4-approved.md`)
          const g5 = existsSync(`${gatesDir}/${sid}-G5-approved.md`)

          // Check evidence
          const evidenceDir = `.agent/evidence/${sid}`
          const hasEvidence = existsSync(`${evidenceDir}/test-results.json`)
          const coverage    = hasEvidence && existsSync(`${evidenceDir}/coverage-summary.json`)
            ? JSON.parse(readFileSync(`${evidenceDir}/coverage-summary.json`, 'utf8'))
            : null

          // Check definition of done
          const dod = story.definition_of_done || []
          const dodStatus = {
            total:   dod.length,
            met:     g4 ? dod.length : 0,  // simplified — G4 implies DoD met
            items:   dod
          }

          // Determine status
          const allGatesDone = g1 && g2 && g3 && g4 && g5
          const status = allGatesDone    ? 'COMPLETE'
            : g4                          ? 'AWAITING_G5'
            : g3                          ? 'AWAITING_G4'
            : g2                          ? 'IN_PROGRESS'
            : g1                          ? 'PLANNING'
            :                               'NOT_STARTED'

          return { sid, story, log, g1, g2, g3, g4, g5,
                   coverage, dodStatus, status }
        })
    : []

  if (stories.length === 0) {
    console.log(chalk.dim('\n  No stories found this sprint.\n'))
    return
  }

  // Print report
  const divider  = '═'.repeat(62)
  const thin     = '─'.repeat(62)
  const complete = stories.filter(s => s.status === 'COMPLETE').length
  const total    = stories.length
  const pct      = total > 0 ? Math.round((complete / total) * 100) : 0

  console.log('')
  console.log('SPRINT REPORT')
  console.log(divider)
  console.log(`  ${complete}/${total} stories complete (${pct}%)`)
  console.log('')

  // Status by story
  const statusIcon = {
    COMPLETE:     chalk.green('✓'),
    AWAITING_G5:  chalk.cyan('◉'),
    AWAITING_G4:  chalk.cyan('◉'),
    IN_PROGRESS:  chalk.yellow('○'),
    PLANNING:     chalk.dim('○'),
    NOT_STARTED:  chalk.dim('○'),
  }

  stories.forEach(s => {
    const icon  = statusIcon[s.status] || chalk.dim('?')
    const title = s.story.title?.slice(0, 55) || s.sid
    console.log(`  ${icon} ${chalk.white(s.sid)} — ${title}`)
    console.log(chalk.dim(`      Status: ${s.status}`))
    console.log(chalk.dim(`      Gates:  ${[s.g1?'G1':'  ', s.g2?'G2':'  ', s.g3?'G3':'  ', s.g4?'G4':'  ', s.g5?'G5':'  '].join(' ')}`))
    if (s.coverage) {
      const covIcon = s.coverage.overall >= 80 ? chalk.green('✓') : chalk.red('✗')
      console.log(chalk.dim(`      Coverage: ${covIcon} ${s.coverage.overall?.toFixed(1)}% overall · ${s.coverage.new_code?.toFixed(1)}% new code`))
    }

    // Definition of done
    if (s.dodStatus.total > 0) {
      const dodIcon = s.g4 ? chalk.green('✓') : chalk.yellow('○')
      console.log(chalk.dim(`      DoD: ${dodIcon} ${s.g4 ? s.dodStatus.total : 0}/${s.dodStatus.total} items met`))
    }
    console.log('')
  })

  // Sprint is only DONE when all stories are COMPLETE
  console.log(thin)
  if (complete === total && total > 0) {
    console.log(chalk.green('  ✓ SPRINT COMPLETE — all stories done, all gates signed'))
  } else {
    console.log(chalk.yellow(`  ○ SPRINT IN PROGRESS — ${total - complete} story/stories remaining`))
    const blockers = stories.filter(s =>
      s.status === 'IN_PROGRESS' || s.status === 'PLANNING'
    )
    if (blockers.length > 0) {
      console.log(chalk.dim('\n  Next actions needed:'))
      blockers.forEach(s => {
        const next = !s.g2 ? 'yooti plan:review ' + s.sid
          : !s.g4 ? 'yooti qa:review ' + s.sid
          : !s.g5 ? 'Approve production deploy for ' + s.sid
          : ''
        if (next) console.log(chalk.dim(`    ${next}`))
      })
    }
  }
  console.log(divider)
  console.log('')

  // Save persistent sprint report
  if (!options.noSave) {
    const auditDir = '.agent/audit'
    mkdirSync(auditDir, { recursive: true })
    const now = new Date().toISOString().split('T')[0]
    const path = `${auditDir}/sprint-report-${now}.md`

    let md = `# Sprint Report — ${now}\n\n`
    md += `${complete}/${total} stories complete (${pct}%)\n\n`
    stories.forEach(s => {
      const title = s.story.title?.slice(0, 55) || s.sid
      md += `## ${s.sid} — ${title}\n`
      md += `Status: ${s.status}\n`
      md += `Gates: ${[s.g1?'G1':'--', s.g2?'G2':'--', s.g3?'G3':'--', s.g4?'G4':'--', s.g5?'G5':'--'].join(' ')}\n`
      if (s.coverage) {
        md += `Coverage: ${s.coverage.overall?.toFixed(1)}% overall · ${s.coverage.new_code?.toFixed(1)}% new code\n`
      }
      if (s.dodStatus.total > 0) {
        md += `DoD: ${s.g4 ? s.dodStatus.total : 0}/${s.dodStatus.total} items met\n`
      }
      md += '\n'
    })

    writeFileSync(path, md)
    console.log(chalk.dim(`  Saved: ${path}\n`))
  }
}

export async function sprintRetro(options = {}) {
  console.log(chalk.cyan('\n◆ Sprint Retrospective\n'))

  const reqDir   = '.agent/requirements'
  const storyIds = existsSync(reqDir)
    ? readdirSync(reqDir)
        .filter(f => f.endsWith('-validated.json'))
        .map(f => f.replace('-validated.json', ''))
    : []

  if (storyIds.length === 0) {
    console.log(chalk.dim('  No stories found.\n'))
    return
  }

  // Collect metrics
  let totalIterations = 0, totalEscalations = 0, totalTests = 0
  let storiesWithViolations = [], storiesWithEscalations = []

  storyIds.forEach(sid => {
    const log = readLog(sid)
    if (!log) return
    const iters = log.events?.filter(e => e.type === 'ITERATION_START').length || 0
    const escs  = log.events?.filter(e => e.type === 'ESCALATION').length || 0
    totalIterations += iters
    totalEscalations += escs
    if (escs > 0) storiesWithEscalations.push({ sid, count: escs })

    const evidenceDir = `.agent/evidence/${sid}`
    const auditPath   = `${evidenceDir}/code-audit.md`
    if (existsSync(auditPath)) {
      const audit = readFileSync(auditPath, 'utf8')
      if (audit.includes('Violations found') && !audit.includes('No violations found')) {
        storiesWithViolations.push(sid)
      }
    }

    const trPath = `${evidenceDir}/test-results.json`
    if (existsSync(trPath)) {
      const tr = JSON.parse(readFileSync(trPath, 'utf8'))
      totalTests += (tr.unit?.passed || 0) + (tr.integration?.passed || 0)
    }
  })

  const divider = '─'.repeat(62)
  console.log('  SPRINT METRICS')
  console.log(divider)
  console.log(`  Stories completed:      ${storyIds.length}`)
  console.log(`  Total agent iterations: ${totalIterations}`)
  console.log(`  Total escalations:      ${totalEscalations}`)
  console.log(`  Total tests added:      ${totalTests}`)
  console.log(`  Avg iterations/story:   ${storyIds.length > 0 ? (totalIterations/storyIds.length).toFixed(1) : 0}`)
  console.log('')

  // What went well
  console.log('  WHAT WENT WELL')
  console.log(divider)
  if (storiesWithEscalations.length === 0) {
    console.log('  ✓ No escalations — agent worked within scope throughout')
  }
  if (storiesWithViolations.length === 0) {
    console.log('  ✓ No constitution violations found in code audit')
  }
  if (totalTests > 0) {
    console.log(`  ✓ ${totalTests} tests added this sprint`)
  }
  console.log('')

  // What needs improvement
  console.log('  WHAT NEEDS IMPROVEMENT')
  console.log(divider)
  if (storiesWithEscalations.length > 0) {
    console.log('  ⚠ Stories with escalations:')
    storiesWithEscalations.forEach(s =>
      console.log(chalk.dim(`    ${s.sid} — ${s.count} escalation(s)`))
    )
  }
  if (storiesWithViolations.length > 0) {
    console.log('  ⚠ Stories with code audit violations:')
    storiesWithViolations.forEach(s =>
      console.log(chalk.dim(`    ${s}`))
    )
  }
  if (storyIds.length > 0 && totalIterations / storyIds.length > 3) {
    console.log('  ⚠ High iteration count — stories may need smaller tasks')
  }
  if (storiesWithEscalations.length === 0 && storiesWithViolations.length === 0 &&
      (storyIds.length === 0 || totalIterations / storyIds.length <= 3)) {
    console.log('  (none detected)')
  }
  console.log('')

  // Action items
  console.log('  ACTION ITEMS FOR NEXT SPRINT')
  console.log(divider)
  const answers = await inquirer.prompt([
    { type: 'input', name: 'went_well',   message: 'What went well this sprint?',        default: '' },
    { type: 'input', name: 'improve',     message: 'What could be improved?',             default: '' },
    { type: 'input', name: 'actions',     message: 'Action items for next sprint (comma-separated)', default: '' },
  ])

  // Save retro
  const retroDir = '.agent/audit'
  mkdirSync(retroDir, { recursive: true })
  const now     = new Date().toISOString().split('T')[0]

  let wentWellLines = []
  if (storiesWithViolations.length === 0) wentWellLines.push('- No constitution violations')
  if (storiesWithEscalations.length === 0) wentWellLines.push('- No escalations')
  if (totalTests > 0) wentWellLines.push(`- ${totalTests} tests added`)
  if (answers.went_well) wentWellLines.push(`- ${answers.went_well}`)

  let improveLines = []
  if (storiesWithEscalations.length > 0) improveLines.push(`- ${storiesWithEscalations.length} stories had escalations`)
  if (storiesWithViolations.length > 0) improveLines.push(`- ${storiesWithViolations.length} stories had code audit violations`)
  if (storyIds.length > 0 && totalIterations / storyIds.length > 3) improveLines.push('- High iteration count — consider smaller tasks')
  if (answers.improve) improveLines.push(`- ${answers.improve}`)

  const retro = `# Sprint Retrospective — ${now}

## Metrics
Stories: ${storyIds.length}
Iterations: ${totalIterations}
Escalations: ${totalEscalations}
Tests added: ${totalTests}

## What went well
${wentWellLines.length > 0 ? wentWellLines.join('\n') : '- (none recorded)'}

## What needs improvement
${improveLines.length > 0 ? improveLines.join('\n') : '- (none recorded)'}

## Action items for next sprint
${answers.actions ? answers.actions.split(',').map(a => `- ${a.trim()}`).join('\n') : '- None recorded'}
`
  writeFileSync(`${retroDir}/retro-${now}.md`, retro)
  console.log(chalk.green(`\n  ✓ Retro saved: ${retroDir}/retro-${now}.md\n`))
}
