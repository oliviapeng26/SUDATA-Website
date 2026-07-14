import prisma from "../lib/prisma";

export type PhotoAlbum = {
  id: number;
  name: string;
  date: string;
  link: string;
  images: { src: string; alt: string }[];
};

// Loads admin-managed albums from the database. Returns [] on any error
// (e.g. the table not yet created) so the static albums still render.
export async function getDbAlbums(): Promise<PhotoAlbum[]> {
  try {
    const albums = await prisma.album.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        images: { orderBy: { position: "asc" }, select: { id: true } },
      },
    });

    return albums.map((album) => ({
      id: album.id,
      name: album.name,
      date: album.date,
      link: album.link,
      images: album.images.map((img, i) => ({
        src: `/api/album-image?id=${img.id}`,
        alt: `${album.name} ${i + 1}`,
      })),
    }));
  } catch (error) {
    console.error("Failed to load albums from DB:", error);
    return [];
  }
}
