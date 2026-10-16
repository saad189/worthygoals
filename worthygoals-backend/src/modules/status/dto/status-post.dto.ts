import { ApiProperty } from '@nestjs/swagger';

export class StatusReactionDto {
  @ApiProperty({ description: 'personalityId slug (marcus / lyra / goggs).' })
  personalityId!: string;

  @ApiProperty({ description: 'Mentor display name.' })
  mentorName!: string;

  @ApiProperty({ description: 'The in-voice reaction text.' })
  text!: string;
}

export class StatusPostDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  text!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({
    description: 'Presigned GET url for the attached photo, if any.',
    required: false,
    nullable: true,
  })
  imageUrl?: string | null;

  @ApiProperty({ type: [StatusReactionDto] })
  reactions!: StatusReactionDto[];

  @ApiProperty({
    required: false,
    description:
      'Set when the status tripped the crisis gate: no mentor reactions were generated.',
  })
  safetyFlag?: boolean;

  @ApiProperty({
    required: false,
    description: 'The safe response with crisis resources, when safetyFlag.',
  })
  crisisResponse?: string;
}
