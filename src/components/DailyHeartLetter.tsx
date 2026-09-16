"use client";

import Link from "next/link";
import { useState } from "react";

const dailyMessages = [
  "오늘은 결론보다, 내가 서운했던 순간을 정확히 이름 붙여보세요.",
  "답을 서두르기보다, 내가 바랐던 한 가지를 먼저 적어보면 마음이 가벼워질 수 있어요.",
  "상대의 의도를 단정하기 전, 내가 들은 말과 느낀 감정을 나누어 보세요.",
  "오늘의 작은 정리는 ‘왜 그랬을까’보다 ‘나는 무엇이 필요했을까’에서 시작됩니다.",
  "마음이 복잡할수록 사건의 순서를 차분히 적어보세요. 그 안에 다음 말이 숨어 있을 수 있어요.",
  "잘 풀어야 한다는 부담 대신, 내 입장을 한 문장으로 정리하는 것부터 해보세요.",
  "상대에게 전하고 싶은 말과 내가 이해받고 싶은 마음은 다를 수 있어요. 둘 다 적어봐도 괜찮습니다.",
];

const startingPoints = [
  { id: "fact", label: "사실부터", prompt: "그날 무슨 일이 어떤 순서로 있었나요?" },
  { id: "feeling", label: "마음부터", prompt: "그중에서 가장 오래 마음에 남은 순간은 언제였나요?" },
  { id: "wish", label: "바람부터", prompt: "상대가 알아줬으면 하는 한 가지는 무엇인가요?" },
] as const;

function messageForToday() {
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const seed = [...date].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return dailyMessages[seed % dailyMessages.length];
}

export function DailyHeartLetter() {
  const [isOpen, setIsOpen] = useState(false);
  const [startingPointId, setStartingPointId] = useState<(typeof startingPoints)[number]["id"]>("fact");
  const message = messageForToday();
  const startingPoint = startingPoints.find((item) => item.id === startingPointId) ?? startingPoints[0];

  return <section className={`daily-letter ${isOpen ? "is-open" : ""}`} aria-labelledby="daily-letter-title">
    <div className="daily-letter-copy">
      <p className="eyebrow">김햄찌의 오늘 마음 우편</p>
      <h2 id="daily-letter-title">오늘의 한 줄이<br />도착했어요.</h2>
      <p>짧은 한마디로 마음의 첫 문을 열어보세요.</p>
    </div>
    <div className="daily-letter-action">
      <button type="button" className="daily-letter-button" onClick={() => setIsOpen(true)} aria-expanded={isOpen} aria-controls="daily-letter-message">
        <span aria-hidden="true">✉</span>{isOpen ? "오늘의 우편을 열었어요" : "오늘의 한 줄 열기"}
      </button>
      {!isOpen && <small>매일 새로운 한 줄이 도착합니다.</small>}
    </div>
    {isOpen && <div id="daily-letter-message" className="daily-letter-message" role="status"><p className="eyebrow">오늘 김햄찌의 한마디</p><p>{message}</p><div className="heart-starter"><span>사연은 어디부터 꺼내볼까요?</span><div className="starter-options" role="group" aria-label="사연 정리 시작점">{startingPoints.map((item) => <button type="button" className={item.id === startingPointId ? "selected" : ""} onClick={() => setStartingPointId(item.id)} key={item.id}>{item.label}</button>)}</div><p key={startingPoint.id}>{startingPoint.prompt}</p></div><div><Link href={`/intake?start=${startingPoint.id}#statement`} className="button">이 질문으로 사연 정리하기 <span>→</span></Link><a href="#process" className="text-button">민원 절차 보기</a></div></div>}
  </section>;
}
