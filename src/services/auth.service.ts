import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { AppError } from "../utils/AppError";
import { signToken } from "../utils/jwt";
import { toPublicUser } from "../utils/serializers";
import * as emailService from "./email.service";
import type { RegisterInput, LoginInput } from "../validation/auth.schema";

const BCRYPT_ROUNDS = 10;

// הרשמה רגילה יוצרת תמיד USER. מנהלת נוצרת רק ב-Seed / משתני סביבה.
export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw AppError.conflict("EMAIL_TAKEN", "כתובת האימייל הזו כבר רשומה במערכת");
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      phone: input.phone,
      neighborhood: input.neighborhood,
    },
  });

  void emailService.notifyUserRegistered(user).catch((error) => {
    console.error("שליחת מייל ברוכה הבאה נכשלה:", error);
  });

  const token = signToken(user.id, user.role);
  return { token, user: toPublicUser(user) };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "אימייל או סיסמה שגויים");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError(401, "INVALID_CREDENTIALS", "אימייל או סיסמה שגויים");
  }

  const token = signToken(user.id, user.role);
  return { token, user: toPublicUser(user) };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound("המשתמשת לא נמצאה");
  }
  return toPublicUser(user);
}
