import { InterestForm } from "@/components/site/interest-form";

export default function ChampionshipPage() {
  return (
    <section className="shell section stack-lg">
      <div className="hero-band compact">
        <div className="stack-sm">
          <p className="eyebrow">Championship Track</p>
        </div>
        <div className="panel stack-sm">
          <p className="eyebrow">Future Stack</p>
          <div className="timeline">
            <div className="timeline-item">Verified accounts</div>
            <div className="timeline-item">Seeded challenge runs</div>
            <div className="timeline-item">Global leaderboard</div>
            <div className="timeline-item">Stream-ready finals</div>
          </div>
        </div>
      </div>

      <div className="championship-interest">
        <InterestForm
          type="student"
          title="Get Challenge Drops"
          subtitle="Capture students and creators who want championship announcements, limited seeds, and new scenario drops."
          buttonLabel="Save Challenge Interest"
        />
      </div>
    </section>
  );
}
