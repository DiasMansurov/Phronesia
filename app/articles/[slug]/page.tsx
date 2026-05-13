import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getArticleBySlug, getArticles } from "@/lib/articles";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.seoDescription,
    keywords: [...article.keywords],
    alternates: {
      canonical: `/articles/${article.slug}`
    },
    openGraph: {
      title: article.title,
      description: article.seoDescription,
      url: `/articles/${article.slug}`,
      type: "article",
      publishedTime: article.date
    }
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <article className="shell section stack-xl article-page">
      <header className="article-hero">
        <div className="stack-md">
          <Link className="text-link" href="/articles">
            Back to Articles
          </Link>
          <div className="pill-row">
            <span className="pill">{article.category}</span>
            <span className="pill">{article.level}</span>
            <time className="pill" dateTime={article.date}>{article.date}</time>
          </div>
          <h1 className="display compact">{article.title}</h1>
          <p className="lede compact-lede">{article.excerpt}</p>
        </div>
        <aside className="article-context-card">
          <span>Learning focus</span>
          <strong>{article.category}</strong>
          <p>{article.seoDescription}</p>
        </aside>
      </header>

      <div className="article-layout">
        <div className="article-body">
          {article.body.split("\n\n").map((block, index) => renderBlock(block, index))}
        </div>
        <aside className="article-sources panel stack-md">
          <div>
            <p className="eyebrow">Sources</p>
            <h2>Read more</h2>
          </div>
          <div className="source-list">
            {article.sources.map((source) => (
              <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                <span>{source.name.replaceAll("_", " ")}</span>
                <small>{source.url}</small>
              </a>
            ))}
          </div>
        </aside>
      </div>
    </article>
  );
}

function renderBlock(block: string, index: number) {
  const trimmed = block.trim();
  if (!trimmed) return null;

  const lines = trimmed.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.every((line) => line.startsWith("- "))) {
    return (
      <ul key={index}>
        {lines.map((line) => (
          <li key={line}>{renderInline(line.slice(2))}</li>
        ))}
      </ul>
    );
  }

  if (lines.every((line) => /^\d+\.\s/.test(line))) {
    return (
      <ol key={index}>
        {lines.map((line) => (
          <li key={line}>{renderInline(line.replace(/^\d+\.\s/, ""))}</li>
        ))}
      </ol>
    );
  }

  if (/^\*\*.+\*\*$/.test(trimmed) && trimmed.length < 90) {
    return <h2 key={index}>{trimmed.replaceAll("**", "")}</h2>;
  }

  return <p key={index}>{renderInline(trimmed)}</p>;
}

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
