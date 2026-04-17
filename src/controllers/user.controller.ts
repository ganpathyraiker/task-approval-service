import type { NextFunction, Request, Response } from "express";
import { userService } from "../services/user.service";

export const userController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.findAll();
      res.json(users);
    } catch (err) {
      next(err);
    }
  }
};
