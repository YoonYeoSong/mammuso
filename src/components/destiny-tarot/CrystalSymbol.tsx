type SymbolName = "sun" | "star" | "moon" | "crystal" | "home" | "history" | "profile";

type CrystalSymbolProps = {
  name: SymbolName;
  className?: string;
};

export function CrystalSymbol({ name, className }: CrystalSymbolProps) {
  const common = { "aria-hidden": true, focusable: false, viewBox: "0 0 48 48", className };

  if (name === "sun") {
    return <svg {...common}><circle cx="24" cy="24" r="8" /><path d="M24 4v7M24 37v7M4 24h7M37 24h7M9.9 9.9l5 5M33.1 33.1l5 5M38.1 9.9l-5 5M14.9 33.1l-5 5" /></svg>;
  }

  if (name === "star") {
    return <svg {...common}><path d="m24 4 3.8 16.2L44 24l-16.2 3.8L24 44l-3.8-16.2L4 24l16.2-3.8L24 4Z" /><path d="m24 11 1.8 11.2L37 24l-11.2 1.8L24 37l-1.8-11.2L11 24l11.2-1.8L24 11Z" /></svg>;
  }

  if (name === "moon") {
    return <svg {...common}><path d="M32.7 6.7C20.2 7.4 13.9 20.4 19.5 30.6c4.2 7.7 13.6 10.9 21.4 7.1A18 18 0 1 1 32.7 6.7Z" /><path d="M35.3 13.4c1.7.5 3.1 1.3 4.5 2.5" /></svg>;
  }

  if (name === "crystal") {
    return <svg {...common}><path d="M24 5c10 0 18 8 18 18s-8 18-18 18S6 33 6 23 14 5 24 5Z" /><path d="M12.5 28.2 24 8l11.5 20.2L24 38 12.5 28.2Z" /><path d="M24 8v30M12.5 28.2h23" /></svg>;
  }

  if (name === "home") {
    return <svg {...common}><path d="m7 22 17-14 17 14v18H28V29H20v11H7V22Z" /></svg>;
  }

  if (name === "history") {
    return <svg {...common}><rect x="9" y="7" width="30" height="34" rx="4" /><path d="M16 16h16M16 24h16M16 32h10" /><circle cx="14" cy="16" r="1" /><circle cx="14" cy="24" r="1" /><circle cx="14" cy="32" r="1" /></svg>;
  }

  return <svg {...common}><circle cx="24" cy="16" r="7" /><path d="M10 41c1.7-8 6.3-12 14-12s12.3 4 14 12" /></svg>;
}
