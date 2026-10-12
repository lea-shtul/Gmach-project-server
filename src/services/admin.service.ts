import { prisma } from "../prisma";
import { CATEGORIES, REQUEST_STATUSES } from "../config/enums";
import { lastNMonths } from "../utils/dateRanges";
import { toPublicUser } from "../utils/serializers";

const ACTIVE_LOAN_STATUSES = ["APPROVED", "BORROWED"] as const;

export async function getAdminStats() {
  const [users, items, activeLoans, pendingRequests] = await Promise.all([
    prisma.user.count(),
    prisma.item.count(),
    prisma.loanRequest.count({ where: { status: { in: [...ACTIVE_LOAN_STATUSES] } } }),
    prisma.loanRequest.count({ where: { status: "PENDING" } }),
  ]);

  const byCategory = await Promise.all(
    CATEGORIES.map(async (category) => {
      const [itemsCount, requestsCount] = await Promise.all([
        prisma.item.count({ where: { category } }),
        prisma.loanRequest.count({ where: { item: { category } } }),
      ]);
      return { category, items: itemsCount, requests: requestsCount };
    }),
  );

  const byStatus = await Promise.all(
    REQUEST_STATUSES.map(async (status) => {
      const count = await prisma.loanRequest.count({ where: { status } });
      return { status, count };
    }),
  );

  const months = lastNMonths(6);
  const monthlyRequests = await Promise.all(
    months.map(async (bucket) => {
      const count = await prisma.loanRequest.count({
        where: { createdAt: { gte: bucket.start, lt: bucket.end } },
      });
      return { month: bucket.label, count };
    }),
  );

  return {
    totals: { users, items, activeLoans, pendingRequests },
    byCategory,
    byStatus,
    monthlyRequests,
  };
}

export async function getAdminUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { items: true, loanRequests: true } } },
  });

  return users.map((user) => ({
    ...toPublicUser(user),
    itemsCount: user._count.items,
    requestsCount: user._count.loanRequests,
  }));
}
