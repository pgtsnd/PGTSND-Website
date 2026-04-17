import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import organizationsRouter from "./organizations";
import projectsRouter from "./projects";
import phasesRouter from "./phases";
import tasksRouter from "./tasks";
import deliverablesRouter from "./deliverables";
import reviewsRouter from "./reviews";
import messagesRouter from "./messages";
import dmRouter from "./dm";
import contractsRouter from "./contracts";
import clientRouter from "./client";
import integrationsRouter from "./integrations";
import videoReviewRouter from "./video-review";
import projectMutesRouter from "./project-mutes";
import adminEmailPreviewsRouter from "./admin-email-previews";
import adminEmailSubscribersRouter from "./admin-email-subscribers";
import publicReviewRouter from "./public-review";
import storageRouter from "./storage";
import accessTokensRouter from "./access-tokens";
import unsubscribeRouter from "./unsubscribe";
import { authMiddleware } from "../middleware/auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(publicReviewRouter);
router.use(storageRouter);
router.use(unsubscribeRouter);

router.post("/webhooks/stripe", (req, res, next) => {
  req.url = "/webhooks/stripe";
  integrationsRouter(req, res, next);
});
router.post("/webhooks/docusign", (req, res, next) => {
  req.url = "/webhooks/docusign";
  integrationsRouter(req, res, next);
});

router.use(authMiddleware);
router.use(usersRouter);
router.use(organizationsRouter);
router.use(projectsRouter);
router.use(phasesRouter);
router.use(tasksRouter);
router.use(deliverablesRouter);
router.use(reviewsRouter);
router.use(dmRouter);
router.use(messagesRouter);
router.use(contractsRouter);
router.use(clientRouter);
router.use(integrationsRouter);
router.use(videoReviewRouter);
router.use(projectMutesRouter);
router.use(adminEmailPreviewsRouter);
router.use(adminEmailSubscribersRouter);
router.use(accessTokensRouter);

export default router;
