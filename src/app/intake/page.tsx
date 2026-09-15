import { IntakeForm } from "@/components/IntakeForm";
import { Disclaimer, SiteFooter, SiteHeader } from "@/components/SiteChrome";
export default function IntakePage() { return <main><SiteHeader /><div className="page-head"><p className="eyebrow">관계분쟁조정과 · 민원 접수</p><h1>민원 내용을<br />말씀해주세요.</h1><p>김햄찌 주무관이 서류를 차분히 살펴봅니다. 사실과 시간 순서를 중심으로 적으면 더 정확하게 검토할 수 있어요.</p></div><IntakeForm /><Disclaimer /><SiteFooter /></main>; }
