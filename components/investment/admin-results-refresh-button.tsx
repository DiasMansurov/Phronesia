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
      const response = await fetch("/api/investment/admin/refresh-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ mode: "held" })
      });
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        held?: Array<{ ok?: boolean; symbol?: string; message?: string }>;
        error?: string;
      };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Unable to refresh admin results.");
      }
      const heldCount = Array.isArray(payload.held) ? payload.held.length : 0;
      const warningCount = Array.isArray(payload.held) ? payload.held.filter((item) => !item.ok).length : 0;
      setState({
        busy: false,
        message: warningCount
          ? `Refreshed results with ${warningCount} price warning${warningCount === 1 ? "" : "s"}.`
          : `Refreshed ${heldCount} held asset price${heldCount === 1 ? "" : "s"} and recalculated results.`,
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
        {state.busy ? "Refreshing..." : "Refresh Results"}
      </button>
      {state.message ? <span className="admin-refresh-message positive-text">{state.message}</span> : null}
      {state.error ? <span className="admin-refresh-message negative-text">{state.error}</span> : null}
    </div>
  );
}
