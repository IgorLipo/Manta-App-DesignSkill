import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';

export const CurrentUser = createParamDecorator(
  (data: { userId?: boolean; role?: boolean } | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (!data) return request.user;
    if (data.userId) return request.user.userId;
    if (data.role) return request.user.role;
    return request.user;
  },
);

export const RequireRole = (...roles: Role[]) => {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      // Method decorator
    }
    // Applied via RolesGuard
  };
};
