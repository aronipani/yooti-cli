// src/audit/renderer.js

const PHASE_NAMES = {
  1: 'Requirements ingestion',
  2: 'Story decomposition',
  3: 'Environment setup',
  4: 'Code generation',
  5: 'Test orchestration',
  6: 'PR review',
  7: 'Deployment',
}

const TYPE_ICONS = {
  PHASE_START:     '◆',
  AGENT_ACTION:    '→',
  HUMAN_INPUT:     '👤',
  GATE:            '◀',
  ITERATION_START: '↺',
  FILES_CHANGED:   '📝',
  QUALITY_RESULT:  '✓',
  ESCALATION:      '⚠',
  PR_OPENED:       '🔀',
  STORY_CLOSED:    '✓',
}

function formatTime(iso) {
  return iso ? iso.replace('T', ' ').slice(0, 16) : '—'
}

function duration(startIso, endIso) {
  if (!startIso || !endIso) return '—'
  const diff = new Date(endIso) - new Date(startIso)
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(mins / 60)
  return hrs > 0 ? `${hrs}h ${mins % 60}min` : `${mins}min`
}

// ── FULL STORY AUDIT ──
export function renderFullAudit(log, { terminal = true } = {}) {
  const lines = []
  const divider = '═'.repeat(62)
  const thin    = '─'.repeat(62)

  lines.push('')
  lines.push(`STORY-AUDIT: ${log.story_id} — ${log.title}`)
  lines.push(divider)

  let currentPhase = null

  for (const ev of log.events) {
    // Phase header
    if (ev.phase && ev.phase !== currentPhase) {
      currentPhase = ev.phase
      lines.push('')
      lines.push(`PHASE ${ev.phase} — ${PHASE_NAMES[ev.phase] || 'Unknown'}`)
      lines.push(thin)
    }

    const time = formatTime(ev.at)
    const icon = TYPE_ICONS[ev.type] || '·'

    if (ev.type === 'PHASE_START') {
      lines.push(`  ${time}  ${icon} ${ev.detail}`)

    } else if (ev.type === 'AGENT_ACTION') {
      lines.push(`  ${time}  ${icon} ${ev.detail}`)
      if (ev.output) {
        Object.entries(ev.output).forEach(([k, v]) => {
          lines.push(`                    ${k}: ${v}`)
        })
      }

    } else if (ev.type === 'HUMAN_INPUT') {
      lines.push(`  ${time}  ${icon} [${ev.role}] ${ev.actor}: ${ev.detail}`)

    } else if (ev.type === 'GATE') {
      const decision = ev.decision === 'APPROVED' ? '✓ APPROVED' : '✗ REJECTED'
      lines.push(`  ${time}  ${icon} GATE ${ev.gate} — ${decision}`)
      lines.push(`                    Reviewer: ${ev.actor} (${ev.role})`)
      if (ev.notes) lines.push(`                    Notes: ${ev.notes}`)
      if (ev.corrections_applied) lines.push(`                    Corrections applied: ${ev.corrections_applied}`)

    } else if (ev.type === 'ITERATION_START') {
      lines.push(`  ${time}  ${icon} Task ${ev.task} — Iteration ${ev.iteration} started`)

    } else if (ev.type === 'FILES_CHANGED') {
      lines.push(`  ${time}  ${icon} Task ${ev.task} — Files changed (iteration ${ev.iteration})`)
      if (ev.files) {
        ev.files.forEach(f => {
          const delta = f.lines_added ? `+${f.lines_added}${f.lines_removed ? `/-${f.lines_removed}` : ''}` : ''
          lines.push(`                    ${f.action.padEnd(7)} ${f.path} ${delta}`)
        })
      }

    } else if (ev.type === 'QUALITY_RESULT') {
      const icon2 = ev.result === 'PASS' ? '✓' : '✗'
      lines.push(`  ${time}  ${icon2} ${ev.check}: ${ev.result}${ev.detail ? ` — ${ev.detail}` : ''}`)

    } else if (ev.type === 'ESCALATION') {
      lines.push(`  ${time}  ${icon} ESCALATION [${ev.escalation_type}] Task ${ev.task}`)
      lines.push(`                    ${ev.detail}`)

    } else if (ev.type === 'PR_OPENED') {
      lines.push(`  ${time}  ${icon} PR #${ev.pr_number} opened`)
      if (ev.url) lines.push(`                    ${ev.url}`)

    } else if (ev.type === 'STORY_CLOSED') {
      lines.push('')
      lines.push(divider)
      lines.push('SUMMARY')
      lines.push(thin)
      if (ev.duration_minutes) lines.push(`  Total time:             ${Math.floor(ev.duration_minutes / 60)}h ${ev.duration_minutes % 60}min`)
      if (ev.total_iterations !== undefined) lines.push(`  Agent iterations:       ${ev.total_iterations}`)
      if (ev.human_interventions !== undefined) lines.push(`  Human interventions:    ${ev.human_interventions}`)
      if (ev.files_changed !== undefined) lines.push(`  Files changed:          ${ev.files_changed}`)
      if (ev.tests_added !== undefined) lines.push(`  Tests added:            ${ev.tests_added}`)
      lines.push(divider)
    }
  }

  lines.push('')
  return lines.join('\n')
}

