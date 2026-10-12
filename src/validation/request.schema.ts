import { z } from "zod";
import { REQUEST_STATUSES } from "../config/enums";

const isoDate = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "תאריך לא תקין")
  .transform((value) => new Date(value));

export const createRequestSchema = z
  .object({
    itemId: z.uuid("מזהה פריט לא תקין"),
    startDate: isoDate,
    endDate: isoDate,
    message: z.string().trim().max(300, "הודעה יכולה להיות עד 300 תווים").optional(),
  })
  .refine((data) => data.endDate.getTime() >= data.startDate.getTime(), {
    message: "תאריך סיום חייב להיות אחרי תאריך התחלה או שווה לו",
    path: ["endDate"],
  });
export type CreateRequestInput = z.infer<typeof createRequestSchema>;

export const updateRequestStatusSchema = z.object({
  status: z.enum(REQUEST_STATUSES, { message: "סטטוס לא תקין" }),
});
export type UpdateRequestStatusInput = z.infer<typeof updateRequestStatusSchema>;

export const requestStatusFilterSchema = z.object({
  status: z.enum(REQUEST_STATUSES).optional(),
});
