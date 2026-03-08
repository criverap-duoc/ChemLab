import api from './api';

export interface AuditLog {
  action: string;
  timestamp: string;
  userName: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
}

export const traceabilityService = {
  async getEntityHistory(entityType: string, entityId: string): Promise<AuditLog[]> {
    const response = await api.get(`/traceability/history/${entityType}/${entityId}`);
    return response.data;
  }
};
