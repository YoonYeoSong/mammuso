"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { todayTarotRoutes } from "@/lib/today-tarot/flow";
import { persistTodayTarotProfile, type SajuProfileInput } from "@/lib/today-tarot/profile";

type Member = { id: string; email: string };

export function TodayTarotStart({ openInitially = false }: { openInitially?: boolean }) {
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(openInitially);

  useEffect(() => {
    void fetch("/api/auth/me").then((response) => response.ok ? response.json() : { user: null }).then((data: { user: Member | null }) => setMember(data.user)).finally(() => setLoading(false));
  }, []);

  async function start() {
    if (!member) { setOpen(true); return; }
    try {
      const response = await fetch("/api/today-tarot/profile");
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
    <button className="today-tarot-start-cta" type="button" onClick={start} disabled={loading}>
      시작하기 <span aria-hidden="true">→</span>
    </button>
    {open && <div className="today-tarot-sheet-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
      <section className="today-tarot-start-sheet" role="dialog" aria-modal="true" aria-labelledby="today-start-title" onMouseDown={(event) => event.stopPropagation()}>
        <span className="today-tarot-sheet-handle" aria-hidden="true" />
        <h2 id="today-start-title">오늘의 타로를 시작할까요?</h2>
        <p>원하는 방법으로 오늘의 이야기를 만나보세요.</p>
        <button type="button" className="today-tarot-choice today-tarot-choice--member" onClick={() => router.push("/login?returnTo=/today-tarot")}> 
          <b>로그인하고 시작하기</b><small>내 사주정보와 리딩 기록을 저장하고 편하게 이용해요.</small>
        </button>
        <button type="button" className="today-tarot-choice" onClick={() => router.push("/today-tarot/profile?mode=guest")}>
          <b>로그인 없이 시작하기</b><small>회원가입 없이 오늘의 타로를 이용할 수 있어요.</small>
        </button>
        <p className="today-tarot-sheet-note">비로그인으로 입력한 정보는 이번 리딩에만 사용됩니다.</p>
      </section>
    </div>}
  </>;
}
