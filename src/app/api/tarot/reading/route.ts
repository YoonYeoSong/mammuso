import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@/lib/ai/provider";
import { getTarotCards, tarotCategories } from "@/lib/tarot/cards";
import { apiError } from "@/lib/http";

const inputSchema = z.object({
  category: z.enum(tarotCategories),
  question: z.string().trim().max(280),
  cardIds: z.array(z.string()).length(3),
});

export async function POST(request: NextRequest) {
  try {
    const input = inputSchema.parse(await request.json());
    const cards = getTarotCards(input.cardIds);
    if (cards.length !== 3 || new Set(cards.map((card) => card.id)).size !== 3) throw new Error("INVALID_TAROT_CARDS");
    const reading = await getAIProvider().generateTarotReading({ ...input, cards });
    return NextResponse.json({ reading });
  } catch (error) {
    return apiError(error);
  }
}
