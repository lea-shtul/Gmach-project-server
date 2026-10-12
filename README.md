# גמ"ח שכונתי - Backend API

API ל-Backend של "גמ"ח שכונתי" - לוח גמ"חים לשכונות בני ברק. פרויקט React (Frontend) + Node/Express/PostgreSQL (Backend).

מסמכים נוספים:
- [START-HERE.md](./START-HERE.md) - מדריך פריסה צעד-אחר-צעד למי שמעולם לא העלתה שרת (GitHub, מסד נתונים חינמי, Render).
- [FRONTEND-API-GUIDE.md](./FRONTEND-API-GUIDE.md) - כל ה-Endpoints, מבני נתונים ודוגמאות JSON, בלי קוד React - למי שכותבת את ה-Frontend.

## טכנולוגיות

Node.js (LTS, 20+), Express 5, TypeScript (strict), PostgreSQL, Prisma 6, Zod, JWT (jsonwebtoken), bcryptjs, Swagger/OpenAPI 3 (swagger-ui-express), Vitest + Supertest, npm.

> **הערה על גרסאות:** בזמן ההתקנה, `prisma`/`@prisma/client` הגרסה האחרונה בפועל ב-npm הייתה גרסת 7 (ו-8 שהיא עדיין Release Candidate). גרסה 7 משנה את האופן שבו Prisma מתחבר למסד הנתונים (מחייבת driver adapters נפרדים ו-`prisma.config.ts`) - שינוי גדול שלא מתאים לפרויקט לימודי פשוט. לכן המערכת נעולה בכוונה על **Prisma 6.19.3** (גרסה יציבה, עם ה-workflow הקלאסי `datasource { url = env("DATABASE_URL") }`). זו הסיבה שבקובץ `package.json` הגרסאות של `prisma` ו-`@prisma/client` מדויקות (בלי `^`) ולא "האחרונות".

## מבנה הפרויקט

```
src/
  config/        קונפיגורציה: רשימת שכונות, enums עם תוויות בעברית, משתני סביבה
  middleware/     auth (JWT), requireAdmin, errorHandler, notFound
  validation/     סכמות Zod לכל הקלטים
  routes/         הגדרת כל ה-Endpoints (Express Router)
  controllers/    קבלת req/res, הפעלת validation, קריאה ל-services
  services/       כל הלוגיקה העסקית והגישה ל-Prisma
  utils/          AppError, serializers (עיצוב תשובות), jwt, טווחי תאריכים
  docs/           מסמך OpenAPI מלא (openapi.ts)
  scripts/        ensureAdmin.ts - יצירת מנהלת בפרודקשן בלי לדרוס נתונים
  app.ts          הרכבת ה-Express app (ללא listen)
  server.ts       הפעלת השרת בפועל
prisma/
  schema.prisma   מודל הנתונים (User, Item, LoanRequest)
  migrations/     היסטוריית מיגרציות
  seed.ts         נתוני דמו - מוחק הכול ובונה מחדש (לפיתוח בלבד!)
tests/            בדיקות Vitest + Supertest
docker-compose.yml  PostgreSQL מקומי לפיתוח (פורט 5433)
render.yaml       הגדרת פריסה ל-Render
```

## טבלאות (Prisma models)

- **User**: id, fullName, email (ייחודי), passwordHash, phone, neighborhood, role (USER/ADMIN), createdAt
- **Item**: id, ownerId, title, description, category, condition, neighborhood, isPublic, isAvailable, createdAt, updatedAt
- **LoanRequest**: id, itemId, borrowerId, startDate, endDate, message, status, borrowedAt, returnedAt, createdAt, updatedAt

רשימת השכונות הקבועה נמצאת ב-`src/config/neighborhoods.ts` (מקור יחיד לאמת - משם היא מוזרקת לוולידציה, ל-`/api/meta` ול-Seed).

## Endpoints

כל הפירוט המלא (פרמטרים, גוף בקשה, דוגמאות, קודי שגיאה) נמצא ב-Swagger (`/api-docs`) וב-[FRONTEND-API-GUIDE.md](./FRONTEND-API-GUIDE.md). בקצרה:

| קבוצה | Endpoints |
|---|---|
| כללי | `GET /api/health`, `GET /api/meta` |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Items | `GET/POST /api/items`, `GET/PUT/DELETE /api/items/:id` |
| Requests | `POST /api/requests`, `GET /api/requests/mine`, `GET /api/requests/received`, `GET /api/requests/:id`, `PATCH /api/requests/:id/status`, `GET /api/requests` (ADMIN) |
| Stats | `GET /api/stats/me`, `GET /api/stats/neighborhood`, `GET /api/admin/stats` (ADMIN), `GET /api/admin/users` (ADMIN) |

כל ה-Endpoints (חוץ מ-health/register/login) מחייבים Header: `Authorization: Bearer <token>`.

## הרשאות ותקינות - עיקרי הכללים

