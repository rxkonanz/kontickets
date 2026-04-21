import { config } from "dotenv";

config({ path: ".env.local" });
config();

import { PrismaClient } from "../lib/generated/prisma";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "";
const adapter = new PrismaNeonHttp(connectionString, {});
const prisma = new PrismaClient({ adapter } as never);

type ImageSpec = {
  slug: string;
  filename: string;
  unsplashId: string;
  description: string;
};

const specs: ImageSpec[] = [
  {
    slug: "juan-fernando-velasco-gira-para-siempre-quito",
    filename: "juan-fernando-velasco.webp",
    unsplashId: "photo-1501612780327-45045538702b",
    description: "Singer at microphone, warm stage lights",
  },
  {
    slug: "mirella-cesa-noche-andipop-guayaquil",
    filename: "mirella-cesa.webp",
    unsplashId: "photo-1470229722913-7c0e2dbbafd3",
    description: "Pop concert atmosphere with coloured stage lights",
  },
  {
    slug: "nicola-cruz-raices-andinas-cuenca",
    filename: "nicola-cruz.webp",
    unsplashId: "photo-1493225457124-a3eb161ffa5f",
    description: "DJ at an electronic set, neon lighting",
  },
  {
    slug: "daniel-betancourth-acustico-ambato",
    filename: "daniel-betancourth.webp",
    unsplashId: "photo-1511671782779-c97d3d27a1d4",
    description: "Acoustic guitar close-up, warm tones",
  },
];

async function downloadAndOptimize(
  unsplashId: string,
  outPath: string,
): Promise<number> {
  const url = `https://images.unsplash.com/${unsplashId}?w=1800&q=85&auto=format`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Download failed (${resp.status}) for ${url}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  const optimized = await sharp(buf)
    .resize({ width: 1600, height: 900, fit: "cover", position: "attention" })
    .webp({ quality: 78 })
    .toBuffer();
  await writeFile(outPath, optimized);
  return optimized.byteLength;
}

async function main() {
  const outDir = join(process.cwd(), "public", "events");
  await mkdir(outDir, { recursive: true });

  console.log("Fetching + optimizing 4 event images...\n");

  for (const s of specs) {
    const outPath = join(outDir, s.filename);
    console.log(`→ ${s.filename}  (${s.description})`);
    const size = await downloadAndOptimize(s.unsplashId, outPath);
    console.log(`  ✓ saved — ${(size / 1024).toFixed(1)} KB`);

    const coverUrl = `/events/${s.filename}`;
    const events = await prisma.event.findMany({
      where: { slug: s.slug },
      take: 1,
    });
    const event = events[0];
    if (!event) {
      console.warn(`  ⚠ Event not found: ${s.slug}`);
      continue;
    }
    await prisma.event.update({
      where: { id: event.id },
      data: { coverImageUrl: coverUrl },
    });
    console.log(`  ✓ DB updated: ${event.title}\n`);
  }

  console.log("Done. Buebele test event unchanged.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
