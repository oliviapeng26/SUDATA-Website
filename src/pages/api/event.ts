import type { APIRoute } from "astro";
import prisma from "../../lib/prisma";

const EVENT_TIME_ZONE = "Australia/Sydney";

function parseDateInput(dateInput: string) {
  const match = String(dateInput).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new Error("Invalid event date");
  }

  const [, year, month, day] = match;
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
  };
}

function parseTimeInput(timeInput: string) {
  const match = String(timeInput).match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    throw new Error("Invalid event time");
  }

  const [, hour, minute] = match;
  return {
    hour: Number(hour),
    minute: Number(minute),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const partMap = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const asUtc = Date.UTC(
    Number(partMap.year),
    Number(partMap.month) - 1,
    Number(partMap.day),
    Number(partMap.hour),
    Number(partMap.minute),
    Number(partMap.second),
  );

  return asUtc - date.getTime();
}

function createDateOnly(dateInput: string) {
  const { year, month, day } = parseDateInput(dateInput);
  return new Date(Date.UTC(year, month - 1, day));
}

function createSydneyDateTime(dateInput: string, timeInput: string) {
  const { year, month, day } = parseDateInput(dateInput);
  const { hour, minute } = parseTimeInput(timeInput);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
  const firstOffset = getTimeZoneOffsetMs(new Date(utcGuess), EVENT_TIME_ZONE);
  const firstUtc = utcGuess - firstOffset;
  const secondOffset = getTimeZoneOffsetMs(new Date(firstUtc), EVENT_TIME_ZONE);

  return new Date(utcGuess - secondOffset);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // Process image if provided
    let imageData = null;
    let mimeType = null;

    if (body.image) {
      // Extract mime type and base64 data from data URL
      const matches = body.image.match(/^data:(.+?);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        const base64Data = matches[2];
        // Convert base64 to Buffer
        imageData = Buffer.from(base64Data, 'base64');
      }
    }

    const newEvent = await prisma.event.create({
      data: {
        title: body.title,
        date: createDateOnly(body.date),
        time: createSydneyDateTime(body.date, body.time),
        venue: body.venue,
        type: body.type,
        signupLink: body.signupLink,
        catering: body.catering,
        collaborators: body.collaborators, // Expects an array of strings
        description: body.description,
        image_data: imageData,
        mime_type: mimeType,
      },
    });

    // Return event without the image_data field for response (too large to send back)
    const response = { ...newEvent, image_data: null };
    return new Response(JSON.stringify(response), { status: 201 });
  } catch (error) {
    console.error("Event creation error:", error);
    return new Response(JSON.stringify({ error: "Failed to create event", details: error instanceof Error ? error.message : String(error) }), { status: 500 });
  }
};


export const GET: APIRoute = async () => {
  try {
    const events = await prisma.event.findMany({
      orderBy: {
        date: 'desc', // Sorts events by date (soonest first)
      },
    });

    // Convert image data to base64 for serialization
    const eventsWithImages = events.map(event => {
      const eventData = {
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        venue: event.venue,
        type: event.type,
        signupLink: event.signupLink,
        catering: event.catering,
        collaborators: event.collaborators,
        description: event.description,
        mime_type: event.mime_type,
        image_url: null as string | null
      };

      if (event.image_data && event.mime_type) {
        // Convert Prisma Bytes (array or Uint8Array) to Buffer if needed
        const buffer = Buffer.isBuffer(event.image_data)
          ? event.image_data
          : Buffer.from(event.image_data as any);
        const base64String = buffer.toString('base64');
        eventData.image_url = `data:${event.mime_type};base64,${base64String}`;
      }
      return eventData;
    });

    return new Response(JSON.stringify(eventsWithImages), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch events" }), { 
      status: 500 
    });
  }
};

export const DELETE: APIRoute =  async ({ url }) => {
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(JSON.stringify({ message: "Missing ID" }), { status: 400 });
  }

  try {
    await prisma.event.delete({
      where: { id: parseInt(id) },
    });

    return new Response(JSON.stringify({ message: "Event Purged" }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Database Error", error }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request, url }) => {
  const id = url.searchParams.get('id');
  const body = await request.json();

  if (!id) {
    return new Response(JSON.stringify({ message: "Missing ID" }), { status: 400 });
  }

  try {
    // Process image if provided
    let imageData = null;
    let mimeType = null;

    if (body.image) {
      // Extract mime type and base64 data from data URL
      const matches = body.image.match(/^data:(.+?);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        const base64Data = matches[2];
        // Convert base64 to Buffer
        imageData = Buffer.from(base64Data, 'base64');
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id: parseInt(id) },
      data: {
        title: body.title,
        date: createDateOnly(body.date),
        time: createSydneyDateTime(body.date, body.time),
        venue: body.venue,
        type: body.type,
        signupLink: body.signupLink,
        catering: body.catering,
        collaborators: body.collaborators,
        description: body.description,
        image_data: imageData,
        mime_type: mimeType,
      },
    });
    
    // Return event without the image_data field for response (too large to send back)
    const response = { ...updatedEvent, image_data: null };
    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error) {
    console.error("Event update error:", error);
    return new Response(JSON.stringify({ error: "Update failed", details: error instanceof Error ? error.message : String(error) }), { status: 500 });
  }
};
