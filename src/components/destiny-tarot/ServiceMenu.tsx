import { CrystalSymbol } from "./CrystalSymbol";

type Service = {
  title: string;
  description: string;
  symbol: "sun" | "star" | "moon";
  destination: string;
};

const services: Service[] = [
  { title: "오늘의 타로", description: "오늘의 흐름을\n카드 한 장으로", symbol: "sun", destination: "/today-tarot" },
  { title: "운명타로", description: "당신의 고민을\n깊게 들여다봐요", symbol: "star", destination: "/destiny-tarot" },
  { title: "운명 궁합", description: "두 사람의\n흐름을 함께", symbol: "moon", destination: "/destiny-compatibility" },
];

export function ServiceMenu() {
  return <section className="destiny-service-menu" aria-labelledby="service-menu-title">
    <h2 id="service-menu-title" className="sr-only">운명타로 서비스</h2>
    <div className="destiny-service-grid">
      {services.map((service) => <button
        key={service.title}
        type="button"
        className="destiny-service-card"
        data-destination={service.destination}
        aria-label={`${service.title} (준비 중)`}
      >
        <span className="destiny-service-constellation" aria-hidden="true" />
        <span className="destiny-symbol-orb"><CrystalSymbol name={service.symbol} /></span>
        <span className="destiny-service-title">{service.title}</span>
        <span className="destiny-service-description">{service.description}</span>
        <span className="destiny-card-arrow" aria-hidden="true">›</span>
      </button>)}
    </div>
  </section>;
}
