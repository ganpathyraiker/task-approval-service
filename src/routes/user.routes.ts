import { Router } from "express";
import { userController } from "../controllers/user.controller";

const router = Router();

router.get("/", userController.list);
router.post("/", userController.create);
router.delete("/:id", userController.delete);

export default router;
