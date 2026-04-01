import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col font-sans">
      {/* ─── NAV ─── */}
      <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-border bg-surface/85 px-6 py-4 backdrop-blur-[24px] md:px-12">
        <Link href="/" className="font-serif text-xl font-semibold text-foreground">
          Living with Endo
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-foreground/65 transition-opacity hover:text-foreground">Features</a>
          <a href="#about" className="text-sm text-foreground/65 transition-opacity hover:text-foreground">About</a>
          <a href="#how-it-works" className="text-sm text-foreground/65 transition-opacity hover:text-foreground">How It Works</a>
        </div>
        <Link
          href="/signup"
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-surface transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          Get Started
        </Link>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative grid min-h-screen items-center gap-8 overflow-hidden bg-surface px-6 pt-28 pb-16 md:grid-cols-2 md:gap-16 md:px-12">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-accent-green/[0.06] blur-[100px]" />
        <div className="relative z-10">
          <p className="section-label mb-5">Welcome to Living with Endo</p>
          <h1 className="font-serif text-4xl font-light leading-[1.15] text-foreground md:text-5xl lg:text-[3.5rem]">
            Your home for{" "}
            <span className="font-semibold">living with endometriosis</span>
          </h1>
          <p className="mt-5 max-w-[440px] text-base leading-7 text-muted">
            Track your symptoms, gain insights over time, gather your medical
            information in one place, facilitate communication with loved ones
            &mdash; and coming soon, join a community of endo women and stay up
            to date with latest research &amp; treatments.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="rounded-full bg-foreground px-7 py-3 text-base font-medium text-surface transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Start Tracking
            </Link>
            <Link
              href="/login"
              className="rounded-full border-[1.5px] border-foreground px-7 py-3 text-base font-medium text-foreground transition-all hover:bg-foreground hover:text-surface"
            >
              Log In
            </Link>
          </div>
        </div>
        <div className="relative z-10 hidden overflow-hidden rounded-3xl shadow-2xl md:block">
          <Image
            src="/images/endo-couch.png"
            alt="Woman experiencing endometriosis symptoms"
            width={600}
            height={500}
            className="h-[500px] w-full object-cover"
            priority
          />
        </div>
      </section>

      {/* ─── PHOTO STRIP ─── */}
      <section className="grid grid-cols-2 md:grid-cols-4">
        {[
          { src: "/images/endo-bed-side.png", alt: "Woman lying in pain" },
          { src: "/images/endo-sitting-bed.png", alt: "Woman sitting on bed" },
          { src: "/images/endo-leaning-back.png", alt: "Woman leaning back in pain" },
          { src: "/images/endo-red-fabric.png", alt: "Woman with red fabric" },
        ].map((img) => (
          <div key={img.src} className="relative h-[200px] overflow-hidden md:h-[300px]">
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover grayscale-[20%] transition-all duration-500 hover:scale-[1.03] hover:grayscale-0"
            />
          </div>
        ))}
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="px-6 py-20 md:px-12 md:py-28">
        <div className="mx-auto max-w-[1100px]">
          <p className="section-label mb-3">What We Offer</p>
          <h2 className="font-serif text-3xl font-light text-foreground md:text-4xl">
            Tools designed with empathy
          </h2>
          <p className="mt-3 max-w-[480px] text-base leading-7 text-muted">
            Everything you need to understand your body better, all in one place.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Daily Logging",
                description: "Log pain levels, mood, energy, and lifestyle factors in under a minute with our gentle, guided flow.",
                icon: (
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                title: "Insights & Trends",
                description: "Beautiful visualizations reveal patterns you might miss — connecting the dots between symptoms and triggers.",
                icon: (
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                ),
              },
              {
                title: "My Letter",
                description: "Write a personal letter to share with your doctor, partner, or loved ones about life with endometriosis.",
                icon: (
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                ),
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="card-hover cursor-pointer rounded-2xl border border-border bg-surface p-8"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-green/[0.12] text-accent-green">
                  {feature.icon}
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {feature.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-green transition-all">
                  Learn more <span aria-hidden="true">&rarr;</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SPLIT: YOU ARE NOT ALONE ─── */}
      <section id="about" className="bg-surface px-6 py-20 md:px-12 md:py-28">
        <div className="mx-auto grid max-w-[1100px] items-center gap-10 md:grid-cols-2 md:gap-20">
          <div className="relative hidden overflow-hidden rounded-3xl shadow-xl md:block">
            <Image
              src="/images/endo-lying-side.png"
              alt="Woman resting"
              width={600}
              height={480}
              className="h-[480px] w-full object-cover"
            />
          </div>
          <div>
            <p className="section-label mb-3">You Are Not Alone</p>
            <h2 className="font-serif text-3xl font-light leading-tight text-foreground md:text-4xl">
              1 in 10 women live with endometriosis
            </h2>
            <p className="mt-4 text-base leading-7 text-muted">
              It takes an average of 7.5 years to get diagnosed. We believe that
              understanding your symptoms is the first step toward better care,
              better conversations, and better days.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex rounded-full bg-foreground px-7 py-3 text-base font-medium text-surface transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Start Your Journey
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CHART PREVIEW ─── */}
      <section className="px-6 py-20 md:px-12 md:py-28">
        <div className="mx-auto grid max-w-[1100px] items-center gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <p className="section-label mb-3">Data Visualization</p>
            <h2 className="font-serif text-3xl font-light text-foreground md:text-4xl">
              See your patterns, beautifully
            </h2>
            <p className="mt-4 text-base leading-7 text-muted">
              Modern, elegant charts that make your health data easy to
              understand at a glance. Track trends over days, weeks, or months.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex rounded-full bg-foreground px-7 py-3 text-base font-medium text-surface transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Explore Your Data
            </Link>
          </div>
          {/* Dark chart card */}
          <div className="relative overflow-hidden rounded-3xl bg-foreground p-7 text-surface">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-green/[0.06] to-transparent" />
            <p className="relative text-xs font-medium uppercase tracking-[0.12em] text-surface/40">
              Weekly Overview
            </p>
            <p className="relative mt-1 font-serif text-lg text-surface/90">
              Symptom Trends
            </p>
            <div className="relative mt-5">
              <svg viewBox="0 0 400 140" fill="none" className="h-[140px] w-full">
                <line x1="0" y1="35" x2="400" y2="35" stroke="rgba(255,255,255,0.05)" />
                <line x1="0" y1="70" x2="400" y2="70" stroke="rgba(255,255,255,0.05)" />
                <line x1="0" y1="105" x2="400" y2="105" stroke="rgba(255,255,255,0.05)" />
                <path d="M0,105 L57,85 L114,95 L171,60 L228,75 L285,45 L342,65 L400,55 L400,140 L0,140Z" fill="url(#goldGrad)" opacity="0.25" />
                <path d="M0,80 L57,70 L114,90 L171,75 L228,50 L285,65 L342,40 L400,50 L400,140 L0,140Z" fill="url(#terraGrad)" opacity="0.15" />
                <path d="M0,105 L57,85 L114,95 L171,60 L228,75 L285,45 L342,65 L400,55" stroke="#d4b465" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M0,80 L57,70 L114,90 L171,75 L228,50 L285,65 L342,40 L400,50" stroke="#cc9478" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="285" cy="45" r="4" fill="#d4b465" />
                <circle cx="342" cy="40" r="4" fill="#cc9478" />
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4b465" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#d4b465" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="terraGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#cc9478" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#cc9478" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="relative mt-3 flex gap-5">
              <span className="flex items-center gap-1.5 text-xs text-surface/60">
                <span className="h-2 w-2 rounded-full bg-gold-light" /> Pain
              </span>
              <span className="flex items-center gap-1.5 text-xs text-surface/60">
                <span className="h-2 w-2 rounded-full bg-terracotta-light" /> Fatigue
              </span>
              <span className="flex items-center gap-1.5 text-xs text-surface/60">
                <span className="h-2 w-2 rounded-full bg-muted" /> Mood
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DATA VIZ GRID ─── */}
      <section className="px-6 pb-20 md:px-12 md:pb-28">
        <div className="mx-auto grid max-w-[1100px] gap-5 md:grid-cols-2">
          {/* Bar chart card */}
          <div className="relative overflow-hidden rounded-3xl bg-foreground p-7 text-surface">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-surface/40">
              Last 14 Days
            </p>
            <p className="mt-1 font-serif text-lg text-surface/90">Pain Overview</p>
            <div className="mt-5 flex items-end gap-1.5" style={{ height: 100 }}>
              {[35,55,70,40,85,60,30,50,75,45,65,35,80,50].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t transition-opacity hover:opacity-100"
                  style={{
                    height: `${h}%`,
                    background: i % 3 === 0
                      ? "linear-gradient(to top, #b8943f, #d4b465)"
                      : "linear-gradient(to top, #b87858, #cc9478)",
                    opacity: 0.85,
                  }}
                />
              ))}
            </div>
          </div>
          {/* Stats card */}
          <div className="flex flex-col justify-between overflow-hidden rounded-3xl bg-foreground p-7 text-surface">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-surface/40">
                Your Streak
              </p>
              <p className="mt-1 font-serif text-5xl font-light text-gold-light">14</p>
              <p className="mt-1 text-sm text-surface/40">consecutive days logged</p>
            </div>
            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-surface/40">
                Monthly Heatmap
              </p>
              <div className="mt-3 grid grid-cols-7 gap-1">
                {[15,30,50,70,35,20,55,25,80,45,15,40,60,30,10,55,35,65,20,50,15].map((v, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded transition-transform hover:scale-125"
                    style={{
                      background: v > 50
                        ? `rgba(184, 120, 88, ${v / 100})`
                        : `rgba(184, 148, 63, ${v / 100})`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="bg-surface px-6 py-20 md:px-12 md:py-28">
        <div className="mx-auto grid max-w-[1100px] items-center gap-10 md:grid-cols-2 md:gap-20">
          <div className="relative hidden overflow-hidden rounded-3xl shadow-xl md:block">
            <Image
              src="/images/endo-hot-water-bottle.png"
              alt="Woman with hot water bottle"
              width={600}
              height={500}
              className="h-[500px] w-full object-cover"
            />
          </div>
          <div>
            <p className="section-label mb-3">Easy as 1, 2, 3</p>
            <h2 className="mb-8 font-serif text-3xl font-light text-foreground md:text-4xl">
              Ready for clarity?
            </h2>
            {[
              { num: "1", title: "Create Your Profile", desc: "Set up your account with your endo history, treatment plan, and healthcare providers." },
              { num: "2", title: "Log Daily", desc: "Spend a minute each day tracking your symptoms, lifestyle, and how you're feeling." },
              { num: "3", title: "Discover Patterns", desc: "Review your trends, share insights with your doctor, and take control of your care." },
            ].map((step, i) => (
              <div
                key={step.num}
                className={`flex items-start gap-4 py-5 ${i < 2 ? "border-b border-border" : ""}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-accent-green text-sm font-semibold text-accent-green">
                  {step.num}
                </div>
                <div>
                  <h4 className="font-serif text-lg font-semibold text-foreground">
                    {step.title}
                  </h4>
                  <p className="mt-1 text-sm leading-6 text-muted">{step.desc}</p>
                </div>
              </div>
            ))}
            <Link
              href="/signup"
              className="mt-8 inline-flex rounded-full bg-foreground px-7 py-3 text-base font-medium text-surface transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="px-6 py-20 text-center md:px-12 md:py-28">
        <p className="section-label mb-3">Community Voices</p>
        <h2 className="font-serif text-3xl font-light text-foreground md:text-4xl">
          You are not alone in this
        </h2>
        <div className="mx-auto mt-10 grid max-w-[1100px] gap-5 md:grid-cols-3">
          {[
            { quote: "For the first time, I could show my doctor exactly what I was experiencing. The patterns were right there in the data.", author: "Sarah K." },
            { quote: "The letter feature helped me explain to my partner what living with endo really feels like. It changed our relationship.", author: "Emma L." },
            { quote: "I finally feel like I have a tool that understands me. It's calming, beautiful, and actually useful every single day.", author: "Maya R." },
          ].map((t) => (
            <div
              key={t.author}
              className="card-hover rounded-2xl border border-border bg-surface p-8 text-left"
            >
              <p className="font-serif text-4xl leading-none text-accent-green">
                &ldquo;
              </p>
              <p className="mt-2 text-[0.95rem] leading-7 text-foreground">
                {t.quote}
              </p>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-muted">
                &mdash; {t.author}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative overflow-hidden bg-foreground px-6 py-24 text-center md:py-32">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-green/[0.06] blur-[100px]" />
        <h2 className="relative mx-auto max-w-[600px] font-serif text-3xl font-light leading-tight text-surface md:text-4xl lg:text-5xl">
          Your body tells a story. Start listening.
        </h2>
        <p className="relative mx-auto mt-5 max-w-[450px] text-base leading-7 text-surface/45">
          Join thousands of people with endometriosis who are taking control of
          their health, one day at a time.
        </p>
        <Link
          href="/signup"
          className="relative mt-8 inline-flex rounded-full bg-accent-green px-8 py-3.5 text-base font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(184,148,63,0.3)]"
        >
          Start Your Journey
        </Link>
      </section>

      {/* ─── DISCLAIMER ─── */}
      <div className="border-t border-border bg-background px-6 py-8">
        <div className="mx-auto max-w-lg text-center text-xs leading-5 text-muted">
          <p className="font-serif text-sm font-medium text-foreground">
            Important notice
          </p>
          <p className="mt-2">
            Living with Endo is a personal self-tracking and reflection tool. It
            is not a medical device, does not provide medical advice, and is not
            intended to diagnose, treat, or replace professional healthcare.
            Always consult a qualified healthcare provider for medical decisions.
          </p>
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="flex flex-col items-center justify-between gap-4 bg-foreground px-6 py-8 text-sm text-surface/30 md:flex-row md:px-12">
        <p className="font-serif text-base text-surface/50">Living with Endo</p>
        <div className="flex gap-6">
          <Link href="/privacy" className="transition-colors hover:text-surface/60">Privacy</Link>
          <Link href="/terms" className="transition-colors hover:text-surface/60">Terms</Link>
        </div>
        <p>&copy; 2026 Living with Endo</p>
      </footer>
    </div>
  );
}
