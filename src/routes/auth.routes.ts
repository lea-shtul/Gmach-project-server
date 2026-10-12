import { Router } from "express";
import { loginHandler, meHandler, registerHandler } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const authRouter = Router();

authRouter.post("/register", asyncHandler(registerHandler));
authRouter.post("/login", asyncHandler(loginHandler));
authRouter.get("/me", requireAuth, asyncHandler(meHandler));
