import jwt from "jsonwebtoken";

const SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
export const ADMIN_COOKIE = "admin_session";

export function createAdminToken() {
  return jwt.sign({ admin: true }, SECRET, { expiresIn: "7d" });
}

export function verifyAdminToken(token) {
  if (!token) return false;
  try {
    const payload = jwt.verify(token, SECRET);
    return payload && payload.admin === true;
  } catch (e) {
    return false;
  }
}
