import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/teachers/classes/", "/join/"]
    },
    sitemap: "https://phronesia.online/sitemap.xml",
    host: "https://phronesia.online"
  };
}