// ── GATE LOG ONLY ──
export function renderGateLog(log) {
  const lines = []
  const gates = log.events.filter(e => e.type === 'GATE')
  const humans = log.events.filter(e => e.type === 'HUMAN_INPUT')

  lines.push('')
  lines.push(`GATE LOG: ${log.story_id} — ${log.title}`)
  lines.push('─'.repeat(62))
  lines.push('')

  if (gates.length === 0) {
    lines.push('  No gate decisions recorded yet.')
    lines.push('')
    return lines.join('\n')
  }

  gates.forEach(g => {
    const icon = g.decision === 'APPROVED' ? '✓' : '✗'
    lines.push(`  ${icon} Gate ${g.gate}`)
    lines.push(`    Decision:  ${g.decision}`)
    lines.push(`    Reviewer:  ${g.actor} (${g.role})`)
    lines.push(`    Time:      ${formatTime(g.at)}`)
    if (g.notes) lines.push(`    Notes:     ${g.notes}`)
    if (g.corrections_applied) lines.push(`    Corrections: ${g.corrections_applied} applied`)
    lines.push('')
  })

  if (humans.length > 0) {
    lines.push('Human inputs between gates:')
    lines.push('')
    humans.forEach(h => {
      lines.push(`  [${h.role}] ${h.actor} — ${h.detail}`)
      lines.push(`    Time: ${formatTime(h.at)}`)
      lines.push('')
    })
  }

  return lines.join('\n')
}

