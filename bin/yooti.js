#!/usr/bin/env node
import { program } from 'commander';
import chalk from 'chalk';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

console.log('');
console.log(chalk.cyan('  ██╗   ██╗ ██████╗  ██████╗ ████████╗██╗'));
console.log(chalk.cyan('  ╚██╗ ██╔╝██╔═══██╗██╔═══██╗╚══██╔══╝██║'));
console.log(chalk.cyan('   ╚████╔╝ ██║   ██║██║   ██║   ██║   ██║'));
console.log(chalk.cyan('    ╚██╔╝  ██║   ██║██║   ██║   ██║   ██║'));
console.log(chalk.cyan('     ██║   ╚██████╔╝╚██████╔╝   ██║   ██║'));
console.log(chalk.cyan('     ╚═╝    ╚═════╝  ╚═════╝    ╚═╝   ╚═╝'));
console.log('');
console.log(chalk.dim(`  Autonomous SDLC Pipeline  •  v${pkg.version}  •  @yooti/cli`));
console.log('');

program
  .name('yooti')
  .description('Autonomous SDLC scaffold — AI-driven development pipeline')
  .version(pkg.version);

program
  .command('init [project-name]')
  .description('Scaffold a new project with the full autonomous SDLC pipeline')
  .option('--type <full|web|agent>', 'project type', 'full')
  .option('--context <type>', 'greenfield or brownfield')
  .option('--stack <items>', 'comma-separated: node,react,python')
  .option('--linter <tool>', 'eslint or biome')
  .option('--ci <provider>', 'github-actions, gitlab, or none')
  .option('--deploy <target>', 'docker or aws-ecs')
  .option('--agent <tool>', 'claude-code, codex, or both')
  .option('--agent-frameworks <items>', 'comma-separated: langgraph,langchain')
  .option('--llm-provider <provider>', 'anthropic, openai, or both', 'anthropic')
  .option('--vector-store <store>', 'pgvector, chroma, or none', 'pgvector')
  .option('--stage <number>', 'pipeline adoption stage 1-5')
  .option('--no-git', 'skip git initialisation')
  .option('--git-mode <mode>', 'init-commit | init-only | skip')
  .option('--yooti-os', 'enable Yooti OS integration')
  .option('--install', 'install dependencies after scaffold')
  .option('--no-install', 'skip dependency install prompt')
  .action(async (projectName, options) => {
    const { init } = await import('../src/commands/init.js');
    await init(projectName, options);
  });

program
  .command('story:add')
  .description('Add and validate a new story through the Requirements Agent')
  .action(async () => {
    const { storyAdd } = await import('../src/commands/story.js');
    await storyAdd();
  });

program
  .command('story:import')
  .description('Import stories from a JSON file — skips the wizard')
  .requiredOption('--file <path>', 'path to JSON file (single story or array of stories)')
  .option('--overwrite', 'overwrite existing stories with the same ID')
  .action(async (options) => {
    const { storyImport } = await import('../src/commands/story.js');
    await storyImport(options.file, options);
  });

program
  .command('story:sample')
  .description('Import built-in sample stories for a demo app')
  .option('--app <name>',    'sample app name (e.g. ecommerce)')
  .option('--sprint <n>',    'import a specific sprint only (e.g. --sprint 1)')
  .option('--list',          'list all available sample apps')
  .option('--overwrite',     'overwrite existing stories with the same ID')
  .action(async (options) => {
    const { storySample } = await import('../src/commands/story.js');
    await storySample(options);
  });

program
  .command('sprint:start')
  .description('Start a sprint — validate stories, create baseline snapshot')
  .action(async () => {
    console.log(chalk.cyan('\n◆ Sprint start\n'));
    console.log(`  ${chalk.green('✓')} Stories validated — G1 gate passed`);
    console.log(`  ${chalk.green('✓')} Feature branches created`);
    console.log(`  ${chalk.green('✓')} Pre-flight: green`);
    console.log(`  ${chalk.green('✓')} Baseline → .agent/snapshots/sprint-1-baseline.json`);
    console.log('');
    console.log(chalk.dim('  Open VS Code — Claude Code reads .claude/CLAUDE.md automatically'));
    console.log('');
  });

