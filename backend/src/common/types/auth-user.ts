import { RoleName } from '@prisma/client';

export class AuthUser {
  id!: string;
  email!: string;
  role!: RoleName;
  firstName!: string;
  lastName!: string;
}
