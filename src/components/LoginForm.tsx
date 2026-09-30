"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setMessage("");
    try { const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, mode }) }); const data = await response.json() as { error?: string }; if (!response.ok) throw new Error(data.error); router.replace(returnTo); }
    catch (error) { setMessage(error instanceof Error && error.message === "EMAIL_CONFIRMATION_REQUIRED" ? "이메일 인증을 완료한 뒤 로그인해주세요." : "로그인 정보를 확인해주세요. 인증 환경이 설정되지 않은 경우 운영자 설정이 필요합니다."); }
    finally { setPending(false); }
  }
  return <main className="today-tarot-page today-tarot-profile-page"><div className="today-tarot-app-surface"><section className="today-tarot-login"><p>DESTINY TAROT</p><h1>{mode === "signin" ? "로그인하고\n리딩을 이어가세요." : "계정을 만들고\n리딩을 저장하세요."}</h1><form onSubmit={submit}><label>이메일<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>비밀번호<input type="password" required minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} /></label>{message && <p role="alert">{message}</p>}<button type="submit" disabled={pending}>{pending ? "확인 중…" : mode === "signin" ? "로그인하고 계속하기" : "계정 만들기"}</button></form><button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "처음이신가요? 계정 만들기" : "이미 계정이 있나요? 로그인"}</button></section></div></main>;
}
