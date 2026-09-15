import { notFound } from "next/navigation";
import { ApplicantPortal } from "@/components/ApplicantPortal";
import { Disclaimer, SiteHeader } from "@/components/SiteChrome";
import { getCaseRepository } from "@/lib/cases/repository";
export const dynamic = "force-dynamic";
export default async function ApplicantCasePage({ params }: { params: Promise<{ token: string }> }) { const { token } = await params; try { const item = await getCaseRepository().getByApplicantToken(token); if (!item) notFound(); return <main><SiteHeader /><ApplicantPortal initialCase={item} token={token} /><Disclaimer /></main>; } catch (e) { if (e instanceof Error && e.message === "DB_NOT_CONFIGURED") return <ConfigurationNeeded />; throw e; } }
function ConfigurationNeeded() { return <main><SiteHeader /><section className="paper centered"><h1>사건 기록 보관소를 열고 있어요</h1><p>맘무소는 브라우저 저장소 대신 실제 데이터베이스에 사건을 보관합니다. 운영자가 Supabase 설정을 완료하면 이 주소에서 사건을 안전하게 조회할 수 있습니다.</p></section><Disclaimer /></main>; }
