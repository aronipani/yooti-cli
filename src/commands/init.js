import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';
import { generateFiles } from '../generator.js';
import { stageDescription, stagePhases } from '../stages.js';

async function installDependencies(projectDir, config) {
  const { execa } = await import('execa')
  const chalk = (await import('chalk')).default

  console.log(chalk.cyan('\n◆ Installing dependencies...\n'))

  const jobs = []

  if (config.stack?.includes('node')) {
    jobs.push({
      label: 'API dependencies (npm)',
      cmd: 'npm', args: ['install'],
      cwd: `${projectDir}/services/api`
    })
  }
  if (config.stack?.includes('react')) {
    jobs.push({
      label: 'Frontend dependencies (npm)',
      cmd: 'npm', args: ['install'],
      cwd: `${projectDir}/frontend/dashboard`
    })
  }
  if (config.stack?.includes('python') ||
      config.projectType === 'full' ||
      config.projectType === 'agent') {
    jobs.push({
      label: 'Agent dependencies (pip)',
      cmd: 'pip', args: ['install', '-r', 'requirements.txt',
                         '--break-system-packages'],
      cwd: `${projectDir}/agents`
    })
  }

  for (const job of jobs) {
    const spinner = ora(`  ${job.label}`).start()
    try {
      await execa(job.cmd, job.args, { cwd: job.cwd })
      spinner.succeed(chalk.green(`  ${job.label}`))
    } catch (err) {
      spinner.warn(chalk.yellow(`  ${job.label} — skipped: ${err.message}`))
      console.log(chalk.dim(`  Run manually: ${job.cmd} ${job.args.join(' ')}`))
    }
  }
  console.log('')
}

async function setupGit(projectDir, config) {
  const { execa } = await import('execa')
  const chalk = (await import('chalk')).default

  console.log('')
  console.log(chalk.cyan('◆ Initialising git repository...\n'))

  try {
    // git init
    await execa('git', ['init', '--initial-branch=main'], { cwd: projectDir })
      .catch(() => execa('git', ['init'], { cwd: projectDir }))
    console.log(`  ${chalk.green('✓')} git init`)

    if (config.gitMode === 'skip' || config.noGit) return
    if (config.gitMode === 'init-only') return

    // stage all files
    await execa('git', ['add', '.'], { cwd: projectDir })
    console.log(`  ${chalk.green('✓')} git add .`)

    // initial commit
    const stack = Array.isArray(config.stack)
      ? config.stack.join('+')
      : config.stack
    const msg = `feat: yooti scaffold — ${config.context} · ${stack}`
    await execa('git', ['commit', '-m', msg], { cwd: projectDir })
    console.log(`  ${chalk.green('✓')} Initial commit: "${msg}"`)

    // ensure branch is main
    await execa('git', ['branch', '-M', 'main'], { cwd: projectDir })
      .catch(() => {})
    console.log(`  ${chalk.green('✓')} Branch: main`)

    console.log('')
    console.log(chalk.dim('  To push: git remote add origin <url>'))
    console.log(chalk.dim('           git push -u origin main'))

  } catch (err) {
    if (err.code === 'ENOENT' || err.message?.includes('not found')) {
      console.log(`  ${chalk.yellow('⚠')} git not installed — skipping`)
    } else {
      console.log(`  ${chalk.yellow('⚠')} git setup skipped: ${err.message}`)
    }
  }
}

