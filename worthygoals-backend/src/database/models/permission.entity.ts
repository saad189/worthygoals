import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Role } from './role.entity';

@Entity('permissions')
@Unique('uq_permissions_name', ['name'])
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @ManyToMany(() => Role, (role) => role.permissions, { onDelete: 'CASCADE' })
  roles: Role[];

  @CreateDateColumn({ type: 'timestamptz' })
  dateAdded: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  dateUpdated: Date;
}
