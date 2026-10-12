import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { AppError } from "../utils/AppError";
import { toItemDto } from "../utils/serializers";
import type { CreateItemInput, ListItemsQuery, UpdateItemInput } from "../validation/item.schema";
import type { AuthUser } from "../middleware/auth";

const ITEM_WITH_OWNER = { include: { owner: true } } as const;

function buildSortOrder(sort: ListItemsQuery["sort"]): Prisma.ItemOrderByWithRelationInput {
  if (sort === "oldest") return { createdAt: "asc" };
  if (sort === "title") return { title: "asc" };
  return { createdAt: "desc" };
}

function buildWhere(query: ListItemsQuery, viewer: AuthUser): Prisma.ItemWhereInput {
  const conditions: Prisma.ItemWhereInput[] = [];

  if (query.mine) {
    conditions.push({ ownerId: viewer.id });
  } else if (viewer.role !== "ADMIN") {
    conditions.push({ OR: [{ isPublic: true }, { ownerId: viewer.id }] });
  }

  if (query.search) {
    conditions.push({
      OR: [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ],
    });
  }
  if (query.category) conditions.push({ category: query.category });
  if (query.neighborhood) conditions.push({ neighborhood: query.neighborhood });
  if (query.condition) conditions.push({ condition: query.condition });
  if (query.available !== undefined) conditions.push({ isAvailable: query.available });

  return conditions.length > 0 ? { AND: conditions } : {};
}

export async function listItems(query: ListItemsQuery, viewer: AuthUser) {
  const where = buildWhere(query, viewer);
  const orderBy = buildSortOrder(query.sort);
  const skip = (query.page - 1) * query.pageSize;

  const [items, total] = await Promise.all([
    prisma.item.findMany({ where, orderBy, skip, take: query.pageSize, include: { owner: true } }),
    prisma.item.count({ where }),
  ]);

  return {
    items: items.map(toItemDto),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export async function getItemById(id: string, viewer: AuthUser) {
  const item = await prisma.item.findUnique({ where: { id }, ...ITEM_WITH_OWNER });
  if (!item) {
    throw AppError.notFound("הפריט לא נמצא");
  }
  if (!item.isPublic && item.ownerId !== viewer.id && viewer.role !== "ADMIN") {
    throw AppError.notFound("הפריט לא נמצא");
  }
  return toItemDto(item);
}

export async function createItem(input: CreateItemInput, viewer: AuthUser) {
  const item = await prisma.item.create({
    data: { ...input, ownerId: viewer.id },
    ...ITEM_WITH_OWNER,
  });
  return toItemDto(item);
}

async function getOwnedItemOrThrow(id: string, viewer: AuthUser) {
  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) {
    throw AppError.notFound("הפריט לא נמצא");
  }
  if (item.ownerId !== viewer.id && viewer.role !== "ADMIN") {
    throw AppError.forbidden("אפשר לערוך או למחוק רק פריטים בבעלותך");
  }
  return item;
}

export async function updateItem(id: string, input: UpdateItemInput, viewer: AuthUser) {
  await getOwnedItemOrThrow(id, viewer);
  const item = await prisma.item.update({ where: { id }, data: input, ...ITEM_WITH_OWNER });
  return toItemDto(item);
}

export async function deleteItem(id: string, viewer: AuthUser) {
  await getOwnedItemOrThrow(id, viewer);

  const activeLoan = await prisma.loanRequest.findFirst({
    where: { itemId: id, status: { in: ["APPROVED", "BORROWED"] } },
  });
  if (activeLoan) {
    throw AppError.conflict(
      "ITEM_HAS_ACTIVE_LOAN",
      "אי אפשר למחוק פריט עם בקשה מאושרת או בהשאלה",
    );
  }

  await prisma.item.delete({ where: { id } });
}
