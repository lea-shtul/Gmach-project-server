import { z } from "zod";
import { NEIGHBORHOODS } from "../config/neighborhoods";

export const neighborhoodSchema = z.enum(NEIGHBORHOODS, {
  message: "שכונה לא מופיעה ברשימת השכונות המותרות",
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(12),
});

// פרמטרי query מגיעים כמחרוזת. z.coerce.boolean() היה הופך כל מחרוזת לא ריקה (כולל "false") ל-true,
// אז צריך המרה מפורשת של "true"/"false".
export const booleanQueryParamSchema = z
  .enum(["true", "false"], { message: "ערך חייב להיות true או false" })
  .transform((value) => value === "true");

