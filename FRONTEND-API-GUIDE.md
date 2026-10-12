# מדריך API ל-Frontend - גמ"ח שכונתי

מדריך הזה הוא בשבילך, מי שכותבת את ה-React. **אין כאן קוד React** - רק הסברים, מבני נתונים ודוגמאות JSON, בדיוק כמו שהאפיון דרש. כל הפרטים גם ב-Swagger UI החי (`/api-docs`) עם כפתור "Try it out".

## Base URL

פיתוח מקומי: `http://localhost:4000`
פרודקשן: הכתובת שתקבלי מ-Render (לדוגמה `https://gemach-shchunati-api.onrender.com`).

כל ה-Endpoints תחת `/api`, לדוגמה: `http://localhost:4000/api/items`.

## אימות (Authentication)

אחרי התחברות/הרשמה מקבלים `token`. יש לשלוח אותו בכל בקשה מוגנת (כל ה-Endpoints חוץ מ-`health`, `register`, `login`) ב-Header:

```
Authorization: Bearer <token>
```

בלי Header הזה (או עם token לא תקין/שפג תוקפו) - תקבלי `401`.

## פורמט שגיאות אחיד

כל שגיאה (400/401/403/404/409/500) חוזרת באותו מבנה:

```ts
interface ApiError {
  error: {
    code: string;       // לדוגמה "VALIDATION_ERROR", "FORBIDDEN"
    message: string;    // הודעה בעברית, אפשר להציג למשתמשת
    details?: unknown;  // לפעמים רשימת שגיאות ולידציה מפורטת
  };
}
```

שימוש מומלץ ב-Frontend: הציגי את `error.message` למשתמשת, ואם את רוצה להתאים את ה-UI לפי סוג השגיאה - התבססי על `error.code` (לא על הטקסט של `message`, כי הוא יכול להשתנות).

---

## מבני נתונים (Interfaces)

```ts
interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  neighborhood: string;
  role: "USER" | "ADMIN";
  createdAt: string; // ISO date-time
}

interface ItemOwner {
  id: string;
  fullName: string;
  neighborhood: string;
  // בלי phone! טלפון לא חוזר ברשימות/פרטי פריט בכלל.
}

interface Item {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  category: "BABY" | "KITCHEN" | "EVENTS" | "BOOKS" | "HOLIDAY" | "TOOLS" | "OTHER";
  condition: "NEW" | "GOOD" | "FAIR";
  neighborhood: string;
  isPublic: boolean;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  owner: ItemOwner;
}

interface RequestPerson {
  id: string;
  fullName: string;
  neighborhood: string;
  phone?: string; // מופיע רק אם מותר לראות (ראי "פרטיות טלפון" למטה)
}

interface LoanRequest {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "BORROWED" | "RETURNED" | "CANCELLED";
  startDate: string;
  endDate: string;
  message: string | null;
  borrowedAt: string | null;
  returnedAt: string | null;
  createdAt: string;
  updatedAt: string;
  item: { id: string; title: string; category: string; neighborhood: string };
  borrower: RequestPerson;
  owner: RequestPerson;
}
```

**פרטיות טלפון:** `borrower.phone` ו-`owner.phone` מופיעים רק כשהבקשה בסטטוס `APPROVED`, `BORROWED` או `RETURNED` - וגם אז, המבקשת רואה את `owner.phone` (לא את שלה) וההבעלים רואה את `borrower.phone`. ב-`PENDING`/`REJECTED`/`CANCELLED` לעולם לא יופיע טלפון בכלל. ADMIN רואה את שניהם בכל סטטוס שמאפשר חשיפה.

---

## Endpoints

### כללי

**`GET /api/health`** - בדיקת חיות. לא מחייב Token.
```json
{ "status": "ok", "time": "2026-10-12T10:00:00.000Z" }
```

**`GET /api/meta`** - רשימות לכל ה-select/dropdown בטפסים. לא מחייב Token.
```json
{
  "categories": [{ "value": "BABY", "label": "תינוקות" }, ...],
  "conditions": [{ "value": "NEW", "label": "חדש" }, ...],
  "neighborhoods": [{ "value": "גבעת רוקח", "label": "גבעת רוקח" }, ...],
  "statuses": [{ "value": "PENDING", "label": "ממתינה לאישור" }, ...]
}
```

### Auth

**`POST /api/auth/register`** - הרשמה (יוצרת תמיד USER, לעולם לא ADMIN).

גוף הבקשה:
```ts
{
  fullName: string;    // 2-80 תווים, חובה
  email: string;       // חובה, תקין ולא קיים במערכת
  password: string;    // 6-72 תווים, חובה
  phone: string;       // 7-20 תווים, חובה
  neighborhood: string; // חובה, אחת מרשימת /api/meta -> neighborhoods
}
```
תשובה (201): `{ token: string, user: User }`

שגיאות: `400 VALIDATION_ERROR` (שדה לא תקין/חסר), `409 EMAIL_TAKEN` (האימייל כבר רשום).

