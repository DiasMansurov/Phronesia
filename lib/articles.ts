import { phronesiaArticles } from "@/lib/phronesia-articles";

export type Article = (typeof phronesiaArticles)[number];

export type ArticleSummary = Pick<Article, "slug" | "title" | "category" | "level" | "date" | "excerpt">;

export function getArticles() {
  return [...phronesiaArticles];
}

export function getArticleBySlug(slug: string) {
  return phronesiaArticles.find((article) => article.slug === slug) ?? null;
}

export function getArticleSummaries(): ArticleSummary[] {
  return phronesiaArticles.map(({ slug, title, category, level, date, excerpt }) => ({
    slug,
    title,
    category,
    level,
    date,
    excerpt
  }));
}

export function getFeaturedArticleSummaries(): ArticleSummary[] {
  const featured = [
    "tariffs-trade-policy-prices",
    "kazakhstan-tax-code-vat-2026",
    "inflation-interest-rates-kazakhstan"
  ];
  return featured
    .map((slug) => getArticleSummaries().find((article) => article.slug === slug))
    .filter((article): article is ArticleSummary => Boolean(article));
}
