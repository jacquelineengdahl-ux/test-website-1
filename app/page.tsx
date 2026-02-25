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
    title: "Doctor-ready exports",
    description:
      "Generate clear summaries of your symptoms and trends to bring to your next medical appointment.",
  },
  {
    title: "Community support",
    description:
      "Connect with others who understand what you're going through — share experiences, not advice.",
  },
  {
    title: "Research & treatment updates",
    description:
      "Stay informed on the latest endometriosis research, treatments, and clinical developments.",
  },
];

export default function Home() {
  return (
    <div className="relative flex flex-col items-center bg-gradient-to-b from-[#ece7df] via-background to-background font-sans">
      {/* Journey line — spans entire page */}
      <svg
        className="pointer-events-none absolute left-0 top-0 z-0 h-full w-full opacity-[0.13]"
        viewBox="0 0 400 1000"
        fill="none"
        preserveAspectRatio="none"
      >
        <path d="M320 0 C280 40, 200 80, 130 70 C60 60, 20 120, 60 180 C100 240, 250 250, 300 300 C350 350, 380 400, 340 460 C300 520, 150 530, 80 570 C10 610, 30 680, 100 720 C170 760, 320 770, 360 820 C400 870, 350 940, 300 1000" stroke="#c9a88a" strokeWidth="2" strokeLinecap="round" />
        <path d="M330 0 C290 45, 210 90, 140 82 C70 74, 30 130, 68 188 C106 246, 255 258, 308 310 C358 358, 385 408, 348 468 C308 528, 158 540, 90 578 C22 616, 40 688, 108 728 C176 768, 325 778, 368 830 C408 878, 358 948, 310 1000" stroke="#d4b896" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M310 0 C270 35, 190 72, 120 62 C50 52, 10 112, 52 172 C94 232, 242 244, 292 292 C342 342, 372 392, 332 452 C292 512, 142 522, 72 562 C2 602, 22 672, 92 712 C162 752, 312 762, 352 812 C392 862, 342 932, 292 1000" stroke="#b8917a" strokeWidth="1" strokeLinecap="round" />
      </svg>

      {/* Hero — full viewport, centered */}
      <section className="relative flex min-h-screen w-full flex-col items-center justify-center gap-6 overflow-hidden px-6 text-center">
        {/* Warm washes */}
        <div className="pointer-events-none absolute -left-40 -top-20 h-[700px] w-[700px] rounded-full bg-[#c9a88a] opacity-[0.12] blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 top-[10%] h-[600px] w-[600px] rounded-full bg-[#d4b896] opacity-[0.10] blur-[110px]" />
        <div className="pointer-events-none absolute -left-20 bottom-[5%] h-[500px] w-[500px] rounded-full bg-[#8fa580] opacity-[0.08] blur-[100px]" />

        {/* Soft circles cluster — top left */}
        <svg
          className="pointer-events-none absolute -left-10 -top-[10%] h-[400px] w-[400px] opacity-[0.10]"
          viewBox="0 0 200 200"
          fill="none"
        >
          <circle cx="120" cy="80" r="45" stroke="#d4b896" strokeWidth="1.2" />
          <circle cx="100" cy="100" r="60" stroke="#c9a88a" strokeWidth="0.8" />
          <circle cx="140" cy="110" r="30" stroke="#b8917a" strokeWidth="1" />
          <circle cx="90" cy="70" r="20" fill="#d4b896" fillOpacity="0.15" />
        </svg>

        {/* Dot scatter — bottom left */}
        <svg
          className="pointer-events-none absolute bottom-[20%] left-[5%] h-[300px] w-[300px] opacity-[0.15]"
          viewBox="0 0 100 100"
          fill="#c9a88a"
        >
          <circle cx="20" cy="30" r="3" />
          <circle cx="35" cy="50" r="2" />
          <circle cx="15" cy="60" r="4" />
          <circle cx="45" cy="35" r="2.5" />
          <circle cx="30" cy="75" r="3.5" />
          <circle cx="50" cy="65" r="2" />
          <circle cx="25" cy="45" r="1.5" />
          <circle cx="40" cy="80" r="3" />
          <circle cx="55" cy="50" r="1.8" />
          <circle cx="18" cy="85" r="2.5" />
        </svg>

        <h1 className="font-serif text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
          livingwithendo
        </h1>
        <div className="h-px w-16 bg-accent-clay" />
        <p className="max-w-md text-lg leading-8 text-muted">
          Track, understand, and take control of your symptoms.
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

      {/* Below the fold */}
      <main className="relative flex w-full max-w-2xl flex-col items-center gap-32 px-6 pb-24 sm:px-16">
        {/* Decorative — circles behind about text */}
        <svg
          className="pointer-events-none absolute -right-16 bottom-[10%] h-[350px] w-[350px] opacity-[0.08]"
          viewBox="0 0 200 200"
          fill="none"
        >
          <circle cx="100" cy="100" r="50" stroke="#b8917a" strokeWidth="1" />
          <circle cx="100" cy="100" r="75" stroke="#d4b896" strokeWidth="0.7" />
          <circle cx="120" cy="80" r="25" fill="#c9a88a" fillOpacity="0.1" />
        </svg>

        {/* Decorative — dot scatter */}
        <svg
          className="pointer-events-none absolute bottom-[30%] right-[2%] h-[250px] w-[250px] opacity-[0.12]"
          viewBox="0 0 100 100"
          fill="#b8917a"
        >
          <circle cx="70" cy="25" r="2.5" />
          <circle cx="85" cy="40" r="1.8" />
          <circle cx="75" cy="55" r="3" />
          <circle cx="90" cy="65" r="2" />
          <circle cx="80" cy="80" r="2.5" />
          <circle cx="65" cy="70" r="1.5" />
        </svg>

        {/* Feature cards */}
        <section className="relative z-10 flex w-full flex-col items-center gap-8">
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            How it works
          </h2>
          <div className="grid w-full gap-8 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-border bg-surface p-6"
              >
                <h2 className="mb-2 font-serif text-lg font-semibold text-foreground">
                  {feature.title}
                </h2>
                <p className="text-sm leading-6 text-muted">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* About */}
        <section className="relative z-10 flex w-full flex-col items-center gap-6">
          <div className="pointer-events-none absolute -inset-10 rounded-full bg-background opacity-70 blur-2xl" />
          <h2 className="relative font-serif text-2xl font-semibold tracking-tight text-foreground">
            Why do we exist?
          </h2>
          <div className="relative h-px w-16 bg-accent-clay" />
          <p className="relative max-w-lg text-center text-base leading-7 text-muted">
            Endometriosis is a chronic condition where tissue similar to the
            uterine lining grows outside the uterus, causing pain, fatigue, and
            digestive issues that can affect every part of daily life. It impacts
            roughly 1 in 10 women and can take years to diagnose.{" "}
            <span className="font-serif font-semibold text-foreground">livingwithendo</span>{" "}
            helps you log how you feel, what you eat, how you move, and where you
            are in your cycle — so you and your care team can spot triggers,
            measure what works, and advocate for better treatment.
            After decades of living with excruciating pain and a debilitating
            life situation, our founder decided to build the page she wished
            had existed — to support her own journey and, hopefully, the
            journeys of more women living with endo.
          </p>
        </section>
      </main>

      {/* Closing CTA */}
      <section className="relative mt-12 w-full overflow-hidden bg-surface py-20">
        {/* Decorative — warm wash */}
        <div className="pointer-events-none absolute -right-20 top-0 h-[300px] w-[300px] rounded-full bg-[#c9a88a] opacity-[0.08] blur-[80px]" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-[250px] w-[250px] rounded-full bg-[#8fa580] opacity-[0.06] blur-[70px]" />

        <div className="flex flex-col items-center gap-6 px-6 text-center">
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            Ready to start tracking?
          </h2>
          <p className="max-w-sm text-sm leading-6 text-muted">
            Your experience deserves to be understood. Start logging today.
          </p>
          <Link
            href="/signup"
            className="flex h-12 items-center justify-center rounded-md bg-accent-green px-6 text-base font-medium text-white transition-colors hover:opacity-90"
          >
            Create an account
          </Link>
        </div>
      </section>

      <footer className="flex flex-col items-center gap-2 py-24 text-center text-sm text-muted">
        <p>Your data stays yours — stored securely with end-to-end authentication.</p>
        <p>&copy; 2026 livingwithendo</p>
      </footer>
    </div>
  );
}
