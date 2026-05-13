import type { Metadata } from "next";
import Link from "next/link";

import { getArticleSummaries } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Articles",
  description: "Read Phronesia finance and economics articles on inflation, debt, bonds, exchange rates, taxes, markets, and simulation learning.",
  alternates: {
    canonical: "/articles"
  },
  openGraph: {
    title: "Phronesia Articles",
    description: "Student-friendly finance and economics articles for simulation-based learning.",
    url: "/articles"
  }
};

export default function ArticlesPage() {
  const articles = getArticleSummaries();
  const categories = [...new Set(articles.map((article) => article.category))];

  return (
    <section className="shell section stack-xl articles-page">
      <section className="articles-hero">
        <div className="stack-md">
          <p className="eyebrow">Articles</p>
          <h1 className="display compact">Finance ideas students can actually use.</h1>
          <p className="lede compact-lede">
            Read short, practical explainers that connect markets, money, debt, policy, and household decisions to the simulations inside Phronesia.
          </p>
          <div className="pill-row">
            {categories.slice(0, 5).map((category) => (
              <span className="pill" key={category}>{category}</span>
            ))}
          </div>
        </div>
        <aside className="articles-hero-panel">
          <span>Knowledge base</span>
          <strong>{articles.length}</strong>
          <p>Original articles with sources, examples, and beginner-friendly explanations.</p>
        </aside>
      </section>

      <section className="article-grid">
        {articles.map((article, index) => (
          <article className={index === 0 ? "article-card featured" : "article-card"} key={article.slug}>
            <div className="article-card-topline">
              <span>{article.category}</span>
              <small>{article.level}</small>
            </div>
            <h2>{article.title}</h2>
            <p>{article.excerpt}</p>
            <div className="article-card-footer">
              <time dateTime={article.date}>{article.date}</time>
              <Link className="button secondary" href={`/articles/${article.slug}`}>
                Read article
              </Link>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
