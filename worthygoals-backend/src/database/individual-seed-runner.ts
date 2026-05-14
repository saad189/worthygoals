import 'reflect-metadata';

import { runSeeders } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import dataSource from './dataSource';
import RoleSeeder from './seeds/3. RoleSeeder';
import MentorSeeder from './seeds/2. MentorSeeder';

const SEEDERS: Record<string, any> = {
  RoleSeeder,
  MentorSeeder,
};

function resolveSeedersFromArgs(argv: string[]) {
  const names = argv.slice(2).filter(Boolean);
  if (names.length === 0) return Object.values(SEEDERS);

  const unknown = names.filter((n) => !SEEDERS[n]);
  if (unknown.length) {
    // eslint-disable-next-line no-console
    console.error(`❌ Unknown seeder(s): ${unknown.join(', ')}`);
    // eslint-disable-next-line no-console
    console.error(`Available seeders: ${Object.keys(SEEDERS).join(', ')}`);
    process.exit(1);
  }

  return names.map((n) => SEEDERS[n]);
}

export async function seedDatabaseIndividual() {
  let appDataSource: DataSource | null = null;

  try {
    appDataSource = await dataSource.initialize();
    const seeds = resolveSeedersFromArgs(process.argv);

    // eslint-disable-next-line no-console
    console.log(
      `✅ Database connected, running seeders: ${seeds.map((s) => s.name).join(', ')}`,
    );

    await runSeeders(appDataSource, { seeds });

    // eslint-disable-next-line no-console
    console.log('✅ Seeding completed.');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    if (appDataSource?.isInitialized) {
      await appDataSource.destroy();
    }
  }
}

seedDatabaseIndividual();
