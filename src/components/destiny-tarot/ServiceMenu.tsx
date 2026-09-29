import Link from "next/link";

type Service = {
  title: string;
  description: string;
  icon: "sun" | "star" | "heart";
  destination: string;
  background: "daily" | "destiny" | "compatibility";
  featured?: boolean;
};

const services: Service[] = [
  { title: "오늘의 타로", description: "오늘의 흐름을\n카드 한 장으로", icon: "sun", destination: "/today-tarot", background: "daily", featured: true },
  { title: "운명타로", description: "당신의 고민을\n깊게 들여다봐요", icon: "star", destination: "/destiny-tarot", background: "destiny" },
  { title: "운명궁합", description: "두 사람의\n흐름을 함께", icon: "heart", destination: "/destiny-compatibility", background: "compatibility" },
];

function ServiceIcon({ name }: { name: Service["icon"] }) {
  const sharedProps = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  if (name === "sun") {
    return <svg viewBox="0 0 64 64" aria-hidden="true" {...sharedProps}>
      <circle cx="32" cy="32" r="12" />
      <path d="M32 7v7M32 50v7M7 32h7M50 32h7M14.3 14.3l5 5M44.7 44.7l5 5M49.7 14.3l-5 5M19.3 44.7l-5 5" />
    </svg>;
  }

  if (name === "star") {
    return <svg viewBox="0 0 64 64" aria-hidden="true" {...sharedProps}>
      <path d="M32 7 35.8 27.4 47.6 16.4 36.6 28.2 57 32 36.6 35.8 47.6 47.6 35.8 36.6 32 57 28.2 36.6 16.4 47.6 27.4 35.8 7 32 27.4 28.2 16.4 16.4 28.2 27.4Z" />
    </svg>;
  }

  return <svg viewBox="0 0 64 64" aria-hidden="true" {...sharedProps}>
    <path d="M32 52.5 14.7 35.2C7.1 27.6 8.2 15.2 16.3 11.5c6.3-2.8 12.4.2 15.7 5.9 3.3-5.7 9.4-8.7 15.7-5.9 8.1 3.7 9.2 16.1 1.6 23.7Z" />
  </svg>;
}

function ServiceCard({ service }: { service: Service }) {
  const content = <>
    <span className={`destiny-service-icon destiny-service-icon--${service.icon}`}><ServiceIcon name={service.icon} /></span>
    <span className="destiny-service-copy">
      <span className="destiny-service-title">{service.title}</span>
      <span className="destiny-service-description">{service.description}</span>
    </span>
  </>;

  if (service.featured) {
    return <Link
      className={`destiny-service-card destiny-service-card--${service.background} is-featured`}
      href={service.destination}
      aria-label={`${service.title} 시작하기`}
    >
      {content}
    </Link>;
  }

  return <button
    type="button"
    className={`destiny-service-card destiny-service-card--${service.background}`}
    data-destination={service.destination}
    aria-label={`${service.title} (준비 중)`}
  >
    {content}
  </button>;
}

export function ServiceMenu() {
  return <section className="destiny-service-menu" aria-labelledby="service-menu-title">
    <h2 id="service-menu-title" className="sr-only">운명타로 서비스</h2>
    <div className="destiny-service-grid">
      {services.map((service) => <ServiceCard key={service.title} service={service} />)}
    </div>
  </section>;
}
