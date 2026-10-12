import type { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { loginSchema, registerSchema } from "../validation/auth.schema";
import { AppError } from "../utils/AppError";

export async function registerHandler(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const result = await authService.register(input);
  res.status(201).json(result);
}

export async function loginHandler(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);
  res.status(200).json(result);
}

export async function meHandler(req: Request, res: Response) {
  if (!req.user) {
    throw AppError.unauthorized();
  }
  const user = await authService.getMe(req.user.id);
  res.status(200).json(user);
}
