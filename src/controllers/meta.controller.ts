import type { Request, Response } from "express";
import { NEIGHBORHOODS } from "../config/neighborhoods";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CONDITIONS,
  CONDITION_LABELS,
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
} from "../config/enums";

export function metaHandler(_req: Request, res: Response) {
  res.status(200).json({
    categories: CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] })),
    conditions: CONDITIONS.map((value) => ({ value, label: CONDITION_LABELS[value] })),
    neighborhoods: NEIGHBORHOODS.map((value) => ({ value, label: value })),
    statuses: REQUEST_STATUSES.map((value) => ({ value, label: REQUEST_STATUS_LABELS[value] })),
  });
}
