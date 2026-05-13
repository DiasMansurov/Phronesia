import type { Metadata } from "next";
import Script from "next/script";

import { FinanceHome } from "@/components/site/finance-home";
import { getFeaturedArticleSummaries } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Finance & Economics Education Through Simulation",
  description:
    "Phronesia is an interactive finance and economics simulation platform where students learn markets, money, policy, and crisis management through real-world decisions.",
  alternates: {
    canonical: "/"
  }
};

export default function HomePage() {
  const featuredArticles = getFeaturedArticleSummaries();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Phronesia",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: "https://phronesia.org",
    description:
      "Phronesia teaches finance and economics through simulation-based learning, scenario recommendations, theory cards, rankings, and progress tracking.",
    audience: [
      { "@type": "EducationalAudience", educationalRole: "student" },
      { "@type": "EducationalAudience", educationalRole: "teacher" }
    ],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    },
    publisher: {
      "@type": "Organization",
      name: "Phronesia",
      url: "https://phronesia.org"
    }
  };

  return (
    <>
      <Script
        id="home-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <FinanceHome featuredArticles={featuredArticles} />
    </>
  );
}
