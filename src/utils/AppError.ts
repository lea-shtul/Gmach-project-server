// שגיאת אפליקציה אחידה. כל ה-middleware/controllers זורקים אותה,
// וה-errorHandler הגלובלי מתרגם אותה לפורמט { error: { code, message, details? } }.
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(code: string, message: string, details?: unknown) {
    return new AppError(400, code, message, details);
  }

  static unauthorized(message = "נדרשת התחברות") {
    return new AppError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "אין הרשאה לפעולה זו") {
    return new AppError(403, "FORBIDDEN", message);
  }

  static notFound(message = "המשאב לא נמצא") {
    return new AppError(404, "NOT_FOUND", message);
  }

  static conflict(code: string, message: string, details?: unknown) {
    return new AppError(409, code, message, details);
  }
}
