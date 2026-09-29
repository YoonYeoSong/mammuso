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
  const sharedProps = { fill: "none", stroke: "currentColor", strokeWidth: 1.35, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  if (name === "sun") {
    return <svg viewBox="0 0 64 64" aria-hidden="true" {...sharedProps}>
      <circle cx="32" cy="32" r="12" />
      <path d="M32 7v7M32 50v7M7 32h7M50 32h7M14.3 14.3l5 5M44.7 44.7l5 5M49.7 14.3l-5 5M19.3 44.7l-5 5" />
    </svg>;
  }

  if (name === "star") {
    return <svg viewBox="0 0 64 64" aria-hidden="true" {...sharedProps}>
      <path d="M32 4 36 28 52 12 35 29 60 32 35 35 52 52 36 36 32 60 28 36 12 52 29 35 4 32 29 29 12 12 28 28Z" />
      <circle cx="32" cy="32" r="2" />
    </svg>;
  }

  return <svg viewBox="0 0 64 64" aria-hidden="true" {...sharedProps}>
    <path d="M32 52.5 13.5 34.6C5.8 27.1 7.2 14.3 16.1 10.1c6.2-3 12.4-.5 15.9 5.1 3.5-5.6 9.7-8.1 15.9-5.1 8.9 4.2 10.3 17 2.6 24.5Z" />
  </svg>;
}

function ServiceCard({ service }: { service: Service }) {
  return <button
    type="button"
    className={`destiny-service-card destiny-service-card--${service.background}${service.featured ? " is-featured" : ""}`}
    data-destination={service.destination}
    aria-label={`${service.title} (준비 중)`}
  >
    <span className="destiny-service-icon"><ServiceIcon name={service.icon} /></span>
    <span className="destiny-service-copy">
      <span className="destiny-service-title">{service.title}</span>
      <span className="destiny-service-description">{service.description}</span>
    </span>
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
