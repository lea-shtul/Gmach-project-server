import type { Request, Response } from "express";
import * as itemsService from "../services/items.service";
import { createItemSchema, listItemsQuerySchema, updateItemSchema } from "../validation/item.schema";
import { AppError } from "../utils/AppError";

function requireUser(req: Request) {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}

export async function listItemsHandler(req: Request, res: Response) {
  const viewer = requireUser(req);
  const query = listItemsQuerySchema.parse(req.query);
  const result = await itemsService.listItems(query, viewer);
  res.status(200).json(result);
}

export async function getItemHandler(req: Request, res: Response) {
  const viewer = requireUser(req);
  const item = await itemsService.getItemById(req.params.id as string, viewer);
  res.status(200).json(item);
}

export async function createItemHandler(req: Request, res: Response) {
  const viewer = requireUser(req);
  const input = createItemSchema.parse(req.body);
  const item = await itemsService.createItem(input, viewer);
  res.status(201).json(item);
}

export async function updateItemHandler(req: Request, res: Response) {
  const viewer = requireUser(req);
  const input = updateItemSchema.parse(req.body);
  const item = await itemsService.updateItem(req.params.id as string, input, viewer);
  res.status(200).json(item);
}

export async function deleteItemHandler(req: Request, res: Response) {
  const viewer = requireUser(req);
  await itemsService.deleteItem(req.params.id as string, viewer);
  res.status(204).send();
}
