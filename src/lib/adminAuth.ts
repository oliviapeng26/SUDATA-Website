import { createHmac, timingSafeEqual } from "node:crypto";
import type { AstroCookies } from "astro";

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

const SESSION_VERSION = "v1";
const SESSION_ROLE = "admin";

type SessionPayload = {
  role: string;
  exp: number;
  v: string;
};

const toBase64Url = (value: string) => Buffer.from(value, "utf8").toString("base64url");
const fromBase64Url = (value: string) => Buffer.from(value, "base64url").toString("utf8");

const sign = (payloadB64: string, secret: string) =>
  createHmac("sha256", secret).update(payloadB64).digest("base64url");

const getAuthSecret = () => import.meta.env.AUTH_SECRET || "";

export const isAdminPasswordValid = (password: string): boolean => {
  const expected = import.meta.env.ADMIN_PASSWORD;
  return Boolean(expected) && password === expected;
};

export const createAdminSessionToken = (): string => {
  const secret = getAuthSecret();
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  const payload: SessionPayload = {
    role: SESSION_ROLE,
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE_SECONDS,
    v: SESSION_VERSION,
  };

  const payloadB64 = toBase64Url(JSON.stringify(payload));
  const signature = sign(payloadB64, secret);
  return `${payloadB64}.${signature}`;
};

export const verifyAdminSessionToken = (token: string | undefined | null): boolean => {
  if (!token) return false;

  const [payloadB64, providedSig] = token.split(".");
  if (!payloadB64 || !providedSig) return false;

  const secret = getAuthSecret();
  if (!secret) return false;

  const expectedSig = sign(payloadB64, secret);
  const provided = Buffer.from(providedSig, "utf8");
  const expected = Buffer.from(expectedSig, "utf8");
  if (provided.length !== expected.length) return false;
  if (!timingSafeEqual(provided, expected)) return false;

  try {
    const payload = JSON.parse(fromBase64Url(payloadB64)) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);

    return (
      payload.v === SESSION_VERSION &&
      payload.role === SESSION_ROLE &&
      Number.isFinite(payload.exp) &&
      payload.exp > now
    );
  } catch {
    return false;
  }
};

export const isAdminRequest = (cookies: AstroCookies): boolean =>
  verifyAdminSessionToken(cookies.get(ADMIN_SESSION_COOKIE)?.value);

export const setAdminSessionCookie = (cookies: AstroCookies): void => {
  const token = createAdminSessionToken();
  cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
};

export const clearAdminSessionCookie = (cookies: AstroCookies): void => {
  cookies.delete(ADMIN_SESSION_COOKIE, {
    path: "/",
  });
};
