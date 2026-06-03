import type { MetadataRoute } from "next";

import { getArticleSummaries } from "@/lib/articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://phronesia.org";
  const routes = [
    { path: "", priority: 1 },
    { path: "/learn", priority: 0.9 },
    { path: "/articles", priority: 0.85 },
    { path: "/finance-lab", priority: 0.95 },
    { path: "/investment-challenge", priority: 0.96 },
    { path: "/investment-challenge/rules", priority: 0.76 },
    { path: "/scenarios", priority: 0.9 },
    { path: "/play/setup", priority: 0.9 },
    { path: "/olympiad", priority: 0.8 },
    { path: "/rankings", priority: 0.75 },
    { path: "/progress", priority: 0.7 },
    { path: "/teachers", priority: 0.75 },
    { path: "/about", priority: 0.65 }
  ];

  const staticRoutes = routes.map((route) => ({
    url: `${base}${route.path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route.priority
  }));

  const articleRoutes = getArticleSummaries().map((article) => ({
    url: `${base}/articles/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: "monthly" as const,
    priority: 0.72
  }));

  return [...staticRoutes, ...articleRoutes];
}
