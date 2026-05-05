import type { APIRoute } from "astro";
import { isAdminPasswordValid, setAdminSessionCookie } from "../../../lib/adminAuth";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const password = typeof body?.password === "string" ? body.password : "";

    if (!isAdminPasswordValid(password)) {
      return new Response(JSON.stringify({ error: "Invalid password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    setAdminSessionCookie(cookies);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
