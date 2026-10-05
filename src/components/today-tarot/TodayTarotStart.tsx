"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { todayTarotRoutes } from "@/lib/today-tarot/flow";
import { TODAY_TAROT_SESSION_KEY } from "@/lib/today-tarot/session";

export function TodayTarotStart({ openInitially = false }: { openInitially?: boolean }) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [open, setOpen] = useState(openInitially);
  const startLock = useRef(false);
  const choiceLock = useRef(false);

  function closeSheet() {
    setOpen(false);
    startLock.current = false;
    choiceLock.current = false;
  }

  function chooseStartPath(path: string) {
    if (choiceLock.current) return;
    choiceLock.current = true;
    router.push(path);
  }

  function startGuestReading() {
    window.sessionStorage.removeItem(TODAY_TAROT_SESSION_KEY);
    chooseStartPath(todayTarotRoutes.preparing);
  }

  function start() {
    if (startLock.current) return;
    startLock.current = true;
    setIsStarting(true);
    setOpen(true);
    setIsStarting(false);
  }

  return <>
    <button className="today-tarot-start-cta" type="button" onClick={start} disabled={isStarting}>
      시작하기 <span aria-hidden="true">→</span>
    </button>
    {open && <div className="today-tarot-sheet-backdrop" role="presentation" onPointerDown={closeSheet}>
      <section className="today-tarot-start-sheet" role="dialog" aria-modal="true" aria-labelledby="today-start-title" onPointerDown={(event) => event.stopPropagation()}>
        <span className="today-tarot-sheet-handle" aria-hidden="true" />
        <h2 id="today-start-title">오늘의 타로를 시작할까요?</h2>
        <p>원하는 방법으로 오늘의 이야기를 만나보세요.</p>
        <button type="button" className="today-tarot-choice today-tarot-choice--member" disabled aria-disabled="true">
          <b>로그인 <em>준비 중</em></b><small>로그인 기능은 현재 테스트를 준비하고 있어요.</small>
        </button>
        <button type="button" className="today-tarot-choice" onClick={startGuestReading}>
          <b>로그인 없이 시작하기</b><small>회원가입 없이 오늘의 타로를 이용할 수 있어요.</small><small className="today-tarot-choice-test-note">현재 테스트 버전으로 이용할 수 있어요.</small>
        </button>
        <p className="today-tarot-sheet-note">테스트 중인 오늘의 타로를 먼저 만나보세요.</p>
      </section>
    </div>}
  </>;
}
