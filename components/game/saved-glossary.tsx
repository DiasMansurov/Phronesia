"use client";

import { useEffect, useState } from "react";

export function SavedGlossary() {
  const [terms, setTerms] = useState<string[]>([]);

  useEffect(() => {
    try {
      setTerms(JSON.parse(window.localStorage.getItem("pm.v1.savedGlossary") ?? "[]"));
    } catch {
      setTerms([]);
    }
  }, []);

  if (!terms.length) {
    return (
      <section className="panel compact-panel stack-sm">
        <p className="eyebrow">My Saved Concepts</p>
        <p className="muted">Use Add To Glossary on theory cards during Learning Mode to save concepts here.</p>
      </section>
    );
  }

  return (
    <section className="panel compact-panel stack-sm">
      <p className="eyebrow">My Saved Concepts</p>
      <div className="pill-row">
        {terms.map((term) => (
          <span key={term} className="pill">{term}</span>
        ))}
      </div>
    </section>
  );
}
