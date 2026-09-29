import Link from "next/link";

type TodayTarotHeaderProps = {
  backHref?: string;
  title?: string;
};

export function TodayTarotHeader({ backHref = "/", title = "오늘의 타로" }: TodayTarotHeaderProps) {
  return <header className="today-tarot-header">
    <Link className="today-tarot-back" href={backHref} aria-label="이전 화면으로 돌아가기">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.75 4.75-7.25 7.25 7.25 7.25M8 12h9" /></svg>
    </Link>
    <h1>{title}</h1>
    <span className="today-tarot-header-spacer" aria-hidden="true" />
  </header>;
}
