import { execSync } from 'child_process';
import chalk from 'chalk';

/**
 * Returns the list of prerequisites for a given config.
 * If no config is passed, returns a universal set (used by `yooti doctor`).
 */
export function getPrereqs(config = {}) {
  return [
    {
      name:    'Git',
      command: 'git --version',
      install: {
        darwin:  'brew install git',
        win32:   'winget install Git.Git',
        linux:   'sudo apt-get install git',
      },
      required: true,
    },
    {
      name:    'GitHub CLI (gh)',
      command: 'gh --version',
      install: {
        darwin:  'brew install gh',
        win32:   'winget install GitHub.cli',
        linux:   'sudo apt-get install gh',
      },
      required: false,
      reason:   'Required for automatic PR creation in Phase 6',
    },
    {
      name:    'Node.js >= 20',
      command: 'node --version',
      versionCheck: v => parseInt(v.replace('v', '').split('.')[0]) >= 20,
      install: {
        darwin:  'brew install node@20',
        win32:   'winget install OpenJS.NodeJS.LTS',
        linux:   'nvm install 20',
      },
      required: true,
    },
    {
      name:    'Python >= 3.12',
      command: process.platform === 'win32'
        ? 'python --version'
        : 'python3 --version 2>/dev/null || python --version',
      versionCheck: v => {
        const m = v.match(/(\d+)\.(\d+)/);
        return m && (parseInt(m[1]) > 3 || (parseInt(m[1]) === 3 && parseInt(m[2]) >= 12));
      },
      install: {
        darwin:  'brew install python@3.12',
        win32:   'winget install Python.Python.3.12',
        linux:   'sudo apt-get install python3.12',
      },
      required: config.stack?.includes('python') || config.projectType !== 'web',
    },
    {
      name:    'Docker Desktop',
      command: 'docker --version',
      install: {
        darwin:  'https://docs.docker.com/desktop/install/mac-install/',
        win32:   'https://docs.docker.com/desktop/install/windows-install/',
        linux:   'https://docs.docker.com/desktop/install/linux-install/',
      },
      required: config.deploy === 'docker',
      reason:   'Required for docker compose up',
    },
    {
      name:    'Docker Compose',
      command: 'docker compose version',
      install: {
        all: 'Included with Docker Desktop',
      },
      required: config.deploy === 'docker',
    },
  ];
}

/**
 * Runs prerequisite checks. Returns { passed, failed, warnings }.
 * If `exitOnFail` is true, calls process.exit(1) on hard failures.
 */
export function checkPrereqs(config = {}, { exitOnFail = false, quiet = false } = {}) {
  const prereqs = getPrereqs(config);
  const platform = process.platform;
  let passed = 0;
  let failed = 0;
  let warnings = 0;

  if (!quiet) console.log(chalk.cyan('\n◆ Checking prerequisites...\n'));

  // Required prereqs
  for (const prereq of prereqs) {
    if (!prereq.required) continue;
    try {
      const out = execSync(prereq.command, { encoding: 'utf8', stdio: 'pipe' }).trim();
      const versionOk = prereq.versionCheck ? prereq.versionCheck(out) : true;
      if (versionOk) {
        if (!quiet) console.log(`  ${chalk.green('✓')} ${prereq.name}`);
        passed++;
      } else {
        if (!quiet) {
          console.log(`  ${chalk.red('✗')} ${prereq.name} — version too old`);
          const cmd = getInstallCmd(prereq, platform);
          if (cmd) console.log(chalk.dim(`    Install: ${cmd}`));
        }
        failed++;
      }
    } catch {
      if (!quiet) {
        console.log(`  ${chalk.red('✗')} ${prereq.name} — not found`);
        const cmd = getInstallCmd(prereq, platform);
        if (cmd) console.log(chalk.dim(`    Install: ${cmd}`));
      }
      failed++;
    }
  }

  // Optional prereqs (warn only)
  for (const prereq of prereqs.filter(p => !p.required)) {
    try {
      execSync(prereq.command, { encoding: 'utf8', stdio: 'pipe' });
      if (!quiet) console.log(`  ${chalk.green('✓')} ${prereq.name}`);
      passed++;
    } catch {
      if (!quiet) {
        console.log(`  ${chalk.yellow('⚠')} ${prereq.name} — not found (optional)`);
        if (prereq.reason) console.log(chalk.dim(`    ${prereq.reason}`));
        const cmd = getInstallCmd(prereq, platform);
        if (cmd) console.log(chalk.dim(`    Install: ${cmd}`));
      }
      warnings++;
    }
  }

  if (!quiet) console.log('');

  if (failed > 0) {
    if (!quiet) console.log(chalk.red('  ✗ Install missing prerequisites then run again.\n'));
    if (exitOnFail) process.exit(1);
  }

  return { passed, failed, warnings };
}

function getInstallCmd(prereq, platform) {
  if (prereq.install.all) return prereq.install.all;
  if (platform === 'darwin') return prereq.install.darwin;
  if (platform === 'win32')  return prereq.install.win32;
  return prereq.install.linux;
}
