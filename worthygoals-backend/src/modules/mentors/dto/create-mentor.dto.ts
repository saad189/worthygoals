import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  MentorCommunicationStyle,
  MentorResponseLength,
  MentorVisibility,
} from 'src/common/constants';

class PromptExampleDto {
  @IsString()
  @IsNotEmpty()
  user: string;

  @IsString()
  @IsNotEmpty()
  assistant: string;
}

class PromptBlocksDto {
  @IsString()
  @IsNotEmpty()
  systemPrompt: string;

  @IsOptional()
  @IsString()
  behaviorPrompt?: string;

  @IsOptional()
  @IsString()
  safetyPrompt?: string;

  @IsOptional()
  @IsString()
  contextPrompt?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromptExampleDto)
  examples?: PromptExampleDto[];
}

class PersonalityTraitsDto {
  @IsOptional()
  @IsInt()
  patience?: number;

  @IsOptional()
  @IsInt()
  kindness?: number;

  @IsOptional()
  @IsInt()
  clarity?: number;

  @IsOptional()
  @IsInt()
  straightforwardness?: number;

  @IsOptional()
  @IsInt()
  humor?: number;

  @IsOptional()
  @IsInt()
  empathy?: number;

  @IsOptional()
  @IsInt()
  spirituality?: number;
}

export class CreateMentorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  slug: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  shortDescription?: string;

  @IsOptional()
  @IsString()
  longDescription?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  language?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedLanguages?: string[];

  @IsOptional()
  @IsEnum(MentorCommunicationStyle)
  communicationStyle?: MentorCommunicationStyle;

  @IsOptional()
  @IsEnum(MentorResponseLength)
  responseLength?: MentorResponseLength;

  @IsOptional()
  @ValidateNested()
  @Type(() => PersonalityTraitsDto)
  personalityTraits?: PersonalityTraitsDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PromptBlocksDto)
  promptBlocks: PromptBlocksDto;

  @IsOptional()
  @IsObject()
  topicPolicy?: Record<string, any>;

  @IsOptional()
  @IsObject()
  safetyPolicy?: Record<string, any>;

  @IsOptional()
  @IsObject()
  memoryPolicy?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(MentorVisibility)
  visibility?: MentorVisibility;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  requiredPlan?: string;

  @IsOptional()
  @IsInt()
  version?: number;
}
