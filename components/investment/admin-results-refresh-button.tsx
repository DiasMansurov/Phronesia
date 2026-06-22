"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RefreshState = {
  busy: boolean;
  message: string | null;
  error: string | null;
};

export function AdminResultsRefreshButton() {
  const router = useRouter();
  const [state, setState] = useState<RefreshState>({ busy: false, message: null, error: null });

  async function refreshResults() {
    setState({ busy: true, message: "Refreshing held asset prices...", error: null });
    try {
      const response = await fetch("/api/investment/admin/refresh-held-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store"
      });
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        providerCallsMade?: number;
        symbolsFromCache?: string[];
        symbolsRefreshed?: string[];
        nextRefreshAt?: string | null;
        error?: string;
      };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Unable to refresh admin results.");
      }
      const providerCallsMade = payload.providerCallsMade ?? 0;
      const cachedCount = payload.symbolsFromCache?.length ?? 0;
      const refreshedCount = payload.symbolsRefreshed?.length ?? 0;
      setState({
        busy: false,
        message:
          providerCallsMade > 0
            ? `Refresh complete: ${refreshedCount} symbol${refreshedCount === 1 ? "" : "s"} refreshed, ${cachedCount} served from cache.`
            : `No provider calls needed. ${cachedCount} symbol${cachedCount === 1 ? "" : "s"} served from cache.`,
        error: null
      });
      router.refresh();
    } catch (error) {
      setState({
        busy: false,
        message: null,
        error: error instanceof Error ? error.message : "Unable to refresh admin results."
      });
    }
  }

  return (
    <div className="admin-results-refresh-action">
      <button className="button secondary" type="button" onClick={refreshResults} disabled={state.busy}>
        {state.busy ? "Refreshing..." : "Refresh prices now"}
      </button>
      {state.message ? <span className="admin-refresh-message positive-text">{state.message}</span> : null}
      {state.error ? <span className="admin-refresh-message negative-text">{state.error}</span> : null}
    </div>
  );
}
