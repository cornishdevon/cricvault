import { Router, type IRouter } from "express";
import healthRouter from "./health";
import matchesRouter from "./matches";
import storageRouter from "./storage";
import fixturesRouter from "./fixtures";
import adminImportRouter from "./adminImport";
import accountRouter from "./account";

const router: IRouter = Router();

router.use(healthRouter);
// Must come before the auth-gated routers: their router-level requireAuth
// middleware runs for every request passing through them.
router.use(adminImportRouter);
// Storage must also come before the auth-gated routers: media tags/players
// can't send auth headers, so object streaming is authorized by a signed
// token instead (uploads inside storageRouter still apply requireAuth).
router.use(storageRouter);
router.use(matchesRouter);
router.use(fixturesRouter);
router.use(accountRouter);

export default router;
