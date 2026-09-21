import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const sourceDirectory = path.join(projectRoot, ".codex-remote-attachments", "01a0c34f-97d5-7841-a5e8-e272a15c0937", "7169cb40-590c-4ebf-b385-2a078507cf57");
const outputDirectory = path.join(projectRoot, "public", "tarot");
const artworkOutputDirectory = path.join(outputDirectory, "arcana");

const artwork = [
  ["00-fool", 5, 20], ["01-magician", 171, 20], ["02-high-priestess", 337, 20], ["03-empress", 503, 20], ["04-emperor", 669, 20],
  ["05-hierophant", 5, 264], ["06-lovers", 171, 264], ["07-chariot", 337, 264], ["08-strength", 503, 264], ["09-hermit", 669, 264],
  ["10-wheel-of-fortune", 5, 510], ["11-justice", 171, 510], ["12-hanged-man", 337, 510], ["13-death", 503, 510], ["14-temperance", 669, 510],
  ["15-devil", 5, 755], ["16-tower", 171, 755], ["17-star", 337, 755], ["18-moon", 503, 755], ["19-sun", 669, 755],
  ["20-judgement", 5, 998], ["21-world", 171, 998],
];

const artworkCanvas = { width: 384, height: 512 };
const artworkContent = { width: 332, height: 400 };
const artworkCell = { width: 162, height: 225 };
const frontFrameCrop = { left: 116, top: 35, width: 477, height: 715 };

function clearConnectedDarkBackground(data, width, height) {
  const queued = new Uint8Array(width * height);
  const queue = [];
  const isDark = (pixel) => {
    const offset = pixel * 4;
    return data[offset] < 28 && data[offset + 1] < 28 && data[offset + 2] < 28;
  };
  const add = (pixel) => {
    if (!queued[pixel] && isDark(pixel)) {
      queued[pixel] = 1;
      queue.push(pixel);
    }
  };

  for (let x = 0; x < width; x += 1) { add(x); add((height - 1) * width + x); }
  for (let y = 1; y < height - 1; y += 1) { add(y * width); add(y * width + width - 1); }
  for (let index = 0; index < queue.length; index += 1) {
    const pixel = queue[index];
    data[pixel * 4 + 3] = 0;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    if (x > 0) add(pixel - 1);
    if (x < width - 1) add(pixel + 1);
    if (y > 0) add(pixel - width);
    if (y < height - 1) add(pixel + width);
  }
}

async function makeArtwork(source, name, left, top) {
  const { data, info } = await sharp(source)
    .extract({ left, top, ...artworkCell })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // The supplied sheet uses pure black only as the inter-card background.
  // Preserve the dark outlines while making that background transparent.
  for (let index = 0; index < data.length; index += 4) {
    if (data[index] < 10 && data[index + 1] < 10 && data[index + 2] < 10) data[index + 3] = 0;
  }

  const normalized = await sharp(data, { raw: info })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ ...artworkContent, fit: "contain", kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();

  const canvas = await sharp({
    create: { ...artworkCanvas, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: normalized, gravity: "centre" }])
    .raw()
    .toBuffer({ resolveWithObject: true });

  // JPEG compression reintroduced a few opaque near-black pixels during
  // scaling. Clear only the dark region connected to the outside, preserving
  // details such as eyes and character outlines inside the illustration.
  clearConnectedDarkBackground(canvas.data, canvas.info.width, canvas.info.height);
  await sharp(canvas.data, { raw: canvas.info }).png().toFile(path.join(artworkOutputDirectory, `${name}.png`));
}

async function makeFrontFrame(source) {
  const { data, info } = await sharp(source)
    .extract(frontFrameCrop)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // This is the one shared ARTWORK VIEWPORT. Its transparent opening lets the
  // artwork live below the frame while leaving the supplied border intact.
  const viewport = { left: 50, top: 95, width: 375, height: 495 };
  for (let y = viewport.top; y < viewport.top + viewport.height; y += 1) {
    for (let x = viewport.left; x < viewport.left + viewport.width; x += 1) data[(y * info.width + x) * 4 + 3] = 0;
  }

  await sharp(data, { raw: info }).png().toFile(path.join(outputDirectory, "frame", "tarot-front-frame.png"));
}

async function makeCardBack(source) {
  await sharp(source)
    .extract({ left: 691, top: 35, width: 467, height: 715 })
    .png()
    .toFile(path.join(outputDirectory, "back", "tarot-card-back.png"));
}

await mkdir(path.join(outputDirectory, "frame"), { recursive: true });
await mkdir(path.join(outputDirectory, "back"), { recursive: true });
await mkdir(artworkOutputDirectory, { recursive: true });

const artworkSheet = await readFile(path.join(sourceDirectory, "1-Photo-1.jpg"));
const frameAndBack = await readFile(path.join(sourceDirectory, "2-Photo-2.jpg"));
await Promise.all(artwork.map(([name, left, top]) => makeArtwork(artworkSheet, name, left, top)));
await makeFrontFrame(frameAndBack);
await makeCardBack(frameAndBack);
