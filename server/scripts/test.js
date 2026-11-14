import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const serverDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const databaseDirectory = mkdtempSync(join(tmpdir(), 'mentor-connect-test-'));
const env = {
  ...process.env,
  DATABASE_URL: `file:${join(databaseDirectory, 'test.db')}`,
  JWT_SECRET: 'test-only-secret-for-mentor-connect-automated-tests',
  NODE_ENV: 'test',
};

function run(executable, args) {
  const result = spawnSync(executable, args, {
    cwd: serverDirectory,
    env,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

let exitCode = 1;
try {
  exitCode = run(process.execPath, [
    resolve(serverDirectory, 'node_modules/prisma/build/index.js'),
    'migrate',
    'deploy',
  ]);
  if (exitCode === 0) {
    exitCode = run(process.execPath, [resolve(serverDirectory, 'prisma/seed.js')]);
  }
  if (exitCode === 0) {
    exitCode = run(process.execPath, [
      resolve(serverDirectory, 'node_modules/vitest/vitest.mjs'),
      'run',
    ]);
  }
} finally {
  rmSync(databaseDirectory, { recursive: true, force: true });
}

process.exitCode = exitCode;
