import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@/lib/ai/provider";
import { getTarotCards, tarotCategories, type TarotCard } from "@/lib/tarot/cards";
import { apiError } from "@/lib/http";

const inputSchema = z.object({
  category: z.enum(tarotCategories),
  question: z.string().trim().max(280),
  cardIds: z.array(z.string()).length(3),
});

export async function POST(request: NextRequest) {
  let input: z.infer<typeof inputSchema>;
  try {
    input = inputSchema.parse(await request.json());
  } catch (error) {
    return apiError(error);
  }

  const cards = getTarotCards(input.cardIds);
  if (cards.length !== 3 || new Set(cards.map((card) => card.id)).size !== 3) return apiError(new Error("INVALID_TAROT_CARDS"));

  try {
    const reading = await getAIProvider().generateTarotReading({ ...input, cards });
    return NextResponse.json({ reading });
  } catch (error) {
    console.error("Tarot AI reading failed; returning card-based reading.", error);
    return NextResponse.json({ reading: createCardBasedReading(cards), fallback: true });
  }
}

function createCardBasedReading(cards: TarotCard[]) {
  const [first, second, third] = cards;
  return {
    headline: `${first.name}에서 ${third.name}까지, 마음의 흐름을 살펴볼 때예요.`,
    opening: `지금은 ${first.keywords[0]}의 마음에서 출발해 ${second.keywords[0]}을(를) 거쳐 ${third.keywords[0]}으로 시선이 이어지는 모습이에요. 답을 서두르기보다, 세 장이 보여준 순서를 차분히 따라가 봐요.`,
    cardReadings: [
      { title: `지금의 마음 · ${first.name}`, meaning: `${first.keywords.join("·")}의 기운이 먼저 보여요. 지금 느끼는 마음을 숨기지 말고, 무엇이 가장 중요한지 한 번 적어보면 좋아요.` },
      { title: `나를 스치는 것 · ${second.name}`, meaning: `${second.keywords.join("·")}이(가) 가까이에 있어요. 바로 결론 내리기보다, 현재 선택에 도움이 되는 작은 단서를 살펴봐요.` },
      { title: `다가오는 흐름 · ${third.name}`, meaning: `${third.keywords.join("·")}의 방향을 비춰요. 이것은 확정된 미래가 아니라, 오늘의 선택을 가볍게 점검해 볼 힌트예요.` },
    ],
    takeaway: `세 장은 ${first.name}의 마음을 알아차리고 ${second.name}의 관점으로 정리한 뒤, ${third.name}이(가) 알려주는 방향을 선택해 보라고 말해요. 부담 없는 한 걸음부터 시작해도 충분해요.`,
    tinyAction: "오늘 마음에 걸린 한 가지를 짧은 문장으로 적어보기",
  };
}
