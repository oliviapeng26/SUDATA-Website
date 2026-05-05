import type { APIRoute } from "astro";
import { isAdminRequest } from "../../../lib/adminAuth";

export const GET: APIRoute = async ({ cookies }) => {
  return new Response(JSON.stringify({ isAdmin: isAdminRequest(cookies) }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