**`POST /api/auth/login`**
```ts
{ email: string; password: string; }
```
תשובה (200): `{ token: string, user: User }`
שגיאה: `401 INVALID_CREDENTIALS` (אימייל או סיסמה שגויים - בכוונה לא מבדילים בין "אימייל לא קיים" ל"סיסמה שגויה", מטעמי אבטחה).

**`GET /api/auth/me`** - מחייב Token. תשובה (200): `User`.

### Items (פריטים)

**`GET /api/items`** - מחייב Token. פרמטרים (כולם אופציונליים, ב-query string):

| פרמטר | טיפוס | הסבר |
|---|---|---|
| `search` | string | חיפוש בכותרת/תיאור, לא רגיש לאותיות |
| `category` | אחת מ-CATEGORIES | |
| `neighborhood` | אחת מרשימת השכונות | שכונת **הפריט**, לא של המשתמשת |
| `condition` | NEW/GOOD/FAIR | |
| `available` | "true"/"false" | |
| `mine` | "true"/"false" | רק הפריטים שהמשתמשת המחוברת בעלת שלהם (כולל פרטיים) |
| `sort` | newest / oldest / title | ברירת מחדל: newest |
| `page` | מספר | ברירת מחדל 1 |
| `pageSize` | מספר | ברירת מחדל 12, מקסימום 50 |

תשובה (200):
```ts
{ items: Item[]; total: number; page: number; pageSize: number; }
```

**חשוב ל-UI:** USER מקבלת ברשימה גם פריטים פרטיים - אבל רק **שלה**. פריטים פרטיים של אחרות אף פעם לא מופיעים ברשימה (ולא ב-`GET /api/items/:id` - 404).

**`GET /api/items/:id`** - תשובה (200): `Item`. שגיאה: `404 NOT_FOUND` (גם אם קיים אבל פרטי ולא שלך/לא ADMIN - בכוונה אי אפשר להבדיל, כדי לא לחשוף מידע).

**`POST /api/items`** - יצירת פריט. גוף:
```ts
{
  title: string;        // 2-80 תווים, חובה
  description?: string; // עד 500 תווים
  category: string;     // חובה, מתוך CATEGORIES
  condition: string;    // חובה, מתוך CONDITIONS
  neighborhood: string; // חובה, מתוך רשימת השכונות (אפשר שונה מהשכונה של המשתמשת!)
  isPublic?: boolean;   // ברירת מחדל true
  isAvailable?: boolean; // ברירת מחדל true
}
```
תשובה (201): `Item`. שגיאה: `400 VALIDATION_ERROR`.

**`PUT /api/items/:id`** - עדכון (כל השדות אופציונליים, כמו POST חלקי). רק הבעלים/ADMIN.
תשובה (200): `Item`. שגיאות: `403 FORBIDDEN`, `404 NOT_FOUND`.

**`DELETE /api/items/:id`** - רק הבעלים/ADMIN. תשובה: `204` (בלי גוף).
שגיאות: `403 FORBIDDEN`, `404 NOT_FOUND`, `409 ITEM_HAS_ACTIVE_LOAN` (יש בקשה APPROVED/BORROWED על הפריט).

### Requests (בקשות השאלה)

**`POST /api/requests`** - שליחת בקשה. גוף:
```ts
{
  itemId: string;      // חובה
  startDate: string;   // תאריך ("YYYY-MM-DD"), לא בעבר
  endDate: string;     // תאריך, >= startDate
  message?: string;    // עד 300 תווים
}
```
תשובה (201): `LoanRequest` (בסטטוס `PENDING`).

שגיאות:
- `400 VALIDATION_ERROR` - שדה חסר/לא תקין (למשל תאריך לא תקין, endDate לפני startDate).
- `400 CANNOT_REQUEST_OWN_ITEM` - ניסיון לבקש פריט של עצמך.
- `400 START_DATE_IN_PAST` - תאריך התחלה בעבר.
- `409 ITEM_NOT_AVAILABLE` - הפריט לא ציבורי ו/או לא זמין.
- `409 DUPLICATE_PENDING_REQUEST` - יש כבר בקשה ממתינה שלך על הפריט הזה.
- `409 DATE_OVERLAP` - התאריכים חופפים לבקשה מאושרת/בהשאלה קיימת.

**`GET /api/requests/mine`** - הבקשות ששלחתי. פרמטר אופציונלי `status`. תשובה: `LoanRequest[]`.

**`GET /api/requests/received`** - בקשות שקיבלתי על הפריטים שלי. פרמטר אופציונלי `status`. תשובה: `LoanRequest[]`.

**`GET /api/requests/:id`** - רק המבקשת, הבעלים או ADMIN. תשובה: `LoanRequest`. שגיאות: `403 FORBIDDEN`, `404 NOT_FOUND`.

**`PATCH /api/requests/:id/status`** - עדכון סטטוס. גוף: `{ status: string }`.

