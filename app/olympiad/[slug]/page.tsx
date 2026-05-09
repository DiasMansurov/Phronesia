import type { Metadata } from "next";
import Link from "next/link";

import { OlympiadCase } from "@/components/olympiad/olympiad-case";
import { getOlympiadBySlug } from "@/lib/olympiads";

export const metadata: Metadata = {
  title: "Olympiad Case",
  description: "Open the official Phronesia olympiad simulation case.",
  alternates: {
    canonical: "/olympiad"
  }
};

export default async function OlympiadCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const olympiad = getOlympiadBySlug(slug);

  if (!olympiad) {
    return (
      <section className="shell section">
        <div className="panel stack-md">
          <p className="eyebrow">Olympiad</p>
          <h1>Case not found</h1>
          <p className="muted">This olympiad is not active or the link is incorrect.</p>
          <Link className="button primary" href="/olympiad">
            Back To Olympiad Login
          </Link>
        </div>
      </section>
    );
  }

  return <OlympiadCase olympiad={olympiad} />;
}
