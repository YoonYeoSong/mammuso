import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const sourceFile = path.join(
  projectRoot,
  ".codex-remote-attachments",
  "01a0c6f2-6fb8-7ed2-ba42-8bde69fefbb1",
  "1840537c-2284-438e-b409-63593a288e34",
  "1-1000005797.jpg",
);
const artworkOutputDirectory = path.join(projectRoot, "public", "tarot", "fronts");

// The supplied sheet is ordered 1–21 across the first three rows, with the
// Fool (22) in the final row. Each crop includes the complete printed front:
// number, illustration, and Korean title.
const cardNames = [
  "01-magician", "02-high-priestess", "03-empress", "04-emperor", "05-hierophant", "06-lovers", "07-chariot",
  "08-strength", "09-hermit", "10-wheel-of-fortune", "11-justice", "12-hanged-man", "13-death", "14-temperance",
  "15-devil", "16-tower", "17-star", "18-moon", "19-sun", "20-judgement", "21-world",
  "00-fool",
];

const columns = [
  { left: 0, width: 127 }, { left: 127, width: 121 }, { left: 248, width: 120 }, { left: 368, width: 119 },
  { left: 487, width: 119 }, { left: 606, width: 123 }, { left: 729, width: 124 },
];
const rows = [
  { top: 0, height: 336 }, { top: 336, height: 342 }, { top: 678, height: 326 }, { top: 1004, height: 276 },
];
const outputSize = { width: 384, height: 576 };

async function makeCardFront(source, name, row, column) {
  const cell = { ...columns[column], ...rows[row] };
  const card = await sharp(source)
    .extract(cell)
    .trim({ background: { r: 255, g: 255, b: 255 }, threshold: 12 })
    // Tarot interaction layouts use a consistent 2:3 card canvas. The source
    // sheet is unusually narrow, so normalize the complete supplied face to
    // that canvas rather than cropping away its printed number or title.
    .resize(outputSize.width, outputSize.height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();

  await sharp(card).toFile(path.join(artworkOutputDirectory, `${name}.png`));
}

await mkdir(artworkOutputDirectory, { recursive: true });
const source = await readFile(sourceFile);
for (const [index, name] of cardNames.entries()) {
  await makeCardFront(source, name, Math.floor(index / 7), index % 7);
}
