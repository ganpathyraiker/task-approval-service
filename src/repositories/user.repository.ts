import type { Role } from "@prisma/client";
import { prisma } from "../config";

export const userRepository = {
  create(data: { name: string; email: string; role: Role }) {
    return prisma.user.create({ data });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },
};
