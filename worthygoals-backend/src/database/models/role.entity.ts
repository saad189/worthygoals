import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

import { User } from './user.entity';
import { Permission } from './permission.entity';

@Entity('roles')
@Unique('uq_roles_name', ['name'])
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @ManyToMany(() => Permission, (permission) => permission.roles, {
    cascade: true,
  })
  @JoinTable({
    name: 'role-permissions', // Join table
    // Created by PostgresInit with its own FK and index names, which
    // JoinTable cannot express. Leave it to the migrations.
    synchronize: false,
    joinColumn: { name: 'roleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' },
  })
  permissions: Promise<Permission[]>;

  @OneToMany(() => User, (user) => user.role)
  users: Promise<User[]>;

  @CreateDateColumn({ type: 'timestamptz' })
  dateAdded: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  dateUpdated: Date;
}
