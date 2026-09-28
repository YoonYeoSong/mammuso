import Image from "next/image";

type Service = {
  title: string;
  description: string;
  icon: string;
  destination: string;
  background: "daily" | "destiny" | "compatibility";
  featured?: boolean;
};

const services: Service[] = [
  { title: "오늘의 타로", description: "오늘의 흐름을\n카드 한 장으로", icon: "/illustrations/destiny-icons/daily-tarot-sun.png", destination: "/today-tarot", background: "daily", featured: true },
  { title: "운명타로", description: "당신의 고민을\n깊게 들여다봐요", icon: "/illustrations/destiny-icons/destiny-tarot-star.png", destination: "/destiny-tarot", background: "destiny" },
  { title: "운명 궁합", description: "두 사람의\n흐름을 함께", icon: "/illustrations/destiny-icons/compatibility-moon.png", destination: "/destiny-compatibility", background: "compatibility" },
];

function ServiceCard({ service }: { service: Service }) {
  return <button
    type="button"
    className={`destiny-service-card destiny-service-card--${service.background}${service.featured ? " is-featured" : ""}`}
    data-destination={service.destination}
    aria-label={`${service.title} (준비 중)`}
  >
    <span className="destiny-service-constellation" aria-hidden="true" />
    <span className="destiny-service-icon"><Image src={service.icon} alt="" fill sizes="(max-width: 480px) 25vw, 105px" /></span>
    <span className="destiny-service-copy">
      <span className="destiny-service-title">{service.title}</span>
      <span className="destiny-service-description">{service.description}</span>
    </span>
    <span className="destiny-card-arrow" aria-hidden="true">›</span>
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
