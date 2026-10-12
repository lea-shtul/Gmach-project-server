import { z } from "zod";
import { booleanQueryParamSchema, neighborhoodSchema, paginationSchema } from "./common.schema";
import { CATEGORIES, CONDITIONS, ITEM_SORT_OPTIONS } from "../config/enums";

export const createItemSchema = z.object({
  title: z.string().trim().min(2, "כותרת חייבת להיות באורך 2-80 תווים").max(80),
  description: z.string().trim().max(500, "תיאור יכול להיות עד 500 תווים").optional(),
  category: z.enum(CATEGORIES, { message: "קטגוריה לא תקינה" }),
  condition: z.enum(CONDITIONS, { message: "מצב פריט לא תקין" }),
  neighborhood: neighborhoodSchema,
  isPublic: z.boolean().optional().default(true),
  isAvailable: z.boolean().optional().default(true),
});
export type CreateItemInput = z.infer<typeof createItemSchema>;

export const updateItemSchema = createItemSchema.partial();
export type UpdateItemInput = z.infer<typeof updateItemSchema>;

export const listItemsQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional(),
  category: z.enum(CATEGORIES).optional(),
  neighborhood: neighborhoodSchema.optional(),
  condition: z.enum(CONDITIONS).optional(),
  available: booleanQueryParamSchema.optional(),
  mine: booleanQueryParamSchema.optional(),
  sort: z.enum(ITEM_SORT_OPTIONS).optional().default("newest"),
});
export type ListItemsQuery = z.infer<typeof listItemsQuerySchema>;
