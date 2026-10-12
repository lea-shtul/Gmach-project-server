import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";

interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

function send(res: Response, statusCode: number, code: string, message: string, details?: unknown) {
  const body: ErrorBody = { error: { code, message } };
  if (details !== undefined) {
    body.error.details = details;
  }
  res.status(statusCode).json(body);
}

// Middleware שגיאות גלובלי - חייב 4 פרמטרים כדי ש-Express יזהה אותו ככזה.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    send(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  if (err instanceof ZodError) {
    send(res, 400, "VALIDATION_ERROR", "נתונים לא תקינים", err.issues);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      send(res, 409, "DUPLICATE", "הערך כבר קיים במערכת", err.meta);
      return;
    }
    if (err.code === "P2025") {
      send(res, 404, "NOT_FOUND", "המשאב לא נמצא");
      return;
    }
  }

  // eslint-disable-next-line no-console
  console.error(err);
  send(res, 500, "INTERNAL_ERROR", "שגיאת שרת לא צפויה");
}
