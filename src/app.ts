import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { apiRouter } from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFound";
import { openApiDocument } from "./docs/openapi";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigins,
    }),
  );
  app.use(express.json());

  app.get("/openapi.json", (_req, res) => {
    res.status(200).json(openApiDocument);
  });
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
