import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import organizationsRouter from "./organizations";
import projectsRouter from "./projects";
import tasksRouter from "./tasks";
import deliverablesRouter from "./deliverables";
import reviewsRouter from "./reviews";
import messagesRouter from "./messages";
import contractsRouter from "./contracts";
import { authMiddleware } from "../middleware/auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);

router.use(authMiddleware);
router.use(usersRouter);
router.use(organizationsRouter);
router.use(projectsRouter);
router.use(tasksRouter);
router.use(deliverablesRouter);
router.use(reviewsRouter);
router.use(messagesRouter);
router.use(contractsRouter);

export default router;
