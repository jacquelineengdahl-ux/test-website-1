import Link from "next/link";

const features = [
  {
    title: "Log symptoms",
    description:
      "Track pain, digestion, lifestyle factors, and cycle phase daily.",
  },
  {
    title: "Visualize trends",
    description:
      "See patterns with stacked bar charts and line graphs over days, weeks, months, or years.",
  },
  {
    title: "Understand your body",
    description:
      "Identify connections between lifestyle factors and symptom flare-ups.",
  },
  {
    title: "Private & secure",
    description:
      "Your data is yours, stored securely with end-to-end authentication.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center gap-24 px-6 py-32 sm:px-16">
        {/* Hero */}
        <section className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
            livingwithendo
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Track, understand, and take control of your symptoms.
          </p>
          <div className="flex gap-4 pt-2 text-base font-medium">
            <Link
              href="/signup"
              className="flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="flex h-12 items-center justify-center rounded-full border border-solid border-black/[.08] px-6 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
            >
              Log in
            </Link>
          </div>
        </section>

        {/* About endometriosis */}
        <section className="w-full rounded-xl border border-black/[.08] p-6 dark:border-white/[.145]">
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
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
        <p className="max-w-lg text-center text-base leading-7 text-zinc-600 dark:text-zinc-400">
          livingwithendo is a daily symptom tracker built for people with
          endometriosis. Log how you feel, what you eat, how you move, and
          where you are in your cycle — then discover patterns that help you
          make informed decisions about your health.
        </p>

        {/* Feature cards */}
        <section className="grid w-full gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-black/[.08] p-6 dark:border-white/[.145]"
            >
              <h2 className="mb-2 text-lg font-semibold text-black dark:text-zinc-50">
                {feature.title}
              </h2>
              <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {feature.description}
              </p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
