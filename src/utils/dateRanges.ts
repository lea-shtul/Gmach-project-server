// עזרים לבניית טווחי זמן למילוי-אפסים בגרפים (חודשים/ימים בלי פעילות חייבים להופיע עם 0).
// עובדים ב-UTC כדי שההתנהגות תהיה דטרמיניסטית בכל שרת/בדיקה.

export interface MonthBucket {
  label: string; // "2026-05"
  start: Date;
  end: Date; // exclusive
}

export interface DayBucket {
  label: string; // "2026-10-12"
  start: Date;
  end: Date; // exclusive
}

export function lastNMonths(n: number, reference: Date = new Date()): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  const refYear = reference.getUTCFullYear();
  const refMonth = reference.getUTCMonth();

  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(Date.UTC(refYear, refMonth - i, 1));
    const end = new Date(Date.UTC(refYear, refMonth - i + 1, 1));
    const label = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`;
    buckets.push({ label, start, end });
  }
  return buckets;
}

export function lastNDays(n: number, reference: Date = new Date()): DayBucket[] {
  const buckets: DayBucket[] = [];
  const refDay = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate()));

  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(refDay);
    start.setUTCDate(start.getUTCDate() - i);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    const label = start.toISOString().slice(0, 10);
    buckets.push({ label, start, end });
  }
  return buckets;
}