- USER רואה פריטים ציבוריים של כולן + את כל הפריטים שלה (גם פרטיים). פריט פרטי של אחרת → 404.
- עריכה/מחיקה של פריט - רק הבעלים או ADMIN (403 אחרת). אי אפשר למחוק פריט עם בקשה APPROVED/BORROWED (409).
- יצירת בקשה: לא על פריט של עצמי (400), הפריט חייב ציבורי+זמין (409), לא כפל-PENDING (409), לא חופף לבקשה APPROVED/BORROWED (409).
- מעברי סטטוס: הבעלים/ADMIN מבצעים PENDING→APPROVED/REJECTED, APPROVED→BORROWED, BORROWED→RETURNED. המבקשת מבצעת PENDING→CANCELLED. כל מעבר אחר → 409, מי שלא בתפקיד הנכון → 403.
- טלפון מוחזר רק בבקשה בסטטוס APPROVED/BORROWED/RETURNED, ורק לצד הרלוונטי (ולא ברשימות פריטים בכלל).
- המשתמשת המזוהה נקבעת תמיד מה-Token (JWT), לא מגוף הבקשה.

## הרצה מקומית

דורש Node.js 20+‏ ו-Docker (ל-PostgreSQL מקומי; אפשר גם מסד PostgreSQL מקומי/מרוחק אחר - רק לעדכן `DATABASE_URL`).

```bash
npm install
docker compose up -d                 # מעלה PostgreSQL מקומי על פורט 5433
cp .env.example .env                 # (אם עדיין אין .env; יש כבר אחד מוכן בפרויקט)
npm run prisma:migrate                # יוצר את הטבלאות
npm run seed                          # ממלא נתוני דמו
npm run dev                           # מריץ שרת פיתוח עם reload אוטומטי
```

השרת רץ בכתובת `http://localhost:4000`, Swagger ב-`http://localhost:4000/api-docs`.

> שימו תשומת לב: Docker Compose מעלה את PostgreSQL על **פורט 5433** ולא 5432 הרגיל, כי במחשב שעליו נבנה הפרויקט רץ כבר שירות PostgreSQL מקומי על 5432 - כדי לא להתנגש בו. אם אצלכם 5432 פנוי אפשר לשנות בחזרה ב-`docker-compose.yml` וב-`.env`, אבל אין בכך צורך.

### בדיקות

```bash
npm test
```

הפקודה מריצה אוטומטית מיגרציות על מסד נתונים **נפרד** לבדיקות (`gemach_test`, מוגדר ב-`.env.test`, נוצר אוטומטית על ידי `docker-compose.yml`) ואז מריצה את כל הבדיקות עם Vitest. הבדיקות מוחקות ומאכלסות מחדש את הטבלאות בכל `test`, ולכן **אסור** להריץ אותן מול מסד הפיתוח/הפרודקשן.

### פקודות נוספות

```bash
npm run typecheck      # בדיקת טיפוסים (tsc --noEmit)
npm run build           # בניית dist/ לפרודקשן
npm start                # הרצת הגרסה הבנויה (dist/server.js)
npm run prisma:migrate   # מיגרציה חדשה בפיתוח
```

## תוצאות שהורצו בפועל בעת הבנייה

- `npm run typecheck` → **עבר, 0 שגיאות**.
- `npm run build` → **עבר**, נוצר `dist/`.
- `npm test` → **54/54 בדיקות עברו** (5 קבצי בדיקה: auth, items, requests, stats, admin).
- שרת הופעל בפועל (`npm run dev`), ונבדקו ב-curl בהצלחה: `/api/health`, `/openapi.json`, `/api-docs`, הרשמה/התחברות, `/api/auth/me`, `/api/items` (כולל owner מוטמע בלי טלפון), `/api/stats/me` (עם מילוי אפסים), ו-`/api/admin/stats` / `/api/admin/users` עם משתמשת ADMIN.

## אבטחה ו-npm audit

- סיסמאות מוצפנות עם bcryptjs (לא נחשפות אף פעם ב-API).
- `npm audit` מדווח על 3 פגיעויות ברמת "high" - כולן ב-`deepmerge-ts`/`@prisma/config`, תלויות-פנימיות של **כלי ה-CLI של Prisma** (לא רצות בשרת עצמו, רק כש-`prisma migrate`/`generate` רצים ביד/בפריסה). אין תיקון זמין בלי downgrade ל-Prisma ישן יותר. מדובר בסיכון תאורטי-נמוך (לא קוד שרץ מול קלט ממשתמשות), אך שווה לבדוק מחדש `npm audit` בעוד כמה חודשים.
- `.gitignore` חוסם `.env*` (חוץ מ-`.env.example`) ו-`node_modules`.

## מה נשאר פתוח

כל מה שמופיע באפיון מומש ונבדק. דברים ששווה לדעת:
- אין Rate limiting / הגנת Brute-force על login - לא התבקש באפיון, ופרויקט לימודי קטן.
- הקוד לא רץ מעולם בפועל על Render (אין חשבון/פריסה בשלב הזה) - `render.yaml` מוכן, וה-START-HERE מפורט, אבל יש לבצע את הפריסה בעצמך ולדווח אם משהו לא מתנהג כצפוי.
- המספרים ב-Seed (תאריכים, כמה בקשות וכו') נבחרו ביד כדי שהגרפים יראו "חיים" - אפשר להרחיב/לשנות אותם בלי להשפיע על שום קוד אחר.