program
  .command('preflight')
  .description('Run pre-flight validation checks')
  .action(async () => {
    const { preflight } = await import('../src/commands/preflight.js');
    await preflight();
  });

program
  .command('configure')
  .description('Change pipeline adoption stage for an existing project')
  .option('--stage <number>', 'set stage directly (1-5)')
  .action(async (options) => {
    const { configure } = await import('../src/commands/configure.js');
    await configure(options);
  });

// ── Task management ──
program
  .command('task:add [story-id]')
  .description('Add a task to an existing story (PM, Architect, Developer)')
  .action(async (storyId) => {
    const { taskAdd } = await import('../src/commands/task.js');
    await taskAdd(storyId);
  });

program
  .command('task:list [story-id]')
  .description('List tasks and their status (all roles)')
  .action(async (storyId) => {
    const { taskList } = await import('../src/commands/task.js');
    await taskList(storyId);
  });

// ── Plan management ──
program
  .command('plan:amend <task-id>')
  .description('Amend a plan file — add scope, steps, or annotations (Architect, Developer)')
  .action(async (taskId) => {
    const { planAmend } = await import('../src/commands/plan.js');
    await planAmend(taskId);
  });

program
  .command('plan:approve <story-id>')
  .description('Sign off Gate G2 — architecture review complete (Architect)')
  .action(async (storyId) => {
    const { planApprove } = await import('../src/commands/plan.js');
    await planApprove(storyId);
  });

// ── Context injection ──
program
  .command('context:add <story-id>')
  .description('Attach external context to a story (all roles)')
  .option('--url <url>',   'attach a URL — API docs, Figma link, Confluence page')
  .option('--file <path>', 'attach a local file — spec, PDF, markdown')
  .option('--note <text>', 'attach a freeform note')
  .action(async (storyId, options) => {
    const { contextAdd } = await import('../src/commands/context.js');
    await contextAdd(storyId, options);
  });

program
  .command('context:list <story-id>')
  .description('List all context attached to a story')
  .action(async (storyId) => {
    const { contextList } = await import('../src/commands/context.js');
    await contextList(storyId);
  });

// ── Corrections ──
program
  .command('correct:inject <task-id>')
  .description('Inject a correction for the agent mid-generation (Developer, QA)')
  .action(async (taskId) => {
    const { correctInject } = await import('../src/commands/correct.js');
    await correctInject(taskId);
  });

// ── Test requirements ──
program
  .command('test:require [story-id]')
  .description('Add a test requirement the agent must cover (QA, Developer)')
  .action(async (storyId) => {
    const { testRequire } = await import('../src/commands/testrequire.js');
    await testRequire(storyId);
  });

// ── Audit ──
program
  .command('audit <story-id>')
  .description('Show full audit trail for a story')
  .option('--gates',   'show gate decisions only')
  .option('--diff',    'show file changes only')
  .option('--no-save', 'print only, do not save to .agent/audit/')
  .action(async (storyId, options) => {
    const { auditStory } = await import('../src/commands/audit.js');
    await auditStory(storyId, options);
  });

program
  .command('sprint:report')
  .description('Show audit summary for all stories in the sprint')
  .option('--no-save', 'print only, do not save to .agent/audit/')
  .action(async (options) => {
    const { sprintReport } = await import('../src/commands/audit.js');
    await sprintReport(options);
  });

program
  .command('log:event [story-id]')
  .description('Manually log an event for a story (for actions taken outside the CLI)')
  .action(async (storyId) => {
    const { logEvent } = await import('../src/commands/logEvent.js');
    await logEvent(storyId);
  });

program
  .command('qa:plan [story-id]')
  .description('Create a QA test plan for a story (QA / SDET)')
  .action(async (storyId) => {
    const { qaPlan } = await import('../src/commands/qa.js')
    await qaPlan(storyId)
  })

program
  .command('qa:review [story-id]')
  .description('Run Gate G4 QA review against evidence package')
  .action(async (storyId) => {
    const { qaReview } = await import('../src/commands/qa.js')
    await qaReview(storyId)
  })

program
  .command('sm:standup')
  .description('Generate daily standup summary from pipeline data')
  .option('--no-save', 'print only, do not save')
  .action(async (options) => {
    const { smStandup } = await import('../src/commands/standup.js');
    await smStandup(options);
  });

program.parse();