מעברים חוקיים (כל מעבר אחר → `409 INVALID_STATUS_TRANSITION`; מעבר חוקי בתפקיד הלא נכון → `403 FORBIDDEN`):

| מי מבצעת | מעבר |
|---|---|
| הבעלים או ADMIN | `PENDING → APPROVED`, `PENDING → REJECTED` |
| הבעלים או ADMIN | `APPROVED → BORROWED` (ממלא `borrowedAt`, מסמן את הפריט `isAvailable=false`) |
| הבעלים או ADMIN | `BORROWED → RETURNED` (ממלא `returnedAt`, מסמן את הפריט `isAvailable=true`) |
| המבקשת | `PENDING → CANCELLED` |

תשובה (200): `LoanRequest` המעודכנת.

**`GET /api/requests`** - **ADMIN בלבד**. כל הבקשות במערכת, פרמטר אופציונלי `status`. שגיאה: `403 FORBIDDEN` עבור USER.

### Stats (גרפים)

**`GET /api/stats/me`** - "ההשפעה שלי".
```ts
{
  totals: {
    myItemsCount: number;
    timesMyItemsLent: number;   // בקשות על הפריטים שלי שהגיעו ל-BORROWED/RETURNED
    timesIBorrowed: number;     // בקשות שלי שהגיעו ל-BORROWED/RETURNED
    pendingReceived: number;    // בקשות PENDING שמחכות לי לאישור
  };
  monthly: { month: string; lent: number; borrowed: number }[]; // 6 חודשים, ממולא באפסים, כרונולוגי
  topItem: { id: string; title: string; count: number } | null;
}
```

**`GET /api/stats/neighborhood?neighborhood=...`** - "מה קורה בשכונה". פרמטר `neighborhood` אופציונלי (ברירת מחדל: השכונה של המשתמשת המחוברת).
```ts
{
  daily: { date: string; newItems: number; newRequests: number }[]; // 7 ימים, ממולא באפסים
  mostRequested: { item: Item; count: number }[]; // עד 5, פריטים ציבוריים בלבד
  newItemsThisWeek: number;
}
```

**`GET /api/admin/stats`** - **ADMIN בלבד**. לוח הבקרה הכללי.
```ts
{
  totals: { users: number; items: number; activeLoans: number; pendingRequests: number };
  byCategory: { category: string; items: number; requests: number }[]; // כל 7 הקטגוריות
  byStatus: { status: string; count: number }[]; // כל 6 הסטטוסים
  monthlyRequests: { month: string; count: number }[]; // 6 חודשים, ממולא באפסים
}
```

**`GET /api/admin/users`** - **ADMIN בלבד**. רשימת כל המשתמשות (בלי סיסמאות):
```ts
(User & { itemsCount: number; requestsCount: number })[]
```

---

## מיפוי מסך → Endpoints

| מסך | Endpoints שצריך |
|---|---|
| **כניסה** | `POST /api/auth/login` |
| **הרשמה** | `GET /api/meta` (לרשימת שכונות), `POST /api/auth/register` |
| **רשימת פריטים** | `GET /api/meta` (לפילטרים), `GET /api/items` |
| **פרטי פריט + שליחת בקשה** | `GET /api/items/:id`, `POST /api/requests` |
| **הוספה/עריכת פריט** | `GET /api/meta`, `POST /api/items` או `PUT /api/items/:id` |
| **הפריטים שלי** | `GET /api/items?mine=true`, `PUT`/`DELETE /api/items/:id` |
| **הבקשות שלי** | `GET /api/requests/mine`, `PATCH /api/requests/:id/status` (לביטול) |
| **בקשות שקיבלתי** | `GET /api/requests/received`, `PATCH /api/requests/:id/status` (אישור/דחייה/השאלה/החזרה) |
| **"ההשפעה שלי" + "מה קורה בשכונה"** | `GET /api/stats/me`, `GET /api/stats/neighborhood` |
| **לוח בקרה למנהלת** | `GET /api/admin/stats`, `GET /api/admin/users`, `GET /api/requests` (כל הבקשות, ADMIN) |

## טיפים כלליים ל-Frontend

- אחרי login/register, שמרי את ה-`token` (למשל ב-`localStorage`) ואת `user` כדי לדעת את ה-role (USER/ADMIN) ולהציג תפריט מתאים.
- כל טופס שבו יש שדה "קטגוריה"/"מצב"/"שכונה"/"סטטוס" - תמיד לטעון את האפשרויות מ-`GET /api/meta` (ולא לכתוב קשיח ב-Frontend), כדי שאם הרשימה תתעדכן בשרת, ה-Frontend יתעדכן אוטומטית.
- כש-401 מתקבל בכל קריאה - כנראה ה-token פג תוקף; מומלץ לנתק את המשתמשת ולהחזיר למסך כניסה.
- שדה `description`/`message` יכולים לחזור כ-`null` - לא `undefined` ולא מחרוזת ריקה.
