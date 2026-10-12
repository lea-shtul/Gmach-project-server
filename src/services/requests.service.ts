import { prisma } from "../prisma";
import { AppError } from "../utils/AppError";
import { toRequestDto } from "../utils/serializers";
import type { AuthUser } from "../middleware/auth";
import type { CreateRequestInput } from "../validation/request.schema";
import type { RequestStatusValue } from "../config/enums";

const REQUEST_INCLUDE = { item: { include: { owner: true } }, borrower: true } as const;

const ACTIVE_STATUSES = ["APPROVED", "BORROWED"] as const;

export async function createRequest(input: CreateRequestInput, borrower: AuthUser) {
  const item = await prisma.item.findUnique({ where: { id: input.itemId } });
  if (!item) {
    throw AppError.notFound("הפריט לא נמצא");
  }

  if (item.ownerId === borrower.id) {
    throw AppError.badRequest("CANNOT_REQUEST_OWN_ITEM", "אי אפשר לבקש להשאיל פריט של עצמך");
  }

  if (!item.isPublic || !item.isAvailable) {
    throw AppError.conflict("ITEM_NOT_AVAILABLE", "הפריט אינו ציבורי וזמין להשאלה כרגע");
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (input.startDate.getTime() < today.getTime()) {
    throw AppError.badRequest("START_DATE_IN_PAST", "תאריך ההתחלה לא יכול להיות בעבר");
  }

  const existingPending = await prisma.loanRequest.findFirst({
    where: { itemId: item.id, borrowerId: borrower.id, status: "PENDING" },
  });
  if (existingPending) {
    throw AppError.conflict(
      "DUPLICATE_PENDING_REQUEST",
      "יש לך כבר בקשה ממתינה לאישור על הפריט הזה",
    );
  }

  const overlapping = await prisma.loanRequest.findFirst({
    where: {
      itemId: item.id,
      status: { in: [...ACTIVE_STATUSES] },
      startDate: { lte: input.endDate },
      endDate: { gte: input.startDate },
    },
  });
  if (overlapping) {
    throw AppError.conflict(
      "DATE_OVERLAP",
      "התאריכים חופפים לבקשה מאושרת/בהשאלה קיימת על הפריט",
    );
  }

  const created = await prisma.loanRequest.create({
    data: {
      itemId: item.id,
      borrowerId: borrower.id,
      startDate: input.startDate,
      endDate: input.endDate,
      message: input.message,
    },
    include: REQUEST_INCLUDE,
  });

  return toRequestDto(created, borrower);
}

export async function listMine(borrower: AuthUser, status?: RequestStatusValue) {
  const requests = await prisma.loanRequest.findMany({
    where: { borrowerId: borrower.id, ...(status ? { status } : {}) },
    include: REQUEST_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return requests.map((request) => toRequestDto(request, borrower));
}

export async function listReceived(owner: AuthUser, status?: RequestStatusValue) {
  const requests = await prisma.loanRequest.findMany({
    where: { item: { ownerId: owner.id }, ...(status ? { status } : {}) },
    include: REQUEST_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return requests.map((request) => toRequestDto(request, owner));
}

export async function listAll(status?: RequestStatusValue) {
  const requests = await prisma.loanRequest.findMany({
    where: status ? { status } : {},
    include: REQUEST_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return requests.map((request) => toRequestDto(request, { id: "", role: "ADMIN" }));
}

export async function getById(id: string, viewer: AuthUser) {
  const request = await prisma.loanRequest.findUnique({ where: { id }, include: REQUEST_INCLUDE });
  if (!request) {
    throw AppError.notFound("הבקשה לא נמצאה");
  }

  const isBorrower = viewer.id === request.borrowerId;
  const isOwner = viewer.id === request.item.ownerId;
  const isAdmin = viewer.role === "ADMIN";
  if (!isBorrower && !isOwner && !isAdmin) {
    throw AppError.forbidden("אין הרשאה לצפות בבקשה הזו");
  }

  return toRequestDto(request, viewer);
}

const OWNER_TRANSITIONS: Record<string, RequestStatusValue[]> = {
  PENDING: ["APPROVED", "REJECTED"],
  APPROVED: ["BORROWED"],
  BORROWED: ["RETURNED"],
};

const BORROWER_TRANSITIONS: Record<string, RequestStatusValue[]> = {
  PENDING: ["CANCELLED"],
};

export async function updateStatus(id: string, target: RequestStatusValue, viewer: AuthUser) {
  const request = await prisma.loanRequest.findUnique({ where: { id }, include: REQUEST_INCLUDE });
  if (!request) {
    throw AppError.notFound("הבקשה לא נמצאה");
  }

  const isOwnerActor = viewer.id === request.item.ownerId || viewer.role === "ADMIN";
  const isBorrowerActor = viewer.id === request.borrowerId;

  const validOwnerTransition = OWNER_TRANSITIONS[request.status]?.includes(target) ?? false;
  const validBorrowerTransition = BORROWER_TRANSITIONS[request.status]?.includes(target) ?? false;

  if (!validOwnerTransition && !validBorrowerTransition) {
    throw AppError.conflict(
      "INVALID_STATUS_TRANSITION",
      `מעבר סטטוס מ-${request.status} ל-${target} לא אפשרי`,
    );
  }
  if (validOwnerTransition && !isOwnerActor) {
    throw AppError.forbidden("רק הבעלים או מנהלת יכולים לבצע מעבר סטטוס זה");
  }
  if (validBorrowerTransition && !isBorrowerActor) {
    throw AppError.forbidden("רק המבקשת יכולה לבטל את הבקשה שלה");
  }

  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.loanRequest.update({
      where: { id },
      data: {
        status: target,
        ...(target === "BORROWED" ? { borrowedAt: now } : {}),
        ...(target === "RETURNED" ? { returnedAt: now } : {}),
      },
      include: REQUEST_INCLUDE,
    });

    if (target === "BORROWED") {
      await tx.item.update({ where: { id: request.itemId }, data: { isAvailable: false } });
    }
    if (target === "RETURNED") {
      await tx.item.update({ where: { id: request.itemId }, data: { isAvailable: true } });
    }

    return updatedRequest;
  });

  return toRequestDto(updated, viewer);
}
