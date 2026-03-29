// src/commands/plan.js
import chalk from 'chalk'
import inquirer from 'inquirer'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { logGate } from '../audit/logger.js'
import { validateId, placeholderExample } from '../utils/itemId.js'

export async function planAmend(taskId) {
  const planPath = `.agent/plans/${taskId}.plan.md`
  if (!existsSync(planPath)) {
    console.log(chalk.red(`\n  ✗ Plan not found: ${planPath}`))
    console.log(chalk.dim('  Run: yooti task:list to see available tasks\n'))
    process.exit(1)
  }

  let content = readFileSync(planPath, 'utf8')
  console.log(chalk.cyan(`\n◆ Amending plan: ${taskId}\n`))

  // Show current status
  const currentStatus = (content.match(/## Status\n(\w+)/) || [])[1] || 'UNKNOWN'
  console.log(chalk.dim(`  Current status: ${currentStatus}\n`))

  const { amendType } = await inquirer.prompt([{
    type: 'list', name: 'amendType',
    message: 'What do you want to change?',
    choices: [
      { name: '+ Add file to CREATE scope',              value: 'add-create' },
      { name: '+ Add file to MODIFY scope',              value: 'add-modify' },
      { name: '+ Add directory to OUT OF SCOPE',         value: 'add-oos' },
      { name: '+ Add implementation step',               value: 'add-step' },
      { name: '+ Add role annotation / constraint',      value: 'annotate' },
      { name: '↔ Change task status',                    value: 'status' },
      { name: '↔ Change depends-on',                     value: 'depends' },
    ]
  }])

  const now = new Date().toISOString().split('T')[0]
  let changed = false

  if (amendType === 'add-create') {
    const { value } = await inquirer.prompt([{ type: 'input', name: 'value', message: 'File path to add to CREATE' }])
    content = content.replace(/^CREATE:\n/m, `CREATE:\n- ${value}\n`)
    changed = true
  }
  else if (amendType === 'add-modify') {
    const { value } = await inquirer.prompt([{ type: 'input', name: 'value', message: 'File path to add to MODIFY' }])
    content = content.replace(/^MODIFY:\n/m, `MODIFY:\n- ${value}\n`)
    changed = true
  }
  else if (amendType === 'add-oos') {
    const { value } = await inquirer.prompt([{ type: 'input', name: 'value', message: 'Directory to add to OUT OF SCOPE' }])
    content = content.replace(/^OUT OF SCOPE \(do not touch\):\n/m, `OUT OF SCOPE (do not touch):\n- ${value}\n`)
    changed = true
  }
  else if (amendType === 'add-step') {
    const { value } = await inquirer.prompt([{ type: 'input', name: 'value', message: 'Implementation step to add' }])
    const stepCount = (content.match(/^\d+\./gm) || []).length
    content = content.replace(/^## Dependencies/m, `${stepCount + 1}. ${value}\n\n## Dependencies`)
    changed = true
  }
  else if (amendType === 'annotate') {
    const { role, note } = await inquirer.prompt([
      { type: 'list', name: 'role', message: 'Your role', choices: ['ARCHITECT', 'DEVELOPER', 'QA', 'PM', 'DEVOPS'] },
      { type: 'input', name: 'note', message: 'Annotation / constraint for the agent', validate: v => v.length > 0 }
    ])
    const annotation = `[${role} G2 ${now}]: ${note}`
    const placeholder = `<!-- Add annotations with: yooti plan:amend ${taskId} -->`
    if (content.includes(placeholder)) {
      content = content.replace(placeholder, annotation)
    } else {
      content = content.trimEnd() + `\n${annotation}\n`
    }
    changed = true
  }
  else if (amendType === 'status') {
    const { status } = await inquirer.prompt([{
      type: 'list', name: 'status', message: 'New status',
      choices: ['PENDING', 'IN_PROGRESS', 'COMPLETE', 'BLOCKED', 'REJECTED']
    }])
    content = content.replace(/^(## Status\n)\w+/m, `$1${status}`)
    changed = true
  }
  else if (amendType === 'depends') {
    const { depends } = await inquirer.prompt([{ type: 'input', name: 'depends', message: 'Depends on (e.g. T001, or "none")' }])
    content = content.replace(/^Depends on: .+/m, `Depends on: ${depends}`)
    changed = true
  }

  if (changed) {
    writeFileSync(planPath, content)
    console.log(`\n  ${chalk.green('✓')} Plan updated: ${planPath}\n`)
  }
}

export async function planApprove(storyId) {
  const gatesDir = '.agent/gates'
  mkdirSync(gatesDir, { recursive: true })

  console.log(chalk.cyan(`\n◆ Gate G2 — Architecture Review: ${storyId}\n`))

  const answers = await inquirer.prompt([
    { type: 'input', name: 'name', message: 'Your name', validate: v => v.length > 0 },
    {
      type: 'list', name: 'decision',
      message: 'Decision',
      choices: [
        { name: 'Approve — plans are structurally sound, proceed to code generation', value: 'approved' },
        { name: 'Reject — plans need revision before code generation', value: 'rejected' }
      ]
    },
    { type: 'input', name: 'notes', message: 'Notes', default: 'Plans reviewed and approved.' }
  ])

  const now = new Date().toISOString()
  const filename = `${storyId}-G2-${answers.decision}.md`
  const content = `# Gate G2 — Architecture Review\nStory: ${storyId}\nDecision: ${answers.decision.toUpperCase()}\nReviewed by: ${answers.name}\nDate: ${now}\nNotes: ${answers.notes}\n`

  writeFileSync(`${gatesDir}/${filename}`, content)

  // Log gate decision to audit trail
  logGate(storyId, 2, 'G2', answers.decision.toUpperCase(), answers.name, 'Architect', answers.notes)

  if (answers.decision === 'approved') {
    console.log(`\n  ${chalk.green('✓')} Gate G2 signed: .agent/gates/${filename}`)
    console.log(chalk.dim('  The agent will proceed to code generation for this story.\n'))
  } else {
    console.log(`\n  ${chalk.yellow('⚠')} Gate G2 rejected: .agent/gates/${filename}`)
    console.log(chalk.dim('  Update the plan files then run this command again.\n'))
  }
}

export async function planReview(storyId) {
  if (!storyId) {
    const ans = await inquirer.prompt([{
      type: 'input', name: 'storyId',
      message: `Item ID (e.g. ${placeholderExample()})`,
      validate: v => validateId(v) === true || validateId(v)
    }]);
    storyId = ans.storyId;
  }

  const plansDir = '.agent/plans';
  if (!existsSync(plansDir)) {
    console.log(chalk.red('\n  ✗ No plans directory found.'));
    console.log(chalk.dim('  Plans are generated by the agent after sprint:start.\n'));
    process.exit(1);
  }

  const plans = readdirSync(plansDir)
    .filter(f => f.startsWith(storyId) && f.endsWith('.plan.md'))
    .sort();

  if (plans.length === 0) {
    console.log(chalk.red(`\n  ✗ No plans found for ${storyId}`));
    console.log(chalk.dim('  Run: ls .agent/plans/ to see available plans\n'));
    process.exit(1);
  }

  const reqPath = `.agent/requirements/${storyId}-validated.json`;
  const story   = existsSync(reqPath)
    ? JSON.parse(readFileSync(reqPath, 'utf8'))
    : null;

  const divider = '─'.repeat(62);

  console.log(chalk.cyan(`\n◆ Gate G2 Review — ${storyId}`));
  if (story?.title) console.log(chalk.dim(`  ${story.title}`));
  console.log(chalk.dim(`  ${plans.length} task(s) to review\n`));

  const decisions = [];

  for (let i = 0; i < plans.length; i++) {
    const planFile = plans[i];
    const planPath = `${plansDir}/${planFile}`;
    let   content  = readFileSync(planPath, 'utf8');
    const taskId   = planFile.replace('.plan.md', '');

    const title    = (content.match(/^# (.+)/m)              || [])[1] || taskId;
    const status   = (content.match(/## Status\n(\w+)/m)     || [])[1] || 'PENDING';
    const depsOn   = (content.match(/Depends on: (.+)/m)     || [])[1] || 'none';
    const blocksTasks = (content.match(/Blocks: (.+)/m)      || [])[1] || 'none';

    const createSection = (content.match(/(?:### CREATE|CREATE:)\n([\s\S]*?)(?=###|MODIFY:|OUT OF SCOPE|---|\n##)/m) || [])[1] || '';
    const modifySection = (content.match(/(?:### MODIFY|MODIFY:)\n([\s\S]*?)(?=###|OUT OF SCOPE|---|\n##)/m) || [])[1] || '';
    const oosSection    = (content.match(/(?:### OUT OF SCOPE|OUT OF SCOPE[^:]*:)\n([\s\S]*?)(?=###|---|\n##)/m) || [])[1] || '';
    const acSection     = (content.match(/## Acceptance [Cc]riteria [Cc]overed\n([\s\S]*?)(?=\n##)/m) || [])[1] || '';
    const stepsSection  = (content.match(/## Implementation [Ss]teps\n([\s\S]*?)(?=\n##)/m) || [])[1] || '';
    const annotSection  = (content.match(/## Role annotations\n([\s\S]*?)$/m) || [])[1] || '';

    const parseFiles = str => str.trim().split('\n')
      .filter(l => l.trim().startsWith('-'))
      .map(l => l.trim());

    const createFiles = parseFiles(createSection);
    const modifyFiles = parseFiles(modifySection);
    const oosItems    = parseFiles(oosSection);
    const steps       = stepsSection.trim().split('\n')
      .filter(l => /^\d+\./.test(l.trim()))
      .map(l => l.trim());

    console.log(divider);
    console.log(chalk.white(`TASK ${i + 1} of ${plans.length} — ${taskId}`));
    console.log(chalk.dim(`  Status: ${status}`));
    console.log(chalk.dim(`  Depends on: ${depsOn}`));
    console.log(chalk.dim(`  Blocks: ${blocksTasks}`));
    console.log('');

    if (createFiles.length > 0) {
      console.log(chalk.green('  CREATE:'));
      createFiles.forEach(f => console.log(chalk.dim(`    ${f}`)));
    }
    if (modifyFiles.length > 0) {
      console.log(chalk.yellow('  MODIFY:'));
      modifyFiles.forEach(f => console.log(chalk.dim(`    ${f}`)));
    }
    if (oosItems.length > 0) {
      console.log(chalk.red('  OUT OF SCOPE:'));
      oosItems.forEach(f => console.log(chalk.dim(`    ${f}`)));
    }

    const acLines = acSection.trim().split('\n').filter(l => l.startsWith('-') && l.length > 3);
    if (acLines.length > 0) {
      console.log('');
      console.log('  AC covered:');
      acLines.forEach(l => console.log(chalk.dim(`    ${l}`)));
    }

    if (steps.length > 0) {
      console.log('');
      console.log('  Implementation steps:');
      steps.forEach(s => console.log(chalk.dim(`    ${s}`)));
    }

    const existingAnnotations = annotSection.trim().split('\n')
      .filter(l => l.startsWith('[') && l.length > 5);
    if (existingAnnotations.length > 0) {
      console.log('');
      console.log('  Existing annotations:');
      existingAnnotations.forEach(a => console.log(chalk.cyan(`    ${a}`)));
    }

    console.log('');

    const totalFiles = createFiles.length + modifyFiles.length;
    if (totalFiles > 7) {
      console.log(chalk.yellow(`  ⚠ ${totalFiles} files in scope — consider splitting this task`));
      console.log('');
    }

    const { decision } = await inquirer.prompt([{
      type: 'list',
      name: 'decision',
      message: `Decision for ${taskId}:`,
      choices: [
        { name: '✓ Approve              — plan is correct, proceed',    value: 'approve' },
        { name: '✓ Approve + annotation — add a constraint for agent',  value: 'annotate' },
        { name: '✗ Request revision     — plan needs changes before G2', value: 'revise' },
      ]
    }]);

    if (decision === 'annotate') {
      const { annotation } = await inquirer.prompt([{
        type: 'input',
        name: 'annotation',
        message: 'Constraint or instruction for the agent:',
        validate: v => v.length > 5 || 'Be specific — the agent will read this'
      }]);

      const now = new Date().toISOString().split('T')[0];
      const tag = `[ARCHITECT G2 ${now}]: ${annotation}`;

      if (content.includes('<!-- Add annotations')) {
        content = content.replace(/<!--.*?-->/, tag);
      } else if (annotSection.trim().length === 0 || annotSection.includes('<!-- ')) {
        content = content.replace(/## Role annotations\n[\s\S]*?$/, `## Role annotations\n${tag}\n`);
      } else {
        content += `\n${tag}`;
      }

      writeFileSync(planPath, content);
      console.log(chalk.green(`  ✓ Annotation written to ${taskId}\n`));
      decisions.push({ taskId, decision: 'approved', annotation });

    } else if (decision === 'revise') {
      const { feedback } = await inquirer.prompt([{
        type: 'input',
        name: 'feedback',
        message: 'What specifically needs to change?',
        validate: v => v.length > 10 || 'Be specific'
      }]);

      const escDir = '.agent/escalations';
      mkdirSync(escDir, { recursive: true });
      const escPath = `${escDir}/${taskId}-G2-revision.md`;
      writeFileSync(escPath,
        `# G2 Revision Request — ${taskId}\nDate: ${new Date().toISOString()}\n\n## Feedback from Architect\n${feedback}\n\n## Instructions for agent\nRevise the plan based on the feedback above.\nDo not write any code until the revised plan is re-approved.\n`
      );

      console.log(chalk.yellow(`  ⚠ Revision requested — ${taskId}`));
      console.log(chalk.dim(`  Escalation written: ${escPath}\n`));
      decisions.push({ taskId, decision: 'revision', feedback });

    } else {
      console.log(chalk.green(`  ✓ ${taskId} approved\n`));
      decisions.push({ taskId, decision: 'approved' });
    }
  }

  console.log(divider);
  const approved  = decisions.filter(d => d.decision === 'approved').length;
  const revisions = decisions.filter(d => d.decision === 'revision').length;
  const annotated = decisions.filter(d => d.decision === 'approved' && d.annotation).length;

  console.log(`\n  ${approved}/${plans.length} tasks approved`);
  if (annotated  > 0) console.log(chalk.dim(`  ${annotated} with annotations`));
  if (revisions  > 0) {
    console.log(chalk.yellow(`  ${revisions} task(s) need revision`));
    console.log(chalk.dim('  Update the plans then run: yooti plan:review again'));
    console.log(chalk.dim('  Check: .agent/escalations/ for revision details\n'));
    return;
  }

  const { name, notes } = await inquirer.prompt([
    {
      type: 'input', name: 'name',
      message: 'Your name (Architect)',
      validate: v => v.length > 0
    },
    {
      type: 'input', name: 'notes',
      message: 'G2 approval notes',
      default: `All ${plans.length} task(s) reviewed. Plans are structurally sound.`
    }
  ]);

  const gatesDir = '.agent/gates';
  mkdirSync(gatesDir, { recursive: true });

  const gateContent = `# Gate G2 — Architecture Review\nStory: ${storyId}\nDecision: APPROVED\nReviewed by: ${name}\nDate: ${new Date().toISOString()}\nTasks reviewed: ${plans.length}\nNotes: ${notes}\n`;
  writeFileSync(`${gatesDir}/${storyId}-G2-approved.md`, gateContent);

  console.log(`\n  ${chalk.green('✓')} Gate G2 signed: .agent/gates/${storyId}-G2-approved.md`);
  console.log(chalk.dim('  The agent can now proceed to code generation.\n'));
}
