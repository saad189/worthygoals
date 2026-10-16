import { LocationData, UserRole } from 'src/common/interfaces';

export class ResponseUserDto {
  firstName: string;
  lastName: string;
  email: string;
  id: number;
  localtion: LocationData;
  role: UserRole;
  /** Null when no date of birth was given. */
  age: number | null;
  /** Onboarding tone preference (soft | firm | intense); null until chosen. */
  tone?: string | null;
  /** Onboarding-matched mentor (personality slug); null until chosen. */
  personalityId?: string | null;
}
