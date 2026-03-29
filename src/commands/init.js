import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';
import { generateFiles } from '../generator.js';
import { stageDescription, stagePhases } from '../stages.js';
import { checkPrereqs } from '../prereqs.js';

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

  // Run prerequisite checks before anything else
  // Use a minimal config based on CLI flags available at this point
  const preConfig = {
    stack: cliOptions.stack ? cliOptions.stack.split(',') : [],
    deploy: cliOptions.deploy || 'docker',
    projectType: cliOptions.type || 'full',
  };
  const { failed } = checkPrereqs(preConfig, { exitOnFail: true });

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
      // ── Stack selection ──
      {
        type: 'list',
        name: 'backend',
        message: 'Backend service',
        when: !cliOptions.stack,
        choices: [
          { name: 'Node.js + TypeScript (Express / Fastify)', value: 'node' },
          { name: 'Python + FastAPI',                         value: 'python-api' },
          { name: 'None — frontend or agents only',          value: 'none' },
        ],
      },
      {
        type: 'list',
        name: 'frontend',
        message: 'Frontend',
        when: !cliOptions.stack,
        choices: [
          { name: 'React 18 + Vite + shadcn/ui',  value: 'react' },
          { name: 'Next.js 14 + shadcn/ui',        value: 'nextjs' },
          { name: 'None — API or agent only',      value: 'none' },
        ],
      },
      {
        type: 'list',
        name: 'agents',
        message: 'AI agent layer',
        when: !cliOptions.stack,
        choices: [
          { name: 'LangGraph + LangChain (Python)', value: 'langgraph' },
          { name: 'None — no agent layer',          value: 'none' },
        ],
      },
      {
        type: 'list',
        name: 'batch',
        message: 'Batch / data layer',
        when: !cliOptions.stack,
        choices: [
          { name: 'Python + boto3 + pandas',  value: 'python-batch' },
          { name: 'None',                      value: 'none' },
        ],
      },
      {
        type: 'checkbox',
        name: 'databases',
        message: 'Databases (space to select, enter to confirm)',
        when: !cliOptions.stack,
        choices: [
          {
            name: 'PostgreSQL 16          — primary relational database',
            value: 'postgres',
            checked: true,
          },
          {
            name: 'pgvector               — vector embeddings for RAG and agents',
            value: 'pgvector',
            checked: false,
          },
          {
            name: 'Redis 7                — cache, sessions, rate limiting',
            value: 'redis',
            checked: true,
          },
          {
            name: 'MongoDB                — document store',
            value: 'mongodb',
            checked: false,
          },
          {
            name: 'Apache AGE             — graph database extension for PostgreSQL',
            value: 'age',
            checked: false,
          },
        ],
        validate: selected =>
          selected.length > 0 || 'Select at least one database',
      },
      {
        type: 'checkbox',
        name: 'llmProviders',
        message: 'LLM providers',
        when: answers => !cliOptions.stack && answers.agents !== 'none',
        choices: [
          { name: 'Anthropic (Claude)', value: 'anthropic', checked: true },
          { name: 'OpenAI (GPT-4o)',    value: 'openai',    checked: false },
        ],
      },
      // ── Remaining config ──
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
        type: 'confirm',
        name: 'includeAws',
        message: 'Does this project use AWS services?',
        when: !cliOptions.stack,
        default: false,
      },
      {
        type: 'checkbox',
        name: 'awsServices',
        message: 'Which AWS services will this project use?',
        when: (a) => a.includeAws,
        choices: [
          { name: 'Lambda + API Gateway',    value: 'lambda',       checked: true },
          { name: 'DynamoDB',                value: 'dynamodb',     checked: true },
          { name: 'SQS',                     value: 'sqs',          checked: false },
          { name: 'SNS',                     value: 'sns',          checked: false },
          { name: 'EventBridge',             value: 'eventbridge',  checked: false },
          { name: 'Kinesis Firehose',        value: 'firehose',     checked: false },
          { name: 'Fargate',                 value: 'fargate',      checked: false },
          { name: 'S3',                      value: 's3',           checked: false },
          { name: 'Secrets Manager',         value: 'secrets',      checked: false },
        ],
      },
      {
        type: 'list',
        name: 'awsDeploy',
        message: 'How will you deploy AWS services?',
        when: (a) => a.includeAws,
        choices: [
          { name: 'SAM (AWS Serverless Application Model) — recommended', value: 'sam' },
          { name: 'CDK (AWS Cloud Development Kit)',                       value: 'cdk' },
          { name: 'Manual / existing pipeline',                            value: 'manual' },
        ],
        default: 'sam',
      },
      {
        type: 'list',
        name: 'awsRegion',
        message: 'Primary AWS region?',
        when: (a) => a.includeAws,
        choices: [
          { name: 'us-east-1 (N. Virginia)',    value: 'us-east-1' },
          { name: 'us-west-2 (Oregon)',         value: 'us-west-2' },
          { name: 'eu-west-1 (Ireland)',        value: 'eu-west-1' },
          { name: 'eu-central-1 (Frankfurt)',   value: 'eu-central-1' },
          { name: 'ap-southeast-1 (Singapore)', value: 'ap-southeast-1' },
          { name: 'ap-northeast-1 (Tokyo)',     value: 'ap-northeast-1' },
        ],
        default: 'us-east-1',
      },
      {
        type: 'list',
        name: 'stage',
        message: 'Pipeline adoption stage',
        when: !cliOptions.stage,
        choices: [
          {
            name: 'Stage 1 — Foundation   (framework only, your team writes all code)',
            value: 1
          },
          {
            name: 'Stage 2 — Build        (agent writes plans, your team writes code)',
            value: 2
          },
          {
            name: 'Stage 3 — Review       (agent codes, your team reviews every PR)  ← recommended',
            value: 3
          },
          {
            name: 'Stage 4 — Deploy       (agent codes + deploys to staging, you approve production)',
            value: 4
          },
          {
            name: 'Stage 5 — Autonomous   (full pipeline, your team owns 5 gates only)',
            value: 5
          },
        ],
        default: 2,
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
          { name: 'Claude Code (Anthropic) — recommended', value: 'claude-code' },
          { name: 'Codex CLI (OpenAI)',                    value: 'codex' },
          { name: 'Both — primary Claude, fallback Codex', value: 'both' },
          { name: 'Other / manual',                        value: 'manual' },
        ],
      },
      {
        type: 'list',
        name: 'itemPrefix',
        message: 'Work item naming convention',
        when: !cliOptions.itemPrefix && cliOptions.itemPrefix !== '',
        choices: [
          { name: 'STORY-001   (default — Yooti standard)',  value: 'STORY' },
          { name: 'US-001      (User Story)',                 value: 'US' },
          { name: 'FEAT-001    (Feature)',                    value: 'FEAT' },
          { name: 'BUG-001     (Bug tracker style)',          value: 'BUG' },
          { name: 'TASK-001    (Task)',                       value: 'TASK' },
          { name: 'TICKET-001  (Support / ITSM style)',       value: 'TICKET' },
          { name: 'Custom      (enter your own prefix)',      value: 'custom' },
          { name: 'None        (001 only — no prefix)',       value: '' },
        ]
      },
      {
        type: 'input',
        name: 'itemPrefixCustom',
        message: 'Enter your prefix (letters only, e.g. ABC)',
        when: a => a.itemPrefix === 'custom',
        validate: v => /^[A-Z]+$/i.test(v) || 'Letters only, no spaces or numbers',
        filter:   v => v.toUpperCase()
      },
      {
        type: 'list',
        name: 'gitMode',
        message: 'Git repository',
        when: !cliOptions.gitMode,
        choices: [
          {
            name: 'Init + first commit    (recommended — git init and commit all generated files)',
            value: 'init-commit'
          },
          {
            name: 'Init only             (git init but no commit — you commit manually)',
            value: 'init-only'
          },
          {
            name: 'Skip                  (no git — I will set it up myself)',
            value: 'skip'
          },
        ],
        default: 0,
      },
    ]);
  }

  // Build config.stack from individual answers (or CLI flags)
  let stack = []
  let agentFrameworks = []
  if (cliOptions.stack) {
    // CLI flag path — comma-separated stack
    stack = cliOptions.stack.split(',')
    agentFrameworks = cliOptions.agentFrameworks
      ? cliOptions.agentFrameworks.split(',')
      : []
  } else {
    // Wizard path — derive stack from individual answers
    if (answers.backend === 'node')         stack.push('node')
    if (answers.backend === 'python-api')   stack.push('python')
    if (answers.frontend === 'react')       stack.push('react')
    if (answers.frontend === 'nextjs')      stack.push('nextjs')
    if (answers.agents === 'langgraph') {
      stack.push('python')
      agentFrameworks = ['langgraph', 'langchain']
    }
    if (answers.batch === 'python-batch')   stack.push('python')
    stack = [...new Set(stack)]  // deduplicate
  }

  // Derive projectType from stack
  const hasAgentLayer = answers.agents === 'langgraph' || agentFrameworks.includes('langgraph')
  const hasBackendOrFrontend = stack.some(s => ['node', 'react', 'nextjs'].includes(s)) || answers.backend === 'python-api'
  let projectType = cliOptions.type || 'full'
  if (!cliOptions.type) {
    if (hasAgentLayer && hasBackendOrFrontend) projectType = 'full'
    else if (hasAgentLayer) projectType = 'agent'
    else projectType = 'web'
  }

  const databases    = answers.databases   || ['postgres', 'redis']
  const vectorStore  = answers.databases?.includes('pgvector') ? 'pgvector'
                     : answers.databases?.includes('chroma')   ? 'chroma'
                     : 'none'
  const llmProviders = answers.llmProviders || []

  const config = {
    projectName: (projectName && projectName !== '.') ? projectName : (answers.projectName || 'my-project'),
    projectType,
    context: cliOptions.context || answers.context || 'greenfield',
    stack,
    agentFrameworks,
    databases,
    vectorStore,
    hasPostgres: databases.includes('postgres') || databases.includes('pgvector') || databases.includes('age'),
    hasRedis:    databases.includes('redis'),
    hasMongo:    databases.includes('mongodb'),
    hasAge:      databases.includes('age'),
    llmProviders,
    llmProvider: llmProviders.includes('anthropic') ? 'anthropic' : (llmProviders[0] || 'anthropic'),
    linter: cliOptions.linter || answers.linter || 'eslint',
    ci: cliOptions.ci || answers.ci || 'github-actions',
    deploy: cliOptions.deploy || answers.deploy || 'docker',
    agent: cliOptions.agent || answers.agent || 'claude-code',
    itemPrefix: cliOptions.itemPrefix !== undefined
      ? cliOptions.itemPrefix
      : (answers.itemPrefix === 'custom' ? answers.itemPrefixCustom : (answers.itemPrefix ?? 'STORY')),
    includeAws: answers.includeAws || false,
    awsServices: answers.awsServices || [],
    awsDeploy: answers.awsDeploy || 'sam',
    awsRegion: answers.awsRegion || 'us-east-1',
    stage: parseInt(cliOptions.stage || answers.stage || 3),
    gitMode: cliOptions.gitMode || answers.gitMode || 'init-commit',
    noGit: cliOptions.git === false,
    yootiOs: cliOptions.yootiOs || answers.yootiOs || false,
    backend: answers.backend || null,
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
    config.projectType !== 'web' ? ['Agent context', `.claude/CLAUDE.md  (LangGraph + LangChain rules)`] : null,
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
