import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Role } from '../models/role.entity';
import { Permission } from '../models/permission.entity';
import { USER_ROLES } from 'src/common/constants';

export default class RoleSeeder implements Seeder {
    async run(dataSource: DataSource): Promise<void> {
        const roleRepository = dataSource.getRepository(Role);
        const permissionRepository = dataSource.getRepository(Permission);

        // Initial permissions
        const permissionNames = ['dashboard', 'goals', 'users', 'reporting'];

        // Ensure permissions exist
        const permissions: Permission[] = [];
        for (const name of permissionNames) {
            let permission = await permissionRepository.findOne({ where: { name } });
            if (!permission) {
                permission = permissionRepository.create({ name });
                await permissionRepository.save(permission);
            }
            permissions.push(permission);
        }

        // Define role-permission mappings
        const rolePermissionsMap: Record<string, string[]> = {
            [USER_ROLES.USER]: ['dashboard', 'goals', 'users', 'reporting'],
            [USER_ROLES.ADMIN]: ['dashboard', 'goals', 'users', 'reporting', 'deed-management']
        };

        // Create roles and assign permissions
        for (const [roleName, permissionNames] of Object.entries(rolePermissionsMap)) {

            let role = await roleRepository.findOne({ where: { name: roleName } });
            if (!role) {
                role = roleRepository.create({ name: roleName });
                await roleRepository.save(role);
            }

            // Filter the permissions for this role.
            const rolePermissions = permissions.filter(p => permissionNames.includes(p.name));
            role.permissions = Promise.resolve(rolePermissions);
            await roleRepository.save(role);
        }

        console.log('✅ Roles and permissions seeded successfully!');
    }
}
