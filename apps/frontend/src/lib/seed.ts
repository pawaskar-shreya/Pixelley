/**
 * seed.ts
 *
 * 1. Uploads all assets to Cloudflare R2 (S3-compatible)
 * 2. Seeds Avatar rows for blackwidow + ironman
 * 3. Seeds the Office Space row
 * 4. Seeds placeable Element rows tied to the Office space
 *
 * Required .env variables:
 *   R2_ACCOUNT_ID        — Cloudflare account ID
 *   R2_ACCESS_KEY_ID     — R2 API token access key
 *   R2_SECRET_ACCESS_KEY — R2 API token secret
 *   R2_BUCKET_NAME       — e.g. "pixelley-assets"
 *   R2_PUBLIC_URL        — public base URL, e.g. "https://assets.yourdomain.com"
 *   DATABASE_URL         — already used by Prisma
 *
 * Run:
 *   cd apps/frontend && npx ts-node src/lib/seed.ts
 * or add to package.json:
 *   "prisma": { "seed": "ts-node prisma/seed.ts" }
 * then: npx prisma db seed
 */

import "dotenv/config";
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from "@pixelley/db";

// R2 client (S3-compatible)

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET      = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL  = process.env.R2_PUBLIC_URL!.replace(/\/$/, ''); // strip trailing slash

// Asset definitions

// Local path (relative to project root) → R2 object key
const ASSETS: { localPath: string; r2Key: string }[] = [
  // MCU Avatars
  { localPath: 'public/mcu-avatars/blackwidow-idle.png',    r2Key: 'mcu-avatars/blackwidow-idle.png'    },
  { localPath: 'public/mcu-avatars/blackwidow-left.png',    r2Key: 'mcu-avatars/blackwidow-left.png'    },
  { localPath: 'public/mcu-avatars/blackwidow-right.png',   r2Key: 'mcu-avatars/blackwidow-right.png'   },
  { localPath: 'public/mcu-avatars/blackwidow-up.png',      r2Key: 'mcu-avatars/blackwidow-up.png'      },
  { localPath: 'public/mcu-avatars/blackwidow-down.png',    r2Key: 'mcu-avatars/blackwidow-down.png'    },
  { localPath: 'public/mcu-avatars/ironman-idle.png',    r2Key: 'mcu-avatars/ironman-idle.png'    },
  { localPath: 'public/mcu-avatars/ironman-left.png',    r2Key: 'mcu-avatars/ironman-left.png'    },
  { localPath: 'public/mcu-avatars/ironman-right.png',   r2Key: 'mcu-avatars/ironman-right.png'   },
  { localPath: 'public/mcu-avatars/ironman-up.png',      r2Key: 'mcu-avatars/ironman-up.png'      },
  { localPath: 'public/mcu-avatars/ironman-down.png',    r2Key: 'mcu-avatars/ironman-down.png'    },

  // Office placeable elements
  { localPath: 'public/free-office-pixel-art/desk.png',             r2Key: 'office/desk.png'             },
  { localPath: 'public/free-office-pixel-art/desk-with-pc.png',     r2Key: 'office/desk-with-pc.png'     },
  { localPath: 'public/free-office-pixel-art/chair.png',            r2Key: 'office/chair.png'            },
  { localPath: 'public/free-office-pixel-art/plant.png',            r2Key: 'office/plant.png'            },
  { localPath: 'public/free-office-pixel-art/cabinet.png',          r2Key: 'office/cabinet.png'          },
  { localPath: 'public/free-office-pixel-art/printer.png',          r2Key: 'office/printer.png'          },
  { localPath: 'public/free-office-pixel-art/pc1.png',              r2Key: 'office/pc1.png'              },
  { localPath: 'public/free-office-pixel-art/pc2.png',              r2Key: 'office/pc2.png'              },
  { localPath: 'public/free-office-pixel-art/water-cooler.png',     r2Key: 'office/water-cooler.png'     },
  { localPath: 'public/free-office-pixel-art/coffee-maker.png',     r2Key: 'office/coffee-maker.png'     },
  { localPath: 'public/free-office-pixel-art/writing-table.png',    r2Key: 'office/writing-table.png'    },
  { localPath: 'public/free-office-pixel-art/stamping-table.png',   r2Key: 'office/stamping-table.png'   },
  { localPath: 'public/free-office-pixel-art/sink.png',             r2Key: 'office/sink.png'             },
  { localPath: 'public/free-office-pixel-art/trash.png',            r2Key: 'office/trash.png'            },
];

// Upload helper 

async function uploadToR2(localPath: string, r2Key: string): Promise<string> {
  const absPath = path.resolve(process.cwd(), localPath);

  if (!fs.existsSync(absPath)) {
    console.warn(`  ⚠  File not found, skipping: ${absPath}`);
    return `${PUBLIC_URL}/${r2Key}`; // return expected URL anyway so DB seed can continue
  }

  // Skip if already uploaded (idempotent re-runs)
  try {
    await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: r2Key }));
    console.log(`  ✓  Already exists, skipping: ${r2Key}`);
    return `${PUBLIC_URL}/${r2Key}`;
  } catch {
    // Not found: proceed to upload
  }

  const body        = fs.readFileSync(absPath);
  const contentType = 'image/png';

  await r2.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         r2Key,
    Body:        body,
    ContentType: contentType,
    // Make publicly readable if your bucket allows it:
    // ACL: 'public-read',
  }));

  const url = `${PUBLIC_URL}/${r2Key}`;
  console.log(`  ↑  Uploaded: ${r2Key}`);
  return url;
}

