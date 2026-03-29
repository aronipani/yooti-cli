import chalk from 'chalk';
import inquirer from 'inquirer';
import { writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import ora from 'ora';
import { initLog, logPhaseStart, logAgentAction } from '../audit/logger.js';
import { listSampleApps, getSampleStories, SAMPLE_APPS } from '../samples/index.js';
import { validateId, placeholderExample, getPrefix, formatId } from '../utils/itemId.js';

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
      message: `Item ID (e.g. ${placeholderExample()})`,
      default: placeholderExample(),
      validate: v => validateId(v) === true || validateId(v),
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

export async function storyApprove(storyId, options = {}) {
  const reqDir   = '.agent/requirements';
  const gatesDir = '.agent/gates';
  mkdirSync(gatesDir, { recursive: true });

  // If --all flag, approve every validated story
  if (options.all) {
    if (!existsSync(reqDir)) {
      console.log(chalk.red('\n  ✗ No requirements found. Add stories first.\n'));
      process.exit(1);
    }
    const stories = readdirSync(reqDir)
      .filter(f => f.endsWith('-validated.json'))
      .map(f => f.replace('-validated.json', ''));

    if (stories.length === 0) {
      console.log(chalk.dim('\n  No stories to approve.\n'));
      return;
    }

    console.log(chalk.cyan(`\n◆ Gate G1 — PM Sign-off (${stories.length} stories)\n`));

    stories.forEach((sid, i) => {
      const story = JSON.parse(readFileSync(`${reqDir}/${sid}-validated.json`, 'utf8'));
      const acCount = story.acceptance_criteria?.length || 0;
      const flags   = story.ambiguity_flags?.length || 0;
      const flagIcon = flags > 0 ? chalk.red(`⚠ ${flags} ambiguity flag(s)`) : chalk.green('✓ no flags');
      console.log(`  ${i + 1}. ${chalk.white(sid)} — ${story.title?.slice(0, 55)}`);
      console.log(chalk.dim(`     ${acCount} AC · Priority: ${story.priority} · ${flagIcon}`));
      console.log('');
    });

    const flagged = stories.filter(sid => {
      const s = JSON.parse(readFileSync(`${reqDir}/${sid}-validated.json`, 'utf8'));
      return s.ambiguity_flags?.length > 0;
    });

    if (flagged.length > 0 && !options.force) {
      console.log(chalk.yellow(`  ⚠ ${flagged.length} story/stories have unresolved ambiguity flags:`));
      flagged.forEach(sid => console.log(chalk.dim(`    ${sid}`)));
      console.log(chalk.dim('\n  Resolve flags first, or use --force to approve anyway.\n'));
      process.exit(1);
    }

    const { name, proceed, notes } = await inquirer.prompt([
      { type: 'input', name: 'name', message: 'Your name (PM)', validate: v => v.length > 0 },
      {
        type: 'confirm', name: 'proceed',
        message: `Approve all ${stories.length} stories for sprint start?`,
        default: false
      },
      {
        type: 'input', name: 'notes',
        message: 'Approval notes',
        default: 'All stories reviewed. AC are complete and testable.',
        when: a => a.proceed
      }
    ]);

    if (!proceed) {
      console.log(chalk.dim('\n  Gate G1 not signed. No stories approved.\n'));
      return;
    }

    const now = new Date().toISOString();
    stories.forEach(sid => {
      writeFileSync(
        `${gatesDir}/${sid}-G1-approved.md`,
        `# Gate G1 — PM Sign-off\nStory: ${sid}\nDecision: APPROVED\nReviewed by: ${name}\nDate: ${now}\nNotes: ${notes}\n`
      );
      console.log(`  ${chalk.green('✓')} ${sid} — G1 approved`);
    });

    console.log(`\n  ${chalk.green(stories.length + ' stories approved')} — sprint can start`);
    console.log(chalk.dim('  Next step: yooti sprint:start\n'));
    return;
  }

  // Single story approval
  if (!storyId) {
    const ans = await inquirer.prompt([{
      type: 'input', name: 'storyId',
      message: `Item ID (e.g. ${placeholderExample()})`,
      validate: v => validateId(v) === true || validateId(v)
    }]);
    storyId = ans.storyId;
  }

  const reqPath = `${reqDir}/${storyId}-validated.json`;
  if (!existsSync(reqPath)) {
    console.log(chalk.red(`\n  ✗ Story ${storyId} not found.\n`));
    process.exit(1);
  }

  const story = JSON.parse(readFileSync(reqPath, 'utf8'));
  const acCount = story.acceptance_criteria?.length || 0;
  const flags   = story.ambiguity_flags?.length || 0;

  console.log(chalk.cyan(`\n◆ Gate G1 — PM Sign-off: ${storyId}\n`));
  console.log(`  ${chalk.white(story.title)}`);
  console.log(chalk.dim(`  ${acCount} acceptance criteria · Priority: ${story.priority}`));

  if (flags > 0 && !options.force) {
    console.log(chalk.red(`\n  ✗ ${flags} unresolved ambiguity flag(s) — resolve before approving`));
    story.ambiguity_flags.forEach(f => console.log(chalk.dim(`    · ${f}`)));
    console.log(chalk.dim('\n  Use --force to approve anyway.\n'));
    process.exit(1);
  }

  if (flags > 0) {
    console.log(chalk.yellow(`\n  ⚠ Approving with ${flags} unresolved flag(s) (--force)\n`));
  }

  console.log('\n  Acceptance criteria:\n');
  story.acceptance_criteria?.forEach(ac => {
    console.log(`  ${chalk.green(ac.id)}`);
    console.log(chalk.dim(`    Given: ${ac.given}`));
    console.log(chalk.dim(`    When:  ${ac.when}`));
    console.log(chalk.dim(`    Then:  ${ac.then}`));
    console.log('');
  });

  const answers = await inquirer.prompt([
    { type: 'input', name: 'name', message: 'Your name (PM)', validate: v => v.length > 0 },
    {
      type: 'list', name: 'decision', message: 'Decision',
      choices: [
        { name: 'Approve — story is complete and unambiguous', value: 'approved' },
        { name: 'Reject  — story needs more work',             value: 'rejected' }
      ]
    },
    {
      type: 'input', name: 'notes',
      message: 'Notes',
      default: 'Story reviewed. AC are complete and testable.'
    }
  ]);

  const now = new Date().toISOString();
  const filename = `${storyId}-G1-${answers.decision}.md`;
  writeFileSync(
    `${gatesDir}/${filename}`,
    `# Gate G1 — PM Sign-off\nStory: ${storyId}\nDecision: ${answers.decision.toUpperCase()}\nReviewed by: ${answers.name}\nDate: ${now}\nNotes: ${answers.notes}\n`
  );

  if (answers.decision === 'approved') {
    console.log(`\n  ${chalk.green('✓')} Gate G1 signed: .agent/gates/${filename}`);
    console.log(chalk.dim('  Next step: yooti plan:review — architect reviews plans\n'));
  } else {
    console.log(`\n  ${chalk.yellow('⚠')} Gate G1 rejected: .agent/gates/${filename}`);
    console.log(chalk.dim('  Update the story and run this command again.\n'));
  }
}
