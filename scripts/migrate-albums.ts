import "dotenv/config";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { PrismaClient } from "../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Insert oldest-first so the newest createdAt (INN) renders at the top,
// matching the original page order (INN, Startup, Ball).
const albums = [
  { dir: "ball", name: "SUDATA x SUMATH x UNSWMATH Ball '25", date: "Oct 2025", link: "https://photos.app.goo.gl/KkFssZJXDh3iFj2M9" },
  { dir: "startup", name: "Startup Night", date: "Sept 2025", link: "https://photos.app.goo.gl/Ts9CYAZnoeQV1dsS9" },
  { dir: "inn", name: "INN 2025", date: "May 2025", link: "https://photos.app.goo.gl/sPAGscihAqiscHNU6" },
];

const ROOT = process.cwd();

for (const album of albums) {
  const existing = await prisma.album.findFirst({ where: { name: album.name } });
  if (existing) {
    console.log(`SKIP "${album.name}" — already in DB (id ${existing.id})`);
    continue;
  }

  const dirPath = join(ROOT, "src/assets/albums", album.dir);
  const files = readdirSync(dirPath)
    .filter((f) => /\.(jpg|jpeg|png|webp|avif)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const images: { image_data: Buffer; mime_type: string; position: number }[] = [];
  for (let i = 0; i < files.length; i++) {
    const buf = readFileSync(join(dirPath, files[i]));
    const out = await sharp(buf)
      .rotate() // honour EXIF orientation
      .resize({ width: 1280, withoutEnlargement: true })
      .jpeg({ quality: 72, mozjpeg: true })
      .toBuffer();
    images.push({ image_data: out, mime_type: "image/jpeg", position: i });
    console.log(`  ${album.dir}/${files[i]}: ${(buf.length / 1048576).toFixed(1)}MB -> ${(out.length / 1024).toFixed(0)}KB`);
  }

  const created = await prisma.album.create({
    data: { name: album.name, date: album.date, link: album.link, images: { create: images } },
  });
  console.log(`CREATED "${album.name}" (id ${created.id}) with ${images.length} images\n`);
}

await prisma.$disconnect();
console.log("Done.");
