import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';

import { User } from './user.entity';
import { Permission } from './permission.entity';

@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @ManyToMany(() => Permission, (permission) => permission.roles, { cascade: true })
    @JoinTable({
        name: 'role-permissions', // Join table
        joinColumn: { name: 'roleId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' },
    })
    permissions: Promise<Permission[]>;


    @OneToMany(() => User, (user) => user.role)
    users: Promise<User[]>;

    @CreateDateColumn()
    dateAdded: Date;

    @UpdateDateColumn()
    dateUpdated: Date;
}
