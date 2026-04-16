import { Role } from "@prisma/client";
import { Router } from "express";
import { taskController } from "../controllers/task.controller";
import { authorize } from "../middleware/authorize";
import { userContext } from "../middleware/userContext";

const router = Router();

router.use(userContext);

router.post("/", taskController.create);
router.post("/search", taskController.search);
router.post("/:id/approve", authorize(Role.TEAM_LEAD, Role.MANAGER), taskController.approve);
router.post("/:id/reject", authorize(Role.TEAM_LEAD, Role.MANAGER), taskController.reject);

export default router;
