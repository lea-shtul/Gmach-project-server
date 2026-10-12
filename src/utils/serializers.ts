import type { Item, LoanRequest, User } from "@prisma/client";

export interface PublicUserDto {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  neighborhood: string;
  role: string;
  createdAt: Date;
}

export interface BasicUserDto {
  id: string;
  fullName: string;
  neighborhood: string;
}

export interface ItemDto {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  neighborhood: string;
  isPublic: boolean;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
  owner: BasicUserDto;
}

export interface RequestDto {
  id: string;
  status: string;
  startDate: Date;
  endDate: Date;
  message: string | null;
  borrowedAt: Date | null;
  returnedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  item: {
    id: string;
    title: string;
    category: string;
    neighborhood: string;
  };
  borrower: BasicUserDto & { phone?: string };
  owner: BasicUserDto & { phone?: string };
}

// לעולם לא מחזירים passwordHash - פונקציה זו היחידה שאמורה לבנות תשובת "משתמשת" כלפי חוץ.
export function toPublicUser(user: User): PublicUserDto {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    neighborhood: user.neighborhood,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function toBasicUser(user: User): BasicUserDto {
  return {
    id: user.id,
    fullName: user.fullName,
    neighborhood: user.neighborhood,
  };
}

// פריטים ברשימות ובודדים לעולם לא חושפים טלפון - רק רשומת בקשה יכולה לחשוף טלפון, ובתנאים מסוימים.
export function toItemDto(item: Item & { owner: User }): ItemDto {
  return {
    id: item.id,
    ownerId: item.ownerId,
    title: item.title,
    description: item.description,
    category: item.category,
    condition: item.condition,
    neighborhood: item.neighborhood,
    isPublic: item.isPublic,
    isAvailable: item.isAvailable,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    owner: toBasicUser(item.owner),
  };
}

type RequestWithRelations = LoanRequest & {
  item: Item & { owner: User };
  borrower: User;
};

const PHONE_VISIBLE_STATUSES = new Set(["APPROVED", "BORROWED", "RETURNED"]);

// חשיפת טלפון: רק כש-APPROVED/BORROWED/RETURNED, ורק לצד הרלוונטי (המבקשת רואה טלפון בעלים ולהפך).
// ADMIN רואה את שני הטלפונים כחלק מהרשאת "רואה הכול".
export function toRequestDto(
  request: RequestWithRelations,
  viewer: { id: string; role: string },
): RequestDto {
  const canSeePhones = PHONE_VISIBLE_STATUSES.has(request.status);
  const isBorrower = viewer.id === request.borrowerId;
  const isOwner = viewer.id === request.item.ownerId;
  const isAdmin = viewer.role === "ADMIN";

  const borrower: BasicUserDto & { phone?: string } = toBasicUser(request.borrower);
  const owner: BasicUserDto & { phone?: string } = toBasicUser(request.item.owner);

  if (canSeePhones && (isOwner || isAdmin)) {
    borrower.phone = request.borrower.phone;
  }
  if (canSeePhones && (isBorrower || isAdmin)) {
    owner.phone = request.item.owner.phone;
  }

  return {
    id: request.id,
    status: request.status,
    startDate: request.startDate,
    endDate: request.endDate,
    message: request.message,
    borrowedAt: request.borrowedAt,
    returnedAt: request.returnedAt,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    item: {
      id: request.item.id,
      title: request.item.title,
      category: request.item.category,
      neighborhood: request.item.neighborhood,
    },
    borrower,
    owner,
  };
}
