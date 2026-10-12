import { z } from "zod";
import { neighborhoodSchema } from "./common.schema";

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "שם מלא חייב להיות באורך 2 תווים לפחות").max(80),
  email: z.email("כתובת אימייל לא תקינה").trim().toLowerCase(),
  password: z.string().min(6, "סיסמה חייבת להיות באורך 6 תווים לפחות").max(72),
  phone: z.string().trim().min(7, "מספר טלפון לא תקין").max(20),
  neighborhood: neighborhoodSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email("כתובת אימייל לא תקינה").trim().toLowerCase(),
  password: z.string().min(1, "נדרשת סיסמה"),
});
export type LoginInput = z.infer<typeof loginSchema>;
