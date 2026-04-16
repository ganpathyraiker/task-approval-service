import { auditRepository } from "../repositories/audit.repository";

export const auditService = {
  log(data: {
    action: string;
    entityType: string;
    entityId: string;
    performedBy: string;
    metadata?: Record<string, unknown>;
  }) {
    return auditRepository.log(data);
  },

  findAll() {
    return auditRepository.findAll();
  },
};
