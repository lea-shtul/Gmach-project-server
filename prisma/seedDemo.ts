import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/prisma";
import { NEIGHBORHOODS } from "../src/config/neighborhoods";
import { CATEGORIES, CONDITIONS, type CategoryValue, type ConditionValue } from "../src/config/enums";

// seed:demo - מוסיף נתוני דמו עשירים לפרודקשן, רק הוספה (אף פעם לא מוחק/משכתב).
// בניגוד ל-prisma/seed.ts (סקריפט הפיתוח, שמנקה את כל הטבלאות!) - קובץ זה בטוח
// להרצה חזרה-בחזרה ב-Start Command של Render: אם המסד אינו ריק מנתוני דמו,
// או שחסרים משתני הסביבה הנדרשים, הוא יוצא מיידית בלי לגעת בכלום.

type Status = "PENDING" | "APPROVED" | "REJECTED" | "BORROWED" | "RETURNED" | "CANCELLED";

const ACTIVE_STATUSES: Status[] = ["APPROVED", "BORROWED"];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

function clampToNow(date: Date): Date {
  const now = new Date();
  return date.getTime() > now.getTime() ? now : date;
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[randomInt(0, arr.length - 1)]!;
}

// הטיה לכיוון תאריכים קרובים להיום (יותר פעילות בחודשים האחרונים).
function recentBiasedDaysAgo(maxDays: number): number {
  return Math.floor(Math.random() ** 2 * maxDays);
}

function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() <= bEnd.getTime() && aEnd.getTime() >= bStart.getTime();
}

const DEMO_FULL_NAMES = [
  "רחל לוי", "שרה אברהם", "מרים גולד", "לאה כהן", "חנה רוזנברג", "אסתר פרידמן",
  "דבורה שפירא", "יהודית וייס", "בתיה גרוס", "פייגה שטרן", "חיה קליין", "גולדה אדלר",
  "רייזל הורוביץ", "מלכה מרגלית", "נחמה זילברשטיין", "ברכה דויטש", "שושנה אנגל",
  "צביה רובין", "רבקה בלוך", "אהובה לנדאו", "ריקי פינקל", "חני יעקובוביץ",
  "שיינדל אקשטיין", "גיטל אלבוים", "בלומה ברנדויין", "סימה כץ",
];

interface ItemTemplate {
  title: string;
  description: string;
}

