import { Suspense } from "react";

import { PlayExperience } from "@/components/game/play-experience";

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <section className="shell section">
          <div className="panel">Loading campaign room...</div>
        </section>
      }
    >
      <PlayExperience />
    </Suspense>
  );
}
