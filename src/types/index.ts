import type { Role } from "@prisma/client";
import type { Request } from "express";

export interface UserContext {
  id: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user?: UserContext;
}

export interface TaskWithVersion {
  version: number;
  [key: string]: unknown;
}
