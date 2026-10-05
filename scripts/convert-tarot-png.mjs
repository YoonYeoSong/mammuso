import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const tarotDirectory = path.join(projectRoot, "public", "tarot");
const suits = ["arcana", "wands", "cups", "swords", "pentacles"];
const referenceJpeg = path.join(tarotDirectory, "swords", "06-six-of-swords.jpg");
const referenceMask = path.join(tarotDirectory, "swords", "06-six-of-swords-transparent-test.png");
const frameSignalThreshold = 45;

function brightnessAt(data, offset) {
  return Math.max(data[offset], data[offset + 1], data[offset + 2]);
}

function findFrameSignals(data, width, height) {
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const findFromLeft = () => {
    for (let x = 0; x < centerX; x += 1) {
      if (brightnessAt(data, (centerY * width + x) * 3) > frameSignalThreshold) return x;
    }
    return -1;
  };
  const findFromRight = () => {
    for (let x = width - 1; x > centerX; x -= 1) {
      if (brightnessAt(data, (centerY * width + x) * 3) > frameSignalThreshold) return x;
    }
    return -1;
  };
  const findFromTop = () => {
    for (let y = 0; y < centerY; y += 1) {
      if (brightnessAt(data, (y * width + centerX) * 3) > frameSignalThreshold) return y;
    }
    return -1;
  };
  const findFromBottom = () => {
    for (let y = height - 1; y > centerY; y -= 1) {
      if (brightnessAt(data, (y * width + centerX) * 3) > frameSignalThreshold) return y;
    }
    return -1;
  };

  const signals = { left: findFromLeft(), right: findFromRight(), top: findFromTop(), bottom: findFromBottom() };
  if (Object.values(signals).some((value) => value < 0)) throw new Error(`Could not locate all four frame signals: ${JSON.stringify(signals)}`);
  if (signals.right - signals.left < width * 0.7 || signals.bottom - signals.top < height * 0.8) throw new Error(`Implausible frame signals: ${JSON.stringify(signals)}`);
  return signals;
}

function remapCoordinate(value, targetStart, targetEnd, referenceStart, referenceEnd) {
  return Math.round(referenceStart + ((value - targetStart) * (referenceEnd - referenceStart)) / (targetEnd - targetStart));
}

function alphaCounts(rgba) {
  let transparent = 0;
  let partial = 0;
  let opaque = 0;
  for (let index = 3; index < rgba.length; index += 4) {
    if (rgba[index] === 0) transparent += 1;
    else if (rgba[index] === 255) opaque += 1;
    else partial += 1;
  }
  return { transparent, partial, opaque };
}

function alphaBounds(rgba, width, height) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (rgba[(y * width + x) * 4 + 3] === 0) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  return { left, top, right, bottom };
}

function createCardRgba(source, width, height, referenceAlpha, referenceSignals, targetSignals) {
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const referenceY = Math.max(0, Math.min(height - 1, remapCoordinate(y, targetSignals.top, targetSignals.bottom, referenceSignals.top, referenceSignals.bottom)));
    for (let x = 0; x < width; x += 1) {
      const sourceOffset = (y * width + x) * 3;
      const targetOffset = (y * width + x) * 4;
      const referenceX = Math.max(0, Math.min(width - 1, remapCoordinate(x, targetSignals.left, targetSignals.right, referenceSignals.left, referenceSignals.right)));
      rgba[targetOffset] = source[sourceOffset];
      rgba[targetOffset + 1] = source[sourceOffset + 1];
      rgba[targetOffset + 2] = source[sourceOffset + 2];
      rgba[targetOffset + 3] = referenceAlpha[referenceY * width + referenceX];
    }
  }
  return rgba;
}

