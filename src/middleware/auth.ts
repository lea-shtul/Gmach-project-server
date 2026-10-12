import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import type { Role } from "@prisma/client";

export interface AuthUser {
  id: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

interface JwtPayload {
  sub: string;
  role: Role;
}

// מאמת Bearer Token ומצרף את המשתמשת המזוהה ל-req.user.
// זהו המקור היחיד לקביעת "מי אני" - אף פעם לא מזהה שנשלח בגוף הבקשה.
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw AppError.unauthorized("נדרש Token בכתיבה: Bearer <token>");
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    throw AppError.unauthorized("Token לא תקין או שפג תוקפו");
  }
}
