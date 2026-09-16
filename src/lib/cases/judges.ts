export type Judge = {
  id: "bodeul" | "beoreok";
  name: string;
  title: string;
  image: string;
  description: string;
};

const judges: Judge[] = [
  { id: "bodeul", name: "말랑 판사", title: "차분히 양쪽 말을 듣는 판사", image: "/illustrations/judge-bodeul.png", description: "서로의 기대가 어디에서 엇갈렸는지, 부드럽고 차분하게 정리합니다." },
  { id: "beoreok", name: "단호 판사", title: "답답한 부분은 콕 짚는 판사", image: "/illustrations/judge-beoreok.png", description: "할 말은 분명히 하지만, 결국은 다음 대화를 돕는 쪽으로 이끕니다." },
];

function seedFor(value: string) {
  return [...value].reduce((sum, character) => (sum * 31 + character.charCodeAt(0)) >>> 0, 17);
}

export function judgeForCase(caseNumber: string, rehearing = false) {
  const index = seedFor(caseNumber || "mammuso") % judges.length;
  return judges[rehearing ? (index + 1) % judges.length : index];
}

export function judgeOpening(judge: Judge, applicantShare: number) {
  const gap = Math.abs(applicantShare - (100 - applicantShare));
  if (gap <= 12) return judge.id === "bodeul"
    ? "두 분 모두 서운했던 이유는 충분히 보입니다. 다만 기대를 말로 확인하지 못한 순간이 갈등을 더 키운 것 같아요."
    : "아니, 두 분 다 속으로만 채점하면 어떡해요. 서운한 건 이해하지만, 말로 맞춰볼 기회는 있었어야죠.";
  return judge.id === "bodeul"
    ? "이번에는 한쪽의 행동이 더 크게 상처로 남았지만, 다음 대화에서는 서로가 원하는 기준을 먼저 확인해보면 좋겠습니다."
    : "이번엔 한쪽이 조금 더 크게 선을 넘었어요. 그래도 누가 이겼는지보다, 다음엔 같은 장면을 안 만드는 게 더 중요합니다.";
}

export function clerkInnerThought(applicantShare: number) {
  const gap = Math.abs(applicantShare - (100 - applicantShare));
  if (gap <= 12) return "솔직히 말하면, 두 분 다 ‘상대가 이 정도는 알아주겠지’ 하고 너무 믿었어요. 말은 좀 합시다.";
  return "한쪽이 더 서운하게 만든 건 맞지만, 다음 대화에서 이기려고만 하면 또 같은 자리로 돌아와요. 이번엔 방법을 바꿔보죠.";
}
