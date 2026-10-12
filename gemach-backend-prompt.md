# בניית Backend מלא — "גמ"ח שכונתי" (פרויקט React)

אתה מפתח Backend בכיר ומדריך אישי לתלמידה. אני בונה פרויקט גמר ב־React + TypeScript, ואתה בונה עבורי את כל צד השרת ומסד הנתונים, מקצה לקצה, בתיקייה הנוכחית.

## כללי יסוד

1. דבר איתי בעברית פשוטה.
2. האפיון כבר סגור (מופיע למטה). אל תראיין אותי מחדש. אם משהו בו לא ברור או סותר, שאל רק על זה.
3. לפני שאתה כותב קוד: הצג לי סיכום קצר של תכנון הטבלאות וה־Endpoints לפי האפיון, ציין אם יש משהו שהיית משנה ולמה, ועצור. אחרי שאכתוב "מאשרת" — בנה הכול ללא אישורים נוספים.
4. צור קבצים אמיתיים בתיקייה. אל תכתוב פסאודו־קוד או TODO במקום פונקציונליות.
5. אל תטען שהרצת בדיקות או שמשהו עובד אם לא בדקת בפועל.
6. אל תוסיף יכולות שלא מופיעות באפיון. פרויקט קטן, נקי וקל להסבר.
7. אין להשתמש בשירותי AI או בשירות בתשלום כדי שהמערכת תפעל.

## הגבלה מחייבת — React נכתב על ידי בלבד

אסור לך לכתוב קוד React מכל סוג: קומפוננטות, Hooks, Router, React Hook Form, React Query, Context/Redux, טפסים או UI.
מותר ורצוי: תיעוד API, דוגמאות JSON, מבני נתונים (TypeScript interfaces לתשובות השרת מותרים בתוך קובץ התיעוד), והסבר איזה Endpoint משרת כל מסך.

---

## האפיון

### הרעיון
לוח גמ"חים לכל שכונות בני ברק: משתמשות מפרסמות פריטים שהן מוכנות להשאיל (עגלה, כלי אירוח, ספרים, כלים לחגים, כלי עבודה), ומשתמשות אחרות שולחות בקשת השאלה. הבעלים מאשרת או דוחה, ומנהלת את ההשאלה עד ההחזרה. יש גרפים אישיים, גרף פעילות שכונתית ולוח בקרה למנהלת.

### סוגי משתמשים
- **USER (משתמשת רגילה):** נרשמת, מפרסמת ועורכת את הפריטים שלה, רואה את הפריטים שלה ואת כל הפריטים הציבוריים של אחרות, שולחת בקשות השאלה, מנהלת בקשות שקיבלה, רואה גרפים אישיים ושכונתיים.
- **ADMIN (מנהלת):** רואה ועורכת/מוחקת את כל הפריטים (כולל פרטיים), רואה את כל הבקשות, רואה רשימת משתמשות ולוח בקרה כללי. הרשמה רגילה תמיד יוצרת USER; מנהלת נוצרת רק ב־Seed או במשתני סביבה.

### טבלאות

**User**
- id, fullName, email (ייחודי), passwordHash, phone, neighborhood, role (USER / ADMIN, ברירת מחדל USER), createdAt

**Item (פריט)**
- id, ownerId → User
- title (חובה, 2–80 תווים), description (עד 500 תווים)
- category: BABY / KITCHEN / EVENTS / BOOKS / HOLIDAY / TOOLS / OTHER
- condition: NEW / GOOD / FAIR
- neighborhood (מתוך רשימה קבועה)
- isPublic (ברירת מחדל true), isAvailable (ברירת מחדל true)
- createdAt, updatedAt

**LoanRequest (בקשת השאלה)**
- id, itemId → Item, borrowerId → User
- startDate, endDate, message (אופציונלי, עד 300 תווים)
- status: PENDING / APPROVED / REJECTED / BORROWED / RETURNED / CANCELLED
- borrowedAt, returnedAt (מתמלאים במעבר הסטטוס, נדרשים לגרפים)
- createdAt, updatedAt

**שכונות:** האפליקציה משרתת את כל העיר בני ברק. רשימת השכונות קבועה, מוגדרת בקובץ config אחד, ומשמשת גם לוולידציה, גם ל־Endpoint של אפשרויות בחירה וגם ל־Seed:
גבעת רוקח, זכרון מאיר, מרכז העיר, פרדס כץ, קריית הרצוג, רמת אהרן, רמת אלחנן, נווה אחיעזר, גני גד, שיכון ג', שיכון ה', שיכון ו', קריית ויז'ניץ.

השכונה של הפריט נפרדת מהשכונה של המשתמשת: כל משתמשת יכולה לפרסם פריט בכל שכונה. השכונה של המשתמשת משמשת רק כברירת מחדל (לטופס ולגרף "מה קורה בשכונה").

### חוקי הרשאות ותקינות (נאכפים בשרת)

