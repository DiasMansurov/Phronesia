import { JoinCodeResolver } from "@/components/teachers/join-code-resolver";

export default function JoinPage() {
  return (
    <section className="shell section stack-xl">
      <div className="hero-band compact panel">
        <div className="stack-sm">
          <p className="eyebrow">Join A Class</p>
          <h1 className="display compact">Enter your teacher code or scan the classroom QR link.</h1>
          <p className="lede">
            Student classroom accounts are teacher-managed in v1, with age-gated sign-up, school-facing legal notices,
            and no advertising or behavioral profiling in classroom mode.
          </p>
        </div>
      </div>
      <JoinCodeResolver />
    </section>
  );
}
