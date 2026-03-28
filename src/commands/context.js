// src/commands/context.js
import chalk from 'chalk'
import inquirer from 'inquirer'
import { writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync } from 'fs'
import { resolve } from 'path'

const CONTEXT_TYPES = {
  url:        'URL — API docs, Figma link, Confluence page',
  file:       'File — attach local spec, PDF, or markdown',
  note:       'Note — freeform text for the agent',
  jira:       'Jira/Linear — paste ticket content',
  constraint: 'Constraint — architectural rule agent must follow',
  figma:      'Figma — paste component spec or design notes',
  api:        'API contract — paste OpenAPI spec or endpoint definition',
}

export async function contextAdd(storyId, cliOptions = {}) {
  if (!existsSync('yooti.config.json')) {
    console.log(chalk.red('\n  ✗ Not inside a Yooti project.\n'))
    process.exit(1)
  }

  const contextDir = `.agent/context/${storyId}`
  mkdirSync(contextDir, { recursive: true })

  console.log(chalk.cyan(`\n◆ Adding context to ${storyId}\n`))

  // Detect type from flags
  let type = cliOptions.url ? 'url'
    : cliOptions.file ? 'file'
    : cliOptions.note ? 'note'
    : null

  if (!type) {
    const ans = await inquirer.prompt([{
      type: 'list', name: 'type',
      message: 'What type of context are you attaching?',
      choices: Object.entries(CONTEXT_TYPES).map(([k, v]) => ({ name: v, value: k }))
    }])
    type = ans.type
  }

  const prompts = []

  if (type === 'url' && !cliOptions.url)
    prompts.push({ type: 'input', name: 'url', message: 'URL', validate: v => v.startsWith('http') || 'Must be a valid URL' })

  if (type === 'file' && !cliOptions.file)
    prompts.push({ type: 'input', name: 'filePath', message: 'File path (relative or absolute)' })

  if (['note', 'jira', 'constraint', 'figma', 'api'].includes(type) && !cliOptions.note)
    prompts.push({ type: 'editor', name: 'content', message: 'Paste or write your context (opens editor)' })

  prompts.push(
    { type: 'list', name: 'addedBy', message: 'Your role', choices: ['PM', 'Architect', 'Developer', 'QA', 'DevOps', 'UX Designer'] },
    { type: 'input', name: 'summary', message: 'One-line summary (shown in context:list)', validate: v => v.length > 0 }
  )

  const answers = await inquirer.prompt(prompts)

  const now = new Date().toISOString()
  const timestamp = Date.now()
  const filename = `${contextDir}/${timestamp}-${type}.md`

  const url      = cliOptions.url   || answers.url
  const filePath = cliOptions.file  || answers.filePath
  const content  = cliOptions.note  || answers.content || ''

  const agentInstructions = {
    url:        `Fetch the content at the URL above before generating code.\nUse it as reference for API signatures, data formats, and integration patterns.\nIf the URL is a Figma link, extract component names, props, and layout requirements.`,
    file:       `Read the file at the path above before generating code.\nExtract relevant requirements, constraints, and data structures from it.`,
    note:       `Read this note before generating code. Apply it as additional guidance.`,
    jira:       `This is a ticket from the team's issue tracker.\nUse the acceptance criteria and description here to supplement the story requirements.`,
    constraint: `This is a hard architectural constraint.\nDo NOT violate it under any circumstances.\nIf implementing the acceptance criteria would require violating this constraint, write an escalation file and stop.`,
    figma:      `This is a design specification from the UX team.\nMatch the component names, props, layout, and behaviour described here exactly.\nIf anything is ambiguous, match the visual description as closely as possible.`,
    api:        `This is an API contract or OpenAPI specification.\nUse the exact endpoint paths, request/response schemas, and status codes defined here.\nDo not invent endpoints or change schemas.`,
  }

  let fileContent = `# Context for ${storyId} — ${answers.summary}\n`
  fileContent += `Type: ${type}\n`
  fileContent += `Added by: ${answers.addedBy}\n`
  fileContent += `Date: ${now}\n`
  fileContent += `Summary: ${answers.summary}\n\n`
  fileContent += `---\n\n`

  if (type === 'url')        fileContent += `## Source URL\n${url}\n\n`
  else if (type === 'file')  fileContent += `## Source file\n${resolve(filePath)}\n\n`
  else                       fileContent += `## Content\n${content}\n\n`

  fileContent += `## Instructions for agent\n${agentInstructions[type]}\n`

  writeFileSync(filename, fileContent)

  console.log(`\n  ${chalk.green('✓')} Context attached: ${filename}`)
  console.log(chalk.dim(`  View all context: yooti context:list ${storyId}\n`))
}

export async function contextList(storyId) {
  const contextDir = `.agent/context/${storyId}`
  if (!existsSync(contextDir)) {
    console.log(chalk.dim(`\n  No context attached to ${storyId} yet.`))
    console.log(chalk.dim(`  Add context: yooti context:add ${storyId}\n`))
    return
  }

  const files = readdirSync(contextDir).filter(f => f.endsWith('.md')).sort()
  if (files.length === 0) {
    console.log(chalk.dim(`\n  No context attached to ${storyId} yet.\n`))
    return
  }

  console.log(chalk.cyan(`\n◆ Context attached to ${storyId}\n`))
  files.forEach(f => {
    const c = readFileSync(`${contextDir}/${f}`, 'utf8')
    const type    = (c.match(/^Type: (.+)/m)     || [])[1] || 'note'
    const summary = (c.match(/^Summary: (.+)/m)  || [])[1] || f
    const by      = (c.match(/^Added by: (.+)/m) || [])[1] || '?'
    const date    = (c.match(/^Date: (.+)/m)     || [])[1]?.split('T')[0] || ''
    const typeColor = type === 'constraint' ? chalk.red : type === 'url' ? chalk.cyan : chalk.white
    console.log(`  ${typeColor(type.padEnd(12))} ${summary} ${chalk.dim(`(${by}, ${date})`)}`)
  })
  console.log('')
}
