import { createFileRoute } from "@tanstack/react-router";
import { ClimateGuardHero } from "@/components/ClimateGuardHero";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "ClimateGuard — Personalized Climate Intelligence" },
      { name: "description", content: "Understand local climate risk before it reaches you with personalized monitoring and alerts." },
      { property: "og:title", content: "ClimateGuard — Personalized Climate Intelligence" },
      { property: "og:description", content: "Understand local climate risk before it reaches you with personalized monitoring and alerts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClimateGuardHero,
});