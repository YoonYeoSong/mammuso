import type { TarotCard } from "./cards";

export const tarotAssets = {
  frontFrame: "/tarot/frame/tarot-front-frame.png",
  cardBack: "/tarot/back/tarot-card-back.png",
  // Coordinates in the shared front-frame asset (477 × 715). Keep this one
  // viewport for every Major Arcana illustration; do not tune cards per-id.
  artworkViewport: { left: "10.48%", top: "13.29%", width: "78.62%", height: "69.23%" },
} as const;

export function tarotArtworkPath(card: TarotCard) {
  return `/tarot/arcana/${String(card.number).padStart(2, "0")}-${card.id}.png`;
}
