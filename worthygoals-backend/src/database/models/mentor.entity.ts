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
  OneToMany,
  Unique,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';

@Entity('mentors')
@Unique('uq_mentors_slug', ['slug'])
export class Mentor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 120 })
  slug: string;

  @Index('idx_mentors_personality_id')
  @Column({ type: 'varchar', length: 64, nullable: true, default: null })
  personalityId: string | null;

  @Index('idx_mentors_name')
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

  @Index('idx_mentors_language')
  @Column({ type: 'varchar', length: 16, default: 'en' })
  language: string;

  // MySQL: json. (Use jsonb only on Postgres.)
  @Column({ type: 'jsonb', nullable: true })
  supportedLanguages?: string[];

  @Column({
    type: 'varchar',
    length: 32,
    default: MentorCommunicationStyle.GENTLE,
  })
  communicationStyle: MentorCommunicationStyle;

  @Column({
    type: 'varchar',
    length: 16,
    default: MentorResponseLength.MEDIUM,
  })
  responseLength: MentorResponseLength;

  @Index('idx_mentors_sort_order')
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  // ---- Your existing ones, upgraded as structured JSON ----
  @Exclude()
  @Column({ type: 'jsonb', nullable: true })
  personalityTraits?: PersonalityTraits;

  // Instead of a single giant prompt, store blocks.
  // @Exclude: this is the mentor's system prompt. It must never leave the
  // server — not via GET /mentors and not via GET /conversations?include=mentor.
  @Exclude()
  @Column({ type: 'jsonb' })
  promptBlocks: PromptBlocks;

  @Exclude()
  @Column({ type: 'jsonb', nullable: true })
  topicPolicy?: TopicPolicy;

  @Exclude()
  @Column({ type: 'jsonb', nullable: true })
  safetyPolicy?: SafetyPolicy;

  @Exclude()
  @Column({ type: 'jsonb', nullable: true })
  memoryPolicy?: MemoryPolicy;

  @Exclude()
  @Column({ type: 'jsonb', nullable: true })
  modelConfig?: ModelConfig;

  // Feature flags / rollout control
  @Index('idx_mentors_is_active')
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Index('idx_mentors_visibility')
  @Column({
    type: 'varchar',
    length: 16,
    default: MentorVisibility.PUBLIC,
  })
  visibility: MentorVisibility;

  // Monetization / gating
  @Index('idx_mentors_is_premium')
  @Column({ type: 'boolean', default: false })
  isPremium: boolean;

  @Column({ type: 'varchar', length: 32, nullable: true })
  requiredPlan?: string; // "standard" | "enhanced"

  // Versioning (important for prompt changes)
  @Index('idx_mentors_version')
  @Column({ type: 'int', default: 1 })
  version: number;

  // Optional: quality stats you can update async
  @Column({ type: 'float', default: 0 })
  avgRating: number;

  @Column({ type: 'int', default: 0 })
  totalSessions: number;

  @OneToMany(() => Conversation, (c) => c.mentor)
  conversations!: Conversation[];

  @OneToMany(() => Message, (m) => m.mentor)
  messages!: Message[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
