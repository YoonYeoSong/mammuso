"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { todayTarotRoutes } from "@/lib/today-tarot/flow";
import { persistTodayTarotProfile, type SajuProfileInput } from "@/lib/today-tarot/profile";

type Member = { id: string; email: string };

export function TodayTarotStart({ openInitially = false }: { openInitially?: boolean }) {
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [open, setOpen] = useState(openInitially);
  const authRequest = useRef<Promise<Member | null> | null>(null);
  const startLock = useRef(false);
  const choiceLock = useRef(false);

  const resolveMember = useCallback(() => {
    if (!authRequest.current) {
      authRequest.current = fetch("/api/auth/me")
        .then((response) => response.ok ? response.json() as Promise<{ user: Member | null }> : { user: null })
        .then((data) => data.user)
        .catch(() => null);
    }
    return authRequest.current;
  }, []);

  useEffect(() => {
    let mounted = true;
    void resolveMember().then((user) => { if (mounted) setMember(user); });
    return () => { mounted = false; };
  }, [resolveMember]);

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

  async function start() {
    if (startLock.current) return;
    startLock.current = true;
    setIsStarting(true);

    const signedInMember = member ?? await resolveMember();
    if (!signedInMember) {
      setOpen(true);
      setIsStarting(false);
      return;
    }

    try {
      const response = await fetch("/api/today-tarot/profile");
      if (!response.ok) throw new Error("PROFILE_LOOKUP_FAILED");
      const data = await response.json() as { profile: SajuProfileInput | null };
      if (data.profile) {
        persistTodayTarotProfile({ ...data.profile, source: "member" });
        router.push(todayTarotRoutes.preparing);
        return;
      }
    } catch { /* The profile screen offers a clear recovery path. */ }
    router.push("/today-tarot/profile?mode=member");
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
        <button type="button" className="today-tarot-choice today-tarot-choice--member" onClick={() => chooseStartPath("/login?returnTo=/today-tarot")}>
          <b>로그인하고 시작하기</b><small>내 사주정보와 리딩 기록을 저장하고 편하게 이용해요.</small>
        </button>
        <button type="button" className="today-tarot-choice" onClick={() => chooseStartPath("/today-tarot/profile?mode=guest")}>
          <b>로그인 없이 시작하기</b><small>회원가입 없이 오늘의 타로를 이용할 수 있어요.</small>
        </button>
        <p className="today-tarot-sheet-note">비로그인으로 입력한 정보는 이번 리딩에만 사용됩니다.</p>
      </section>
    </div>}
  </>;
}
