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
};