const ITEM_TEMPLATES: Record<CategoryValue, ItemTemplate[]> = {
  BABY: [
    { title: "עגלת תינוק מתקפלת", description: "עגלה קלה, מתאימה מגיל חודש" },
    { title: "כיסא אוכל לתינוק", description: "מתקפל, ניתן לכיוון גובה" },
    { title: "משאבת חלב אלקטרונית", description: "משומשת מעט, מנוקה ומושרה" },
    { title: "מיטת פארק מתקפלת", description: "כולל מזרן, לנסיעות ולבית הורים" },
    { title: "מנשא (סלינג) לתינוק", description: "נוח לגב, מתאים מגיל 3 חודשים" },
    { title: "כיסא בטיחות לרכב", description: "לתינוקות עד גיל שנתיים" },
    { title: "באבי מוניטור", description: "עם מצלמה ומסך, טווח טוב" },
    { title: "נדנדת תינוק חשמלית", description: "עם מוזיקה ותנועה מרגיעה" },
    { title: "הליכון (ג'ירף) לתינוק", description: "מתאים מגיל 6 חודשים" },
    { title: "כריות הנקה", description: "זוג כריות, שטופות ונקיות" },
    { title: "מתקן לאמבטיה לתינוק", description: "עם משענת, מונע החלקה" },
    { title: "מדרגות עלייה למיטת הורים", description: "קלות משקל, מתקפלות" },
  ],
  KITCHEN: [
    { title: "מיקסר שף גדול", description: "למאפים ועוגות לשבת וחג" },
    { title: "סיר לחץ 10 ליטר", description: "מתאים לבישול כמויות גדולות" },
    { title: "מכונת קפה קפסולות", description: "" },
    { title: "בלנדר טוחן חזק", description: "לשייקים ולקוביות קרח" },
    { title: "מצלת חלה גדולה", description: "לאירועים ולשבתות" },
    { title: "סט סכינים לבישול", description: "סט מלא, מושחז" },
    { title: "תנור אפייה נייד", description: "קומפקטי, לדירות קטנות" },
    { title: "מכונת אטריות ובצק", description: "להכנת פסטה ואטריות בבית" },
    { title: "סט קדרות נירוסטה", description: "6 חלקים, לבישולי חג" },
    { title: "סט מדי אפייה ומצקות", description: "סט מלא לאפייה מדויקת" },
    { title: "מצנם (סיר אידוי)", description: "לבישול בריא בלי שמן" },
    { title: "מכונת גלידה בייתית", description: "להכנת גלידה וסורבה בקיץ" },
  ],
  EVENTS: [
    { title: "שולחנות מתקפלים לאירוע (x4)", description: "שולחנות פלסטיק, קלים להרכבה" },
    { title: "מערכת הגברה קטנה", description: "רמקול + מיקרופון אחד" },
    { title: "כיסאות פלסטיק לאירוח (x20)", description: "לבנים, מצב שמיש" },
    { title: "כלי הגשה חד פעמיים מהודרים", description: "ל-50 סועדים" },
    { title: "מפות שולחן לבנות", description: "סט 10 מפות, גודל גדול" },
    { title: "פמוטים לשולחן חג", description: "זוג, כסף מצופה" },
    { title: "מערכת תאורה לאירוע", description: "פנסי לד, נטענים" },
    { title: "אוהל/סככה לאירוע חוץ", description: "4x6 מטר, עם עמודים" },
    { title: "מקרר קטן נייד לאירועים", description: "למשקאות קרים" },
    { title: "עמדת מוזיקה ניידת ומיקסר", description: "למסיבות וחתונות קטנות" },
    { title: "מגשי הגשה גדולים", description: "סט 5 מגשים נירוסטה" },
    { title: "מכונת פופקורן לאירועים", description: "לימי הולדת ומסיבות" },
  ],
  BOOKS: [
    { title: "סט ספרי פרשת שבוע לילדים", description: "מאוייר, 5 כרכים" },
    { title: "ספרי לימוד כיתה ג'", description: "חשבון ולשון" },
    { title: "אנציקלופדיה לילדים", description: "סט 10 כרכים" },
    { title: "סט משניות כיס", description: "6 סדרים, כריכה רכה" },
    { title: "ספרי סיפורים לגיל הרך", description: "10 ספרים מאוירים" },
    { title: "סט ש\"ס וילנא", description: "כריכה קשה, שלם" },
    { title: "ספרי הלכה למעשה", description: "שולחן ערוך מבואר" },
    { title: "אטלס עולם לילדים", description: "מודפס וצבעוני" },
    { title: "ספרי מתכונים לחג", description: "סט 3 כרכים" },
    { title: "סט ספרי מוסר לבני מצווה", description: "מתנה מומלצת" },
    { title: "רומנים בעברית למבוגרים", description: "קופסה עם 15 ספרים" },
    { title: "לקסיקון תנ\"ך מאויר לילדים", description: "" },
  ],
  HOLIDAY: [
    { title: "ארבעת המינים - קופסת החזקה", description: "קופסה מהודרת לפסח" },
    { title: "סוכה מתקפלת 2x2", description: "כולל סכך, לבדיקה לפני חג" },
    { title: "מנורת חנוכה גדולה לאירוע", description: "" },
    { title: "כלים לפסח (סט מלא)", description: "להשאלה לשבוע החג" },
    { title: "תיק לד' מינים מהודר", description: "רקמת יד" },
    { title: "שולחן הגדה עץ מתקפל", description: "להגדה ולקריאה בליל הסדר" },
    { title: "תחפושות פורים לילדים", description: "מידות שונות, לכל המשפחה" },
    { title: "סט כלי יין לקידוש", description: "8 כוסות ומגש" },
    { title: "חנוכיה לנרות שמן", description: "עתיקה, לשימוש בפועל" },
    { title: "סט פנסים ליום ירושלים ול\"ג בעומר", description: "סט 6 פנסים" },
    { title: "מגילת אסתר בקלף", description: "לקריאה פרטית בפורים" },
    { title: "כיסא אליהו מהודר", description: "לברית מילה" },
  ],
  TOOLS: [
    { title: "מברגה חשמלית + סט ראשים", description: "סוללה נטענת" },
    { title: "סולם אלומיניום 3 מ'", description: "מתקפל, יציב" },
    { title: "מערכת מקדחה ופטיש", description: "לעבודות שיפוץ קטנות" },
    { title: "מסור חשמלי יד", description: "לעבודות עץ קלות" },
    { title: "סט מפתחות ברגים", description: "מתאים לרוב הצרכים הבייתיים" },
    { title: "מכונת ריתוך קטנה", description: "לתיקונים ביתיים" },
    { title: "משאבת אוויר לרכב", description: "חשמלית, 12V" },
    { title: "מדחס אוויר נייד", description: "לניקוי ותיקוני רכב" },
    { title: "קופסת ברגים ואומים מאורגנת", description: "קופסת מגירות עם מאות ברגים" },
    { title: "מנוף הרמה ידני (ג'ק)", description: "לרכב, עד 2 טון" },
    { title: "מכסחת עשבים חשמלית", description: "קלה לשימוש, לגינה קטנה" },
    { title: "מד מתח לבדיקות חשמל", description: "לבדיקות חשמל ביתיות" },
  ],
  OTHER: [
    { title: "אוהל קמפינג 4 אנשים", description: "לטיולי חופש" },
    { title: "כיסא גלגלים מתקפל", description: "להשאלה לזמן קצר" },
    { title: "מזוודת טיולים גדולה", description: "על גלגלים, נפח גדול" },
    { title: "אופני ילדים", description: "מידה 20 אינץ', עם גלגלי עזר" },
    { title: "קלנועית חשמלית", description: "לניידות קלה, סוללה חדשה" },
    { title: "סט מזרוני התעמלות", description: "סט 2 מזרונים" },
    { title: "ציוד שנורקל למשפחה", description: "4 סטים, מידות שונות" },
    { title: "תיק גב לטיולים", description: "60 ליטר, עמיד למים" },
    { title: "כיסא חוף מתקפל ושמשייה", description: "מתקפל, כולל שמשייה" },
    { title: "ערסל תלייה", description: "לגינה או למרפסת" },
    { title: "מקרן נייד + מסך", description: "לצפייה משפחתית" },
    { title: "מכונת תפירה בייתית", description: "פשוטה לתפירה ותיקונים" },
  ],
};

