import { createFileRoute } from "@tanstack/react-router";
import { Workbench } from "@/components/racket/Workbench";
export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({ meta: [
    { title: "RACKET 01 — Make it yours" },
    { name: "description", content: "Configure RACKET 01 in three dimensions. Explore tactile pickguards, body finishes and hardware. One form. Your finish." },
    { property: "og:title", content: "RACKET 01 — Make it yours" },
    { property: "og:description", content: "Same instrument. Different point of view. Explore, configure and save your RACKET 01." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Workbench,
});
