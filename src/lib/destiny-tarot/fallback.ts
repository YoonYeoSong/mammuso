import { MAX_DESTINY_FOLLOW_UPS, type DestinyChatReply, type DestinyConversationMessage } from "./types";

function userMessages(conversation: DestinyConversationMessage[]) {
  return conversation.filter((message) => message.role === "user").map((message) => message.content.trim()).filter(Boolean);
}

function compactConcern(messages: string[]) {
  const concern = messages.join(" ").replace(/\s+/g, " ").trim();
  return concern.length > 170 ? `${concern.slice(0, 167)}…` : concern;
}

/** Keeps the first phase usable when an AI provider is unavailable or malformed. */
export function createDestinyChatFallback(conversation: DestinyConversationMessage[], forceReady = false): DestinyChatReply {
  const messages = userMessages(conversation);
  const latest = messages.at(-1) ?? "";
  const followUpCount = Math.max(0, messages.length - 1);
  const hasSpecificContext = latest.length >= 36 || messages.join(" ").length >= 75;

  if (!forceReady && followUpCount < MAX_DESTINY_FOLLOW_UPS && !hasSpecificContext) {
    return {
      status: "ASK",
      assistantMessage: "그 고민에서 가장 마음을 망설이게 하는 지점은 무엇인가요? 한 가지 장면이나 선택지를 들려주셔도 좋아요.",
      quickReplies: ["계속할지 바꿀지 고민이에요", "상대의 마음이 궁금해요", "어떤 선택이 맞을지 모르겠어요"],
    };
  }

  const concern = compactConcern(messages) || "지금 마음에 걸리는 고민";
  return {
    status: "READY",
    assistantMessage: "이야기를 충분히 들었어요. 지금의 마음을 살펴볼 수 있는 질문으로 정리해볼게요.",
    summary: `${concern}에 대해, 지금의 상황과 선택의 기준을 차분히 살펴보고 싶어 해요.`,
    finalQuestion: "이 고민을 나에게 맞는 방향으로 정리하기 위해, 지금 가장 살펴봐야 할 흐름과 선택의 기준은 무엇일까?",
  };
}
