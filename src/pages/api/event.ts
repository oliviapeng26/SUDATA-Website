import type { APIRoute } from "astro";
import prisma from "../../lib/prisma";

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
        date: new Date(body.date), 
        time: new Date(`${body.date}T${body.time}`),
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
        date: new Date(body.date),
        time: new Date(`${body.date}T${body.time}`),
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