// src/commands/standup.js
import chalk from 'chalk'
import { readLog, listLogs } from '../audit/logger.js'
import { existsSync, readdirSync, writeFileSync, mkdirSync } from 'fs'

export async function smStandup(options = {}) {
  console.log(chalk.cyan('\n◆ Daily Standup\n'))

  const storyIds = listLogs()
  if (storyIds.length === 0) {
    console.log(chalk.dim('  No stories logged yet. Add stories and start the sprint first.\n'))
    return
  }

  const logs = storyIds.map(id => readLog(id)).filter(Boolean)

  const completed   = []
  const inProgress  = []
  const blocked     = []
  const notStarted  = []

  for (const log of logs) {
    const events     = log.events || []
    const isClosed   = events.some(e => e.type === 'STORY_CLOSED')
    const hasMerged  = events.some(e => e.type === 'GATE' && e.gate === 'G3' && e.decision === 'APPROVED')
    const hasG2      = events.some(e => e.type === 'GATE' && e.gate === 'G2' && e.decision === 'APPROVED')
    const escalations= events.filter(e => e.type === 'ESCALATION')
    const lastPhase  = events.filter(e => e.type === 'PHASE_START').pop()
    const iters      = events.filter(e => e.type === 'ITERATION_START')

    // Check how long at current gate
    const g2Events   = events.filter(e => e.type === 'GATE' && e.gate === 'G2')
    const lastG2     = g2Events[g2Events.length - 1]
    const g2Hours    = lastG2
      ? Math.round((Date.now() - new Date(lastG2.at)) / 3600000)
      : null

    if (isClosed || hasMerged) {
      const actor = events.find(e => e.type === 'GATE' && e.gate === 'G3')?.actor || 'agent'
      completed.push({ id: log.story_id, title: log.title, actor })
    } else if (escalations.length > 0) {
      const lastEsc = escalations[escalations.length - 1]
      blocked.push({
        id: log.story_id, title: log.title,
        reason: lastEsc.escalation_type || 'escalation',
        detail: lastEsc.detail || '',
        action: escalationOwner(lastEsc.escalation_type)
      })
    } else if (g2Hours !== null && !hasMerged && g2Hours > 24) {
      blocked.push({
        id: log.story_id, title: log.title,
        reason: `Gate G2 open ${g2Hours}h`,
        detail: 'Architect review overdue',
        action: 'Architect'
      })
    } else if (hasG2 || iters.length > 0) {
      const phase = lastPhase?.detail || 'In progress'
      inProgress.push({ id: log.story_id, title: log.title, phase, iterations: iters.length })
    } else {
      notStarted.push({ id: log.story_id, title: log.title })
    }
  }

  // Check for escalation files outside logs
  const escDir = '.agent/escalations'
  if (existsSync(escDir)) {
    const escFiles = readdirSync(escDir).filter(f => f.endsWith('.md'))
    if (escFiles.length > 0 && blocked.length === 0) {
      escFiles.forEach(f => {
        const storyId = f.split('-')[0] + '-' + f.split('-')[1]
        if (!blocked.find(b => b.id === storyId)) {
          blocked.push({ id: storyId, title: storyId, reason: 'escalation file found', detail: f, action: 'Developer' })
        }
      })
    }
  }

  // Print report
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  console.log(`  ${chalk.white(dateStr)}\n`)

  if (completed.length > 0) {
    console.log(chalk.green('  COMPLETED'))
    completed.forEach(s => {
      const title = s.title?.length > 60 ? s.title.slice(0, 60) + '...' : s.title
      console.log(`  ${chalk.green('✓')} ${s.id} — ${title}`)
      if (s.actor) console.log(chalk.dim(`      reviewed by ${s.actor}`))
    })
    console.log('')
  }

  if (inProgress.length > 0) {
    console.log(chalk.cyan('  IN PROGRESS'))
    inProgress.forEach(s => {
      const title = s.title?.length > 60 ? s.title.slice(0, 60) + '...' : s.title
      console.log(`  ${chalk.cyan('◉')} ${s.id} — ${title}`)
      console.log(chalk.dim(`      ${s.phase}${s.iterations > 0 ? ' · ' + s.iterations + ' iterations' : ''}`))
    })
    console.log('')
  }

  if (blocked.length > 0) {
    console.log(chalk.red('  BLOCKED'))
    blocked.forEach(s => {
      const title = s.title?.length > 55 ? s.title.slice(0, 55) + '...' : s.title
      console.log(`  ${chalk.red('✗')} ${s.id} — ${title}`)
      console.log(chalk.yellow(`      ⚠ ${s.reason}`))
      if (s.detail) console.log(chalk.dim(`      ${s.detail}`))
      console.log(chalk.dim(`      Action required: ${s.action}`))
    })
    console.log('')
  }

  if (notStarted.length > 0) {
    console.log(chalk.dim('  NOT STARTED'))
    notStarted.forEach(s => {
      const title = s.title?.length > 60 ? s.title.slice(0, 60) + '...' : s.title
      console.log(chalk.dim(`  ○ ${s.id} — ${title}`))
    })
    console.log('')
  }

  // Sprint health summary
  const total = logs.length
  const done  = completed.length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0
  console.log('  SPRINT HEALTH')
  console.log(`  ${done}/${total} stories complete (${pct}%)`)
  if (blocked.length > 0) console.log(chalk.yellow(`  ${blocked.length} story/stories blocked — action required`))
  if (blocked.length === 0 && inProgress.length > 0) console.log(chalk.green('  No blockers'))
  console.log('')

  // Save to file
  if (!options.noSave) {
    mkdirSync('.agent/audit', { recursive: true })
    const dateKey = now.toISOString().split('T')[0]
    const path = `.agent/audit/standup-${dateKey}.md`
    const content = [
      `# Daily Standup — ${dateStr}`, '',
      `## Completed (${completed.length})`,
      ...completed.map(s => `- ${s.id} — ${s.title}`), '',
      `## In Progress (${inProgress.length})`,
      ...inProgress.map(s => `- ${s.id} — ${s.title} (${s.phase})`), '',
      `## Blocked (${blocked.length})`,
      ...blocked.map(s => `- ${s.id} — ${s.reason} → ${s.action}`), '',
      `## Not Started (${notStarted.length})`,
      ...notStarted.map(s => `- ${s.id} — ${s.title}`), '',
      `## Sprint health: ${done}/${total} complete (${pct}%)`,
    ].join('\n')
    writeFileSync(path, content)
    console.log(chalk.dim(`  Saved: ${path}\n`))
  }
}

function escalationOwner(type) {
  const owners = {
    SCOPE_ERROR:   'Developer and Architect',
    ENV_ERROR:     'DevOps',
    AMBIGUITY:     'PM',
    ARCH_ERROR:    'Architect',
    IMPORT_ERROR:  'Developer',
    SECURITY_ERROR:'Developer',
    TYPE_ERROR:    'Developer',
  }
  return owners[type] || 'Developer'
}
