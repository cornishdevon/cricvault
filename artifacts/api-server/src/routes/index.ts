import { Router, type IRouter } from "express";
import healthRouter from "./health";
import matchesRouter from "./matches";
import storageRouter from "./storage";
import fixturesRouter from "./fixtures";
import stripeRouter from "./stripe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(matchesRouter);
router.use(storageRouter);
router.use(fixturesRouter);
router.use(stripeRouter);

export default router;
