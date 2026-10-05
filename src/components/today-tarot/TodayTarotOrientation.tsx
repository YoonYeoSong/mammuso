"use client";

import { useEffect } from "react";

export function OrientationInfoTrigger({ onClick }: { onClick: () => void }) {
  return <button type="button" className="today-tarot-orientation-info" onClick={onClick} aria-label="정방향과 역방향 설명 보기">
    <span aria-hidden="true">ⓘ</span>
  </button>;
}

export function OrientationGuide({ onOpen }: { onOpen: () => void }) {
  return <section className="today-tarot-orientation-guide" aria-label="카드 방향 안내">
    <p>카드는 정방향 또는 역방향으로 나타나요</p>
    <p>선택한 카드의 방향도 무작위로 결정됩니다.</p>
    <button type="button" onClick={onOpen}>정방향과 역방향이 궁금하다면 눌러보세요 <span aria-hidden="true">›</span></button>
  </section>;
}

export function OrientationBottomSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  if (!open) return null;
  return <div className="today-tarot-orientation-sheet-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="today-tarot-orientation-sheet" role="dialog" aria-modal="true" aria-labelledby="today-tarot-orientation-title" onMouseDown={(event) => event.stopPropagation()}>
      <span className="today-tarot-sheet-handle" aria-hidden="true" />
      <div className="today-tarot-orientation-sheet-heading"><h2 id="today-tarot-orientation-title">정방향과 역방향</h2><button type="button" onClick={onClose} aria-label="방향 설명 닫기">×</button></div>
      <p><b>정방향</b>은 카드가 가진 메시지가 자연스럽게 드러나는 흐름을 뜻해요.</p>
      <p><b>역방향</b>은 그 메시지를 조금 다르게 바라보거나, 안쪽의 마음을 살펴볼 때를 뜻해요.</p>
      <p className="today-tarot-orientation-sheet-note">역방향이라고 해서 나쁜 카드라는 뜻은 아니에요. 오늘의 메시지를 읽는 또 하나의 방향이에요.</p>
    </section>
  </div>;
}
