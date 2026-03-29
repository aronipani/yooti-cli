// src/commands/sprint.js
import { execSync } from 'child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import chalk from 'chalk'
import inquirer from 'inquirer'

export function evidencePackageComplete(storyId) {
  const evidenceDir = `.agent/evidence/${storyId}`
  const required = [
    `${evidenceDir}/test-results.json`,
    `${evidenceDir}/coverage-summary.json`,
    `${evidenceDir}/regression-diff.json`,
    `${evidenceDir}/security-scan.json`,
    `${evidenceDir}/pr-body.md`,
  ]
  const missing = required.filter(f => !existsSync(f))
  return {
    complete: missing.length === 0,
    missing
  }
}

export async function sprintStart(options = {}) {
  console.log(chalk.cyan('\n◆ Sprint start\n'))

  // Step 1 — Check we are in a Yooti project
  if (!existsSync('yooti.config.json')) {
    console.log(chalk.red('  ✗ Not inside a Yooti project. Run yooti init first.\n'))
    process.exit(1)
  }

  // Step 2 — Check stories exist
  const reqDir = '.agent/requirements'
  if (!existsSync(reqDir) || readdirSync(reqDir).filter(f => f.endsWith('.json')).length === 0) {
    console.log(chalk.yellow('  ⚠ No stories found in .agent/requirements/'))
    console.log(chalk.dim('  Add stories first: yooti story:add\n'))
    process.exit(1)
  }

  const storyCount = readdirSync(reqDir).filter(f => f.endsWith('-validated.json')).length
  console.log(chalk.dim(`  ${storyCount} story/stories found\n`))

  // Step 2b — Check G1 gates
  const gatesDir = '.agent/gates'
  const stories = readdirSync(reqDir)
    .filter(f => f.endsWith('-validated.json'))
    .map(f => f.replace('-validated.json', ''))

  const unsigned = stories.filter(sid =>
    !existsSync(`${gatesDir}/${sid}-G1-approved.md`)
  )

  if (unsigned.length > 0) {
    console.log(chalk.yellow('  ⚠ Gate G1 not signed for all stories\n'))
    unsigned.forEach(sid =>
      console.log(chalk.dim(`    ${sid} — run: yooti story:approve ${sid}`))
    )
    console.log(chalk.dim('\n  Or approve all at once: yooti story:approve --all\n'))

    const { proceed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'proceed',
      message: 'Continue without G1 sign-off? (not recommended)',
      default: false
    }])

    if (!proceed) {
      console.log(chalk.dim('\n  Sprint start cancelled.\n'))
      process.exit(0)
    }
  }

  // Step 3 — Run preflight
  console.log('  Running pre-flight checks...')
  try {
    execSync('node pipeline/scripts/preflight.js', { stdio: 'inherit' })
  } catch {
    console.log(chalk.red('\n  ✗ Pre-flight checks failed. Fix issues above before starting sprint.\n'))
    process.exit(1)
  }

  // Step 4 — Capture baseline snapshot
  console.log('\n  Capturing regression baseline...')

  const snapshotDir = 'tests/regression/baseline'
  mkdirSync(snapshotDir, { recursive: true })

  const existing = existsSync(snapshotDir)
    ? readdirSync(snapshotDir).filter(f => f.endsWith('.json'))
    : []
  const sprintNum = existing.length + 1
  const snapshotPath = `${snapshotDir}/sprint-${sprintNum}-baseline.json`

  let passingTests = []
  let failingTests = []

  try {
    if (existsSync('agents') || existsSync('services/api_python')) {
      try {
        const result = execSync(
          'python -m pytest --tb=no -q 2>/dev/null || true',
          { encoding: 'utf8', stdio: 'pipe' }
        )
        const passMatch = result.match(/(\d+) passed/)
        if (passMatch) {
          passingTests.push(`python:${passMatch[1]}_tests_passing`)
        }
      } catch { /* no python tests yet */ }
    }

    if (existsSync('services/api/package.json')) {
      try {
        const result = execSync(
          'cd services/api && npm test -- --reporter=json 2>/dev/null || true',
          { encoding: 'utf8', stdio: 'pipe' }
        )
        const passMatch = result.match(/"passed":(\d+)/)
        if (passMatch) {
          passingTests.push(`node_api:${passMatch[1]}_tests_passing`)
        }
      } catch { /* no node tests yet */ }
    }
  } catch { /* test runners not available */ }

  const snapshot = {
    sprint:          sprintNum,
    captured_at:     new Date().toISOString(),
    story_count:     storyCount,
    passing_tests:   passingTests,
    failing_tests:   failingTests,
    note:            passingTests.length === 0
      ? 'Empty baseline — no tests exist yet. First story will establish the baseline.'
      : `${passingTests.length} test groups passing at sprint start.`
  }

  writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2))

  console.log(chalk.green(`  ✓ Baseline captured: ${snapshotPath}`))
  console.log(chalk.dim(`    Sprint ${sprintNum} · ${passingTests.length} test group(s) recorded`))

  if (existsSync('pipeline/scripts/snapshot.py')) {
    try {
      execSync(`python pipeline/scripts/snapshot.py --sprint ${sprintNum}`, {
        stdio: 'pipe'
      })
      console.log(chalk.dim('    Python snapshot script also ran'))
    } catch { /* script may not be runnable yet */ }
  }

  // Step 5 — Summary
  console.log(chalk.cyan('\n  Sprint started\n'))
  console.log(`  ${chalk.green('✓')} Pre-flight checks passed`)
  console.log(`  ${chalk.green('✓')} Regression baseline captured (Sprint ${sprintNum})`)
  console.log(`  ${chalk.green('✓')} ${storyCount} story/stories ready`)
  console.log('')
  console.log(chalk.dim('  Next steps:'))
  console.log(chalk.dim('    Architect reviews plans: yooti plan:review STORY-001'))
  console.log(chalk.dim('    View tasks:              yooti task:list'))
  console.log(chalk.dim('    Add QA plan:             yooti qa:plan STORY-001\n'))
}
