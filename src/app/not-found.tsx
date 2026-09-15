import Link from "next/link";
import { SiteHeader } from "@/components/SiteChrome";
export default function NotFound() { return <main><SiteHeader /><section className="paper centered"><img className="big-mascot" src="/illustrations/hamji-clerk.png" alt="서류를 찾는 김햄찌 주무관" /><h1>사건 기록을 찾지 못했어요</h1><p>접근 주소가 올바른지 확인해주세요. 보안을 위해 사건번호만으로는 기록을 열 수 없습니다.</p><Link href="/" className="button">민원 창구로 돌아가기</Link></section></main>; }
