import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";

const router: IRouter = Router();
const sessions = new Map<string, number>();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "saffron-lantern-47";
const COOKIE_NAME = "dls_admin_session";

function isValidSession(token: unknown): token is string {
  if (typeof token !== "string") return false;
  const expiresAt = sessions.get(token);
  if (!expiresAt) return false;
  if (expiresAt < Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

router.post("/admin/login", (req, res) => {
  if (typeof req.body?.password !== "string" || req.body.password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  const token = randomUUID();
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
  res.json({ authenticated: true });
});

router.get("/admin/session", (req, res) => {
  res.json({ authenticated: isValidSession(req.cookies?.[COOKIE_NAME]) });
});

router.post("/admin/logout", (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (typeof token === "string") sessions.delete(token);
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: "lax", path: "/" });
  res.json({ authenticated: false });
});

export default router;