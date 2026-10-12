// הגדרות ה-Enum של האפליקציה, עם תוויות בעברית לתצוגה (משמש ב-GET /api/meta).

export const CATEGORIES = ["BABY", "KITCHEN", "EVENTS", "BOOKS", "HOLIDAY", "TOOLS", "OTHER"] as const;
export type CategoryValue = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<CategoryValue, string> = {
  BABY: "תינוקות",
  KITCHEN: "מטבח",
  EVENTS: "אירועים",
  BOOKS: "ספרים",
  HOLIDAY: "חגים",
  TOOLS: "כלי עבודה",
  OTHER: "אחר",
};

export const CONDITIONS = ["NEW", "GOOD", "FAIR"] as const;
export type ConditionValue = (typeof CONDITIONS)[number];

export const CONDITION_LABELS: Record<ConditionValue, string> = {
  NEW: "חדש",
  GOOD: "טוב",
  FAIR: "שמיש",
};

export const REQUEST_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "BORROWED",
  "RETURNED",
  "CANCELLED",
] as const;
export type RequestStatusValue = (typeof REQUEST_STATUSES)[number];

export const REQUEST_STATUS_LABELS: Record<RequestStatusValue, string> = {
  PENDING: "ממתינה לאישור",
  APPROVED: "אושרה",
  REJECTED: "נדחתה",
  BORROWED: "בהשאלה",
  RETURNED: "הוחזרה",
  CANCELLED: "בוטלה",
};

export const ITEM_SORT_OPTIONS = ["newest", "oldest", "title"] as const;
export type ItemSortValue = (typeof ITEM_SORT_OPTIONS)[number];