const REQUEST_MESSAGES = [
  "אשמח להשאיל, תודה מראש!",
  "צריכה את זה לכמה ימים, אפשר?",
  "תודה רבה, מחזירה במצב מצוין",
  "",
];

// משקלים לבחירת סטטוס בקשה (RETURNED דומיננטי - כדי שיהיה הרבה היסטוריה לגרפים).
const STATUS_WEIGHTS: Array<[Status, number]> = [
  ["PENDING", 0.16],
  ["APPROVED", 0.12],
  ["BORROWED", 0.16],
  ["RETURNED", 0.4],
  ["REJECTED", 0.08],
  ["CANCELLED", 0.08],
];

function pickWeightedStatus(): Status {
  const roll = Math.random();
  let cumulative = 0;
  for (const [status, weight] of STATUS_WEIGHTS) {
    cumulative += weight;
    if (roll <= cumulative) return status;
  }
  return "RETURNED";
}

interface GeneratedUser {
  fullName: string;
  email: string;
  phone: string;
  neighborhood: string;
}

function buildDemoUsers(): GeneratedUser[] {
  return DEMO_FULL_NAMES.map((fullName, index) => ({
    fullName,
    email: `demo${index + 1}@gemach-demo.local`,
    phone: `05${index % 5}-${String(1000000 + index * 137).slice(-7)}`,
    neighborhood: NEIGHBORHOODS[index % NEIGHBORHOODS.length]!,
  }));
}

