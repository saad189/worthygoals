#!/usr/bin/env node
/*
 Cross-platform TypeORM migration generate helper.
 Usage examples:
   npm run typeorm:generate:xplat --name=myNewMigration
   npm run typeorm:generate:xplat -- --name=myNewMigration
   npm run typeorm:generate:xplat --name add-users-table

 Accepts either:
   --name MigrationName
   --n MigrationName
 or via npm config param:
   npm run typeorm:generate:xplat --name=AddUsers

 Falls back to TIMESTAMP_Migration if no name supplied.
*/

const { execSync } = require('node:child_process');
const { join } = require('node:path');
const fs = require('node:fs');

// Load env (mirror logic from dataSource.ts). Prefer NODE_ENV-specific file, fallback to .env.local
try {
  const dotenv = require('dotenv');
  const envFile = process.env.NODE_ENV
    ? `.env.${process.env.NODE_ENV}`
    : '.env.local';
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
  } else {
    dotenv.config(); // fallback to default .env if present
  }
} catch (e) {
  console.warn('Could not load dotenv:', e.message);
}

function parseArgs() {
  const args = process.argv.slice(2);
  let rawName;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--name=')) rawName = a.split('=')[1];
    else if (a === '--name' || a === '-n' || a === '--n') rawName = args[i + 1];
    else if (a.startsWith('-n=')) rawName = a.split('=')[1];
  }
  if (!rawName) rawName = process.env.npm_config_name;
  if (!rawName || !rawName.trim()) rawName = 'Migration';

  // Sanitize: Keep alphanumerics, convert separators to underscores
  let safe = rawName.replace(/[^A-Za-z0-9]+/g, '_');
  safe = safe.replace(/_{2,}/g, '_').replace(/^_+|_+$/g, '');
  if (!safe) safe = 'Migration';

  // Ensure first char is a letter for class naming (TypeORM does this internally but be safe)
  if (/^[0-9]/.test(safe)) safe = 'Migration_' + safe;

  // Convert to PascalCase for readability
  const pascal = safe
    .split('_')
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');

  return pascal;
}

async function ensureMetadataTable() {
  // Pre-flight: ensure the metadata table exists (some TypeORM code expects it when diffing
  // generated columns). This avoids: Error: Table '<db>.typeorm_metadata' doesn't exist
  const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME } = process.env;
  if (!(DB_HOST && DB_PORT && DB_USERNAME && DB_NAME)) {
    console.warn(
      '[typeorm-generate] DB env vars incomplete; skipping metadata table ensure step.',
    );
    return;
  }
  try {
    const mysql = require('mysql2/promise');
    const conn = await mysql.createConnection({
      host: DB_HOST,
      port: +DB_PORT,
      user: DB_USERNAME,
      password: DB_PASSWORD,
      database: DB_NAME,
    });
    await conn.execute(
      'CREATE TABLE IF NOT EXISTS `typeorm_metadata` (\n' +
        '  `type` varchar(255) NOT NULL,\n' +
        '  `database` varchar(255) DEFAULT NULL,\n' +
        '  `schema` varchar(255) DEFAULT NULL,\n' +
        '  `table` varchar(255) DEFAULT NULL,\n' +
        '  `name` varchar(255) DEFAULT NULL,\n' +
        '  `value` text\n' +
        ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;',
    );
    await conn.end();
    console.log('[typeorm-generate] Ensured typeorm_metadata table exists.');
  } catch (err) {
    console.warn(
      '[typeorm-generate] Skipping metadata table ensure step:',
      err.message,
    );
  }
}

async function main() {
  const pascalName = parseArgs();
  const tsNodeRegister = '-r tsconfig-paths/register';
  const cliPath = './node_modules/typeorm/cli.js';
  const dataSource = 'src/database/dataSource.ts';
  await ensureMetadataTable();
  // Pass only the name, let TypeORM build the timestamped file name.
  const cmd = `ts-node ${tsNodeRegister} ${cliPath} migration:generate src/database/migrations/${pascalName} -d ${dataSource}`;
  console.log('Running:', cmd);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    console.error('Migration generation failed.');
    process.exit(e.status || 1);
  }
}

main().catch((e) => {
  console.error('Unexpected failure in generation script:', e);
  process.exit(1);
});
