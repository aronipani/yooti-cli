// src/utils/itemId.js
// Handles work item ID formatting and validation
// respects the team's naming convention from yooti.config.json

import { existsSync, readFileSync } from 'fs'

export function getConfig() {
  const paths = ['yooti.config.json', 'proxiom.config.json']
  for (const p of paths) {
    if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'))
  }
  return {}
}

export function getPrefix() {
  const cfg = getConfig()
  return cfg.item_prefix ?? 'STORY'
}

export function formatId(prefix, number) {
  const num = String(number).padStart(3, '0')
  return prefix ? `${prefix}-${num}` : num
}

export function makeId(number) {
  return formatId(getPrefix(), number)
}

export function validateId(value) {
  const prefix = getPrefix()
  if (prefix) {
    // Accept PREFIX-NNN or PREFIX-NNNN
    const pattern = new RegExp(`^${prefix}-\\d{3,}$`)
    if (pattern.test(value)) return true
    // Also accept any word chars + dash + numbers for flexibility
    if (/^[A-Z]+-\d+$/.test(value)) return true
    return `Format: ${prefix}-NNN (e.g. ${formatId(prefix, 1)})`
  } else {
    // No prefix — just numbers
    if (/^\d{3,}$/.test(value)) return true
    return `Format: NNN (e.g. 001)`
  }
}

export function idPattern() {
  const prefix = getPrefix()
  return prefix
    ? new RegExp(`^${prefix}-\\d+$`)
    : /^\d{3,}$/
}

export function extractIdFromBranch(branchName) {
  // Try configured prefix first
  const prefix = getPrefix()
  if (prefix) {
    const match = branchName.match(new RegExp(`(${prefix}-\\d+)`))
    if (match) return match[1]
  }
  // Fall back to any PREFIX-NNN pattern
  const match = branchName.match(/([A-Z]+-\d+)/)
  return match ? match[1] : null
}

export function placeholderExample() {
  const prefix = getPrefix()
  return formatId(prefix, 1)
}
