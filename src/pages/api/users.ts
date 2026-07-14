// Example API route - reference the astro docs for more information

import type { APIRoute } from "astro";
import prisma from "../../lib/prisma";

export const prerender = false;

export const GET: APIRoute = async () => {
  const users = await prisma.user.findMany({
    include: { posts: true },
  });

  return new Response(JSON.stringify(users), {
    headers: { "Content-Type": "application/json" },
  });
};
