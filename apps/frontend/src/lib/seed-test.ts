/**
 * seed.local.ts
 *
 * Seeds Avatar + Office Space using local public/ file paths.
 * No R2 uploads — zero cloud cost.
 *
 * Setup:
 *   1. Add DATABASE_URL to .env pointing to your local test Postgres container and comment the original DATABASE_URL
 *   2. Run:  npx prisma migrate dev
 *   3. Run:  cd apps/frontend &&  npx ts-node src/lib/seed-test.ts
 */

import "dotenv/config";
import { prisma } from "@pixelley/db";

// These resolve to files in your public/ folder, served by Vite at dev time
const BASE = ""; // empty = relative URLs like /mcu-avatars/blackwidow-idle.png

const AVATAR_BASE = `${BASE}/mcu-avatars`;
const OFFICE_BASE = `${BASE}/free-office-pixel-art`;

async function seedAvatars() {
  console.log("\n Seeding Avatars (local paths)");

  const avatars = [
    {
      name: "Black Widow",
      gender: "female",
      idleUrl: `${AVATAR_BASE}/blackwidow-idle.png`,
      leftUrl: `${AVATAR_BASE}/blackwidow-left.png`,
      rightUrl: `${AVATAR_BASE}/blackwidow-right.png`,
      upUrl: `${AVATAR_BASE}/blackwidow-up.png`,
      downUrl: `${AVATAR_BASE}/blackwidow-down.png`,
    },
    {
      name: "Iron Man",
      gender: "male",
      idleUrl: `${AVATAR_BASE}/ironman-idle.png`,
      leftUrl: `${AVATAR_BASE}/ironman-left.png`,
      rightUrl: `${AVATAR_BASE}/ironman-right.png`,
      upUrl: `${AVATAR_BASE}/ironman-up.png`,
      downUrl: `${AVATAR_BASE}/ironman-down.png`,
    },
  ];

  for (const avatar of avatars) {
    const record = await prisma.avatar.upsert({
      where: { name: avatar.name } as any,
      update: avatar,
      create: avatar,
    });
    console.log(`  ✓  Avatar: ${record.name} (${record.id})`);
  }
}

async function seedOfficeSpace() {
  console.log("\n Seeding Office Space (local paths)");

  const space = await prisma.space.upsert({
    where: { name: "Office" } as any,
    update: {},
    create: {
      name: "Office",
      width: 1200,
      height: 800,
      thumbnail: `${OFFICE_BASE}/desk-with-pc.png`,
    },
  });

  console.log(`  ✓  Space: ${space.name} (${space.id})`);

  const elements: {
    name: string;
    imageUrl: string;
    width: number;
    height: number;
    isCollidable: boolean;
  }[] = [
    { name: "Desk",           imageUrl: `${OFFICE_BASE}/desk.png`,           width: 64, height: 32, isCollidable: true  },
    { name: "Desk with PC",   imageUrl: `${OFFICE_BASE}/desk-with-pc.png`,   width: 64, height: 64, isCollidable: true  },
    { name: "Chair",          imageUrl: `${OFFICE_BASE}/chair.png`,          width: 16, height: 16, isCollidable: false },
    { name: "Plant",          imageUrl: `${OFFICE_BASE}/plant.png`,          width: 32, height: 32, isCollidable: true  },
    { name: "Cabinet",        imageUrl: `${OFFICE_BASE}/cabinet.png`,        width: 64, height: 64, isCollidable: true  },
    { name: "Printer",        imageUrl: `${OFFICE_BASE}/printer.png`,        width: 64, height: 32, isCollidable: true  },
    { name: "PC 1",           imageUrl: `${OFFICE_BASE}/pc1.png`,            width: 32, height: 32, isCollidable: false },
    { name: "PC 2",           imageUrl: `${OFFICE_BASE}/pc2.png`,            width: 32, height: 32, isCollidable: false },
    { name: "Water Cooler",   imageUrl: `${OFFICE_BASE}/water-cooler.png`,   width: 16, height: 32, isCollidable: true  },
    { name: "Coffee Maker",   imageUrl: `${OFFICE_BASE}/coffee-maker.png`,   width: 64, height: 64, isCollidable: true  },
    { name: "Writing Table",  imageUrl: `${OFFICE_BASE}/writing-table.png`,  width: 64, height: 64, isCollidable: true  },
    { name: "Stamping Table", imageUrl: `${OFFICE_BASE}/stamping-table.png`, width: 64, height: 32, isCollidable: true  },
    { name: "Sink",           imageUrl: `${OFFICE_BASE}/sink.png`,           width: 64, height: 64, isCollidable: true  },
    { name: "Trash",          imageUrl: `${OFFICE_BASE}/trash.png`,          width: 16, height: 16, isCollidable: false },
  ];

  for (const el of elements) {
    const existing = await prisma.element.findFirst({
      where: { name: el.name, spaceId: space.id },
    });

    if (existing) {
      await prisma.element.update({
        where: { id: existing.id },
        data: { imageUrl: el.imageUrl, width: el.width, height: el.height, isCollidable: el.isCollidable },
      });
      console.log(`  ↺  Element updated: ${el.name}`);
    } else {
      await prisma.element.create({
        data: {
          name: el.name,
          spaceId: space.id,
          width: el.width,
          height: el.height,
          isCollidable: el.isCollidable,
          imageUrl: el.imageUrl,
        },
      });
      console.log(`  +  Element created: ${el.name}`);
    }
  }
}

async function main() {
  console.log("=== Pixelley LOCAL Seed (no R2) ===\n");
  await seedAvatars();
  await seedOfficeSpace();
  console.log("\n Local seed complete.");
}

main()
  .catch((err) => {
    console.error("\n Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());