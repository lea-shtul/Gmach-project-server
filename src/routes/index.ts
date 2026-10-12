import { Router } from "express";
import { healthRouter } from "./health.routes";
import { metaRouter } from "./meta.routes";
import { authRouter } from "./auth.routes";
import { itemsRouter } from "./items.routes";
import { requestsRouter } from "./requests.routes";
import { statsRouter } from "./stats.routes";
import { adminRouter } from "./admin.routes";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/meta", metaRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/items", itemsRouter);
apiRouter.use("/requests", requestsRouter);
apiRouter.use("/stats", statsRouter);
apiRouter.use("/admin", adminRouter);
