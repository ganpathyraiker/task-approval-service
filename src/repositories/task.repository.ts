import { TaskStatus } from "@prisma/client";
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

  findByTitle(title: string) {
    return prisma.task.findFirst({ where: { title: { equals: title, mode: "insensitive" } } });
  },

  findAll(status?: TaskStatus) {
    return prisma.task.findMany({
      where: status ? { status } : undefined,
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
