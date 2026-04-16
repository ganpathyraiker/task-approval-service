import type { NextFunction, Request, Response } from "express";
import { auditService } from "../services/audit.service";

export const auditController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await auditService.findAll();
      res.json(logs);
    } catch (err) {
      next(err);
    }
  },
};
