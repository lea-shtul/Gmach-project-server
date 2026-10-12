import { prisma } from "../prisma";
import { lastNDays, lastNMonths } from "../utils/dateRanges";
import { toItemDto } from "../utils/serializers";
import type { AuthUser } from "../middleware/auth";

const LENT_STATUSES = ["BORROWED", "RETURNED"] as const;

export async function getMyStats(viewer: AuthUser) {
  const [myItemsCount, timesMyItemsLent, timesIBorrowed, pendingReceived] = await Promise.all([
    prisma.item.count({ where: { ownerId: viewer.id } }),
    prisma.loanRequest.count({
      where: { item: { ownerId: viewer.id }, status: { in: [...LENT_STATUSES] } },
    }),
    prisma.loanRequest.count({
      where: { borrowerId: viewer.id, status: { in: [...LENT_STATUSES] } },
    }),
    prisma.loanRequest.count({
      where: { item: { ownerId: viewer.id }, status: "PENDING" },
    }),
  ]);

  const months = lastNMonths(6);
  const monthly = await Promise.all(
    months.map(async (bucket) => {
      const [lent, borrowed] = await Promise.all([
        prisma.loanRequest.count({
          where: {
            item: { ownerId: viewer.id },
            borrowedAt: { gte: bucket.start, lt: bucket.end },
          },
        }),
        prisma.loanRequest.count({
          where: {
            borrowerId: viewer.id,
            borrowedAt: { gte: bucket.start, lt: bucket.end },
          },
        }),
      ]);
      return { month: bucket.label, lent, borrowed };
    }),
  );

  const topItemGroup = await prisma.loanRequest.groupBy({
    by: ["itemId"] as const,
    where: { item: { ownerId: viewer.id }, status: { in: [...LENT_STATUSES] } },
    _count: { itemId: true },
    orderBy: { _count: { itemId: "desc" } },
    take: 1,
  });

  let topItem: { id: string; title: string; count: number } | null = null;
  if (topItemGroup.length > 0) {
    const group = topItemGroup[0]!;
    const item = await prisma.item.findUnique({ where: { id: group.itemId } });
    if (item) {
      topItem = { id: item.id, title: item.title, count: group._count.itemId };
    }
  }

  return {
    totals: { myItemsCount, timesMyItemsLent, timesIBorrowed, pendingReceived },
    monthly,
    topItem,
  };
}

export async function getNeighborhoodStats(neighborhood: string) {
  const days = lastNDays(7);

  const daily = await Promise.all(
    days.map(async (bucket) => {
      const [newItems, newRequests] = await Promise.all([
        prisma.item.count({
          where: { neighborhood, createdAt: { gte: bucket.start, lt: bucket.end } },
        }),
        prisma.loanRequest.count({
          where: {
            item: { neighborhood },
            createdAt: { gte: bucket.start, lt: bucket.end },
          },
        }),
      ]);
      return { date: bucket.label, newItems, newRequests };
    }),
  );

  const weekStart = days[0]!.start;
  const weekEnd = days[days.length - 1]!.end;

  const mostRequestedGroup = await prisma.loanRequest.groupBy({
    by: ["itemId"] as const,
    where: {
      item: { neighborhood, isPublic: true },
      createdAt: { gte: weekStart, lt: weekEnd },
    },
    _count: { itemId: true },
    orderBy: { _count: { itemId: "desc" } },
    take: 5,
  });

  const mostRequested = await Promise.all(
    mostRequestedGroup.map(async (group) => {
      const item = await prisma.item.findUnique({ where: { id: group.itemId }, include: { owner: true } });
      return item ? { item: toItemDto(item), count: group._count.itemId } : null;
    }),
  );

  const newItemsThisWeek = daily.reduce((sum, day) => sum + day.newItems, 0);

  return {
    daily,
    mostRequested: mostRequested.filter((entry): entry is NonNullable<typeof entry> => entry !== null),
    newItemsThisWeek,
  };
}
