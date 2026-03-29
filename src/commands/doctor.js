import chalk from 'chalk';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { getPrereqs } from '../prereqs.js';

export async function doctor() {
  console.log(chalk.cyan('\n◆ yooti doctor — environment health check\n'));

  const platform = process.platform;
  const prereqs = getPrereqs({});  // universal set — all prereqs shown
  let totalPass = 0;
  let totalFail = 0;
  let totalWarn = 0;

  // ── Section 1: Prerequisites ──
  console.log(chalk.white('  Prerequisites\n'));

  for (const prereq of prereqs) {
    let version = null;
    let found = false;
    let versionOk = true;

    try {
      const out = execSync(prereq.command, { encoding: 'utf8', stdio: 'pipe' }).trim();
      found = true;
      version = out.split('\n')[0];
      if (prereq.versionCheck) {
        versionOk = prereq.versionCheck(out);
      }
    } catch {
      found = false;
    }

    if (found && versionOk) {
      console.log(`  ${chalk.green('✓')} ${prereq.name.padEnd(24)} ${chalk.dim(version || 'installed')}`);
      totalPass++;
    } else if (found && !versionOk) {
      console.log(`  ${chalk.red('✗')} ${prereq.name.padEnd(24)} ${chalk.dim(version || '')} — version too old`);
      printInstallHelp(prereq, platform);
      if (prereq.required) totalFail++; else totalWarn++;
    } else {
      if (prereq.required) {
        console.log(`  ${chalk.red('✗')} ${prereq.name.padEnd(24)} not found`);
        totalFail++;
      } else {
        console.log(`  ${chalk.yellow('⚠')} ${prereq.name.padEnd(24)} not found (optional)`);
        if (prereq.reason) console.log(chalk.dim(`      ${prereq.reason}`));
        totalWarn++;
      }
      printInstallHelp(prereq, platform);
    }
  }

  // ── Section 2: Project checks (only if inside a yooti project) ──
  const inProject = existsSync('yooti.config.json');

  if (inProject) {
    console.log('');
    console.log(chalk.white('  Project\n'));

    const projectChecks = [
      { name: 'yooti.config.json', test: () => {
        const raw = readFileSync('yooti.config.json', 'utf8');
        JSON.parse(raw);
        return 'valid JSON';
      }},
      { name: '.claude/CLAUDE.md', test: () => existsSync('.claude/CLAUDE.md') ? 'present' : null },
      { name: '.git', test: () => existsSync('.git') ? 'present' : null },
      { name: 'docker-compose.yml', test: () => existsSync('docker-compose.yml') ? 'present' : null },
      { name: 'pipeline/scripts/', test: () => existsSync('pipeline/scripts/preflight.js') ? 'present' : null },
      { name: '.agent/examples/', test: () => existsSync('.agent/examples') ? 'present' : null },
    ];

    for (const check of projectChecks) {
      try {
        const result = check.test();
        if (result) {
          console.log(`  ${chalk.green('✓')} ${check.name.padEnd(24)} ${chalk.dim(result)}`);
          totalPass++;
        } else {
          console.log(`  ${chalk.yellow('⚠')} ${check.name.padEnd(24)} missing`);
          totalWarn++;
        }
      } catch (err) {
        console.log(`  ${chalk.red('✗')} ${check.name.padEnd(24)} ${err.message}`);
        totalFail++;
      }
    }

    // Read config and check stack-specific tools
    try {
      const config = JSON.parse(readFileSync('yooti.config.json', 'utf8'));
      if (config.stack) {
        console.log('');
        console.log(chalk.white('  Stack-specific\n'));

        if (config.stack.includes('node')) {
          checkToolVersion('npm', 'npm --version', totalPass, totalFail);
        }
        if (config.stack.includes('python')) {
          checkToolVersion('pip', 'pip --version 2>/dev/null || pip3 --version', totalPass, totalFail);
          checkToolVersion('ruff', 'ruff --version', totalPass, totalFail, false);
          checkToolVersion('mypy', 'mypy --version', totalPass, totalFail, false);
        }
      }
    } catch {
      // config read failed — skip stack checks
    }
  }

  // ── Summary ──
  console.log('');
  console.log(chalk.dim('  ─────────────────────────────────────'));

  if (totalFail === 0 && totalWarn === 0) {
    console.log(chalk.green('\n  ✓ All checks passed. Environment is healthy.\n'));
  } else if (totalFail === 0) {
    console.log(chalk.yellow(`\n  ⚠ ${totalWarn} warning(s) — optional tools missing.`));
    console.log(chalk.green('  ✓ Required tools are all present.\n'));
  } else {
    console.log(chalk.red(`\n  ✗ ${totalFail} required tool(s) missing.`));
    if (totalWarn > 0) console.log(chalk.yellow(`  ⚠ ${totalWarn} optional warning(s).`));
    console.log(chalk.dim('  Install the missing tools above, then run: yooti doctor\n'));
    process.exit(1);
  }
}

function printInstallHelp(prereq, platform) {
  const cmd = prereq.install.all
    || (platform === 'darwin' ? prereq.install.darwin : null)
    || (platform === 'win32'  ? prereq.install.win32  : null)
    || prereq.install.linux;
  if (cmd) console.log(chalk.dim(`      Install: ${cmd}`));
}

function checkToolVersion(name, command, passCount, failCount, required = true) {
  try {
    const out = execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim().split('\n')[0];
    console.log(`  ${chalk.green('✓')} ${name.padEnd(24)} ${chalk.dim(out)}`);
  } catch {
    if (required) {
      console.log(`  ${chalk.red('✗')} ${name.padEnd(24)} not found`);
    } else {
      console.log(`  ${chalk.yellow('⚠')} ${name.padEnd(24)} not found (optional)`);
    }
  }
}
