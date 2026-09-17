import { notFound } from "next/navigation";
import { RespondentPortal } from "@/components/RespondentPortal";
import { Disclaimer, SiteHeader } from "@/components/SiteChrome";
import { getCaseRepository } from "@/lib/cases/repository";
export const dynamic = "force-dynamic";
export default async function AttendPage({ params }: { params: Promise<{ token: string }> }) { const { token } = await params; try { const item = await getCaseRepository().getByRespondentToken(token); if (!item) notFound(); return <main><SiteHeader /><div className="page-head attend-head"><p className="eyebrow">맘무소 관계분쟁조정과</p><h1>의견 제출 요청</h1><p>귀하와 관련된 관계분쟁 사연에 대해, 본인의 기억과 입장을 남겨주세요.</p><div className="case-number">개인 의견 작성 페이지</div></div><aside className="role-guide compact"><b>안내</b><p>맘무소는 실제 행정·법률기관이 아닙니다. 이 요청은 법적 소환이나 의무가 아니며, 원하지 않으면 참여하지 않아도 됩니다.</p></aside><RespondentPortal item={item} token={token} /><Disclaimer /></main>; } catch (e) { if (e instanceof Error && e.message === "DB_NOT_CONFIGURED") return <main><SiteHeader /><section className="paper centered"><h1>기록 보관소를 열고 있어요</h1><p>운영자가 데이터베이스 설정을 완료하면 출석할 수 있습니다.</p></section></main>; throw e; } }
