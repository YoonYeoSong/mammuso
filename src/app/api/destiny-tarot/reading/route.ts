import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";
import { canonicalizeDestinyReadingInput, createFallbackDestinyReading, isValidDestinyReading } from "@/lib/destiny-tarot/reading";
import type { DestinyReadingInput } from "@/lib/destiny-tarot/types";

export async function POST(request: NextRequest) {
  let input: DestinyReadingInput;
  try {
    const body: unknown = await request.json();
    const canonicalInput = canonicalizeDestinyReadingInput(body);
    if (!canonicalInput) throw new Error("INVALID_DESTINY_READING_INPUT");
    input = canonicalInput;
  } catch {
    return NextResponse.json({ message: "리딩에 필요한 카드 정보를 확인하지 못했어요." }, { status: 400 });
  }

  try {
    const generated = await getAIProvider().generateDestinyReading(input);
    if (!isValidDestinyReading(generated, input)) throw new Error("INVALID_DESTINY_READING_RESPONSE");
    return NextResponse.json({ reading: generated, fallback: false });
  } catch (error) {
    console.error("Destiny tarot reading failed; returning the stable fallback.", error);
    return NextResponse.json({ reading: createFallbackDestinyReading(input), fallback: true });
  }
}
