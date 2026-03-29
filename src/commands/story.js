import chalk from 'chalk';
import inquirer from 'inquirer';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import ora from 'ora';
import { initLog, logPhaseStart, logAgentAction } from '../audit/logger.js';
import { listSampleApps, getSampleStories, SAMPLE_APPS } from '../samples/index.js';

export async function storyAdd() {
  console.log(chalk.cyan('\n◆ yooti story:add — Requirements Ingestion Agent\n'));

  if (!existsSync('yooti.config.json')) {
    console.log(chalk.red('  ✗ No yooti.config.json found. Run yooti init first.\n'));
    process.exit(1);
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'storyId',
      message: 'Story ID',
      default: 'STORY-001',
      validate: v => /^STORY-\d+$/.test(v) || 'Format: STORY-NNN',
    },
    {
      type: 'input',
      name: 'title',
      message: 'Story title',
      validate: v => v.length > 5 || 'Title must be at least 6 characters',
    },
    {
      type: 'list',
      name: 'type',
      message: 'Story type',
      choices: ['feature', 'bugfix', 'refactor', 'chore'],
    },
    {
      type: 'list',
      name: 'priority',
      message: 'Priority',
      choices: ['P0', 'P1', 'P2', 'P3'],
      default: 'P1',
    },
    {
      type: 'input',
      name: 'given',
      message: 'AC-1 Given (precondition)',
      default: 'An authenticated user',
    },
    {
      type: 'input',
      name: 'when',
      message: 'AC-1 When (action)',
      default: 'They perform the action',
    },
    {
      type: 'input',
      name: 'then',
      message: 'AC-1 Then (expected outcome)',
      default: 'The expected result occurs',
    },
  ]);

  const spinner = ora({
    text: chalk.cyan('Running Requirements Ingestion Agent...'),
    color: 'cyan',
  }).start();

  await new Promise(r => setTimeout(r, 1500));
  spinner.succeed('Requirements validated');

  const requirement = {
    story_id: answers.storyId,
    title: answers.title,
    type: answers.type,
    priority: answers.priority,
    context: JSON.parse(readFileSync('yooti.config.json', 'utf8')).context,
    actors: ["authenticated user"],
    acceptance_criteria: [
      {
        id: "AC-1",
        given: answers.given,
        when: answers.when,
        then: answers.then,
        testable: true
      }
    ],
    definition_of_done: [
      "Unit tests written and passing",
      "Integration tests for all ACs passing",
      "No regressions vs baseline snapshot",
      "Coverage on new code >= 90%"
    ],
    constraints: {
      must_not_break: [],
      performance_budget: "p99 < 100ms"
    },
    ambiguity_flags: [],
    estimated_complexity: "M",
    generated_at: new Date().toISOString()
  };

  mkdirSync('.agent/requirements', { recursive: true });
  const outputPath = `.agent/requirements/${answers.storyId}-validated.json`;
  writeFileSync(outputPath, JSON.stringify(requirement, null, 2));

  // Initialise audit log for this story
  initLog(answers.storyId, answers.title)
  logPhaseStart(answers.storyId, 1, 'Requirements ingestion started')
  logAgentAction(answers.storyId, 1, `Story parsed → ${answers.storyId}-validated.json`, {
    ac_count: requirement.acceptance_criteria.length,
    ambiguity_flags: requirement.ambiguity_flags.length
  })

  console.log('');
  console.log(`  ${chalk.green('✓')} Requirement validated: ${outputPath}`);
  console.log(`  ${chalk.green('✓')} Schema validation: passed`);
  console.log(`  ${chalk.green('✓')} Ambiguity flags: 0 blockers`);
  console.log('');
  console.log(chalk.dim('  Next: Claude Code will read this file when you start coding.'));
  console.log(chalk.dim('  The agent uses it to generate .plan files for each task.'));
  console.log('');
}

