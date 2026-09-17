import Link from "next/link";
import { brand } from "@/lib/brand";

/** Legacy case routes keep their logic, but no longer carry the former character world. */
export function SiteHeader() { return <header className="new-header"><Link href="/" className="new-brand">{brand.name}</Link><span>기존 기록 관리</span></header>; }
export function Disclaimer() { return <aside className="legacy-note">이 기록은 기존 서비스 기능으로 보관됩니다. 제공되는 내용은 참고용 AI 콘텐츠입니다.</aside>; }
export function SiteFooter() { return <footer className="new-footer"><span>© {brand.name}</span><nav><Link href="/privacy">개인정보처리방침</Link><Link href="/terms">이용안내</Link></nav></footer>; }
export function Hamji({ text }: { mood?: "friendly" | "paper" | "waiting" | "serious" | "stamp" | "surprised"; text: string }) { return <aside className="legacy-note"><b>안내</b><br />{text}</aside>; }
