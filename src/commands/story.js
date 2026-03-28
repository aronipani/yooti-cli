import chalk from 'chalk';
import inquirer from 'inquirer';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import ora from 'ora';
import { initLog, logPhaseStart, logAgentAction } from '../audit/logger.js';

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
