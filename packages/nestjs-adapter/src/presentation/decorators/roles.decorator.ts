import { SetMetadata } from '@nestjs/common/decorators';
import { Role } from '@auth-template/core/domain';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
