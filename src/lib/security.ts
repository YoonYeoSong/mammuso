import { createHash, randomBytes } from "node:crypto";

export function createAccessToken() {
  return randomBytes(32).toString("base64url");
}
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function createPublicCaseNumber(date = new Date()) {
  const ymd = date.toISOString().slice(0, 10).replaceAll("-", "");
  return `맘-${ymd}-${randomBytes(3).toString("hex").toUpperCase()}`;
}
