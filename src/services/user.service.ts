import type { Role } from "@prisma/client";
import { ValidationError } from "../errors";
import { userRepository } from "../repositories/user.repository";
import { auditService } from "./audit.service";

export const userService = {
  async create(data: { name: string; email: string; role: Role }) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new ValidationError("Email already exists");
    }

    const user = await userRepository.create(data);

    await auditService.log({
      action: "USER_CREATED",
      entityType: "USER",
      entityId: user.id,
      performedBy: user.id,
      metadata: { email: user.email, role: user.role },
    });

    return user;
  },
};
