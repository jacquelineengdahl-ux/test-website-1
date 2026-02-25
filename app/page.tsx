import Link from "next/link";

const features = [
  {
    title: "Daily symptom logging",
    description:
      "Record pain levels, digestion, lifestyle factors, and cycle phase — all in one place.",
  },
  {
    title: "Visual trend tracking",
    description:
      "Stacked bar charts and line graphs surface patterns across days, weeks, months, or years.",
  },
  {
    title: "Body-literacy insights",
    description:
      "Connections between lifestyle factors and symptom flare-ups, made visible over time.",
  },
  {
    title: "Private by design",
    description:
      "Your data stays yours, stored securely with end-to-end authentication.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background font-sans">
      <main className="flex min-h-screen w-full max-w-2xl flex-col items-center gap-20 px-6 py-32 sm:px-16">
        {/* Hero */}
        <section className="flex flex-col items-center gap-6 text-center">
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground">
            livingwithendo
          </h1>
          <p className="max-w-md text-lg leading-8 text-muted">
            A private, calm space to track your experience with
            endometriosis&nbsp;&mdash; on your terms.
          </p>
          <div className="flex gap-4 pt-2 text-base font-medium">
            <Link
              href="/signup"
              className="flex h-12 items-center justify-center rounded-md bg-accent-green px-6 text-white transition-colors hover:opacity-90"
            >
              Create an account
            </Link>
            <Link
              href="/login"
              className="flex h-12 items-center justify-center rounded-md border border-border px-6 text-foreground transition-colors hover:bg-surface"
            >
              Log in
            </Link>
          </div>
        </section>

        {/* About endometriosis */}
        <section className="w-full rounded-lg border border-border bg-surface p-6">
          <p className="text-sm leading-6 text-muted">
            Endometriosis is a chronic condition where tissue similar to the
            uterine lining grows outside the uterus, causing pain, fatigue,
            and digestive issues that can affect every part of daily life. It
            impacts roughly 1 in 10 women and can take years to diagnose.
            Because symptoms vary widely and are influenced by diet, activity,
            stress, and hormonal cycles, keeping a consistent log helps you
            and your care team spot triggers, measure what works, and advocate
            for better treatment.
          </p>
        </section>

        {/* App description */}
        <p className="max-w-lg text-center text-base leading-7 text-muted">
          livingwithendo is a daily symptom tracker built for people with
          endometriosis. Log how you feel, what you eat, how you move, and
          where you are in your cycle — then let the data speak for itself.
        </p>

        {/* Feature cards */}
        <section className="grid w-full gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-border p-6"
            >
              <h2 className="mb-2 font-serif text-lg font-semibold text-foreground">
                {feature.title}
              </h2>
              <p className="text-sm leading-6 text-muted">
                {feature.description}
              </p>
            </div>
          ))}
        </section>
      </main>
      <footer className="pt-4 text-center text-sm text-muted">
        &copy; 2026 livingwithendo
      </footer>
    </div>
  );
}
