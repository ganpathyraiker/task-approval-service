import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import auditRoutes from "./routes/audit.routes";
import taskRoutes from "./routes/task.routes";
import userRoutes from "./routes/user.routes";
import { setupSwagger } from "./swagger";

const app = express();

app.use(express.json());

setupSwagger(app);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/audit-logs", auditRoutes);

app.use(errorHandler);

export default app;