// ── DIFF LOG — files changed ──
export function renderDiffLog(log) {
  const lines = []
  const fileEvents = log.events.filter(e => e.type === 'FILES_CHANGED')

  lines.push('')
  lines.push(`DIFF LOG: ${log.story_id} — ${log.title}`)
  lines.push('─'.repeat(62))
  lines.push('')

  if (fileEvents.length === 0) {
    lines.push('  No file changes recorded yet.')
    lines.push('')
    return lines.join('\n')
  }

  // Aggregate all file changes
  const allFiles = {}
  fileEvents.forEach(ev => {
    if (!ev.files) return
    ev.files.forEach(f => {
      if (!allFiles[f.path]) allFiles[f.path] = { action: f.action, added: 0, removed: 0, iterations: [] }
      allFiles[f.path].added    += f.lines_added   || 0
      allFiles[f.path].removed  += f.lines_removed || 0
      allFiles[f.path].iterations.push(`${ev.task}-i${ev.iteration}`)
    })
  })

  // Group by action
  const created  = Object.entries(allFiles).filter(([, v]) => v.action === 'CREATE')
  const modified = Object.entries(allFiles).filter(([, v]) => v.action === 'MODIFY')
  const deleted  = Object.entries(allFiles).filter(([, v]) => v.action === 'DELETE')

  if (created.length > 0) {
    lines.push('Created:')
    created.forEach(([path, info]) => {
      lines.push(`  + ${path}  (+${info.added} lines)  [${info.iterations.join(', ')}]`)
    })
    lines.push('')
  }
  if (modified.length > 0) {
    lines.push('Modified:')
    modified.forEach(([path, info]) => {
      lines.push(`  ~ ${path}  (+${info.added}/-${info.removed} lines)  [${info.iterations.join(', ')}]`)
    })
    lines.push('')
  }
  if (deleted.length > 0) {
    lines.push('Deleted:')
    deleted.forEach(([path]) => {
      lines.push(`  - ${path}`)
    })
    lines.push('')
  }

  const totalAdded   = Object.values(allFiles).reduce((s, v) => s + v.added,   0)
  const totalRemoved = Object.values(allFiles).reduce((s, v) => s + v.removed, 0)
  const totalFiles   = Object.keys(allFiles).length
  lines.push(`Total: ${totalFiles} files  +${totalAdded}/-${totalRemoved} lines`)
  lines.push('')
  return lines.join('\n')
}

// ── SPRINT REPORT ──
export function renderSprintReport(logs) {
  const lines = []
  const divider = '═'.repeat(62)
  const thin    = '─'.repeat(62)

  lines.push('')
  lines.push('SPRINT REPORT')
  lines.push(divider)
  lines.push('')

  if (logs.length === 0) {
    lines.push('  No stories logged this sprint.')
    lines.push('')
    return lines.join('\n')
  }

  let totalIterations = 0
  let totalHumanInterventions = 0
  let totalFiles = 0
  let totalTests = 0
  let storiesClosed = 0

  logs.forEach(log => {
    const closed = log.events.find(e => e.type === 'STORY_CLOSED')
    const gates  = log.events.filter(e => e.type === 'GATE')
    const iters  = log.events.filter(e => e.type === 'ITERATION_START')
    const humans = log.events.filter(e => e.type === 'HUMAN_INPUT')
    const esc    = log.events.filter(e => e.type === 'ESCALATION')
    const status = closed ? 'CLOSED' : gates.some(g => g.gate === 'G3') ? 'MERGED' : gates.some(g => g.gate === 'G2') ? 'IN PROGRESS' : 'PLANNING'

    totalIterations         += closed?.total_iterations   || iters.length
    totalHumanInterventions += closed?.human_interventions || humans.length
    totalFiles              += closed?.files_changed       || 0
    totalTests              += closed?.tests_added         || 0
    if (closed) storiesClosed++

    lines.push(`${log.story_id} — ${log.title}`)
    lines.push(`  Status:        ${status}`)
    lines.push(`  Iterations:    ${closed?.total_iterations   || iters.length}`)
    lines.push(`  Interventions: ${closed?.human_interventions || humans.length}`)
    if (esc.length > 0) lines.push(`  Escalations:   ${esc.length}`)
    lines.push(`  Gates signed:  ${gates.filter(g => g.decision === 'APPROVED').map(g => g.gate).join(', ') || 'none'}`)
    if (closed) {
      lines.push(`  Duration:      ${Math.floor(closed.duration_minutes / 60)}h ${closed.duration_minutes % 60}min`)
      lines.push(`  Files changed: ${closed.files_changed}`)
      lines.push(`  Tests added:   ${closed.tests_added}`)
    }
    lines.push('')
  })

  lines.push(divider)
  lines.push('SPRINT TOTALS')
  lines.push(thin)
  lines.push(`  Stories:              ${logs.length} total, ${storiesClosed} closed`)
  lines.push(`  Agent iterations:     ${totalIterations}`)
  lines.push(`  Human interventions:  ${totalHumanInterventions}`)
  lines.push(`  Files changed:        ${totalFiles}`)
  lines.push(`  Tests added:          ${totalTests}`)
  lines.push(`  Avg iterations/story: ${logs.length > 0 ? (totalIterations / logs.length).toFixed(1) : 0}`)
  lines.push(divider)
  lines.push('')
  return lines.join('\n')
}

