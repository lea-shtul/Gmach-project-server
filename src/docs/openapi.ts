import { NEIGHBORHOODS } from "../config/neighborhoods";
import { CATEGORIES, CONDITIONS, REQUEST_STATUSES, ITEM_SORT_OPTIONS } from "../config/enums";

const errorResponse = (description: string, example: Record<string, unknown>) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
      example,
    },
  },
});

const bearerSecurity = [{ bearerAuth: [] }];

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "גמ\"ח שכונתי - API",
    version: "1.0.0",
    description:
      "API ללוח גמ\"חים שכונתי בבני ברק: פרסום פריטים להשאלה, שליחת וניהול בקשות השאלה, גרפים אישיים ושכונתיים, ולוח בקרה למנהלת.",
  },
  servers: [{ url: "/", description: "שרת נוכחי" }],
  tags: [
    { name: "General", description: "בריאות השרת ורשימות בחירה" },
    { name: "Auth", description: "הרשמה, התחברות וזהות" },
    { name: "Items", description: "ניהול פריטים להשאלה" },
    { name: "Requests", description: "בקשות השאלה" },
    { name: "Stats", description: "גרפים ולוח בקרה" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "יש להתחבר עם POST /api/auth/login ולהדביק את ה-token שהתקבל",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "נתונים לא תקינים" },
              details: { type: "object", nullable: true },
            },
            required: ["code", "message"],
          },
        },
        required: ["error"],
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          fullName: { type: "string", example: "דנה כהן" },
          email: { type: "string", format: "email", example: "dana@example.com" },
          phone: { type: "string", example: "050-1234567" },
          neighborhood: { type: "string", enum: NEIGHBORHOODS, example: "פרדס כץ" },
          role: { type: "string", enum: ["USER", "ADMIN"], example: "USER" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      AdminUser: {
        allOf: [
          { $ref: "#/components/schemas/User" },
          {
            type: "object",
            properties: {
              itemsCount: { type: "integer", example: 4 },
              requestsCount: { type: "integer", example: 7 },
            },
          },
        ],
      },
      RegisterInput: {
        type: "object",
        required: ["fullName", "email", "password", "phone", "neighborhood"],
        properties: {
          fullName: { type: "string", minLength: 2, maxLength: 80, example: "דנה כהן" },
          email: { type: "string", format: "email", example: "dana@example.com" },
          password: { type: "string", minLength: 6, maxLength: 72, example: "mySecret1" },
          phone: { type: "string", example: "050-1234567" },
          neighborhood: { type: "string", enum: NEIGHBORHOODS, example: "פרדס כץ" },
        },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "dana@example.com" },
          password: { type: "string", example: "mySecret1" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          token: { type: "string" },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      MetaOption: {
        type: "object",
        properties: {
          value: { type: "string" },
          label: { type: "string" },
        },
      },
      MetaResponse: {
        type: "object",
        properties: {
          categories: { type: "array", items: { $ref: "#/components/schemas/MetaOption" } },
          conditions: { type: "array", items: { $ref: "#/components/schemas/MetaOption" } },
          neighborhoods: { type: "array", items: { $ref: "#/components/schemas/MetaOption" } },
          statuses: { type: "array", items: { $ref: "#/components/schemas/MetaOption" } },
        },
      },
      ItemOwner: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          fullName: { type: "string" },
          neighborhood: { type: "string" },
        },
      },
      Item: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          ownerId: { type: "string", format: "uuid" },
          title: { type: "string", example: "עגלת תינוק" },
          description: { type: "string", nullable: true, example: "עגלה מתקפלת, מצב טוב" },
          category: { type: "string", enum: CATEGORIES },
          condition: { type: "string", enum: CONDITIONS },
          neighborhood: { type: "string", enum: NEIGHBORHOODS },
          isPublic: { type: "boolean" },
          isAvailable: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          owner: { $ref: "#/components/schemas/ItemOwner" },
        },
      },
      CreateItemInput: {
        type: "object",
        required: ["title", "category", "condition", "neighborhood"],
        properties: {
          title: { type: "string", minLength: 2, maxLength: 80, example: "עגלת תינוק" },
          description: { type: "string", maxLength: 500 },
          category: { type: "string", enum: CATEGORIES },
          condition: { type: "string", enum: CONDITIONS },
          neighborhood: { type: "string", enum: NEIGHBORHOODS },
          isPublic: { type: "boolean", default: true },
          isAvailable: { type: "boolean", default: true },
        },
      },
      UpdateItemInput: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 2, maxLength: 80 },
          description: { type: "string", maxLength: 500 },
          category: { type: "string", enum: CATEGORIES },
          condition: { type: "string", enum: CONDITIONS },
          neighborhood: { type: "string", enum: NEIGHBORHOODS },
          isPublic: { type: "boolean" },
          isAvailable: { type: "boolean" },
        },
      },
      ItemListResponse: {
        type: "object",
        properties: {
          items: { type: "array", items: { $ref: "#/components/schemas/Item" } },
          total: { type: "integer", example: 42 },
          page: { type: "integer", example: 1 },
          pageSize: { type: "integer", example: 12 },
        },
      },
      RequestItemSummary: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          category: { type: "string", enum: CATEGORIES },
          neighborhood: { type: "string", enum: NEIGHBORHOODS },
        },
      },
      RequestPerson: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          fullName: { type: "string" },
          neighborhood: { type: "string" },
          phone: {
            type: "string",
            description: "מוחזר רק אם הבקשה APPROVED/BORROWED/RETURNED ורק לצד הרלוונטי",
          },
        },
      },
      LoanRequest: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          status: { type: "string", enum: REQUEST_STATUSES },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time" },
          message: { type: "string", nullable: true },
          borrowedAt: { type: "string", format: "date-time", nullable: true },
          returnedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          item: { $ref: "#/components/schemas/RequestItemSummary" },
          borrower: { $ref: "#/components/schemas/RequestPerson" },
          owner: { $ref: "#/components/schemas/RequestPerson" },
        },
      },
      CreateRequestInput: {
        type: "object",
        required: ["itemId", "startDate", "endDate"],
        properties: {
          itemId: { type: "string", format: "uuid" },
          startDate: { type: "string", format: "date", example: "2026-11-01" },
          endDate: { type: "string", format: "date", example: "2026-11-05" },
          message: { type: "string", maxLength: 300 },
        },
      },
      UpdateRequestStatusInput: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: REQUEST_STATUSES },
        },
      },
      MyStatsResponse: {
        type: "object",
        properties: {
          totals: {
            type: "object",
            properties: {
              myItemsCount: { type: "integer" },
              timesMyItemsLent: { type: "integer" },
              timesIBorrowed: { type: "integer" },
              pendingReceived: { type: "integer" },
            },
          },
          monthly: {
            type: "array",
            items: {
              type: "object",
              properties: {
                month: { type: "string", example: "2026-05" },
                lent: { type: "integer" },
                borrowed: { type: "integer" },
              },
            },
          },
          topItem: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "string", format: "uuid" },
              title: { type: "string" },
              count: { type: "integer" },
            },
          },
        },
      },
      NeighborhoodStatsResponse: {
        type: "object",
        properties: {
          daily: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string", example: "2026-10-12" },
                newItems: { type: "integer" },
                newRequests: { type: "integer" },
              },
            },
          },
          mostRequested: {
            type: "array",
            items: {
              type: "object",
              properties: {
                item: { $ref: "#/components/schemas/Item" },
                count: { type: "integer" },
              },
            },
          },
          newItemsThisWeek: { type: "integer" },
        },
      },
      AdminStatsResponse: {
        type: "object",
        properties: {
          totals: {
            type: "object",
            properties: {
              users: { type: "integer" },
              items: { type: "integer" },
              activeLoans: { type: "integer" },
              pendingRequests: { type: "integer" },
            },
          },
          byCategory: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string", enum: CATEGORIES },
                items: { type: "integer" },
                requests: { type: "integer" },
              },
            },
          },
          byStatus: {
            type: "array",
            items: {
              type: "object",
              properties: {
                status: { type: "string", enum: REQUEST_STATUSES },
                count: { type: "integer" },
              },
            },
          },
          monthlyRequests: {
            type: "array",
            items: {
              type: "object",
              properties: {
                month: { type: "string", example: "2026-05" },
                count: { type: "integer" },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["General"],
        summary: "בדיקת תקינות השרת",
        responses: {
          "200": {
            description: "השרת פעיל",
            content: {
              "application/json": {
                example: { status: "ok", time: "2026-10-12T10:00:00.000Z" },
              },
            },
          },
        },
      },
    },
    "/api/meta": {
      get: {
        tags: ["General"],
        summary: "רשימות בחירה (קטגוריות, מצבים, שכונות, סטטוסים)",
        responses: {
          "200": {
            description: "רשימות בחירה עם תוויות בעברית",
            content: { "application/json": { schema: { $ref: "#/components/schemas/MetaResponse" } } },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "הרשמה (יוצרת תמיד USER)",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterInput" } } },
        },
        responses: {
          "201": {
            description: "נרשמה בהצלחה",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
          },
          "400": errorResponse("נתונים לא תקינים", {
            error: { code: "VALIDATION_ERROR", message: "נתונים לא תקינים" },
          }),
          "409": errorResponse("האימייל כבר רשום", {
            error: { code: "EMAIL_TAKEN", message: "כתובת האימייל הזו כבר רשומה במערכת" },
          }),
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "התחברות",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginInput" } } },
        },
        responses: {
          "200": {
            description: "התחברות הצליחה",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
          },
          "401": errorResponse("אימייל או סיסמה שגויים", {
            error: { code: "INVALID_CREDENTIALS", message: "אימייל או סיסמה שגויים" },
          }),
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "פרטי המשתמשת המחוברת",
        security: bearerSecurity,
        responses: {
          "200": {
            description: "פרטי המשתמשת",
            content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } },
          },
          "401": errorResponse("אין Token תקין", {
            error: { code: "UNAUTHORIZED", message: "נדרש Token בכתיבה: Bearer <token>" },
          }),
        },
      },
    },
    "/api/items": {
      get: {
        tags: ["Items"],
        summary: "רשימת פריטים עם חיפוש, סינון ודפדוף",
        security: bearerSecurity,
        parameters: [
          { name: "search", in: "query", schema: { type: "string" }, description: "חיפוש בכותרת/תיאור" },
          { name: "category", in: "query", schema: { type: "string", enum: CATEGORIES } },
          { name: "neighborhood", in: "query", schema: { type: "string", enum: NEIGHBORHOODS } },
          { name: "condition", in: "query", schema: { type: "string", enum: CONDITIONS } },
          { name: "available", in: "query", schema: { type: "boolean" } },
          { name: "mine", in: "query", schema: { type: "boolean" }, description: "רק הפריטים שלי" },
          { name: "sort", in: "query", schema: { type: "string", enum: ITEM_SORT_OPTIONS } },
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 50, default: 12 } },
        ],
        responses: {
          "200": {
            description: "רשימת פריטים",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ItemListResponse" } } },
          },
          "401": errorResponse("אין Token תקין", { error: { code: "UNAUTHORIZED", message: "נדרשת התחברות" } }),
        },
      },
      post: {
        tags: ["Items"],
        summary: "יצירת פריט חדש",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateItemInput" } } },
        },
        responses: {
          "201": {
            description: "הפריט נוצר",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Item" } } },
          },
          "400": errorResponse("נתונים לא תקינים", {
            error: { code: "VALIDATION_ERROR", message: "נתונים לא תקינים" },
          }),
        },
      },
    },
    "/api/items/{id}": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      get: {
        tags: ["Items"],
        summary: "פרטי פריט בודד",
        security: bearerSecurity,
        responses: {
          "200": {
            description: "פרטי הפריט",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Item" } } },
          },
          "404": errorResponse("הפריט לא נמצא או פרטי", {
            error: { code: "NOT_FOUND", message: "הפריט לא נמצא" },
          }),
        },
      },
      put: {
        tags: ["Items"],
        summary: "עדכון פריט (בעלים או ADMIN בלבד)",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateItemInput" } } },
        },
        responses: {
          "200": {
            description: "הפריט עודכן",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Item" } } },
          },
          "403": errorResponse("אין הרשאה", {
            error: { code: "FORBIDDEN", message: "אפשר לערוך או למחוק רק פריטים בבעלותך" },
          }),
          "404": errorResponse("הפריט לא נמצא", { error: { code: "NOT_FOUND", message: "הפריט לא נמצא" } }),
        },
      },
      delete: {
        tags: ["Items"],
        summary: "מחיקת פריט (בעלים או ADMIN בלבד)",
        security: bearerSecurity,
        responses: {
          "204": { description: "הפריט נמחק" },
          "403": errorResponse("אין הרשאה", {
            error: { code: "FORBIDDEN", message: "אפשר לערוך או למחוק רק פריטים בבעלותך" },
          }),
          "404": errorResponse("הפריט לא נמצא", { error: { code: "NOT_FOUND", message: "הפריט לא נמצא" } }),
          "409": errorResponse("לא ניתן למחוק - יש השאלה פעילה", {
            error: { code: "ITEM_HAS_ACTIVE_LOAN", message: "אי אפשר למחוק פריט עם בקשה מאושרת או בהשאלה" },
          }),
        },
      },
    },
    "/api/requests": {
      post: {
        tags: ["Requests"],
        summary: "שליחת בקשת השאלה",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateRequestInput" } } },
        },
        responses: {
          "201": {
            description: "הבקשה נשלחה",
            content: { "application/json": { schema: { $ref: "#/components/schemas/LoanRequest" } } },
          },
          "400": errorResponse("בקשה על פריט של עצמי / תאריך בעבר", {
            error: { code: "CANNOT_REQUEST_OWN_ITEM", message: "אי אפשר לבקש להשאיל פריט של עצמך" },
          }),
          "409": errorResponse("הפריט לא זמין / כפילות / חפיפת תאריכים", {
            error: { code: "ITEM_NOT_AVAILABLE", message: "הפריט אינו ציבורי וזמין להשאלה כרגע" },
          }),
        },
      },
      get: {
        tags: ["Requests"],
        summary: "כל הבקשות במערכת (ADMIN בלבד)",
        security: bearerSecurity,
        parameters: [{ name: "status", in: "query", schema: { type: "string", enum: REQUEST_STATUSES } }],
        responses: {
          "200": {
            description: "רשימת כל הבקשות",
            content: {
              "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/LoanRequest" } } },
            },
          },
          "403": errorResponse("אין הרשאה", { error: { code: "FORBIDDEN", message: "הפעולה מותרת למנהלת בלבד" } }),
        },
      },
    },
    "/api/requests/mine": {
      get: {
        tags: ["Requests"],
        summary: "הבקשות ששלחתי",
        security: bearerSecurity,
        parameters: [{ name: "status", in: "query", schema: { type: "string", enum: REQUEST_STATUSES } }],
        responses: {
          "200": {
            description: "רשימת הבקשות ששלחתי",
            content: {
              "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/LoanRequest" } } },
            },
          },
        },
      },
    },
    "/api/requests/received": {
      get: {
        tags: ["Requests"],
        summary: "בקשות שקיבלתי על הפריטים שלי",
        security: bearerSecurity,
        parameters: [{ name: "status", in: "query", schema: { type: "string", enum: REQUEST_STATUSES } }],
        responses: {
          "200": {
            description: "רשימת הבקשות שהתקבלו",
            content: {
              "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/LoanRequest" } } },
            },
          },
        },
      },
    },
    "/api/requests/{id}": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      get: {
        tags: ["Requests"],
        summary: "פרטי בקשה (המבקשת, הבעלים או ADMIN בלבד)",
        security: bearerSecurity,
        responses: {
          "200": {
            description: "פרטי הבקשה",
            content: { "application/json": { schema: { $ref: "#/components/schemas/LoanRequest" } } },
          },
          "403": errorResponse("אין הרשאה", { error: { code: "FORBIDDEN", message: "אין הרשאה לצפות בבקשה הזו" } }),
          "404": errorResponse("הבקשה לא נמצאה", { error: { code: "NOT_FOUND", message: "הבקשה לא נמצאה" } }),
        },
      },
    },
    "/api/requests/{id}/status": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      patch: {
        tags: ["Requests"],
        summary: "עדכון סטטוס בקשה (מעברים מוגבלים לפי תפקיד)",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateRequestStatusInput" } } },
        },
        responses: {
          "200": {
            description: "הסטטוס עודכן",
            content: { "application/json": { schema: { $ref: "#/components/schemas/LoanRequest" } } },
          },
          "403": errorResponse("אין הרשאה לביצוע מעבר זה", {
            error: { code: "FORBIDDEN", message: "רק הבעלים או מנהלת יכולים לבצע מעבר סטטוס זה" },
          }),
          "409": errorResponse("מעבר סטטוס לא חוקי", {
            error: { code: "INVALID_STATUS_TRANSITION", message: "מעבר סטטוס מ-PENDING ל-RETURNED לא אפשרי" },
          }),
        },
      },
    },
    "/api/stats/me": {
      get: {
        tags: ["Stats"],
        summary: "ההשפעה שלי - נתונים אישיים לגרפים",
        security: bearerSecurity,
        responses: {
          "200": {
            description: "נתוני ההשפעה האישית",
            content: { "application/json": { schema: { $ref: "#/components/schemas/MyStatsResponse" } } },
          },
        },
      },
    },
    "/api/stats/neighborhood": {
      get: {
        tags: ["Stats"],
        summary: "מה קורה בשכונה",
        security: bearerSecurity,
        parameters: [
          {
            name: "neighborhood",
            in: "query",
            schema: { type: "string", enum: NEIGHBORHOODS },
            description: "ברירת מחדל: השכונה של המשתמשת המחוברת",
          },
        ],
        responses: {
          "200": {
            description: "נתוני השכונה",
            content: { "application/json": { schema: { $ref: "#/components/schemas/NeighborhoodStatsResponse" } } },
          },
        },
      },
    },
    "/api/admin/stats": {
      get: {
        tags: ["Stats"],
        summary: "לוח בקרה כללי (ADMIN בלבד)",
        security: bearerSecurity,
        responses: {
          "200": {
            description: "נתוני לוח הבקרה",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AdminStatsResponse" } } },
          },
          "403": errorResponse("אין הרשאה", { error: { code: "FORBIDDEN", message: "הפעולה מותרת למנהלת בלבד" } }),
        },
      },
    },
    "/api/admin/users": {
      get: {
        tags: ["Stats"],
        summary: "רשימת משתמשות (ADMIN בלבד)",
        security: bearerSecurity,
        responses: {
          "200": {
            description: "רשימת המשתמשות",
            content: {
              "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/AdminUser" } } },
            },
          },
          "403": errorResponse("אין הרשאה", { error: { code: "FORBIDDEN", message: "הפעולה מותרת למנהלת בלבד" } }),
        },
      },
    },
  },
};