**נראות פריטים**
- USER מקבלת ברשימה: פריטים ציבוריים של כולן + כל הפריטים שלה (גם פרטיים).
- פריט פרטי של משתמשת אחרת → 404 עבור USER.
- ADMIN רואה הכול.

**עריכה/מחיקה של פריט:** רק הבעלים או ADMIN, אחרת 403. אי אפשר למחוק פריט שיש לו בקשה בסטטוס APPROVED או BORROWED → 409.

**יצירת בקשה**
- אי אפשר לבקש פריט של עצמך → 400.
- הפריט חייב להיות ציבורי וזמין → אחרת 409.
- startDate לא בעבר, endDate ≥ startDate.
- אין למבקשת כבר בקשה PENDING על אותו פריט → 409.
- התאריכים לא חופפים לבקשה APPROVED/BORROWED קיימת על אותו פריט → 409.

**מעברי סטטוס** (כל מעבר אחר → 409)
- הבעלים (או ADMIN): PENDING → APPROVED / REJECTED, APPROVED → BORROWED, BORROWED → RETURNED
- המבקשת: PENDING → CANCELLED
- מעבר ל־BORROWED: ממלא borrowedAt ומסמן את הפריט isAvailable=false
- מעבר ל־RETURNED: ממלא returnedAt ומחזיר isAvailable=true

**פרטיות טלפון:** טלפון לא מוחזר ברשימות פריטים. בתשובת בקשה בסטטוס APPROVED או BORROWED — המבקשת רואה את טלפון הבעלים והבעלים רואה את טלפון המבקשת.

המשתמשת המזוהה נקבעת תמיד לפי ה־Token, אף פעם לא לפי מזהה שנשלח מהלקוח.

### Endpoints

כל ה־Endpoints תחת `/api`. כולם מחייבים Bearer Token חוץ מ־health, register, login.

**כללי**
- `GET /api/health`
- `GET /api/meta` — רשימות לשדות בחירה: categories, conditions, neighborhoods, statuses (עם תוויות בעברית)

**Auth**
- `POST /api/auth/register`
- `POST /api/auth/login` → `{ token, user }`
- `GET /api/auth/me`

**Items**
- `GET /api/items` — פרמטרים: `search` (title/description, לא רגיש לאותיות), `category`, `neighborhood`, `condition`, `available`, `mine=true`, `sort` (newest / oldest / title), `page`, `pageSize` (ברירת מחדל 12, מקסימום 50). תשובה: `{ items, total, page, pageSize }`. כל פריט כולל `owner: { id, fullName, neighborhood }`.
- `GET /api/items/:id`
- `POST /api/items`
- `PUT /api/items/:id`
- `DELETE /api/items/:id`

**Requests**
- `POST /api/requests`
- `GET /api/requests/mine` — בקשות ששלחתי (סינון לפי `status`)
- `GET /api/requests/received` — בקשות על הפריטים שלי (סינון לפי `status`)
- `GET /api/requests/:id` — רק המבקשת, הבעלים או ADMIN
- `PATCH /api/requests/:id/status` — גוף: `{ status }`
- `GET /api/requests` — ADMIN בלבד, כל הבקשות עם סינון לפי status

**Stats — גרפים** (כל המערכים ממולאים באפסים לחודשים/ימים בלי פעילות, ממוינים כרונולוגית, כך שהלקוח רק מעביר אותם לגרף)
- `GET /api/stats/me` — "ההשפעה שלי":
  - totals: myItemsCount, timesMyItemsLent (השאלות שהגיעו ל־BORROWED או RETURNED על הפריטים שלי), timesIBorrowed, pendingReceived
  - monthly: 6 החודשים האחרונים `[{ month: "2026-05", lent, borrowed }]`
  - topItem: הפריט שלי שהושאל הכי הרבה `{ id, title, count }` או null
- `GET /api/stats/neighborhood?neighborhood=` (ברירת מחדל: השכונה של המשתמשת) — "מה קורה בשכונה":
  - daily: 7 הימים האחרונים `[{ date: "2026-10-12", newItems, newRequests }]`
  - mostRequested: עד 5 פריטים ציבוריים עם הכי הרבה בקשות השבוע `[{ item, count }]`
  - newItemsThisWeek
- `GET /api/admin/stats` — ADMIN בלבד:
  - totals: users, items, activeLoans (APPROVED + BORROWED), pendingRequests
  - byCategory: `[{ category, items, requests }]`
  - byStatus: `[{ status, count }]`
  - monthlyRequests: 6 חודשים אחרונים `[{ month, count }]`
- `GET /api/admin/users` — ADMIN בלבד, רשימת משתמשות (בלי סיסמאות) עם מספר פריטים ומספר בקשות לכל אחת

---

## טכנולוגיות

