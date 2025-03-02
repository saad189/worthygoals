import 'reflect-metadata';


import { runSeeders } from 'typeorm-extension';
import dataSource from './dataSource';
import { DataSource } from 'typeorm';

export async function seedDatabase() {
    try {
        const appDataSource: DataSource = await dataSource.initialize();
        console.log('✅ Database connected, running seeders...');

        await runSeeders(appDataSource);

        console.log('✅ Seeding completed.');
        await appDataSource.destroy(); // Close connection after seeding
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedDatabase();
