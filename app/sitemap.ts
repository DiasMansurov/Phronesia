import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://phronesia.org";
  const routes = [
    { path: "", priority: 1 },
    { path: "/learn", priority: 0.9 },
    { path: "/finance-lab", priority: 0.95 },
    { path: "/scenarios", priority: 0.9 },
    { path: "/play/setup", priority: 0.9 },
    { path: "/olympiad", priority: 0.8 },
    { path: "/rankings", priority: 0.75 },
    { path: "/progress", priority: 0.7 },
    { path: "/teachers", priority: 0.75 },
    { path: "/about", priority: 0.65 }
  ];

  return routes.map((route) => ({
    url: `${base}${route.path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route.priority
  }));
}
