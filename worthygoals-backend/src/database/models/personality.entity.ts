import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('personalities')
export class Personality {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ length: 128 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}
