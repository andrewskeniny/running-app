import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Running",
    short_name: "Running",
    description: "Diario e piano di allenamento verso la Milano Marathon 2027",
    start_url: "/",
    display: "standalone",
    background_color: "#121110",
    theme_color: "#121110",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}