// ── MARKDOWN EXPORT ──
export function renderMarkdown(log) {
  const lines = []

  lines.push(`# Audit Trail: ${log.story_id}`)
  lines.push('')
  lines.push(`**Story:** ${log.title}`)
  lines.push(`**Started:** ${formatTime(log.started_at)}`)
  lines.push('')

  const closed = log.events.find(e => e.type === 'STORY_CLOSED')
  if (closed) {
    lines.push('## Summary')
    lines.push('')
    lines.push('| Metric | Value |')
    lines.push('|--------|-------|')
    if (closed.duration_minutes) lines.push(`| Total time | ${Math.floor(closed.duration_minutes / 60)}h ${closed.duration_minutes % 60}min |`)
    if (closed.total_iterations !== undefined) lines.push(`| Agent iterations | ${closed.total_iterations} |`)
    if (closed.human_interventions !== undefined) lines.push(`| Human interventions | ${closed.human_interventions} |`)
    if (closed.files_changed !== undefined) lines.push(`| Files changed | ${closed.files_changed} |`)
    if (closed.tests_added !== undefined) lines.push(`| Tests added | ${closed.tests_added} |`)
    lines.push('')
  }

  // Gate decisions table
  const gates = log.events.filter(e => e.type === 'GATE')
  if (gates.length > 0) {
    lines.push('## Gate decisions')
    lines.push('')
    lines.push('| Gate | Decision | Reviewer | Role | Time | Notes |')
    lines.push('|------|----------|----------|------|------|-------|')
    gates.forEach(g => {
      const decision = g.decision === 'APPROVED' ? 'Approved' : 'Rejected'
      lines.push(`| ${g.gate} | ${decision} | ${g.actor} | ${g.role} | ${formatTime(g.at)} | ${g.notes || ''} |`)
    })
    lines.push('')
  }

  // Human inputs
  const humans = log.events.filter(e => e.type === 'HUMAN_INPUT')
  if (humans.length > 0) {
    lines.push('## Human inputs')
    lines.push('')
    humans.forEach(h => {
      lines.push(`- **${formatTime(h.at)}** [${h.role}] ${h.actor}: ${h.detail}`)
    })
    lines.push('')
  }

  // File changes
  const fileEvents = log.events.filter(e => e.type === 'FILES_CHANGED')
  if (fileEvents.length > 0) {
    lines.push('## Files changed')
    lines.push('')
    lines.push('| Action | File | Lines added | Lines removed | Task / Iteration |')
    lines.push('|--------|------|-------------|---------------|-----------------|')
    fileEvents.forEach(ev => {
      if (!ev.files) return
      ev.files.forEach(f => {
        lines.push(`| ${f.action} | \`${f.path}\` | ${f.lines_added || 0} | ${f.lines_removed || 0} | ${ev.task}-i${ev.iteration} |`)
      })
    })
    lines.push('')
  }

  // Full event log
  lines.push('## Full event log')
  lines.push('')
  lines.push('| Time | Phase | Type | Detail |')
  lines.push('|------|-------|------|--------|')
  log.events.forEach(e => {
    const phase = e.phase ? `${e.phase} — ${PHASE_NAMES[e.phase] || ''}` : '—'
    const detail = e.detail || e.check || (e.gate ? `Gate ${e.gate}: ${e.decision}` : '') || ''
    lines.push(`| ${formatTime(e.at)} | ${phase} | ${e.type} | ${detail} |`)
  })
  lines.push('')

  return lines.join('\n')
}
