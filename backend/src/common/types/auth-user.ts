import { RoleName } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: RoleName;
  firstName: string;
  lastName: string;
}