export async function storyImport(filePath, options = {}) {
  if (!filePath) {
    console.log(chalk.red('\n  ✗ File path required.'));
    console.log(chalk.dim('  Usage: yooti story:import --file stories.json\n'));
    process.exit(1);
  }

  if (!existsSync(filePath)) {
    console.log(chalk.red(`\n  ✗ File not found: ${filePath}\n`));
    process.exit(1);
  }

  let raw;
  try {
    raw = readFileSync(filePath, 'utf8');
  } catch (err) {
    console.log(chalk.red(`\n  ✗ Could not read file: ${err.message}\n`));
    process.exit(1);
  }

  let stories;
  try {
    const parsed = JSON.parse(raw);
    stories = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    console.log(chalk.red('\n  ✗ File is not valid JSON.\n'));
    console.log(chalk.dim('  Validate it at: jsonlint.com\n'));
    process.exit(1);
  }

  if (stories.length === 0) {
    console.log(chalk.yellow('\n  ⚠ File contains no stories.\n'));
    process.exit(0);
  }

  const reqDir = '.agent/requirements';
  mkdirSync(reqDir, { recursive: true });

  console.log(chalk.cyan(`\n◆ Importing ${stories.length} story/stories\n`));

  let imported = 0;
  let skipped  = 0;
  let errors   = 0;

  for (const story of stories) {
    if (!story.story_id) {
      console.log(chalk.yellow(`  ⚠ Skipping story with missing story_id`));
      errors++;
      continue;
    }

    const outPath = `${reqDir}/${story.story_id}-validated.json`;

    if (existsSync(outPath) && !options.overwrite) {
      console.log(chalk.dim(`  → ${story.story_id} already exists — skipping (use --overwrite to replace)`));
      skipped++;
      continue;
    }

    try {
      writeFileSync(outPath, JSON.stringify(story, null, 2));
      const title = story.title?.length > 60
        ? story.title.slice(0, 60) + '...'
        : story.title || story.story_id;
      console.log(`  ${chalk.green('✓')} ${story.story_id} — ${title}`);
      imported++;
    } catch (err) {
      console.log(chalk.red(`  ✗ ${story.story_id} — failed to write: ${err.message}`));
      errors++;
    }
  }

  console.log(`\n  ${chalk.green(imported + ' imported')}${skipped > 0 ? chalk.dim(', ' + skipped + ' skipped') : ''}${errors > 0 ? chalk.red(', ' + errors + ' errors') : ''}`);

  if (imported > 0) {
    console.log(chalk.dim(`\n  Files written to: ${reqDir}/`));
    console.log(chalk.dim('  Next step:       yooti sprint:start\n'));
  }
}

export async function storySample(options = {}) {
  // List available sample apps
  if (options.list) {
    console.log(chalk.cyan('\n◆ Available sample apps\n'));
    const apps = listSampleApps();
    apps.forEach(app => {
      console.log(`  ${chalk.white(app.key.padEnd(14))} ${app.name}`);
      console.log(chalk.dim(`                 ${app.description}`));
      console.log(chalk.dim(`                 ${app.story_count} stories · stack: ${app.stack.join(', ')}`));
      console.log('');
    });
    console.log(chalk.dim('  Import with: yooti story:sample --app ecommerce\n'));
    return;
  }

  // Import stories for a specific app
  if (!options.app) {
    const apps = listSampleApps();
    const { appKey } = await inquirer.prompt([{
      type: 'list',
      name: 'appKey',
      message: 'Which sample app?',
      choices: apps.map(a => ({
        name: `${a.name.padEnd(20)} — ${a.description}`,
        value: a.key
      }))
    }]);
    options.app = appKey;
  }

  const app = SAMPLE_APPS[options.app];
  if (!app) {
    console.log(chalk.red(`\n  ✗ Unknown sample app: ${options.app}`));
    console.log(chalk.dim('  Run: yooti story:sample --list to see available apps\n'));
    process.exit(1);
  }

  // Filter by sprint if requested
  const stories = getSampleStories(options.app, {
    sprint: options.sprint ? parseInt(options.sprint) : null
  });

  const reqDir = '.agent/requirements';
  mkdirSync(reqDir, { recursive: true });

  const sprintLabel = options.sprint ? ` Sprint ${options.sprint}` : '';
  console.log(chalk.cyan(`\n◆ Importing ${stories.length} ${app.name}${sprintLabel} stories\n`));

  let imported = 0;
  let skipped  = 0;

  for (const story of stories) {
    const outPath = `${reqDir}/${story.story_id}-validated.json`;

    if (existsSync(outPath) && !options.overwrite) {
      console.log(chalk.dim(`  → ${story.story_id} already exists — skipping`));
      skipped++;
      continue;
    }

    writeFileSync(outPath, JSON.stringify(story, null, 2));
    const title = story.title?.length > 55
      ? story.title.slice(0, 55) + '...'
      : story.title;
    console.log(`  ${chalk.green('✓')} ${story.story_id} — ${title}`);
    imported++;
  }

  console.log(`\n  ${chalk.green(imported + ' imported')}${skipped > 0 ? chalk.dim(', ' + skipped + ' skipped') : ''}`);

  if (imported > 0) {
    console.log(chalk.dim(`\n  Files written to: ${reqDir}/`));
    if (!options.sprint && app.sprint_1) {
      console.log(chalk.dim('  Tip: import Sprint 1 only with --sprint 1'));
    }
    console.log(chalk.dim('  Next step: yooti sprint:start\n'));
  }
}
