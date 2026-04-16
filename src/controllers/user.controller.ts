import type { NextFunction, Request, Response } from "express";
import { userService } from "../services/user.service";
import { createUserSchema } from "../validators/user.validator";

export const userController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createUserSchema.parse(req.body);
      const user = await userService.create(data);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  },

  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.findAll();
      res.json(users);
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await userService.delete(req.params.id as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
