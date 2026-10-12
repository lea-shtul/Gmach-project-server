import bcrypt from "bcryptjs";
import { prisma } from "../src/prisma";
import { signToken } from "../src/utils/jwt";
import type { Role } from "@prisma/client";

interface CreateTestUserOptions {
  fullName?: string;
  email?: string;
  password?: string;
  phone?: string;
  neighborhood?: string;
  role?: Role;
}

let counter = 0;

export async function createTestUser(options: CreateTestUserOptions = {}) {
  counter += 1;
  const password = options.password ?? "password123";
  const user = await prisma.user.create({
    data: {
      fullName: options.fullName ?? `משתמשת בדיקה ${counter}`,
      email: options.email ?? `user${counter}@test.local`,
      passwordHash: await bcrypt.hash(password, 4),
      phone: options.phone ?? "050-0000000",
      neighborhood: options.neighborhood ?? "מרכז העיר",
      role: options.role ?? "USER",
    },
  });

  const token = signToken(user.id, user.role);
  return { user, token, password };
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
