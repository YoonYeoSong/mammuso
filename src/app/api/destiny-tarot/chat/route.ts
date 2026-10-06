import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@/lib/ai/provider";
import { createDestinyChatFallback } from "@/lib/destiny-tarot/fallback";
import { MAX_DESTINY_FOLLOW_UPS, type DestinyConversationMessage } from "@/lib/destiny-tarot/types";
import { apiError } from "@/lib/http";

const inputSchema = z.object({
  conversation: z.array(z.object({
    id: z.string().min(1).max(80),
    role: z.enum(["assistant", "user"]),
    content: z.string().trim().min(1).max(600),
    quickReplies: z.array(z.string().trim().min(1).max(60)).max(4).optional(),
  })).min(1).max(12),
});

export async function POST(request: NextRequest) {
  let input: z.infer<typeof inputSchema>;
  try {
    input = inputSchema.parse(await request.json());
  } catch (error) {
    return apiError(error);
  }

  const conversation = input.conversation as DestinyConversationMessage[];
  const userTurns = conversation.filter((message) => message.role === "user").length;
  if (!userTurns) return NextResponse.json({ error: "INVALID_CONVERSATION", message: "고민을 먼저 들려주세요." }, { status: 400 });

  const followUpCount = Math.max(0, userTurns - 1);
  try {
    const reply = await getAIProvider().generateDestinyTarotChat({ conversation, followUpCount });
    if (reply.status === "ASK" && followUpCount >= MAX_DESTINY_FOLLOW_UPS) {
      return NextResponse.json({ reply: createDestinyChatFallback(conversation, true), fallback: true });
    }
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Destiny tarot chat failed; returning a guided fallback.", error);
    return NextResponse.json({ reply: createDestinyChatFallback(conversation, followUpCount >= MAX_DESTINY_FOLLOW_UPS), fallback: true });
  }
}
