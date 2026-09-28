import { DestinyTarotHome } from "@/components/destiny-tarot/DestinyTarotHome";

type HomePageProps = {
  searchParams: Promise<{ theme?: string | string[] }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const { theme } = await searchParams;
  const activeTheme = theme === "b" ? "b" : "a";

  return <DestinyTarotHome theme={activeTheme} />;
}
