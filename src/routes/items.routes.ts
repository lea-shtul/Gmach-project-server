import { Router } from "express";
import {
  createItemHandler,
  deleteItemHandler,
  getItemHandler,
  listItemsHandler,
  updateItemHandler,
} from "../controllers/items.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const itemsRouter = Router();

itemsRouter.use(requireAuth);

itemsRouter.get("/", asyncHandler(listItemsHandler));
itemsRouter.post("/", asyncHandler(createItemHandler));
itemsRouter.get("/:id", asyncHandler(getItemHandler));
itemsRouter.put("/:id", asyncHandler(updateItemHandler));
itemsRouter.delete("/:id", asyncHandler(deleteItemHandler));
