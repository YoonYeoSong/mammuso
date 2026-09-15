import Link from "next/link";
export function SiteHeader() { return <header className="site-header"><Link href="/" className="brand"><span>🐹</span> 맘무소 <small>MAMMUSO</small></Link><span className="beta">무료 베타 운영 중</span></header>; }
export function Disclaimer() { return <aside className="disclaimer">맘무소는 실제 행정기관과 관련이 없는 AI 기반 콘텐츠 서비스입니다. 제공되는 결과는 법률적 판단이나 실제 행정처분이 아닌 참고용 조정 의견입니다.</aside>; }
export function SiteFooter() { return <footer className="site-footer"><span>© Mammuso beta</span><nav><Link href="/privacy">개인정보처리방침</Link><Link href="/terms">이용안내</Link></nav></footer>; }
export function Hamji({ mood = "friendly", text }: { mood?: "friendly" | "paper" | "waiting" | "serious" | "stamp" | "surprised"; text: string }) { const face = { friendly: "🐹", paper: "🐹📄", waiting: "🐹⌛", serious: "🐹🤓", stamp: "🐹🟢", surprised: "🐹💦" }[mood]; return <div className="hamji"><span className="hamji-face" aria-hidden>{face}</span><p><b>김햄찌 주무관</b><br />{text}</p></div>; }
