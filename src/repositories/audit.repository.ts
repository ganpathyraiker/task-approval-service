import { Prisma } from "@prisma/client";
import { prisma } from "../config";

export const auditRepository = {
  log(data: {
    action: string;
    entityType: string;
    entityId: string;
    performedBy: string;
    metadata?: Record<string, unknown>;
  }) {
    return prisma.auditLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        performedBy: data.performedBy,
        metadata: (data.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
  },
};
