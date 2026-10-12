import { Router } from "express";
import { metaHandler } from "../controllers/meta.controller";

export const metaRouter = Router();

metaRouter.get("/", metaHandler);
