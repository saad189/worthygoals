import {
  MentorCommunicationStyle,
  MentorResponseLength,
  MentorVisibility,
} from 'src/common/constants';
import {
  ModelConfig,
  MemoryPolicy,
  PersonalityTraits,
  PromptBlocks,
  SafetyPolicy,
  TopicPolicy,
} from 'src/common/interfaces';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { MentorTagEntity } from './mentor_tags.entity';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';

@Entity('mentors')
export class Mentor {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120 })
  slug: string;

  @Index()
  @Column({ type: 'varchar', length: 64, nullable: true, default: null })
  personalityId: string | null;

  @Index()
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  title?: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  shortDescription?: string;

  @Column({ type: 'text', nullable: true })
  longDescription?: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'text', nullable: true })
  coverImageUrl?: string;

  @Index()
  @Column({ type: 'varchar', length: 16, default: 'en' })
  language: string;

  // MySQL: json. (Use jsonb only on Postgres.)
  @Column({ type: 'json', nullable: true })
  supportedLanguages?: string[];

  @Column({
    type: 'enum',
    enum: MentorCommunicationStyle,
    default: MentorCommunicationStyle.GENTLE,
  })
  communicationStyle: MentorCommunicationStyle;

  @Column({
    type: 'enum',
    enum: MentorResponseLength,
    default: MentorResponseLength.MEDIUM,
  })
  responseLength: MentorResponseLength;

  @Index()
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  // ---- Your existing ones, upgraded as structured JSON ----
  @Column({ type: 'json', nullable: true })
  personalityTraits?: PersonalityTraits;

  // Instead of a single giant prompt, store blocks
  @Column({ type: 'json' })
  promptBlocks: PromptBlocks;

  @Column({ type: 'json', nullable: true })
  topicPolicy?: TopicPolicy;

  @Column({ type: 'json', nullable: true })
  safetyPolicy?: SafetyPolicy;

  @Column({ type: 'json', nullable: true })
  memoryPolicy?: MemoryPolicy;

  @Column({ type: 'json', nullable: true })
  modelConfig?: ModelConfig;

  // Feature flags / rollout control
  @Index()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Index()
  @Column({
    type: 'enum',
    enum: MentorVisibility,
    default: MentorVisibility.PUBLIC,
  })
  visibility: MentorVisibility;

  // Monetization / gating
  @Index()
  @Column({ type: 'boolean', default: false })
  isPremium: boolean;

  @Column({ type: 'varchar', length: 32, nullable: true })
  requiredPlan?: string; // "standard" | "enhanced"

  // Versioning (important for prompt changes)
  @Index()
  @Column({ type: 'int', default: 1 })
  version: number;

  // Optional: quality stats you can update async
  @Column({ type: 'float', default: 0 })
  avgRating: number;

  @Column({ type: 'int', default: 0 })
  totalSessions: number;

  @ManyToMany(() => MentorTagEntity, (t) => t.mentors, { cascade: true })
  @JoinTable({
    name: 'mentor_to_tags',
    joinColumn: { name: 'mentorId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags: MentorTagEntity[];

  @OneToMany(() => Conversation, (c) => c.mentor)
  conversations!: Conversation[];

  @OneToMany(() => Message, (m) => m.mentor)
  messages!: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
