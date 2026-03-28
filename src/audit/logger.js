// src/audit/logger.js
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs'

const LOGS_DIR = '.agent/logs'
const AUDIT_DIR = '.agent/audit'

export function getLogPath(storyId) {
  return `${LOGS_DIR}/${storyId}.log.json`
}

export function initLog(storyId, title) {
  mkdirSync(LOGS_DIR, { recursive: true })
  const logPath = getLogPath(storyId)
  if (existsSync(logPath)) return // do not overwrite existing log
  const log = {
    story_id: storyId,
    title: title || storyId,
    started_at: new Date().toISOString(),
    events: []
  }
  writeFileSync(logPath, JSON.stringify(log, null, 2))
}

export function appendEvent(storyId, event) {
  mkdirSync(LOGS_DIR, { recursive: true })
  const logPath = getLogPath(storyId)
  let log = existsSync(logPath)
    ? JSON.parse(readFileSync(logPath, 'utf8'))
    : { story_id: storyId, title: storyId, started_at: new Date().toISOString(), events: [] }

  log.events.push({ at: new Date().toISOString(), ...event })
  writeFileSync(logPath, JSON.stringify(log, null, 2))
}

export function readLog(storyId) {
  const logPath = getLogPath(storyId)
  if (!existsSync(logPath)) return null
  return JSON.parse(readFileSync(logPath, 'utf8'))
}

export function listLogs() {
  mkdirSync(LOGS_DIR, { recursive: true })
  return readdirSync(LOGS_DIR)
    .filter(f => f.endsWith('.log.json'))
    .map(f => f.replace('.log.json', ''))
}

// Convenience wrappers used by other commands
export const logPhaseStart = (storyId, phase, detail) =>
  appendEvent(storyId, { phase, type: 'PHASE_START', detail })

export const logAgentAction = (storyId, phase, detail, output = null) =>
  appendEvent(storyId, { phase, type: 'AGENT_ACTION', detail, ...(output && { output }) })

export const logHumanInput = (storyId, phase, actor, role, detail) =>
  appendEvent(storyId, { phase, type: 'HUMAN_INPUT', actor, role, detail })

export const logGate = (storyId, phase, gate, decision, actor, role, notes = '') =>
  appendEvent(storyId, { phase, type: 'GATE', gate, decision, actor, role, notes })

export const logIterationStart = (storyId, task, iteration) =>
  appendEvent(storyId, { phase: 4, type: 'ITERATION_START', task, iteration })

export const logFilesChanged = (storyId, task, iteration, files) =>
  appendEvent(storyId, { phase: 4, type: 'FILES_CHANGED', task, iteration, files })

export const logQualityResult = (storyId, task, iteration, check, result, detail = '') =>
  appendEvent(storyId, { phase: 4, type: 'QUALITY_RESULT', task, iteration, check, result, detail })

export const logEscalation = (storyId, task, type, detail) =>
  appendEvent(storyId, { phase: 4, type: 'ESCALATION', task, escalation_type: type, detail })

export const logPrOpened = (storyId, prNumber, url) =>
  appendEvent(storyId, { phase: 6, type: 'PR_OPENED', pr_number: prNumber, url })

export const logStoryClosed = (storyId, summary) =>
  appendEvent(storyId, { phase: 7, type: 'STORY_CLOSED', ...summary })
