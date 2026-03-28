// src/commands/logEvent.js
import chalk from 'chalk'
import inquirer from 'inquirer'
import { appendEvent, initLog } from '../audit/logger.js'
import { existsSync } from 'fs'

export async function logEvent(storyId) {
  if (!storyId) {
    const ans = await inquirer.prompt([{
      type: 'input', name: 'storyId',
      message: 'Story ID',
      validate: v => /^STORY-\d+$/.test(v) || 'Format: STORY-NNN'
    }])
    storyId = ans.storyId
  }

  console.log(chalk.cyan(`\n◆ Logging event for ${storyId}\n`))

  const answers = await inquirer.prompt([
    {
      type: 'list', name: 'type',
      message: 'Event type',
      choices: [
        { name: 'Human input        — PM clarification, architect note', value: 'HUMAN_INPUT' },
        { name: 'Gate decision       — G1/G2/G3/G4/G5 approve or reject', value: 'GATE' },
        { name: 'Agent action        — log what the agent did',            value: 'AGENT_ACTION' },
        { name: 'Escalation          — log an escalation event',           value: 'ESCALATION' },
        { name: 'Files changed       — log files the agent modified',      value: 'FILES_CHANGED' },
        { name: 'Quality result      — log a test or scan result',         value: 'QUALITY_RESULT' },
        { name: 'Story closed        — mark the story as complete',        value: 'STORY_CLOSED' },
      ]
    },
    {
      type: 'list', name: 'phase',
      message: 'Which phase?',
      choices: [
        { name: '1 — Requirements ingestion', value: 1 },
        { name: '2 — Story decomposition',    value: 2 },
        { name: '3 — Environment setup',      value: 3 },
        { name: '4 — Code generation',        value: 4 },
        { name: '5 — Test orchestration',     value: 5 },
        { name: '6 — PR review',              value: 6 },
        { name: '7 — Deployment',             value: 7 },
      ]
    },
    {
      type: 'input', name: 'detail',
      message: 'What happened? (be specific)',
      validate: v => v.length > 5 || 'At least 6 characters'
    },
    {
      type: 'input', name: 'actor',
      message: 'Who did this? (name)',
      when: a => ['HUMAN_INPUT', 'GATE'].includes(a.type),
      default: ''
    },
    {
      type: 'list', name: 'role',
      message: 'Their role',
      when: a => ['HUMAN_INPUT', 'GATE'].includes(a.type),
      choices: ['PM', 'Architect', 'Developer', 'QA', 'DevOps', 'Release Manager']
    },
    {
      type: 'list', name: 'gate',
      message: 'Which gate?',
      when: a => a.type === 'GATE',
      choices: ['G1', 'G2', 'G3', 'G4', 'G5']
    },
    {
      type: 'list', name: 'decision',
      message: 'Decision',
      when: a => a.type === 'GATE',
      choices: ['APPROVED', 'REJECTED']
    },
  ])

  // Initialise log if it does not exist yet
  if (!existsSync(`.agent/logs/${storyId}.log.json`)) {
    initLog(storyId, storyId)
  }

  const event = {
    phase: answers.phase,
    type:  answers.type,
    detail: answers.detail,
  }

  if (answers.actor)    event.actor    = answers.actor
  if (answers.role)     event.role     = answers.role
  if (answers.gate)     event.gate     = answers.gate
  if (answers.decision) event.decision = answers.decision

  appendEvent(storyId, event)

  console.log(`\n  ${chalk.green('✓')} Event logged to .agent/logs/${storyId}.log.json`)
  console.log(chalk.dim(`  View full trail: yooti audit ${storyId}\n`))
}
