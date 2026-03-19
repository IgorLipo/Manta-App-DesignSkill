import { SetMetadata } from '@nestjs/common';

// Audit log action types
export const AUDIT_ACTION_KEY = 'auditAction';
export const AuditLog = (action: string) => SetMetadata(AUDIT_ACTION_KEY, action);
