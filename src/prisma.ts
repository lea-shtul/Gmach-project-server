import { PrismaClient } from "@prisma/client";

// מופע יחיד של Prisma Client לכל התהליך, כדי לא לפתוח חיבורים מיותרים למסד הנתונים.
export const prisma = new PrismaClient();
