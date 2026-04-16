import type { Role } from "@prisma/client";
import type { NextFunction, Response } from "express";
import { ForbiddenError } from "../errors";
import type { AuthenticatedRequest } from "../types";

export function authorize(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError("Insufficient role permissions"));
    }

    next();
  };
}
