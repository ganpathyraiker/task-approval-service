import type { NextFunction, Response } from "express";
import { prisma } from "../config";
import { UnauthorizedError } from "../errors";
import type { AuthenticatedRequest } from "../types";

export async function userContext(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const userId = req.headers["x-user-id"] as string | undefined;

  if (!userId) {
    return next(new UnauthorizedError("x-user-id header is required"));
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return next(new UnauthorizedError("User not found"));
  }

  req.user = { id: user.id, role: user.role };
  next();
}