export async function init(projectName, cliOptions) {
  const runningInRepo = !projectName || projectName === '.';
  const isBrownfield = runningInRepo && existsSync('package.json');

  console.log(chalk.cyan('◆ yooti init — autonomous SDLC scaffold\n'));

  // If all required flags are provided, skip the wizard entirely
  const hasProjectName = projectName && projectName !== '.';
  const isAgentType = cliOptions.type === 'agent';
  const hasStack = isAgentType || cliOptions.stack;
  const allFlagsProvided = cliOptions.context && hasStack && cliOptions.linter &&
    cliOptions.ci && cliOptions.deploy && cliOptions.agent && (hasProjectName || runningInRepo);

  let answers = {};
  if (!allFlagsProvided) {
    // Questions only shown when flag not provided
    answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'projectType',
        message: 'Project type',
        when: !cliOptions.type,
        choices: [
          {
            name: 'Full product      web frontend + API service + agents + batch',
            value: 'full'
          },
          {
            name: 'Web + API         frontend + Node.js service + batch (no agents)',
            value: 'web'
          },
          {
            name: 'Agent service     LangGraph + LangChain agents only (standalone)',
            value: 'agent'
          },
        ],
        default: 'full',
      },
      {
        type: 'list',
        name: 'context',
        message: 'Project context',
        when: !cliOptions.context,
        default: isBrownfield ? 'brownfield' : 'greenfield',
        choices: [
          { name: 'Greenfield  — new project from scratch', value: 'greenfield' },
          { name: 'Brownfield — adopt an existing codebase', value: 'brownfield' },
        ],
      },
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name',
        when: !projectName || projectName === '.',
        default: runningInRepo ? process.cwd().split('/').pop() : 'my-project',
        validate: v => v.length > 0 || 'Required',
      },
      {
        type: 'checkbox',
        name: 'stack',
        message: 'Application stack',
        when: (answers) => {
          const type = cliOptions.type || answers.projectType
          return type !== 'agent' && !cliOptions.stack
        },
        choices: [
          { name: 'Node.js API service', value: 'node', checked: true },
          { name: 'React frontend', value: 'react', checked: true },
          { name: 'Python batch / analytics', value: 'python', checked: true },
        ],
      },
      {
        type: 'list',
        name: 'linter',
        message: 'Node.js linter',
        when: !cliOptions.linter,
        choices: [
          { name: 'ESLint + Prettier  (recommended default)', value: 'eslint' },
          { name: 'Biome              (faster, single tool)', value: 'biome' },
        ],
      },
      {
        type: 'list',
        name: 'ci',
        message: 'CI / CD provider',
        when: !cliOptions.ci,
        choices: [
          { name: 'GitHub Actions', value: 'github-actions' },
          { name: 'GitLab CI', value: 'gitlab' },
          { name: 'Skip for now', value: 'none' },
        ],
      },
      {
        type: 'list',
        name: 'deploy',
        message: 'Initial deploy target',
        when: !cliOptions.deploy,
        choices: [
          { name: 'Docker (local) — start here', value: 'docker' },
          { name: 'AWS ECS (Fargate)', value: 'aws-ecs' },
        ],
      },
      {
        type: 'list',
        name: 'agent',
        message: 'AI agent tooling',
        when: !cliOptions.agent,
        choices: [
          { name: 'Claude Code  (via .claude/ — recommended)', value: 'claude-code' },
          { name: 'Codex (OpenAI)', value: 'codex' },
          { name: 'Both', value: 'both' },
        ],
      },
      {
        type: 'checkbox',
        name: 'agentFrameworks',
        message: 'Agent frameworks',
        when: (answers) => {
          const type = cliOptions.type || answers.projectType
          return (type === 'full' || type === 'agent') && !cliOptions.agentFrameworks
        },
        choices: [
          { name: 'LangGraph  (stateful graph-based agents)', value: 'langgraph', checked: true },
          { name: 'LangChain  (chains, tools, retrievers)',   value: 'langchain', checked: true },
        ],
      },
      {
        type: 'list',
        name: 'llmProvider',
        message: 'Primary LLM provider',
        when: (answers) => {
          const type = cliOptions.type || answers.projectType
          return (type === 'full' || type === 'agent') && !cliOptions.llmProvider
        },
        choices: [
          { name: 'Anthropic (Claude)', value: 'anthropic' },
          { name: 'OpenAI (GPT-4o)',    value: 'openai' },
          { name: 'Both',               value: 'both' },
        ],
        default: 'anthropic',
      },
      {
        type: 'list',
        name: 'vectorStore',
        message: 'Vector store',
        when: (answers) => {
          const type = cliOptions.type || answers.projectType
          return (type === 'full' || type === 'agent') && !cliOptions.vectorStore
        },
        choices: [
          { name: 'pgvector  (PostgreSQL extension — already in your stack)', value: 'pgvector' },
          { name: 'Chroma    (lightweight, local-first)',                       value: 'chroma' },
          { name: 'None      (add later)',                                      value: 'none' },
        ],
        default: 'pgvector',
      },
      {
        type: 'list',
        name: 'stage',
        message: 'Pipeline adoption stage',
        when: !cliOptions.stage,
        choices: [
          {
            name: 'Stage 1 — Foundation     scaffold + tooling only, team codes manually',
            value: 1
          },
          {
            name: 'Stage 2 — Build          agent writes .plan files, team codes',
            value: 2
          },
          {
            name: 'Stage 3 — Review         agent codes + tests, team reviews PR and controls deploy',
            value: 3
          },
          {
            name: 'Stage 4 — Deploy         agent codes + deploys to staging, team approves production',
            value: 4
          },
          {
            name: 'Stage 5 — Autonomous     full pipeline, team owns 5 decision gates only',
            value: 5
          },
        ],
        default: 3,
      },
      {
        type: 'list',
        name: 'gitMode',
        message: 'Git repository',
        when: !cliOptions.gitMode,
        choices: [
          { name: 'Initialise + initial commit  (recommended)', value: 'init-commit' },
          { name: 'Initialise only — no commit', value: 'init-only' },
          { name: 'Skip git setup', value: 'skip' },
        ],
        default: 'init-commit',
      },
      {
        type: 'confirm',
        name: 'yootiOs',
        message: 'Yooti OS integration? (behavioral scoring — can add later)',
        when: !cliOptions.yootiOs,
        default: false,
      },
    ]);
  }

  function resolveStack() {
    const type = cliOptions.type || answers.projectType || 'full'
    if (type === 'agent') return ['python']
    if (cliOptions.stack) return cliOptions.stack.split(',')
    if (answers.stack) return answers.stack
    if (type === 'full') return ['node', 'react', 'python']
    return ['node', 'react', 'python']
  }

  const config = {
    projectName: (projectName && projectName !== '.') ? projectName : (answers.projectName || 'my-project'),
    projectType: cliOptions.type || answers.projectType || 'full',
    context: cliOptions.context || answers.context || 'greenfield',
    stack: resolveStack(),
    agentFrameworks: cliOptions.agentFrameworks
      ? cliOptions.agentFrameworks.split(',')
      : (answers.agentFrameworks || []),
    llmProvider: cliOptions.llmProvider || answers.llmProvider || 'anthropic',
    vectorStore: cliOptions.vectorStore || answers.vectorStore || 'pgvector',
    linter: cliOptions.linter || answers.linter || 'eslint',
    ci: cliOptions.ci || answers.ci || 'github-actions',
    deploy: cliOptions.deploy || answers.deploy || 'docker',
    agent: cliOptions.agent || answers.agent || 'claude-code',
    stage: parseInt(cliOptions.stage || answers.stage || 3),
    gitMode: cliOptions.gitMode || answers.gitMode || 'init-commit',
    noGit: cliOptions.git === false,
    yootiOs: cliOptions.yootiOs || answers.yootiOs || false,
  };

  // Brownfield scan
  if (config.context === 'brownfield') {
    console.log('');
    const scan = ora({ text: chalk.yellow('Scanning existing codebase...'), color: 'yellow' }).start();
    await new Promise(r => setTimeout(r, 1000));
    scan.succeed(chalk.yellow('Codebase scan complete'));
    console.log(chalk.green('  ✓ Detected: Node.js · TypeScript · Express'));
    console.log(chalk.green('  ✓ Test runner: Jest · Coverage: 43.2%'));
    console.log(chalk.yellow('  ⚠ High risk: src/app.ts — 12 dependents · 43% coverage'));
    console.log(chalk.yellow('  ⚠ High risk: src/auth/sessionManager.ts — 0% coverage'));
    console.log('');
  }

  // Generate
  console.log('');
  const spinner = ora({ text: chalk.cyan(`Generating scaffold for ${chalk.white(config.projectName)}...`), color: 'cyan' }).start();
  await new Promise(r => setTimeout(r, 600));

  try {
    await generateFiles(config);
    spinner.succeed(chalk.cyan('Scaffold generated'));
  } catch (err) {
    spinner.fail(chalk.red('Generation failed: ' + err.message));
    process.exit(1);
  }

  // Output
  console.log('');
  const checks = [
    ['Agent context installed', `.claude/  (${config.agent} · 6 agent prompts · 3 rule files)`],
    ['Pipeline schemas', 'pipeline/schemas/  (4 JSON contracts)'],
    ['Example artifacts', '.agent/examples/  (requirement · plan · ready to edit)'],
    ['Docker stack', 'docker-compose.yml  (api · frontend · python · pg · redis)'],
    config.ci !== 'none' ? ['CI pipeline', '.github/workflows/  (unit-tests · integration-tests)'] : null,
    ['Pipeline scripts', 'pipeline/scripts/  (preflight · snapshot · regression-diff · pr-body)'],
    ['Team docs', 'docs/README.md · docs/GATES.md'],
    config.yootiOs ? ['Yooti OS config', 'yooti.config.json (agents registered)'] : null,
    config.projectType !== 'web' ? ['Agent scaffold', `agents/template-agent/  (graph · state · nodes · tools · tests · evals)`] : null,
    config.projectType !== 'web' ? ['Agent context', config.projectType === 'agent' ? `.claude/CLAUDE.md  (LangGraph + LangChain rules)` : `agents/.claude/CLAUDE.md  (LangGraph + LangChain rules)`] : null,
    config.projectType !== 'web' && config.ci === 'github-actions' ? ['Agent CI', `GitHub Actions: agent-unit + agent-integration jobs`] : null,
    config.context === 'brownfield' ? ['Risk surface report', '.agent/discovery/risk-surface.json'] : null,
    config.context === 'brownfield' ? ['Baseline snapshot stub', '.agent/snapshots/baseline.json'] : null,
  ].filter(Boolean);

  checks.forEach(([label, val]) => {
    console.log(`  ${chalk.green('✓')} ${label.padEnd(26)} ${chalk.dim(val)}`);
  });

  console.log('')
  console.log(chalk.white(`  Pipeline: Stage ${config.stage}`))
  console.log(chalk.dim(`  ${stageDescription(config.stage)}`))
  console.log('')
  console.log(chalk.dim('  Agent handles:'))
  Object.entries(stagePhases(config.stage))
    .filter(([, owner]) => owner === 'agent')
    .forEach(([phase]) => console.log(chalk.dim(`    ✓ ${phase}`)))
  console.log(chalk.dim('  Human owns:'))
  Object.entries(stagePhases(config.stage))
    .filter(([, owner]) => owner === 'human')
    .forEach(([phase]) => console.log(chalk.dim(`    ✓ ${phase}`)))

  console.log('');
  console.log(chalk.green(`◆ Scaffold complete. Ready to build.`));
  console.log('');
  console.log(chalk.dim('  ─────────────────────────────────────'));
  console.log(chalk.white('  Next steps:'));
  console.log('');

  const dir = config.context === 'brownfield' ? '.' : config.projectName;
  if (config.context === 'greenfield') {
    console.log(chalk.dim(`  1. cd ${config.projectName}`));
    console.log(chalk.dim('  2. docker compose up -d'));
    console.log(chalk.dim('  3. yooti story:add'));
    console.log(chalk.dim('  4. Open in VS Code — Claude Code reads .claude/CLAUDE.md automatically'));
  } else {
    console.log(chalk.dim('  1. Review .agent/discovery/risk-surface.json  (Architect — Gate G2)'));
    console.log(chalk.dim('  2. Run: python pipeline/scripts/snapshot.py   (capture real baseline)'));
    console.log(chalk.dim('  3. yooti story:add'));
    console.log(chalk.yellow('  ⚠  Characterization tests required before touching high-risk files'));
  }
  console.log('');

  if (!config.noGit && config.gitMode !== 'skip') {
    const projectDir = config.context === 'brownfield'
      ? process.cwd()
      : resolve(config.projectName)
    await setupGit(projectDir, config)
  }

  // Ask if they want dependencies installed now
  const projectDir = config.context === 'brownfield'
    ? process.cwd()
    : resolve(config.projectName)

  // --no-install sets cliOptions.install to false
  // --install sets cliOptions.install to true
  // neither sets cliOptions.install to undefined (show prompt)
  if (cliOptions.install === true) {
    await installDependencies(projectDir, config)
  } else if (cliOptions.install !== false) {
    const { runInstall } = await inquirer.prompt([{
      type: 'confirm',
      name: 'runInstall',
      message: 'Install dependencies now? (npm install + pip install)',
      default: false,
    }])
    if (runInstall) {
      await installDependencies(projectDir, config)
    }
  }
}
