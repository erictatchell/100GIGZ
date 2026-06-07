import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".gif",
  ".tiff",
  ".bmp",
]);

const HASH_SIZE = 16;
// 16x16 = 256-bit perceptual hash.
// Higher = more accurate but slower.

const DUPLICATE_THRESHOLD = 10;
// 0 = identical hash
// 1-5 = extremely similar
// 6-15 = likely duplicate / resized / slightly compressed
// 16+ = increasingly different

async function getImageFiles(folder) {
  const entries = await fs.readdir(folder, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(folder, entry.name);

    if (entry.isDirectory()) {
      files.push(...await getImageFiles(fullPath));
    } else {
      const ext = path.extname(entry.name).toLowerCase();

      if (IMAGE_EXTENSIONS.has(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

async function averageHash(imagePath) {
  const { data } = await sharp(imagePath)
    .resize(HASH_SIZE, HASH_SIZE, {
      fit: "fill",
    })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let total = 0;

  for (const pixel of data) {
    total += pixel;
  }

  const average = total / data.length;

  let hash = "";

  for (const pixel of data) {
    hash += pixel > average ? "1" : "0";
  }

  return hash;
}

function hammingDistance(hashA, hashB) {
  if (hashA.length !== hashB.length) {
    throw new Error("Hashes must be the same length");
  }

  let distance = 0;

  for (let i = 0; i < hashA.length; i++) {
    if (hashA[i] !== hashB[i]) {
      distance++;
    }
  }

  return distance;
}

async function findDuplicates(folder) {
  const files = await getImageFiles(folder);
  const images = [];

  console.log(`Scanning ${files.length} image(s)...`);

  for (const file of files) {
    try {
      const hash = await averageHash(file);
      images.push({ file, hash });
    } catch (error) {
      console.warn(`Skipping unreadable image: ${file}`);
    }
  }

  const duplicateGroups = [];
  const used = new Set();

  for (let i = 0; i < images.length; i++) {
    if (used.has(i)) continue;

    const group = [images[i]];

    for (let j = i + 1; j < images.length; j++) {
      if (used.has(j)) continue;

      const distance = hammingDistance(images[i].hash, images[j].hash);

      if (distance <= DUPLICATE_THRESHOLD) {
        group.push({
          ...images[j],
          distance,
        });

        used.add(j);
      }
    }

    if (group.length > 1) {
      used.add(i);
      duplicateGroups.push(group);
    }
  }

  return duplicateGroups;
}

function printResults(groups) {
  if (groups.length === 0) {
    console.log("No duplicate images found.");
    return;
  }

  console.log(`\nFound ${groups.length} duplicate group(s):\n`);

  groups.forEach((group, index) => {
    console.log(`Duplicate group ${index + 1}:`);

    group.forEach((item, itemIndex) => {
      if (itemIndex === 0) {
        console.log(`  Original-ish: ${item.file}`);
      } else {
        console.log(`  Duplicate:    ${item.file}`);
        console.log(`  Difference:   ${item.distance}`);
      }
    });

    console.log("");
  });
}

const folder = process.argv[2];

if (!folder) {
  console.error("Usage:");
  console.error("node find-duplicate-images.js ./path/to/images");
  process.exit(1);
}

try {
  const groups = await findDuplicates(folder);
  printResults(groups);
} catch (error) {
  console.error("Error:", error.message);
  process.exit(1);
}