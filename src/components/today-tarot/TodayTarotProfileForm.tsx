"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TodayTarotHeader } from "./TodayTarotHeader";
import { formatBirthDate, parseBirthDate, parseBirthTime, persistTodayTarotProfile, type SajuGender } from "@/lib/today-tarot/profile";
import { todayTarotRoutes } from "@/lib/today-tarot/flow";

type ProfileMode = "guest" | "member";

const genderOptions: Array<{ value: SajuGender; label: string }> = [
  { value: "female", label: "여성" }, { value: "male", label: "남성" },
];

function getTimeControls(value: string) {
  const [hourValue, minute = "00"] = value.split(":");
  const hour = Number(hourValue);
  const meridiem: "am" | "pm" = hour >= 12 ? "pm" : "am";
  const twelveHour = hour % 12 || 12;
  return { meridiem, hour: String(twelveHour), minute };
}

function formatTimeField(value: string) {
  const { hour, minute } = getTimeControls(value);
  return minute === "00" ? hour : `${hour}:${minute}`;
}

export function TodayTarotProfileForm({ mode }: { mode: ProfileMode }) {
  const router = useRouter();
  const datePicker = useRef<HTMLInputElement>(null);
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [unknownTime, setUnknownTime] = useState(false);
  const [gender, setGender] = useState<SajuGender | null>(null);
  const [meridiem, setMeridiem] = useState<"am" | "pm">("am");
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
      if (data.profile.birthTime) {
        const controls = getTimeControls(data.profile.birthTime);
        setMeridiem(controls.meridiem);
        setBirthTime(formatTimeField(data.profile.birthTime));
      }
      setUnknownTime(data.profile.birthTimeUnknown);
      setGender(data.profile.gender === "female" || data.profile.gender === "male" ? data.profile.gender : null);
    });
  }, [mode]);

  function chooseDate(value: string) {
    if (!value) return;
    setBirthDate(formatBirthDate(value));
    setError("");
  }

  function commitTimePicker() {
    const parsed = parseBirthTime(`${pickerHour}:${pickerMinute}`, pickerMeridiem);
    if (parsed.value) setBirthTime(formatTimeField(parsed.value));
    setMeridiem(pickerMeridiem);
    setShowTimePicker(false);
    setError("");
  }

  function openTimePicker() {
    const parsed = parseBirthTime(birthTime, meridiem);
    if (parsed.value) {
      const controls = getTimeControls(parsed.value);
      setPickerMeridiem(controls.meridiem);
      setPickerHour(controls.hour);
      setPickerMinute(controls.minute);
    } else {
      setPickerMeridiem(meridiem);
      setPickerHour("3");
      setPickerMinute("00");
    }
    setShowTimePicker(true);
  }

  async function submit() {
    const date = parseBirthDate(birthDate);
    const time = unknownTime ? { value: null, needsMeridiem: false } : parseBirthTime(birthTime, meridiem);
    if (!date) { setError("생년월일을 정확히 입력해주세요."); return; }
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
          <div className={`today-tarot-time-controls ${unknownTime ? "is-disabled" : ""}`}>
            <select aria-label="오전 또는 오후 선택" value={meridiem} disabled={unknownTime} onChange={(event) => { setMeridiem(event.target.value as "am" | "pm"); setError(""); }}>
              <option value="am">오전</option><option value="pm">오후</option>
            </select>
            <div className="today-tarot-input-with-button">
              <input id="birth-time" type="text" inputMode="text" placeholder="예: 3 또는 3:30" value={birthTime} disabled={unknownTime} onChange={(event) => { setBirthTime(event.target.value); setError(""); }} onBlur={() => { const parsed = parseBirthTime(birthTime, meridiem); if (parsed.value) setBirthTime(formatTimeField(parsed.value)); }} />
              <button type="button" aria-label="시간 선택" disabled={unknownTime} onClick={openTimePicker}>◷</button>
            </div>
          </div>
          <small>분까지 모르시면 시간만 입력해도 괜찮아요.</small>
          <label className="today-tarot-unknown-time"><input type="checkbox" checked={unknownTime} onChange={(event) => { setUnknownTime(event.target.checked); if (event.target.checked) setShowTimePicker(false); }} /><span>출생시간을 몰라요</span></label>
        </div>
        <fieldset className="today-tarot-field-group today-tarot-gender"><legend>성별</legend><div>{genderOptions.map((option) => <button type="button" key={option.value} className={gender === option.value ? "is-selected" : ""} onClick={() => setGender(option.value)}>{option.label}</button>)}</div></fieldset>
        {error && <p className="today-tarot-form-error" role="alert">{error}</p>}
        <button type="button" className={mode === "guest" ? "today-tarot-start-cta" : "today-tarot-profile-submit"} disabled={saving} onClick={submit}>{saving ? "저장하는 중…" : "오늘의 타로 시작하기"}<span aria-hidden="true">→</span></button>
        {mode === "guest" && <aside className="today-tarot-privacy-note"><span aria-hidden="true">♢</span><p>입력한 정보는 이번 리딩에만 사용돼요. 사주 해석을 위해 일시적으로 처리되며, 리딩이 끝난 뒤 별도로 저장하지 않습니다.</p></aside>}
      </section>
    </div>
    {showTimePicker && <div className="today-tarot-picker-backdrop" role="presentation"><section className="today-tarot-time-picker" role="dialog" aria-modal="true" aria-label="출생시간 선택"><h2>출생시간 선택</h2><div><select value={pickerMeridiem} onChange={(event) => setPickerMeridiem(event.target.value as "am" | "pm")}><option value="am">오전</option><option value="pm">오후</option></select><select value={pickerHour} onChange={(event) => setPickerHour(event.target.value)}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={String(index + 1)}>{index + 1}시</option>)}</select><select value={pickerMinute} onChange={(event) => setPickerMinute(event.target.value)}>{Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, "0")).map((minute) => <option key={minute} value={minute}>{minute}분</option>)}</select></div><button type="button" onClick={commitTimePicker}>선택 완료</button><button type="button" className="today-tarot-picker-cancel" onClick={() => setShowTimePicker(false)}>취소</button></section></div>}
  </main>;
}
