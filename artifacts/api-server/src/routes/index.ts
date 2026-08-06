import { Router, type IRouter } from "express";
import healthRouter from "./health";
import matchesRouter from "./matches";
import storageRouter from "./storage";
import fixturesRouter from "./fixtures";
import adminImportRouter from "./adminImport";

const router: IRouter = Router();

router.use(healthRouter);
// Must come before the auth-gated routers: their router-level requireAuth
// middleware runs for every request passing through them.
router.use(adminImportRouter);
router.use(matchesRouter);
router.use(storageRouter);
router.use(fixturesRouter);

export default router;