// DB seed data (URLs filled after upload)

async function seedAvatars(urls: Record<string, string>) {
  console.log('\n Seeding Avatars');

  const avatars = [
    {
      name:     'Black Widow',
      gender:   'female',
      idleUrl:  urls['mcu-avatars/blackwidow-idle.png'],
      leftUrl:  urls['mcu-avatars/blackwidow-left.png'],
      rightUrl: urls['mcu-avatars/blackwidow-right.png'],
      upUrl:    urls['mcu-avatars/blackwidow-up.png'],
      downUrl:  urls['mcu-avatars/blackwidow-down.png'],
    },
    {
      name:     'Iron Man',
      gender:   'male',
      idleUrl:  urls['mcu-avatars/ironman-idle.png'],
      leftUrl:  urls['mcu-avatars/ironman-left.png'],
      rightUrl: urls['mcu-avatars/ironman-right.png'],
      upUrl:    urls['mcu-avatars/ironman-up.png'],
      downUrl:  urls['mcu-avatars/ironman-down.png'],
    },
  ];

  for (const avatar of avatars) {
    const record = await prisma.avatar.upsert({
      where:  { name: avatar.name } as any, // add @@unique([name]) to schema if not present
      update: avatar,
      create: avatar,
    });
    console.log(`  ✓  Avatar: ${record.name} (${record.id})`);
  }
}

async function seedOfficeSpace(urls: Record<string, string>) {
  console.log('\n Seeding Office Space');

  // Upsert by name so re-runs are safe
  const space = await prisma.space.upsert({
    where:  { name: 'Office' } as any, // add @@unique([name]) if not present, or use findFirst pattern below
    update: {},
    create: {
      name:      'Office',
      width:     1024,
      height:    896,
      thumbnail: `${PUBLIC_URL}/office/desk-with-pc.png`, // use any office asset as placeholder thumbnail
    },
  });

  console.log(`  ✓  Space: ${space.name} (${space.id})`);

  // Placeable elements tied to this space 
  // width/height are raw PNG pixel dimensions
  const elements: {
    name: string;
    r2Key: string;
    width: number;
    height: number;
    isCollidable: boolean;
  }[] = [
    { name: 'Desk',           r2Key: 'office/desk.png',           width: 64, height: 32, isCollidable: true  },
    { name: 'Desk with PC',   r2Key: 'office/desk-with-pc.png',   width: 64, height: 64, isCollidable: true  },
    { name: 'Chair',          r2Key: 'office/chair.png',          width: 16, height: 16, isCollidable: false },
    { name: 'Plant',          r2Key: 'office/plant.png',          width: 32, height: 32, isCollidable: true  },
    { name: 'Cabinet',        r2Key: 'office/cabinet.png',        width: 64, height: 64, isCollidable: true  },
    { name: 'Printer',        r2Key: 'office/printer.png',        width: 64, height: 32, isCollidable: true  },
    { name: 'PC 1',           r2Key: 'office/pc1.png',            width: 32, height: 32, isCollidable: false },
    { name: 'PC 2',           r2Key: 'office/pc2.png',            width: 32, height: 32, isCollidable: false },
    { name: 'Water Cooler',   r2Key: 'office/water-cooler.png',   width: 16, height: 32, isCollidable: true  },
    { name: 'Coffee Maker',   r2Key: 'office/coffee-maker.png',   width: 64, height: 64, isCollidable: true  },
    { name: 'Writing Table',  r2Key: 'office/writing-table.png',  width: 64, height: 64, isCollidable: true  },
    { name: 'Stamping Table', r2Key: 'office/stamping-table.png', width: 64, height: 32, isCollidable: true  },
    { name: 'Sink',           r2Key: 'office/sink.png',           width: 64, height: 64, isCollidable: true  },
    { name: 'Trash',          r2Key: 'office/trash.png',          width: 16, height: 16, isCollidable: false },
  ];

  for (const el of elements) {
    const imageUrl = urls[el.r2Key];

    // Upsert by name+spaceId safe to re-run
    const existing = await prisma.element.findFirst({
      where: { name: el.name, spaceId: space.id },
    });

    if (existing) {
      await prisma.element.update({
        where: { id: existing.id },
        data:  { imageUrl, width: el.width, height: el.height, isCollidable: el.isCollidable },
      });
      console.log(`  ↺  Element updated: ${el.name}`);
    } else {
      await prisma.element.create({
        data: {
          name:         el.name,
          spaceId:      space.id,
          width:        el.width,
          height:       el.height,
          isCollidable: el.isCollidable,
          imageUrl,
        },
      });
      console.log(`  +  Element created: ${el.name}`);
    }
  }
}

// Main

async function main() {
  console.log('=== Pixelley Seed Script ===\n');

  // Validate env
  const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL'];
  for (const key of required) {
    if (!process.env[key]) throw new Error(`Missing env var: ${key}`);
  }

  // Step 1: upload all assets to R2, collect key -> public URL map
  console.log(' Uploading assets to R2');
  const urls: Record<string, string> = {};

  for (const { localPath, r2Key } of ASSETS) {
    const url    = await uploadToR2(localPath, r2Key);
    urls[r2Key]  = url;
  }

  // Step 2: seed DB
  await seedAvatars(urls);
  await seedOfficeSpace(urls);

  console.log('\n Seed complete.');
}

main()
  .catch((err) => {
    console.error('\n Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());