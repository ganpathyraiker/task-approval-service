import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export const searchTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  createdBy: z.string().uuid().optional(),
});
