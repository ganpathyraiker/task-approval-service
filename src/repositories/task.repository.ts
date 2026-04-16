import { type Prisma, TaskStatus } from "@prisma/client";
import { prisma } from "../config";

export const taskRepository = {
  create(data: { title: string; description?: string; createdBy: string }) {
    return prisma.task.create({
      data: { ...data, status: TaskStatus.PENDING },
      include: { creator: { select: { id: true, name: true, email: true, role: true } } },
    });
  },

  findById(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: { creator: { select: { id: true, name: true, email: true, role: true } } },
    });
  },

  search(filters: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    createdBy?: string;
  }) {
    const where: Prisma.TaskWhereInput = {};

    if (filters.title) {
      where.title = { contains: filters.title, mode: "insensitive" };
    }
    if (filters.description) {
      where.description = { contains: filters.description, mode: "insensitive" };
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.createdBy) {
      where.createdBy = filters.createdBy;
    }

    return prisma.task.findMany({
      where,
      include: { creator: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  updateStatus(id: string, status: TaskStatus) {
    return prisma.task.update({
      where: { id },
      data: { status },
      include: { creator: { select: { id: true, name: true, email: true, role: true } } },
    });
  },
};
