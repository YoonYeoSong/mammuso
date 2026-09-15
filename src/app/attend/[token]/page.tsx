import { notFound } from "next/navigation";
import { RespondentPortal } from "@/components/RespondentPortal";
import { Disclaimer, SiteHeader } from "@/components/SiteChrome";
import { getCaseRepository } from "@/lib/cases/repository";
export const dynamic = "force-dynamic";
export default async function AttendPage({ params }: { params: Promise<{ token: string }> }) { const { token } = await params; try { const item = await getCaseRepository().getByRespondentToken(token); if (!item) notFound(); return <main><SiteHeader /><div className="page-head attend-head"><p className="eyebrow">맘무소 관계분쟁조정과</p><h1>출석요구</h1><p>귀하와 관련된 관계분쟁 민원이 접수되었습니다.</p><div className="case-number">사건번호 {item.publicCaseNumber}</div></div><RespondentPortal item={item} token={token} /><Disclaimer /></main>; } catch (e) { if (e instanceof Error && e.message === "DB_NOT_CONFIGURED") return <main><SiteHeader /><section className="paper centered"><h1>기록 보관소를 열고 있어요</h1><p>운영자가 데이터베이스 설정을 완료하면 출석할 수 있습니다.</p></section></main>; throw e; } }
