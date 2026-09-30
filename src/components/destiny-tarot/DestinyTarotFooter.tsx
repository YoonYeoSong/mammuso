import Link from "next/link";

/** Operational links deliberately keep test-only business details explicit. */
export function DestinyTarotFooter() {
  return <footer className="destiny-service-footer">
    <nav aria-label="서비스 정책"><Link href="/destiny-tarot/terms">이용약관</Link><Link href="/destiny-tarot/privacy">개인정보처리방침</Link><Link href="/destiny-tarot/youth-policy">청소년보호정책</Link></nav>
    <p>테스트 서비스 · 사업자정보 (테스트) · 통신판매업 신고 (테스트)</p>
    <p>문의/고객지원: 공개 운영 전 연락처 설정 필요</p>
    <small>TODO: 공개 운영 전 실제 사업자·전자상거래 표시 의무와 개인정보 처리 내용을 최종 검토합니다.</small>
  </footer>;
}
