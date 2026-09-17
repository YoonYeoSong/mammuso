import { IntakeForm } from "@/components/IntakeForm";
import { Disclaimer, SiteFooter, SiteHeader } from "@/components/SiteChrome";
export default function IntakePage() { return <main><SiteHeader /><div className="page-head intake-head"><p className="eyebrow">관계분쟁조정과 · 민원 접수</p><h1>무슨 일이<br />있었나요?</h1><p>날짜와 상황만 적어주시면 됩니다.</p></div><IntakeForm /><Disclaimer /><SiteFooter /></main>; }
