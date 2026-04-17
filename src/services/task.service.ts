import { TaskStatus } from "@prisma/client";
import { ForbiddenError, NotFoundError, ValidationError } from "../errors";
import { taskRepository } from "../repositories/task.repository";
import { auditService } from "./audit.service";

export const taskService = {
  async create(data: { title: string; description?: string; createdBy: string }) {
    const existing = await taskRepository.findByTitle(data.title);
    if (existing) {
      throw new ValidationError(`A task with title "${data.title}" already exists`);
    }

    const task = await taskRepository.create(data);

    await auditService.log({
      action: "TASK_CREATED",
      entityType: "TASK",
      entityId: task.id,
      performedBy: data.createdBy,
      metadata: { title: task.title },
    });

    return task;
  },

  findAll(status?: TaskStatus) {
    return taskRepository.findAll(status);
  },

  async approve(taskId: string, performedBy: string) {
    const task = await taskRepository.findById(taskId);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    if (task.status !== TaskStatus.PENDING) {
      throw new ForbiddenError(`Cannot approve a task with status ${task.status}`);
    }

    const updated = await taskRepository.updateStatus(taskId, TaskStatus.APPROVED);

    await auditService.log({
      action: "TASK_APPROVED",
      entityType: "TASK",
      entityId: taskId,
      performedBy,
      metadata: { previousStatus: task.status },
    });

    return updated;
  },

  async reject(taskId: string, performedBy: string) {
    const task = await taskRepository.findById(taskId);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    if (task.status !== TaskStatus.PENDING) {
      throw new ForbiddenError(`Cannot reject a task with status ${task.status}`);
    }

    const updated = await taskRepository.updateStatus(taskId, TaskStatus.REJECTED);

    await auditService.log({
      action: "TASK_REJECTED",
      entityType: "TASK",
      entityId: taskId,
      performedBy,
      metadata: { previousStatus: task.status },
    });

    return updated;
  },
};
