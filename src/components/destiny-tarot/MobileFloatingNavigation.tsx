"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type IconName = "home" | "tarot" | "history" | "profile";

const focusedTodayTarotPaths = ["/today-tarot/prepare", "/today-tarot/select", "/today-tarot/reveal"];

function NavigationIcon({ name }: { name: IconName }) {
  const props = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, viewBox: "0 0 24 24", "aria-hidden": true };
  if (name === "home") return <svg {...props}><path d="m3.5 10 8.5-7 8.5 7v9.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5Z" /><path d="M9 21v-6h6v6" /></svg>;
  if (name === "tarot") return <svg {...props}><rect x="5.5" y="3" width="13" height="18" rx="2" /><path d="m12 6 1 4 3.5 2-3.5 1.5-1 4-1-4L7.5 12 11 10Z" /></svg>;
  if (name === "history") return <svg {...props}><path d="M4.3 11.5A7.7 7.7 0 1 0 6.5 6" /><path d="M4 4.5v4h4" /><path d="M12 7.5V12l3 1.8" /></svg>;
  return <svg {...props}><circle cx="12" cy="8" r="3.5" /><path d="M5 21c.8-4 3.1-6 7-6s6.2 2 7 6" /></svg>;
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileFloatingNavigation() {
  const pathname = usePathname();
  const [isReadingNoticeOpen, setIsReadingNoticeOpen] = useState(false);
  const [isFocusedReading, setIsFocusedReading] = useState(false);
  const isInNavigationScope = pathname === "/" || pathname === "/tarot" || pathname === "/destiny-tarot" || pathname.startsWith("/today-tarot");
  const isHiddenForRoute = focusedTodayTarotPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  useEffect(() => {
    const updateVisibility = (event: Event) => setIsFocusedReading(Boolean((event as CustomEvent<{ hidden?: boolean }>).detail?.hidden));
    window.addEventListener("destiny-mobile-navigation-visibility", updateVisibility);
    return () => window.removeEventListener("destiny-mobile-navigation-visibility", updateVisibility);
  }, []);

  useEffect(() => {
    setIsReadingNoticeOpen(false);
    setIsFocusedReading(false);
  }, [pathname]);

  if (!isInNavigationScope || isHiddenForRoute || isFocusedReading) return null;
  const isTarotActive = isActive(pathname, "/destiny-tarot") || isActive(pathname, "/today-tarot") || isActive(pathname, "/tarot");

  return <nav className="mobile-floating-navigation" aria-label="빠른 메뉴">
    <Link className={`mobile-floating-navigation__item ${isActive(pathname, "/") ? "is-active" : ""}`} href="/" aria-current={isActive(pathname, "/") ? "page" : undefined}><NavigationIcon name="home" /><span>홈</span></Link>
    <Link className={`mobile-floating-navigation__item ${isTarotActive ? "is-active" : ""}`} href="/destiny-tarot" aria-current={isTarotActive ? "page" : undefined}><NavigationIcon name="tarot" /><span>타로</span></Link>
    <button className="mobile-floating-navigation__item" type="button" onClick={() => setIsReadingNoticeOpen(true)} aria-describedby={isReadingNoticeOpen ? "reading-history-notice" : undefined}><NavigationIcon name="history" /><span>기록</span></button>
    <Link className={`mobile-floating-navigation__item ${isActive(pathname, "/login") ? "is-active" : ""}`} href="/login" aria-current={isActive(pathname, "/login") ? "page" : undefined}><NavigationIcon name="profile" /><span>MY</span></Link>
    {isReadingNoticeOpen && <p className="mobile-floating-navigation__notice" id="reading-history-notice" role="status">리딩 기록 기능은 준비 중이에요.</p>}
  </nav>;
}
