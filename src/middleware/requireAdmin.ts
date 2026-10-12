import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

// להפעיל אחרי requireAuth בלבד. חוסם כל מי שאינה ADMIN.
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== "ADMIN") {
    throw AppError.forbidden("הפעולה מותרת למנהלת בלבד");
  }
  next();
}
