"use client";

import { useState } from "react";

type AdminTeamPasswordResetFormProps = {
  teamId: string;
  teamName: string;
};

type ResetResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
};

export function AdminTeamPasswordResetForm({ teamId, teamName }: AdminTeamPasswordResetFormProps) {
  const [newPassword, setNewPassword] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function generateRandomPassword() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    const bytes = new Uint32Array(14);
    window.crypto.getRandomValues(bytes);
    const password = Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
    setNewPassword(password);
    setGeneratedPassword(password);
    setMessage("Copy this password now. It will not be shown again after you leave this page.");
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/investment/admin/reset-team-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ teamId, newPassword })
      });
      const data = (await response.json().catch(() => ({}))) as ResetResponse;
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Could not reset team password.");
      }
      setMessage(data.message || "Team password reset successfully.");
      setNewPassword("");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Could not reset team password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article className="panel stack-md investment-admin-detail-card">
      <p className="eyebrow">Admin access</p>
      <h2>Reset team password</h2>
      <p className="muted">
        Reset access for {teamName} without changing the team portfolio, trades, holdings, cash, or results.
      </p>

      <form className="stack-sm" onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="investment-team-new-password">
          New password
        </label>
        <input
          id="investment-team-new-password"
          className="input"
          minLength={6}
          onChange={(event) => {
            setNewPassword(event.target.value);
            setGeneratedPassword("");
          }}
          placeholder="Minimum 6 characters"
          type="password"
          value={newPassword}
        />

        <div className="investment-admin-actions">
          <button className="button secondary" disabled={isSubmitting} onClick={generateRandomPassword} type="button">
            Generate random password
          </button>
          <button className="button primary" disabled={isSubmitting || newPassword.length < 6} type="submit">
            {isSubmitting ? "Resetting..." : "Confirm reset"}
          </button>
        </div>
      </form>

      {generatedPassword ? (
        <div className="investment-empty-state">
          <strong>Generated password</strong>
          <p className="muted small">Copy this password now. It will not be shown again.</p>
          <code>{generatedPassword}</code>
        </div>
      ) : null}

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="negative-text">{error}</p> : null}
    </article>
  );
}
