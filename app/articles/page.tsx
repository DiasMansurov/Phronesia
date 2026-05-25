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

function formatArticleDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
    year: "numeric"
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export default function ArticlesPage() {
  const articles = getArticleSummaries();
  const categories = [...new Set(articles.map((article) => article.category))];
  const levels = [...new Set(articles.map((article) => article.level))];
  const featuredArticle = articles[0];
  const recommendedArticles = articles.slice(1, 3);
  const feedArticles = articles.slice(3);

  return (
    <section className="articles-page">
      <section className="articles-hero-band">
        <div className="shell articles-hero">
          <div className="articles-hero-copy">
            <p className="articles-eyebrow">Articles</p>
            <h1>Finance ideas students can actually use.</h1>
            <p>
              Read short, practical explainers that connect markets, money, debt, policy, and household decisions to the simulations inside Phronesia.
            </p>
            <div className="article-topic-chips" aria-label="Article topics">
              {categories.slice(0, 5).map((category) => (
                <span key={category}>{category}</span>
              ))}
            </div>
          </div>

          <aside className="articles-knowledge-panel">
            <div>
              <span className="articles-panel-label">Knowledge base</span>
              <strong>{articles.length} articles</strong>
              <p>Original articles with sources, examples, and beginner-friendly explanations.</p>
            </div>
            <div className="articles-stat-grid" aria-label="Knowledge base summary">
              <div>
                <span>Topics</span>
                <strong>{categories.length}</strong>
              </div>
              <div>
                <span>Levels</span>
                <strong>{levels.length}</strong>
              </div>
              <div>
                <span>Format</span>
                <strong>Short explainers</strong>
              </div>
            </div>
            <div className="articles-progress-line" aria-hidden="true">
              <span />
            </div>
          </aside>
        </div>
      </section>

      <section className="articles-library-band">
        <div className="shell articles-library-shell">
          <header className="articles-section-header">
            <div>
              <p className="articles-eyebrow">Latest explainers</p>
              <h2>Short articles designed to help students understand the ideas behind the simulations.</h2>
            </div>
            <p>Showing {articles.length} articles</p>
          </header>

          {featuredArticle ? (
            <section className="articles-feature-layout" aria-label="Featured articles">
              <article className="article-feature-card">
                <div className="article-badge-row">
                  <span className="article-badge">{featuredArticle.category}</span>
                  <span className="article-badge article-badge-muted">{featuredArticle.level}</span>
                </div>
                <div className="article-feature-copy">
                  <span>Featured article</span>
                  <h2>{featuredArticle.title}</h2>
                  <p>{featuredArticle.excerpt}</p>
                </div>
                <div className="article-feature-footer">
                  <time dateTime={featuredArticle.date}>{formatArticleDate(featuredArticle.date)}</time>
                  <Link className="button primary" href={`/articles/${featuredArticle.slug}`}>
                    Read article
                  </Link>
                </div>
              </article>

              <aside className="article-recommended-stack">
                <div className="article-recommended-heading">
                  <span>Recommended reads</span>
                  <p>More context for policy, money, and market decisions.</p>
                </div>
                {recommendedArticles.map((article) => (
                  <article className="article-compact-card" key={article.slug}>
                    <div className="article-badge-row">
                      <span className="article-badge">{article.category}</span>
                      <span className="article-badge article-badge-muted">{article.level}</span>
                    </div>
                    <h3>{article.title}</h3>
                    <time dateTime={article.date}>{formatArticleDate(article.date)}</time>
                    <Link className="article-text-link" href={`/articles/${article.slug}`}>
                      Read article
                    </Link>
                  </article>
                ))}
              </aside>
            </section>
          ) : null}

          {feedArticles.length > 0 ? (
            <section className="article-feed" aria-label="Article feed">
              {feedArticles.map((article) => (
                <article className="article-feed-row" key={article.slug}>
                  <div className="article-feed-meta">
                    <div className="article-badge-row">
                      <span className="article-badge">{article.category}</span>
                      <span className="article-badge article-badge-muted">{article.level}</span>
                    </div>
                    <time dateTime={article.date}>{formatArticleDate(article.date)}</time>
                  </div>
                  <div className="article-feed-copy">
                    <h3>{article.title}</h3>
                    <p>{article.excerpt}</p>
                  </div>
                  <Link className="article-feed-link" href={`/articles/${article.slug}`}>
                    Read article
                  </Link>
                </article>
              ))}
            </section>
          ) : null}
        </div>
      </section>
    </section>
  );
}
