import type { User } from './user';

export interface AuditLog {
  id: number;
  actorId: number;
  entityType: string;
  entityId: number;
  action: 'created' | 'updated' | 'deleted';
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  loggedAt: string;
  actor: User;
}
