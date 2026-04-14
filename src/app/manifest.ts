import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "长沙汇砼亿新材料有限公司",
    short_name: "汇砼亿",
    description: "Your guide to professional growth and opportunities.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#6366f1",
    orientation: "portrait-primary",
    icons: [
      {
        src: "https://i.postimg.cc/nLrDYrHW/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "https://i.postimg.cc/nLrDYrHW/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
