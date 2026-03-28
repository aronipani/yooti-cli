import chalk from 'chalk';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

export async function preflight() {
  // If the generated preflight.js exists, delegate to it
  if (existsSync('pipeline/scripts/preflight.js')) {
    console.log(chalk.cyan('\n◆ Running pre-flight checks...\n'));
    try {
      execSync('node pipeline/scripts/preflight.js', { stdio: 'inherit' });
    } catch {
      // exit code handled by the script itself
      process.exit(1);
    }
    return;
  }

  // Fallback: inline checks (for projects without the generated script)
  console.log(chalk.cyan('\n◆ Running pre-flight checks...\n'));

  const checks = [
    { name: 'Git repository', test: () => existsSync('.git') },
    { name: 'docker-compose.yml exists', test: () => existsSync('docker-compose.yml') },
    { name: '.claude/CLAUDE.md exists', test: () => existsSync('.claude/CLAUDE.md') },
    { name: 'yooti.config.json exists', test: () => existsSync('yooti.config.json') },
    { name: 'Example artifacts ready', test: () => existsSync('.agent/examples') },
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    try {
      if (check.test()) {
        console.log(`  ${chalk.green('✓')} ${check.name}`);
        passed++;
      } else {
        console.log(`  ${chalk.red('✗')} ${check.name}`);
        failed++;
      }
    } catch {
      console.log(`  ${chalk.red('✗')} ${check.name}`);
      failed++;
    }
  }

  console.log('');
  console.log(`  Results: ${chalk.green(passed + ' passed')} · ${failed > 0 ? chalk.red(failed + ' failed') : chalk.dim('0 failed')}`);
  console.log('');

  if (failed > 0) {
    console.log(chalk.red('  ✗ Pre-flight failed. Run yooti init first.\n'));
    process.exit(1);
  } else {
    console.log(chalk.green('  ✓ Pre-flight passed. Ready for code generation.\n'));
  }
}
