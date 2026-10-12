import type { Request, Response } from "express";
import * as adminService from "../services/admin.service";

export async function adminStatsHandler(_req: Request, res: Response) {
  const stats = await adminService.getAdminStats();
  res.status(200).json(stats);
}

export async function adminUsersHandler(_req: Request, res: Response) {
  const users = await adminService.getAdminUsers();
  res.status(200).json(users);
}
