import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  role: z.enum(["EMPLOYEE", "TEAM_LEAD", "MANAGER"]).default("EMPLOYEE"),
});
