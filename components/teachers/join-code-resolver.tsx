"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JoinCodeResolver() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch("/api/join/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });

    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "Unable to find join code.");
      return;
    }

    router.push(`/join/${data.join.joinToken.token}`);
  }

  return (
    <form className="panel stack-md" onSubmit={onSubmit}>
      <div className="stack-sm">
        <p className="eyebrow">Join by Code</p>
        <h2>Enter the class code your teacher gave you</h2>
        <p className="muted">If you were given a QR code, scan it instead to open the same teacher-managed join flow.</p>
      </div>
      <label className="form-field">
        <span>Join code</span>
        <input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="ABC123" />
      </label>
      <button className="button primary" type="submit">
        Continue
      </button>
      {status ? <p className="form-status">{status}</p> : null}
    </form>
  );
}
