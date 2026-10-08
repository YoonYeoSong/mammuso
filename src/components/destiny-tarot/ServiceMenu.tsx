import Link from "next/link";
import { destinyReadingTypes, getDestinyReadingProfile, type DestinyReadingType } from "@/lib/destiny-tarot/profiles";

type IconName = "sun" | "star" | "heart" | "coin" | "paths" | "compass" | "orbit";
type Service = { title: string; description: string; keywords: string; icon: IconName; destination: string; background: string; featured?: boolean; available?: boolean };

const specialistServices: Service[] = destinyReadingTypes.filter((type) => type !== "general").map((readingType) => {
  const profile = getDestinyReadingProfile(readingType);
  const icons: Record<Exclude<DestinyReadingType, "general">, IconName> = { love: "heart", money: "coin", choice: "paths", career: "compass", reunion: "orbit" };
  return { title: profile.displayName, description: profile.description, keywords: profile.keywords, icon: icons[readingType], destination: `/destiny-tarot?readingType=${readingType}`, background: readingType };
});
const general = getDestinyReadingProfile("general");
const services: Service[] = [
  { title: "오늘의 타로", description: "오늘 하루의 운세를 카드 한 장으로", keywords: "오늘의 흐름 · 한 장 리딩", icon: "sun", destination: "/today-tarot", background: "daily", featured: true },
  ...specialistServices,
  { title: general.displayName, description: general.description, keywords: general.keywords, icon: "star", destination: "/destiny-tarot?readingType=general", background: "destiny" },
  { title: "운명궁합", description: "두 사람의 관계와 흐름을 살펴봐요", keywords: "연인 · 썸 · 친구 · 두 사람의 관계", icon: "heart", destination: "/destiny-compatibility", background: "compatibility", available: false },
];

function ServiceIcon({ name }: { name: IconName }) {
  const props = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "sun") return <svg viewBox="0 0 64 64" aria-hidden="true" {...props}><circle cx="32" cy="32" r="12" /><path d="M32 7v7M32 50v7M7 32h7M50 32h7M14.3 14.3l5 5M44.7 44.7l5 5M49.7 14.3l-5 5M19.3 44.7l-5 5" /></svg>;
  if (name === "star") return <svg viewBox="0 0 64 64" aria-hidden="true" {...props}><path d="M32 7 35.8 27.4 47.6 16.4 36.6 28.2 57 32 36.6 35.8 47.6 47.6 35.8 36.6 32 57 28.2 36.6 16.4 47.6 27.4 35.8 7 32 27.4 28.2 16.4 16.4 28.2 27.4Z" /></svg>;
  if (name === "heart") return <svg viewBox="0 0 64 64" aria-hidden="true" {...props}><path d="M32 52.5 14.7 35.2C7.1 27.6 8.2 15.2 16.3 11.5c6.3-2.8 12.4.2 15.7 5.9 3.3-5.7 9.4-8.7 15.7-5.9 8.1 3.7 9.2 16.1 1.6 23.7Z" /></svg>;
  if (name === "coin") return <svg viewBox="0 0 64 64" aria-hidden="true" {...props}><circle cx="32" cy="32" r="19" /><circle cx="32" cy="32" r="13" /><path d="M32 22v20M26.5 27.5c1.4-1.4 3.3-2.1 5.5-2.1 3.3 0 5.5 1.7 5.5 4.2 0 6.1-11 3.1-11 9.2 0 2.1 2 3.7 5.5 3.7 2.4 0 4.4-.7 5.8-2.1" /><path d="m48.5 12 1.6 4.1 4.1 1.6-4.1 1.6-1.6 4.1-1.6-4.1-4.1-1.6 4.1-1.6Z" /></svg>;
  if (name === "paths") return <svg viewBox="0 0 64 64" aria-hidden="true" {...props}><path d="M32 55V33M32 33C29 24 22 19 12 16M32 33c4-9 11-14 21-17" /><path d="m10 16 4-4m-4 4 5 2M54 16l-4-4m4 4-5 2" /><circle cx="32" cy="34" r="4" /><path d="m47 38 1.6 4.1 4.1 1.6-4.1 1.6-1.6 4.1-1.6-4.1-4.1-1.6 4.1-1.6Z" /></svg>;
  if (name === "compass") return <svg viewBox="0 0 64 64" aria-hidden="true" {...props}><circle cx="32" cy="32" r="21" /><circle cx="32" cy="32" r="3" /><path d="m41.5 22.5-6.1 11-11 6.1 6.1-11Z" /><path d="M32 7v4M32 53v4M7 32h4M53 32h4" /></svg>;
  return <svg viewBox="0 0 64 64" aria-hidden="true" {...props}><path d="M44 13c8 4 12 13 9 22-3 9-11 14-20 14-10 0-18-7-21-16" /><path d="m19 51-7-2 3-7" /><path d="M20 51c-8-4-12-13-9-22 3-9 11-14 20-14 10 0 18 7 21 16" /><path d="m45 13 7 2-3 7" /><path d="m31 25 1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5Z" /></svg>;
}

function ServiceCard({ service }: { service: Service }) {
  const content = <>
    <span className={`destiny-service-icon destiny-service-icon--${service.icon}`}><ServiceIcon name={service.icon} /></span>
    <span className="destiny-service-copy"><span className="destiny-service-title">{service.title}</span><span className="destiny-service-description">{service.description}</span><span className="destiny-service-keywords">{service.keywords}</span></span>
  </>;
  const className = `destiny-service-card destiny-service-card--${service.background} ${service.featured ? "is-featured" : ""}`;
  return service.available === false
    ? <button type="button" className={className} data-destination={service.destination} aria-label={`${service.title} 준비 중`}>{content}</button>
    : <Link className={className} href={service.destination} aria-label={`${service.title} 시작하기`}>{content}</Link>;
}

export function ServiceMenu() { return <section className="destiny-service-menu" aria-labelledby="service-menu-title"><h2 id="service-menu-title" className="sr-only">운명타로 서비스</h2><div className="destiny-service-grid">{services.map((service) => <ServiceCard key={service.title} service={service} />)}</div></section>; }
