// רשימת השכונות הקבועה של האפליקציה - מקור יחיד לאמת.
// משמשת לוולידציה (Zod), ל-GET /api/meta ול-Seed.
export const NEIGHBORHOODS = [
  "גבעת רוקח",
  "זכרון מאיר",
  "מרכז העיר",
  "פרדס כץ",
  "קריית הרצוג",
  "רמת אהרן",
  "רמת אלחנן",
  "נווה אחיעזר",
  "גני גד",
  "שיכון ג'",
  "שיכון ה'",
  "שיכון ו'",
  "קריית ויז'ניץ",
] as const;

export type Neighborhood = (typeof NEIGHBORHOODS)[number];

export function isNeighborhood(value: string): value is Neighborhood {
  return (NEIGHBORHOODS as readonly string[]).includes(value);
}
