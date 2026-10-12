import { Router } from "express";
import { myStatsHandler, neighborhoodStatsHandler } from "../controllers/stats.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const statsRouter = Router();

statsRouter.use(requireAuth);

statsRouter.get("/me", asyncHandler(myStatsHandler));
statsRouter.get("/neighborhood", asyncHandler(neighborhoodStatsHandler));
