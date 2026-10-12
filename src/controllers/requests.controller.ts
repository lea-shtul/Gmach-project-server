import type { Request, Response } from "express";
import * as requestsService from "../services/requests.service";
import {
  createRequestSchema,
  requestStatusFilterSchema,
  updateRequestStatusSchema,
} from "../validation/request.schema";
import { AppError } from "../utils/AppError";

function requireUser(req: Request) {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}

export async function createRequestHandler(req: Request, res: Response) {
  const viewer = requireUser(req);
  const input = createRequestSchema.parse(req.body);
  const request = await requestsService.createRequest(input, viewer);
  res.status(201).json(request);
}

export async function listMineHandler(req: Request, res: Response) {
  const viewer = requireUser(req);
  const { status } = requestStatusFilterSchema.parse(req.query);
  const requests = await requestsService.listMine(viewer, status);
  res.status(200).json(requests);
}

export async function listReceivedHandler(req: Request, res: Response) {
  const viewer = requireUser(req);
  const { status } = requestStatusFilterSchema.parse(req.query);
  const requests = await requestsService.listReceived(viewer, status);
  res.status(200).json(requests);
}

export async function listAllHandler(req: Request, res: Response) {
  const { status } = requestStatusFilterSchema.parse(req.query);
  const requests = await requestsService.listAll(status);
  res.status(200).json(requests);
}

export async function getRequestHandler(req: Request, res: Response) {
  const viewer = requireUser(req);
  const request = await requestsService.getById(req.params.id as string, viewer);
  res.status(200).json(request);
}

export async function updateRequestStatusHandler(req: Request, res: Response) {
  const viewer = requireUser(req);
  const { status } = updateRequestStatusSchema.parse(req.body);
  const request = await requestsService.updateStatus(req.params.id as string, status, viewer);
  res.status(200).json(request);
}
