import type { APIRoute } from "astro";
import prisma from "../../lib/prisma";

export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get("id");
  if (!id) {
    return new Response("Missing ID", { status: 400 });
  }

  try {
    const image = await prisma.albumImage.findUnique({
      where: { id: parseInt(id) },
      select: { image_data: true, mime_type: true },
    });

    if (!image) {
      return new Response("Not found", { status: 404 });
    }

    const buffer = Buffer.isBuffer(image.image_data)
      ? image.image_data
      : Buffer.from(image.image_data as unknown as ArrayBuffer);

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": image.mime_type,
        // Image bytes are immutable per id (edits create new rows), so cache hard.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Failed to serve album image:", error);
    return new Response("Error", { status: 500 });
  }
};
