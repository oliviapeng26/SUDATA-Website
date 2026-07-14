import type { APIRoute } from "astro";
import prisma from "../../lib/prisma";

// Preview images are stored as bytes in Postgres — keep them small.
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB per preview image
const MAX_IMAGES_PER_ALBUM = 60;

type ParsedImage = { data: Buffer; mimeType: string };

function parseDataUrl(dataUrl: string): ParsedImage | null {
  const match = String(dataUrl).match(/^data:(.+?);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1];
  const data = Buffer.from(match[2], "base64");
  return { data, mimeType };
}

function validateImages(dataUrls: unknown): { images: ParsedImage[] } | { error: string } {
  if (!Array.isArray(dataUrls)) return { images: [] };
  if (dataUrls.length > MAX_IMAGES_PER_ALBUM) {
    return { error: `Too many images (max ${MAX_IMAGES_PER_ALBUM}).` };
  }
  const images: ParsedImage[] = [];
  for (const url of dataUrls) {
    const parsed = parseDataUrl(url);
    if (!parsed) return { error: "One of the images is not a valid data URL." };
    if (!parsed.mimeType.startsWith("image/")) {
      return { error: "Only image files are allowed." };
    }
    if (parsed.data.byteLength > MAX_IMAGE_BYTES) {
      return { error: `Each image must be under ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB.` };
    }
    images.push(parsed);
  }
  return { images };
}

export const GET: APIRoute = async () => {
  try {
    const albums = await prisma.album.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        images: {
          orderBy: { position: "asc" },
          select: { id: true, position: true },
        },
      },
    });

    const payload = albums.map((album) => ({
      id: album.id,
      name: album.name,
      date: album.date,
      link: album.link,
      images: album.images.map((img) => ({ id: img.id, url: `/api/album-image?id=${img.id}` })),
    }));

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to fetch albums:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch albums" }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    if (!body.name || !body.link) {
      return new Response(JSON.stringify({ error: "Name and link are required." }), { status: 400 });
    }

    const result = validateImages(body.images);
    if ("error" in result) {
      return new Response(JSON.stringify({ error: result.error }), { status: 400 });
    }

    const album = await prisma.album.create({
      data: {
        name: body.name,
        date: body.date || "",
        link: body.link,
        images: {
          create: result.images.map((img, position) => ({
            image_data: img.data,
            mime_type: img.mimeType,
            position,
          })),
        },
      },
    });

    return new Response(JSON.stringify({ id: album.id }), { status: 201 });
  } catch (error) {
    console.error("Album creation error:", error);
    return new Response(JSON.stringify({ error: "Failed to create album" }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request, url }) => {
  const id = url.searchParams.get("id");
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400 });
  }

  try {
    const body = await request.json();
    const albumId = parseInt(id);

    if (!body.name || !body.link) {
      return new Response(JSON.stringify({ error: "Name and link are required." }), { status: 400 });
    }

    const result = validateImages(body.newImages);
    if ("error" in result) {
      return new Response(JSON.stringify({ error: result.error }), { status: 400 });
    }

    // Images the user chose to keep; everything else for this album is removed.
    const keepIds: number[] = Array.isArray(body.keepImageIds)
      ? body.keepImageIds.map((n: unknown) => Number(n)).filter((n: number) => Number.isInteger(n))
      : [];

    const existing = await prisma.albumImage.findMany({
      where: { albumId },
      select: { id: true },
    });
    const keptCount = existing.filter((img) => keepIds.includes(img.id)).length;
    if (keptCount + result.images.length > MAX_IMAGES_PER_ALBUM) {
      return new Response(
        JSON.stringify({ error: `Too many images (max ${MAX_IMAGES_PER_ALBUM}).` }),
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.album.update({
        where: { id: albumId },
        data: { name: body.name, date: body.date || "", link: body.link },
      }),
      prisma.albumImage.deleteMany({
        where: { albumId, id: { notIn: keepIds.length ? keepIds : [-1] } },
      }),
      ...result.images.map((img, i) =>
        prisma.albumImage.create({
          data: {
            albumId,
            image_data: img.data,
            mime_type: img.mimeType,
            position: 1000 + i, // appended after kept images
          },
        }),
      ),
    ]);

    return new Response(JSON.stringify({ id: albumId }), { status: 200 });
  } catch (error) {
    console.error("Album update error:", error);
    return new Response(JSON.stringify({ error: "Failed to update album" }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  const id = url.searchParams.get("id");
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400 });
  }

  try {
    await prisma.album.delete({ where: { id: parseInt(id) } });
    return new Response(JSON.stringify({ message: "Album deleted" }), { status: 200 });
  } catch (error) {
    console.error("Album delete error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete album" }), { status: 500 });
  }
};
