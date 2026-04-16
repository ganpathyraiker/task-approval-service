import { Role } from "@prisma/client";
import { ForbiddenError, NotFoundError, ValidationError } from "../errors";
import { userRepository } from "../repositories/user.repository";

export const userService = {
  async create(data: { name: string; email: string }) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new ValidationError("Email already exists");
    }

    const user = await userRepository.create({ ...data, role: Role.EMPLOYEE });

    return { name: user.name, email: user.email };
  },

  findAll() {
    return userRepository.findAll();
  },

  async delete(id: string) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    if (user.role === Role.TEAM_LEAD || user.role === Role.MANAGER) {
      throw new ForbiddenError("Cannot delete a TEAM_LEAD or MANAGER");
    }
    await userRepository.deleteById(id);
  },
};
