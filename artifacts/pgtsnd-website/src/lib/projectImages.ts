const PROJECT_HEADER_IMAGES: { match: RegExp; src: string }[] = [
  { match: /net your problem|fisher|seafood/i, src: "/images/fisherman-hands-close-pgtsnd-bri-dwyer.jpeg" },
  { match: /tran|architect/i, src: "/images/pgtsnd-drone.png" },
  { match: /pacific nw|health|annual report/i, src: "/images/foggy-fishing-coast-pgtsnd.jpeg" },
  { match: /cascade|coffee|roaster/i, src: "/images/bri-and-team-at-camera-pgtsnd-productions.jpeg" },
  { match: /vallation|outerwear|product launch/i, src: "/images/2024_BRI_DWYER-02064.jpg" },
  { match: /boat|aerial|drone/i, src: "/images/boats-aerial-drone-pgtsnd.png" },
  { match: /crab|shellfish/i, src: "/images/crabs-pelican-pgtsnd-bri-dwyer.jpeg" },
];

const FALLBACK_HEADER_IMAGES = [
  "/images/2025_PGTSND_PRODUCTIONS-09919.jpg",
  "/images/boats-inlet-pgtsnd-bri-dwyer.jpeg",
  "/images/net-hands-close-pgtsnd-bri-dwyer.jpeg",
  "/images/catch-close-pgtsnd-bri-dwyer.jpeg",
];

export function pickHeaderImage(project: { id: string; name: string }): string {
  const haystack = project.name || "";
  for (const entry of PROJECT_HEADER_IMAGES) {
    if (entry.match.test(haystack)) return entry.src;
  }
  let hash = 0;
  for (let i = 0; i < project.id.length; i += 1) {
    hash = (hash * 31 + project.id.charCodeAt(i)) | 0;
  }
  return FALLBACK_HEADER_IMAGES[Math.abs(hash) % FALLBACK_HEADER_IMAGES.length];
}
