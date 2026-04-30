export const prerender = false;

import type { APIRoute } from 'astro';
import prisma from '../../lib/prisma';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { type, label, url, page, referrer, sessionId, meta } = body;

    if (!type || !page) {
      return new Response(null, { status: 400 });
    }

    if (type === 'click') {
      if (!label) return new Response(null, { status: 400 });
      await prisma.linkClick.create({
        data: {
          label,
          url: url || null,
          page,
          referrer: referrer || null,
          sessionId: sessionId || null,
          meta: meta || null,
        },
      });
    } else if (type === 'pageview') {
      await prisma.pageView.create({
        data: {
          page,
          referrer: referrer || null,
          sessionId: sessionId || null,
          meta: meta || null,
        },
      });
    } else {
      return new Response(null, { status: 400 });
    }

    return new Response(null, { status: 204 });
  } catch {
    // silently fail — never break the user's navigation
    return new Response(null, { status: 204 });
  }
};
