import type { MetadataRoute } from "next";

const baseUrl = "https://phronesia.online";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/teachers",
    "/play/setup",
    "/learn",
    "/scenarios",
    "/finance-lab",
    "/about",
    "/rankings",
    "/championship",
    "/privacy",
    "/terms",
    "/cookies",
    "/schools/privacy",
    "/schools/children",
    "/schools/dpa",
    "/subprocessors",
    "/security",
    "/retention",
    "/accessibility",
    "/join"
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/teachers" || route === "/play/setup" ? 0.9 : 0.7
  }));
}
