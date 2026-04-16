import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import taskRoutes from "./routes/task.routes";
import userRoutes from "./routes/user.routes";

const app = express();

app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);

app.use(errorHandler);

export default app;
