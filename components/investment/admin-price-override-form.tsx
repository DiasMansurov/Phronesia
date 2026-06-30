"use client";

import { FormEvent, useState } from "react";

export function AdminPriceOverrideForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitOverride(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/investment/admin/price-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          symbol: formData.get("symbol"),
          price: Number(formData.get("price")),
          note: formData.get("note")
        })
      });
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        override?: { symbol: string; price: number };
      };
      if (!response.ok || !payload.ok || !payload.override) {
        throw new Error(payload.error ?? "Unable to save the emergency price override.");
      }
      setMessage(`${payload.override.symbol} emergency price saved at $${payload.override.price.toFixed(2)}.`);
      form.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save the emergency price override.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel stack-sm">
      <div>
        <p className="eyebrow">Emergency pricing</p>
        <h2>Manual price override</h2>
        <p className="muted small">Used only when MarketData and all stronger platform price sources are unavailable.</p>
      </div>
      <form className="investment-results-filter" onSubmit={submitOverride}>
        <label className="form-field compact-field">
          <span>Symbol</span>
          <input name="symbol" placeholder="AMD" autoCapitalize="characters" required />
        </label>
        <label className="form-field compact-field">
          <span>Price</span>
          <input name="price" type="number" min="0.01" step="0.01" placeholder="547.00" required />
        </label>
        <label className="form-field compact-field">
          <span>Note</span>
          <input name="note" placeholder="Provider outage" />
        </label>
        <button className="button secondary" type="submit" disabled={busy}>
          {busy ? "Saving..." : "Save override"}
        </button>
      </form>
      {message ? <p className="positive-text small">{message}</p> : null}
      {error ? <p className="negative-text small">{error}</p> : null}
    </section>
  );
}