async function validatePng(jpegPath, pngPath, expectedSignals) {
  const [jpeg, png] = await Promise.all([
    sharp(jpegPath).raw().toBuffer({ resolveWithObject: true }),
    sharp(pngPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);
  if (jpeg.info.width !== 853 || jpeg.info.height !== 1280 || png.info.width !== 853 || png.info.height !== 1280 || png.info.channels !== 4) throw new Error(`${path.basename(pngPath)} has invalid dimensions or alpha channel`);
  let rgbMismatches = 0;
  for (let pixel = 0; pixel < png.info.width * png.info.height; pixel += 1) {
    const jpgOffset = pixel * 3;
    const pngOffset = pixel * 4;
    if (png.data[pngOffset + 3] !== 0 && (png.data[pngOffset] !== jpeg.data[jpgOffset] || png.data[pngOffset + 1] !== jpeg.data[jpgOffset + 1] || png.data[pngOffset + 2] !== jpeg.data[jpgOffset + 2])) rgbMismatches += 1;
  }
  if (rgbMismatches) throw new Error(`${path.basename(pngPath)} changed ${rgbMismatches} non-transparent RGB pixels`);
  const counts = alphaCounts(png.data);
  const bounds = alphaBounds(png.data, png.info.width, png.info.height);
  const transparentRatio = counts.transparent / (png.info.width * png.info.height);
  const anomaly = transparentRatio < 0.06 || transparentRatio > 0.12 || counts.partial === 0 || bounds.left > expectedSignals.left || bounds.right < expectedSignals.right || bounds.top > expectedSignals.top || bounds.bottom < expectedSignals.bottom;
  return { file: path.basename(pngPath), dimensions: `${png.info.width}x${png.info.height}`, signals: expectedSignals, bounds, ...counts, transparentRatio, rgbMismatches, anomaly };
}

const [referenceSource, referencePng] = await Promise.all([
  sharp(referenceJpeg).raw().toBuffer({ resolveWithObject: true }),
  sharp(referenceMask).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
]);
if (referenceSource.info.width !== 853 || referenceSource.info.height !== 1280 || referencePng.info.width !== 853 || referencePng.info.height !== 1280) throw new Error("The approved reference pair must be 853x1280");
const referenceSignals = findFrameSignals(referenceSource.data, referenceSource.info.width, referenceSource.info.height);
const referenceAlpha = Buffer.alloc(referenceSource.info.width * referenceSource.info.height);
for (let pixel = 0; pixel < referenceAlpha.length; pixel += 1) referenceAlpha[pixel] = referencePng.data[pixel * 4 + 3];

const results = [];
for (const suit of suits) {
  const directory = path.join(tarotDirectory, suit);
  const jpegFiles = (await readdir(directory)).filter((file) => file.endsWith(".jpg")).sort();
  for (const file of jpegFiles) {
    const jpegPath = path.join(directory, file);
    const pngPath = path.join(directory, file.replace(/\.jpg$/, ".png"));
    const source = await sharp(jpegPath).raw().toBuffer({ resolveWithObject: true });
    if (source.info.width !== 853 || source.info.height !== 1280 || source.info.channels !== 3) throw new Error(`${file} is not an 853x1280 RGB JPG`);
    const signals = findFrameSignals(source.data, source.info.width, source.info.height);
    const rgba = createCardRgba(source.data, source.info.width, source.info.height, referenceAlpha, referenceSignals, signals);
    await sharp(rgba, { raw: { width: source.info.width, height: source.info.height, channels: 4 } }).png().toFile(pngPath);
    results.push({ suit, ...(await validatePng(jpegPath, pngPath, signals)) });
  }
}

if (results.length !== 78) throw new Error(`Expected 78 JPG files, found ${results.length}`);
const anomalies = results.filter((result) => result.anomaly);
console.log(JSON.stringify({ generated: results.length, bySuit: Object.fromEntries(suits.map((suit) => [suit, results.filter((result) => result.suit === suit).length])), anomalies, cards: results }, null, 2));
if (anomalies.length) process.exitCode = 1;
