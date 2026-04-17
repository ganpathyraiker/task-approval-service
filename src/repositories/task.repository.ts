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

  async updateStatus(id: string, status: TaskStatus, version: number) {
    const result = await prisma.$executeRaw`
      UPDATE tasks
      SET status = ${status}::"TaskStatus", version = ${version + 1}, updated_at = NOW()
      WHERE id = ${id} AND version = ${version}
    `;
    return { count: result };
  },
};
