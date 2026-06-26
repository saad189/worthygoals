import { AttachmentType, StorageProvider } from 'src/common/constants';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Message } from './message.entity';

@Entity({ name: 'message_attachments' })
@Index('idx_message_attachments_message_id', ['messageId'])
export class MessageAttachment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  messageId!: string;

  @ManyToOne(() => Message, (m) => m.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'messageId' })
  message!: Message;

  @Column({ type: 'varchar', length: 16 })
  type!: AttachmentType;

  @Column({ type: 'varchar', length: 16 })
  storageProvider!: StorageProvider;

  @Column({ type: 'varchar', length: 512 })
  objectKey!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  mimeType!: string | null;

  @Column({ type: 'bigint', nullable: true })
  sizeBytes!: string | null;

  @Column({ type: 'int', nullable: true })
  durationMs!: number | null;

  @Column({ type: 'int', nullable: true })
  width!: number | null;

  @Column({ type: 'int', nullable: true })
  height!: number | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  checksumSha256!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
