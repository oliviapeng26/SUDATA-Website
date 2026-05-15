import type { APIRoute } from "astro";
import { clearAdminSessionCookie } from "../../../lib/adminAuth";

export const POST: APIRoute = async ({ cookies }) => {
  clearAdminSessionCookie(cookies);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
