import jwt from "jsonwebtoken";

const SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
export const CUSTOMER_COOKIE = "customer_session";

export function createCustomerToken(customerId) {
  return jwt.sign({ customerId }, SECRET, { expiresIn: "30d" });
}

export function verifyCustomerToken(token) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, SECRET);
    return payload?.customerId || null;
  } catch (e) {
    return null;
  }
}
