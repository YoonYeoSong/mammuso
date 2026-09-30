"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TodayTarotHeader } from "./TodayTarotHeader";
import { formatBirthDate, parseBirthDate, parseBirthTime, persistTodayTarotProfile, type SajuGender } from "@/lib/today-tarot/profile";
import { todayTarotRoutes } from "@/lib/today-tarot/flow";

type ProfileMode = "guest" | "member";

const genderOptions: Array<{ value: SajuGender; label: string }> = [
  { value: "female", label: "여성" }, { value: "male", label: "남성" }, { value: "other", label: "직접 선택" },
];

export function TodayTarotProfileForm({ mode }: { mode: ProfileMode }) {
  const router = useRouter();
  const datePicker = useRef<HTMLInputElement>(null);
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [unknownTime, setUnknownTime] = useState(false);
  const [gender, setGender] = useState<SajuGender | null>(null);
  const [meridiem, setMeridiem] = useState<"am" | "pm" | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerHour, setPickerHour] = useState("3");
  const [pickerMinute, setPickerMinute] = useState("00");
  const [pickerMeridiem, setPickerMeridiem] = useState<"am" | "pm">("am");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode !== "member") return;
    void fetch("/api/today-tarot/profile").then((response) => response.ok ? response.json() : null).then((data: { profile?: { birthDate: string; birthTime: string | null; birthTimeUnknown: boolean; gender: SajuGender } } | null) => {
      if (!data?.profile) return;
      setBirthDate(formatBirthDate(data.profile.birthDate));
      setBirthTime(data.profile.birthTime ?? "");
      setUnknownTime(data.profile.birthTimeUnknown);
      setGender(data.profile.gender);
    });
  }, [mode]);

  function chooseDate(value: string) {
    if (!value) return;
    setBirthDate(formatBirthDate(value));
    setError("");
  }

  function commitTimePicker() {
    const parsed = parseBirthTime(`${pickerMeridiem === "am" ? "오전" : "오후"} ${pickerHour}:${pickerMinute}`);
    if (parsed.value) setBirthTime(parsed.value);
    setMeridiem(pickerMeridiem);
    setShowTimePicker(false);
    setError("");
  }

  async function submit() {
    const date = parseBirthDate(birthDate);
    const time = unknownTime ? { value: null, needsMeridiem: false } : parseBirthTime(birthTime, meridiem ?? undefined);
    if (!date) { setError("생년월일을 정확히 입력해주세요."); return; }
    if (!unknownTime && time.needsMeridiem) { setError("오전 또는 오후를 선택해주세요."); return; }
    if (!unknownTime && !time.value) { setError("출생시간을 정확히 입력하거나, 모름을 선택해주세요."); return; }
    if (!gender) { setError("성별을 선택해주세요."); return; }
    const profile = { birthDate: date, birthTime: time.value, birthTimeUnknown: unknownTime, gender };
    setSaving(true);
    try {
      if (mode === "member") {
        const response = await fetch("/api/today-tarot/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
        if (!response.ok) throw new Error("SAVE_FAILED");
      }
      // This is sessionStorage, not localStorage or a database. Guest input is
      // only kept long enough for this in-progress reading.
      persistTodayTarotProfile({ ...profile, source: mode });
      router.push(todayTarotRoutes.preparing);
    } catch {
      setError(mode === "member" ? "저장에 실패했어요. 로그인 상태를 확인한 뒤 다시 시도해주세요." : "입력 정보를 다시 확인해주세요.");
    } finally { setSaving(false); }
  }

  return <main className="today-tarot-page today-tarot-profile-page">
    <div className="today-tarot-app-surface">
      <TodayTarotHeader backHref={todayTarotRoutes.intro} title={mode === "guest" ? "게스트 사주정보" : "내 사주정보"} />
      <section className="today-tarot-profile-form" aria-labelledby="saju-profile-title">
        <div className="today-tarot-profile-copy">
          <p>{mode === "guest" ? "오늘의 리딩을 위한 정보" : "저장할 사주정보"}</p>
          <h2 id="saju-profile-title">당신의 오늘을<br />조금 더 깊게 읽어볼게요.</h2>
        </div>
        <div className="today-tarot-field-group">
          <label htmlFor="birth-date">생년월일</label>
          <div className="today-tarot-input-with-button">
            <input id="birth-date" type="text" inputMode="numeric" autoComplete="bday" placeholder="1992. 03. 15" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} onBlur={() => { const value = parseBirthDate(birthDate); if (value) setBirthDate(formatBirthDate(value)); }} />
            <button type="button" aria-label="달력으로 생년월일 선택" onClick={() => { try { datePicker.current?.showPicker(); } catch { datePicker.current?.click(); } }}>⌑</button>
            <input ref={datePicker} className="today-tarot-native-picker" type="date" max={new Date().toISOString().slice(0, 10)} onChange={(event) => chooseDate(event.target.value)} tabIndex={-1} aria-hidden="true" />
          </div>
          <small>예: 19920315, 1992-03-15, 1992.03.15</small>
        </div>
        <div className="today-tarot-field-group">
          <label htmlFor="birth-time">출생시간 <span>선택</span></label>
          <div className={`today-tarot-input-with-button ${unknownTime ? "is-disabled" : ""}`}>
            <input id="birth-time" type="text" inputMode="numeric" placeholder="예: 오후 3:30" value={birthTime} disabled={unknownTime} onChange={(event) => { setBirthTime(event.target.value); setError(""); }} onBlur={() => { const parsed = parseBirthTime(birthTime, meridiem ?? undefined); if (parsed.value) setBirthTime(parsed.value); }} />
            <button type="button" aria-label="시간 선택" disabled={unknownTime} onClick={() => setShowTimePicker(true)}>◷</button>
          </div>
          {!unknownTime && parseBirthTime(birthTime).needsMeridiem && <div className="today-tarot-meridiem-choice" aria-label="오전 또는 오후 선택"><span>오전/오후</span><button type="button" className={meridiem === "am" ? "is-selected" : ""} onClick={() => setMeridiem("am")}>오전</button><button type="button" className={meridiem === "pm" ? "is-selected" : ""} onClick={() => setMeridiem("pm")}>오후</button></div>}
          <label className="today-tarot-unknown-time"><input type="checkbox" checked={unknownTime} onChange={(event) => setUnknownTime(event.target.checked)} /><span>출생시간을 몰라요</span></label>
        </div>
        <fieldset className="today-tarot-field-group today-tarot-gender"><legend>성별</legend><div>{genderOptions.map((option) => <button type="button" key={option.value} className={gender === option.value ? "is-selected" : ""} onClick={() => setGender(option.value)}>{option.label}</button>)}</div></fieldset>
        {error && <p className="today-tarot-form-error" role="alert">{error}</p>}
        <button type="button" className={mode === "guest" ? "today-tarot-start-cta" : "today-tarot-profile-submit"} disabled={saving} onClick={submit}>{saving ? "저장하는 중…" : "오늘의 타로 시작하기"}<span aria-hidden="true">→</span></button>
        {mode === "guest" && <aside className="today-tarot-privacy-note"><span aria-hidden="true">♢</span><p>입력한 정보는 이번 리딩에만 사용돼요. 사주 해석을 위해 일시적으로 처리되며, 리딩이 끝난 뒤 별도로 저장하지 않습니다.</p></aside>}
      </section>
    </div>
    {showTimePicker && <div className="today-tarot-picker-backdrop" role="presentation"><section className="today-tarot-time-picker" role="dialog" aria-modal="true" aria-label="출생시간 선택"><h2>출생시간 선택</h2><div><select value={pickerMeridiem} onChange={(event) => setPickerMeridiem(event.target.value as "am" | "pm")}><option value="am">오전</option><option value="pm">오후</option></select><select value={pickerHour} onChange={(event) => setPickerHour(event.target.value)}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={String(index + 1)}>{index + 1}시</option>)}</select><select value={pickerMinute} onChange={(event) => setPickerMinute(event.target.value)}>{["00", "10", "20", "30", "40", "50"].map((minute) => <option key={minute} value={minute}>{minute}분</option>)}</select></div><button type="button" onClick={commitTimePicker}>선택 완료</button><button type="button" className="today-tarot-picker-cancel" onClick={() => setShowTimePicker(false)}>취소</button></section></div>}
  </main>;
}
