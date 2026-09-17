import Link from "next/link";
import { SiteHeader } from "@/components/SiteChrome";

export default function NotFound() {
  return <main className="home-page"><SiteHeader /><section className="not-found"><p className="step">404</p><h1>여긴 아직<br />비어 있어.</h1><p>찾는 페이지가 없거나, 주소가 바뀌었어요.</p><Link href="/" className="home-link">홈으로 돌아가기 →</Link></section></main>;
}
