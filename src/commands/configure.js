import chalk from 'chalk'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import inquirer from 'inquirer'
import { stageDescription, stagePhases, stageGates } from '../stages.js'
import { typescriptConstitution } from '../templates/constitutions/typescript-constitution.js'
import { reactConstitution } from '../templates/constitutions/react-constitution.js'
import { pythonConstitution } from '../templates/constitutions/python-constitution.js'
import { langgraphConstitution } from '../templates/constitutions/langgraph-constitution.js'
import { postgresqlConstitution } from '../templates/constitutions/postgresql-constitution.js'
import { securityConstitution } from '../templates/constitutions/security-constitution.js'
import { testingConstitution } from '../templates/constitutions/testing-constitution.js'
import {
  featureStoryTemplate, bugfixStoryTemplate, refactorStoryTemplate,
  agentStoryTemplate, securityPatchTemplate, apiContractTemplate
} from '../templates/story-types/index.js'

export async function configure(cliOptions) {
  const configPath = resolve('yooti.config.json')

  if (!existsSync(configPath)) {
    console.log(chalk.red('\n  ✗ yooti.config.json not found.'))
    console.log(chalk.dim('    Run yooti init first.\n'))
    process.exit(1)
  }

  const config = JSON.parse(readFileSync(configPath, 'utf8'))
  const currentStage = config.pipeline?.stage || config.stage || 3

  console.log(chalk.cyan(`\n◆ yooti configure\n`))
  console.log(chalk.dim(`  Current stage: Stage ${currentStage} — ${config.pipeline?.description || ''}\n`))

  let newStage = cliOptions.stage ? parseInt(cliOptions.stage) : null

  if (!newStage) {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'stage',
        message: 'Pipeline adoption stage',
        choices: [
          { name: 'Stage 1 — Foundation     scaffold + tooling only, team codes manually', value: 1 },
          { name: 'Stage 2 — Build          agent writes .plan files, team codes', value: 2 },
          { name: 'Stage 3 — Review         agent codes + tests, team reviews PR and controls deploy', value: 3 },
          { name: 'Stage 4 — Deploy         agent codes + stages, team approves production', value: 4 },
          { name: 'Stage 5 — Autonomous     full pipeline, 5 human gates only', value: 5 },
        ],
        default: currentStage - 1,
      }
    ])
    newStage = answers.stage
  }

  if (newStage === currentStage) {
    console.log(chalk.dim(`\n  Already at Stage ${currentStage}. No changes made.\n`))
    return
  }

  // Update config
  const direction = newStage > currentStage ? 'upgrading' : 'downgrading'
  console.log(chalk.cyan(`\n  ${direction} from Stage ${currentStage} → Stage ${newStage}...\n`))

  config.stage = newStage
  config.pipeline = {
    ...config.pipeline,
    stage: newStage,
    description: stageDescription(newStage),
    phases: stagePhases(newStage),
    gates: stageGates(newStage)
  }

  writeFileSync(configPath, JSON.stringify(config, null, 2))
  console.log(`  ${chalk.green('✓')} yooti.config.json updated`)

  // Regenerate constitutions and story templates
  const stackList = (config.stack?.services || []).map(s => s.lang) || []
  const projectType = config.projectType || (stackList.some(s => s === 'langgraph') ? 'agent' : 'web')
  const tplConfig = { projectName: config.project, stack: stackList, projectType, stage: newStage }

  mkdirSync('.claude/constitutions', { recursive: true })
  mkdirSync('.agent/templates', { recursive: true })

  const writeFile = (p, c) => writeFileSync(p, c, 'utf8')

  writeFile('.claude/constitutions/security.md', securityConstitution(tplConfig))
  writeFile('.claude/constitutions/testing.md', testingConstitution(tplConfig))
  if (stackList.includes('node')) writeFile('.claude/constitutions/typescript.md', typescriptConstitution(tplConfig))
  if (stackList.includes('react')) writeFile('.claude/constitutions/react.md', reactConstitution(tplConfig))
  if (stackList.includes('python')) writeFile('.claude/constitutions/python.md', pythonConstitution(tplConfig))
  if (stackList.includes('node') || stackList.includes('python')) writeFile('.claude/constitutions/postgresql.md', postgresqlConstitution(tplConfig))
  if (projectType === 'full' || projectType === 'agent') writeFile('.claude/constitutions/langgraph.md', langgraphConstitution(tplConfig))

  writeFile('.agent/templates/feature-story.json', JSON.stringify(featureStoryTemplate(tplConfig), null, 2))
  writeFile('.agent/templates/bugfix-story.json', JSON.stringify(bugfixStoryTemplate(tplConfig), null, 2))
  writeFile('.agent/templates/refactor-story.json', JSON.stringify(refactorStoryTemplate(tplConfig), null, 2))
  writeFile('.agent/templates/security-patch.json', JSON.stringify(securityPatchTemplate(tplConfig), null, 2))
  writeFile('.agent/templates/api-contract.json', JSON.stringify(apiContractTemplate(tplConfig), null, 2))
  if (projectType === 'full' || projectType === 'agent') writeFile('.agent/templates/agent-story.json', JSON.stringify(agentStoryTemplate(tplConfig), null, 2))

  console.log(`  ${chalk.green('✓')} Constitutions and story templates regenerated`)

  // Show what changed
  console.log('')
  console.log(chalk.white('  What changed:'))
  console.log('')

  const phases = stagePhases(newStage)
  Object.entries(phases).forEach(([phase, owner]) => {
    const prev = stagePhases(currentStage)[phase]
    const changed = prev !== owner
    const arrow = changed ? chalk.yellow(' ← changed') : ''
    const icon = owner === 'agent' ? 'agent' : 'human'
    console.log(`    ${phase.padEnd(16)} ${icon}${arrow}`)
  })

  console.log('')
  console.log(chalk.dim('  Run: yooti upgrade --only-prompts'))
  console.log(chalk.dim('  To regenerate .claude/ agent context for the new stage.\n'))
}
