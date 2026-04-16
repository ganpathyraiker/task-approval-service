import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
};
