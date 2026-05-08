import type { APIRoute } from "astro";
import prisma from "../../lib/prisma";

function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  parts.push(line.substring(0, 75));
  let i = 75;
  while (i < line.length) {
    parts.push(" " + line.substring(i, i + 74));
    i += 74;
  }
  return parts.join("\r\n");
}

export const GET: APIRoute = async () => {
  try {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);

    const events = await prisma.event.findMany({
      where: {
        date: { gte: startOfYear },
      },
      orderBy: { date: "asc" },
    });

    const now = formatICalDate(new Date());

    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Sydney University Data Society//SUDATA Events//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:SUDATA Events",
      "X-WR-CALDESC:Events from the Sydney University Data Society",
      "X-WR-TIMEZONE:Australia/Sydney",
      "X-PUBLISHED-TTL:PT0S",
    ];

    for (const event of events) {
      const startDate = new Date(event.time);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      const dtStart = formatICalDate(startDate);
      const dtEnd = formatICalDate(endDate);

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:sudata-${event.id}@sudata-website.vercel.app`);
      lines.push(`DTSTAMP:${now}`);
      lines.push(`DTSTART:${dtStart}`);
      lines.push(`DTEND:${dtEnd}`);
      lines.push(foldLine(`SUMMARY:${escapeText(event.title)}`));

      if (event.description) {
        lines.push(foldLine(`DESCRIPTION:${escapeText(event.description)}`));
      }
      if (event.venue) {
        lines.push(foldLine(`LOCATION:${escapeText(event.venue)}`));
      }
      if (event.signupLink && /^https?:\/\//i.test(event.signupLink)) {
        lines.push(foldLine(`URL:${event.signupLink}`));
      }

      lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");

    const icsContent = lines.join("\r\n") + "\r\n";

    return new Response(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Disposition": 'inline; filename="sudata-events.ics"',
      },
    });
  } catch (error) {
    console.error("Failed to generate iCal feed:", error);
    return new Response("Failed to generate calendar feed", { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};
