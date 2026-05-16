import { LocationData, UserRole } from 'src/common/interfaces';

export class ResponseUserDto {
  firstName: string;
  lastName: string;
  email: string;
  id: number;
  localtion: LocationData;
  role: UserRole;
  age: number;
}
