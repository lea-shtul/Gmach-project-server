import { Router } from "express";
import { adminStatsHandler, adminUsersHandler } from "../controllers/admin.controller";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";
import { asyncHandler } from "../utils/asyncHandler";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/stats", asyncHandler(adminStatsHandler));
adminRouter.get("/users", asyncHandler(adminUsersHandler));
