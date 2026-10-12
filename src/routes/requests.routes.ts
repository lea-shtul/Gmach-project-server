import { Router } from "express";
import {
  createRequestHandler,
  getRequestHandler,
  listAllHandler,
  listMineHandler,
  listReceivedHandler,
  updateRequestStatusHandler,
} from "../controllers/requests.controller";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";
import { asyncHandler } from "../utils/asyncHandler";

export const requestsRouter = Router();

requestsRouter.use(requireAuth);

requestsRouter.post("/", asyncHandler(createRequestHandler));
requestsRouter.get("/mine", asyncHandler(listMineHandler));
requestsRouter.get("/received", asyncHandler(listReceivedHandler));
requestsRouter.get("/", requireAdmin, asyncHandler(listAllHandler));
requestsRouter.get("/:id", asyncHandler(getRequestHandler));
requestsRouter.patch("/:id/status", asyncHandler(updateRequestStatusHandler));
