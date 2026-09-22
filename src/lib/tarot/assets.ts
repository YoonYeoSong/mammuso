import type { TarotCard } from "./cards";

export function tarotArtworkPath(card: TarotCard) {
  return `/tarot/arcana/${String(card.number).padStart(2, "0")}-${card.id}.png`;
}
