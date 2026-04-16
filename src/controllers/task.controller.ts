import type { NextFunction, Response } from "express";
import { taskService } from "../services/task.service";
import type { AuthenticatedRequest } from "../types";
import { createTaskSchema, searchTaskSchema } from "../validators/task.validator";

export const taskController = {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = createTaskSchema.parse(req.body);
      const task = await taskService.create({
        ...data,
        // biome-ignore lint/style/noNonNullAssertion: user is guaranteed by userContext middleware
        createdBy: req.user!.id,
      });
      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  },

  async search(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const filters = searchTaskSchema.parse(req.body);
      const tasks = await taskService.search(filters);
      res.json(tasks);
    } catch (err) {
      next(err);
    }
  },

  async approve(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // biome-ignore lint/style/noNonNullAssertion: user is guaranteed by userContext middleware
      const task = await taskService.approve(req.params.id as string, req.user!.id);
      res.json(task);
    } catch (err) {
      next(err);
    }
  },

  async reject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // biome-ignore lint/style/noNonNullAssertion: user is guaranteed by userContext middleware
      const task = await taskService.reject(req.params.id as string, req.user!.id);
      res.json(task);
    } catch (err) {
      next(err);
    }
  },
};
