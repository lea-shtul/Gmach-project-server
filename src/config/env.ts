import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`משתנה סביבה חובה חסר: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : fallback;
}

export const env = {
  nodeEnv: optional("NODE_ENV", "development"),
  port: Number(optional("PORT", "4000")),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: optional("JWT_EXPIRES_IN", "7d"),
  corsOrigins: required("CORS_ORIGIN")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0),
  admin: {
    email: optional("ADMIN_EMAIL", "admin@gemach.local"),
    password: optional("ADMIN_PASSWORD", "Admin123!"),
    fullName: optional("ADMIN_FULL_NAME", "מנהלת המערכת"),
    phone: optional("ADMIN_PHONE", "050-0000000"),
    neighborhood: optional("ADMIN_NEIGHBORHOOD", "מרכז העיר"),
  },
};

export const isProduction = env.nodeEnv === "production";
