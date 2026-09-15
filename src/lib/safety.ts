const urgentPatterns = [
  /자살|자해|죽고 싶|죽여|살해|흉기|폭행|폭력|성폭력|강간|스토킹|협박|아동학대/i,
  /suicid|self.?harm|kill myself|kill you|weapon|assault|rape|stalk/i,
];

export function classifySafety(text: string): "none" | "urgent" {
  return urgentPatterns.some((pattern) => pattern.test(text)) ? "urgent" : "none";
}

export const safetyMessage = "신체적 위험, 폭력·협박, 성폭력, 스토킹 또는 자해·자살 위험이 언급되어 일반 조정 절차를 진행하지 않습니다. 지금 위험하다면 지역 긴급전화 또는 믿을 수 있는 사람·전문기관에 즉시 도움을 요청하세요. 한국에서는 긴급 상황 시 112(경찰), 119(구급), 자살예방 상담 109를 이용할 수 있습니다.";