export async function runSeedDemo(): Promise<void> {
  try {
    if (process.env.SEED_DEMO !== "true") {
      console.log('SEED_DEMO אינו "true" - מדלגה על seed הדמו.');
      return;
    }

    const demoPassword = process.env.DEMO_USERS_PASSWORD;
    if (!demoPassword) {
      console.log(
        "משתנה הסביבה DEMO_USERS_PASSWORD חסר - לא ניתן ליצור משתמשות דמו, מדלגה על כל seed הדמו.",
      );
      return;
    }

    const [existingItemCount, existingDemoUserCount] = await Promise.all([
      prisma.item.count(),
      prisma.user.count({ where: { role: "USER" } }),
    ]);
    if (existingItemCount > 0 || existingDemoUserCount > 0) {
      console.log(
        "המסד כבר מכיל פריטים ו/או משתמשות שאינן מנהלת - מדלגה על seed הדמו (רק הוספה, לא דריסה).",
      );
      return;
    }

    console.log("מתחילה להוסיף נתוני דמו...");
    const passwordHash = await bcrypt.hash(demoPassword, 10);
    const demoUsers = buildDemoUsers();

    const summary = await prisma.$transaction(
      async (tx) => {
        const createdUsers = [];
        for (const demoUser of demoUsers) {
          createdUsers.push(
            await tx.user.create({
              data: {
                fullName: demoUser.fullName,
                email: demoUser.email,
                passwordHash,
                phone: demoUser.phone,
                neighborhood: demoUser.neighborhood,
                role: "USER",
              },
            }),
          );
        }

        const createdItems = [];
        let itemIndex = 0;
        for (const category of CATEGORIES) {
          for (const template of ITEM_TEMPLATES[category]) {
            const owner = pickRandom(createdUsers);
            const itemCreatedAt = daysAgo(recentBiasedDaysAgo(180));
            itemIndex += 1;
            createdItems.push(
              await tx.item.create({
                data: {
                  ownerId: owner.id,
                  title: template.title,
                  description: template.description || null,
                  category,
                  condition: CONDITIONS[itemIndex % CONDITIONS.length] as ConditionValue,
                  neighborhood: owner.neighborhood,
                  isPublic: itemIndex % 6 !== 0,
                  isAvailable: true,
                  createdAt: itemCreatedAt,
                },
              }),
            );
          }
        }

        let requestsCreated = 0;
        for (const item of createdItems) {
          const activeIntervals: Array<{ start: Date; end: Date }> = [];
          const pendingBorrowerIds = new Set<string>();
          const isPopular = Math.random() < 0.15;
          const requestCount = isPopular ? randomInt(6, 10) : randomInt(0, 3);
          let itemEndsUpBorrowed = false;

          for (let i = 0; i < requestCount; i++) {
            const borrowerCandidates = createdUsers.filter((u) => u.id !== item.ownerId);
            const borrower = pickRandom(borrowerCandidates);
            const status = pickWeightedStatus();

            let createdAt: Date;
            let startDate: Date;
            let endDate: Date;
            let borrowedAt: Date | null = null;
            let returnedAt: Date | null = null;

            if (status === "PENDING" || status === "APPROVED") {
              if (status === "PENDING" && pendingBorrowerIds.has(borrower.id)) {
                continue; // DUPLICATE_PENDING_REQUEST - לא יוצרים בקשה ממתינה כפולה מאותה שואלת.
              }
              createdAt = daysAgo(recentBiasedDaysAgo(21));
              startDate = addDays(new Date(), randomInt(1, 20));
              endDate = addDays(startDate, randomInt(2, 10));
            } else if (status === "BORROWED") {
              createdAt = daysAgo(recentBiasedDaysAgo(60));
              startDate = addDays(createdAt, randomInt(0, 3));
              endDate = addDays(startDate, randomInt(3, 14));
              borrowedAt = clampToNow(addDays(startDate, randomInt(0, 2)));
            } else if (status === "RETURNED") {
              const cycleDays = randomInt(5, 25);
              createdAt = daysAgo(Math.max(recentBiasedDaysAgo(180), cycleDays));
              startDate = addDays(createdAt, randomInt(0, 2));
              endDate = addDays(startDate, randomInt(3, 14));
              borrowedAt = addDays(startDate, randomInt(0, 1));
              returnedAt = clampToNow(addDays(endDate, randomInt(0, 3)));
            } else {
              // REJECTED / CANCELLED - לא התחילו בפועל.
              createdAt = daysAgo(recentBiasedDaysAgo(180));
              startDate = addDays(createdAt, randomInt(0, 5));
              endDate = addDays(startDate, randomInt(2, 10));
            }

            if (ACTIVE_STATUSES.includes(status)) {
              const overlaps = activeIntervals.some((interval) =>
                intervalsOverlap(startDate, endDate, interval.start, interval.end),
              );
              if (overlaps) {
                continue; // DATE_OVERLAP - מדלגים על הבקשה הזו כדי לא לשבור את החוק.
              }
              activeIntervals.push({ start: startDate, end: endDate });
            }
            if (status === "PENDING") {
              pendingBorrowerIds.add(borrower.id);
            }
            if (status === "BORROWED") {
              itemEndsUpBorrowed = true;
            }

            await tx.loanRequest.create({
              data: {
                itemId: item.id,
                borrowerId: borrower.id,
                startDate,
                endDate,
                message: pickRandom(REQUEST_MESSAGES) || null,
                status,
                createdAt,
                borrowedAt,
                returnedAt,
              },
            });
            requestsCreated += 1;
          }

          if (itemEndsUpBorrowed) {
            await tx.item.update({ where: { id: item.id }, data: { isAvailable: false } });
          }
        }

        return {
          users: createdUsers.length,
          items: createdItems.length,
          requests: requestsCreated,
        };
      },
      { timeout: 30_000 },
    );

    console.log(
      `בוצע בהצלחה: נוספו ${summary.users} משתמשות, ${summary.items} פריטים, ${summary.requests} בקשות דמו.`,
    );
  } catch (error) {
    console.error("seed:demo נכשל - השרת ימשיך לעלות כרגיל בלי נתוני דמו.");
    console.error(error);
  }
}

if (require.main === module) {
  runSeedDemo().finally(async () => {
    await prisma.$disconnect();
  });
}
