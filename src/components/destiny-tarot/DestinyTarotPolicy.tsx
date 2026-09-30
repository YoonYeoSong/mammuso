import Link from "next/link";

export function DestinyTarotPolicy({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return <main className="destiny-policy-page"><article><Link href="/" aria-label="운명타로 홈으로 돌아가기">← 운명타로</Link><p>{eyebrow}</p><h1>{title}</h1>{children}</article></main>;
}