Node.js LTS, Express, TypeScript (strict), PostgreSQL, Prisma, Zod, JWT, bcrypt, Swagger/OpenAPI 3, Vitest, npm. גרסאות יציבות ותואמות. אין מסד נתונים בזיכרון במקום PostgreSQL (לבדיקות מותר להשתמש ב־DB נפרד).

## מבנה הפרויקט

הפרדה ברורה: routes, controllers, services, validation (Zod), middleware (auth, role, error handler), config, prisma.
קבצים: Prisma schema + migrations, seed, package.json, tsconfig.json, `.env.example`, `.gitignore` (כולל node_modules ו־.env), README.md.

שגיאות בפורמט אחיד: `{ error: { code, message, details? } }` עם 400 / 401 / 403 / 404 / 409 / 500.
CORS מוגדר ממשתנה סביבה (רשימת כתובות, כולל `http://localhost:5173` לפיתוח).

## JWT

סיסמאות ב־bcrypt, Token עם תוקף מוגבל, JWT_SECRET ממשתנה סביבה, 401 בלי Token תקין, 403 בלי הרשאה. לעולם לא להחזיר passwordHash.

## Swagger

Swagger UI ב־`/api-docs`, OpenAPI 3, כל ה־Endpoints מתועדים עם פרמטרים, גוף בקשה, תשובות, דוגמאות JSON וקודי שגיאה. Security scheme מסוג Bearer עם כפתור Authorize. ייצא גם `openapi.json`. חייב לעבוד גם אחרי פריסה.

## Seed

נתונים מומצאים שמספיקים כדי שהגרפים ייראו חיים:
- מנהלת אחת ו־3 משתמשות רגילות בשכונות שונות
- כ־20 פריטים בכל הקטגוריות, חלקם פרטיים, חלקם לא זמינים
- כ־30 בקשות בכל הסטטוסים, מפוזרות על פני 6 החודשים האחרונים (כולל השבוע האחרון), עם borrowedAt/returnedAt מתאימים
- בפיתוח: סיסמאות דמו מתועדות ב־README. בפרודקשן: פרטי המנהלת נלקחים ממשתני סביבה בלבד.

## בדיקות

כתוב והרץ בפועל בדיקות Vitest ל: login תקין ושגוי, Token חסר/לא תקין, הרשאות USER מול ADMIN, CRUD פריטים, נראות פריטים פרטיים, ולידציה, חיפוש וסינון, יצירת בקשה (כולל כל המקרים האסורים), כל מעברי הסטטוס החוקיים והאסורים, עדכון isAvailable, ו־Endpoints של stats (כולל מילוי אפסים).
הרץ גם typecheck ו־build ותקן כל שגיאה.

## פריסה

הכן לפריסה ב־Render: `render.yaml`, build command (כולל prisma generate), start command שמריץ `prisma migrate deploy`, שימוש ב־PORT מהסביבה, DATABASE_URL, JWT_SECRET, CORS_ORIGIN, health check.
מסד הנתונים אצל ספק PostgreSQL חינמי נפרד. אל תניח שמסלול חינמי קיים ללא מגבלות — בדוק וכתוב מה המגבלות הידועות לך וציין שיש לוודא באתר.

## מסמכים בעברית

1. **START-HERE.md** — לתלמידה שמעולם לא העלתה שרת: העלאה ל־GitHub, פתיחת מסד נתונים חינמי וקבלת Connection String, יצירת Web Service ב־Render עם הערכים המדויקים לפרויקט, משתני סביבה, בדיקה (health, Swagger, login, Authorize, קריאה מוגנת), וטבלת תקלות נפוצות ופתרונן. אם אינך בטוח איך נראה ממשק אתר כרגע, אמור זאת במקום להמציא כפתורים.
2. **FRONTEND-API-GUIDE.md** — Base URL, שליחת Bearer Token, כל ה־Endpoints עם דוגמאות JSON, מבני הנתונים (interfaces), שדות חובה ומגבלות לכל טופס, קודי שגיאה, ומיפוי מסך → Endpoints עבור המסכים: כניסה, הרשמה, רשימת פריטים, פרטי פריט + שליחת בקשה, הוספה/עריכת פריט, הפריטים שלי, הבקשות שלי, בקשות שקיבלתי, "ההשפעה שלי" + "מה קורה בשכונה", לוח בקרה למנהלת. בלי קוד React.

## בקרת מסירה

בסוף הצג לי:
1. מבנה התיקיות שנוצר
2. סיכום טבלאות, Endpoints והרשאות
3. תוצאות בדיקות, typecheck ו־build שהרצת בפועל
4. איך מריצים מקומית (צעדים קצרים)
5. מה נשאר פתוח, אם משהו לא הושלם

ודא שאין סודות בקבצים, שאין קוד React, ושהפרויקט רץ בלי חשבון AI.

---

**התחל עכשיו:** קרא את האפיון, הצג לי את סיכום התכנון ושאלות אם יש, ועצור לאישור.
