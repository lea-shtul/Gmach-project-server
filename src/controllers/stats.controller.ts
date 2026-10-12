import type { Request, Response } from "express";
import * as statsService from "../services/stats.service";
import { AppError } from "../utils/AppError";
import { neighborhoodSchema } from "../validation/common.schema";
import { prisma } from "../prisma";

export async function myStatsHandler(req: Request, res: Response) {
  if (!req.user) throw AppError.unauthorized();
  const stats = await statsService.getMyStats(req.user);
  res.status(200).json(stats);
}

export async function neighborhoodStatsHandler(req: Request, res: Response) {
  if (!req.user) throw AppError.unauthorized();

  let neighborhood: string;
  if (req.query.neighborhood) {
    neighborhood = neighborhoodSchema.parse(req.query.neighborhood);
  } else {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user.id } });
    neighborhood = user.neighborhood;
  }

  const stats = await statsService.getNeighborhoodStats(neighborhood);
  res.status(200).json(stats);
}
