import Link from "next/link";

type LegalSection = {
  title: string;
  body: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  updatedAt: string;
  sections: LegalSection[];
  relatedLinks?: Array<{ href: string; label: string }>;
};

export function LegalPage({ eyebrow, title, intro, updatedAt, sections, relatedLinks = [] }: LegalPageProps) {
  return (
    <section className="shell section legal-shell stack-xl">
      <div className="panel legal-hero stack-md">
        <div className="stack-sm">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="display compact">{title}</h1>
          <p className="lede">{intro}</p>
        </div>
        <div className="legal-meta">
          <span className="pill">Last updated {updatedAt}</span>
          {relatedLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-link">
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="stack-lg">
        {sections.map((section) => (
          <article key={section.title} className="panel stack-sm legal-section">
            <h2>{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="muted">
                {paragraph}
              </p>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}
