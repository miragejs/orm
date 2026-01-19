import { UserRole } from '@shared/enums';
import { User } from '@shared/types';

export function isManager(user: User): boolean {
  return user.role === UserRole.MANAGER;
}
