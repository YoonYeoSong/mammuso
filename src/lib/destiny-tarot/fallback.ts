import { getDestinyReadingProfile, type DestinyReadingType } from "./profiles";
import { MAX_DESTINY_FOLLOW_UPS, type DestinyChatReply, type DestinyConversationMessage } from "./types";

function userMessages(conversation: DestinyConversationMessage[]) {
  return conversation.filter((message) => message.role === "user").map((message) => message.content.trim()).filter(Boolean);
}

function compactConcern(messages: string[]) {
  const concern = messages.join(" ").replace(/\s+/g, " ").trim();
  return concern.length > 170 ? `${concern.slice(0, 167)}…` : concern;
}

function isClearTarotQuestion(text: string) {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length >= 10 && /(궁금|어떨|될까|될지|좋을까|봐줘|알고 싶|맞을까|가능|운)/.test(compact);
}

function periodQuestion(text: string, readingType: DestinyReadingType) {
  if (readingType === "love") return "새로운 인연의 흐름이 궁금한가요, 아니면 마음에 있는 사람과의 관계를 볼까요?";
  if (readingType === "choice") return "지금 고민하는 두 선택 중 어떤 흐름을 비교해볼까요?";
  if (readingType === "career") return "지금 자리의 흐름이 궁금한가요, 아니면 변화·이직 쪽을 볼까요?";
  if (readingType === "reunion") return "상대의 현재 흐름이 궁금한가요, 아니면 다시 이어질 가능성을 볼까요?";
  if (/(재물|금전|돈)/.test(text)) return "가까운 시기의 돈 흐름이 궁금한가요, 아니면 올해 전체 재물운을 볼까요?";
  if (/(이직|취업|직장)/.test(text)) return "지금 이직 자체의 흐름이 궁금한가요, 아니면 지금 직장과 옮길 곳 중 어디가 나을지 볼까요?";
  return "가까운 시기 흐름이 궁금한가요, 아니면 올해 전체 흐름을 볼까요?";
}

/** Keeps the first phase usable when an AI provider is unavailable or malformed. */
export function createDestinyChatFallback(conversation: DestinyConversationMessage[], readingType: DestinyReadingType = "general", forceReady = false): DestinyChatReply {
  const messages = userMessages(conversation);
  const latest = messages.at(-1) ?? "";
  const followUpCount = Math.max(0, messages.length - 1);
  const firstConcern = messages[0] ?? latest;
  const hasSpecificContext = isClearTarotQuestion(firstConcern) || latest.length >= 36 || messages.join(" ").length >= 75;

  if (!forceReady && followUpCount < MAX_DESTINY_FOLLOW_UPS && !hasSpecificContext) {
    return {
      status: "ASK",
      acknowledgement: "좋아요, 그쪽 운을 봐드릴게요. 딱 하나만 정하면 카드가 더 또렷해져요.",
      question: periodQuestion(latest, readingType),
      quickReplies: readingType === "money" ? ["가까운 시기가 궁금해요", "올해 전체 흐름을 보고 싶어요"] : [],
    };
  }

  const concern = compactConcern(messages) || "지금 마음에 걸리는 고민";
  return {
    status: "READY",
    assistantMessage: `좋아요. ${getDestinyReadingProfile(readingType).displayName}로 바로 카드를 펼쳐볼 수 있어요 :)`,
    summary: `“${concern}”에 대해 카드가 보여주는 방향과 흐름을 보고 싶어 해요.`,
    finalQuestion: concern.endsWith("?") ? concern : `${concern}의 흐름은 어떨까?`,
  };
}
