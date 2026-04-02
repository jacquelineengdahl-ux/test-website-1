export interface PackPhase {
  days: [number, number]; // [startDay, endDay] inclusive
  name: string;
  description: string;
}

export interface PackCycle {
  length: number; // total days in one pack/cycle
  phases: PackPhase[];
  brandSpecific?: Record<string, { length: number; phases: PackPhase[] }>;
}

export interface HormonalTreatment {
  value: string;
  label: string;
  description: string;
  examples: string[];
  commonSideEffects: string[];
  cycleInfo: string;
  packCycle?: PackCycle;
}

export const hormonalTreatments: HormonalTreatment[] = [
  {
    value: "Combined pill",
    label: "Combined pill (estrogen + progestogen)",
    description: "Contains both estrogen and progestogen. Taken in 21- or 28-day cycles.",
    examples: ["Yasmin", "Microgynon", "Marvelon", "Cilest", "Rigevidon"],
    commonSideEffects: [
      "Mood changes (especially first 2-3 months)",
      "Headaches or migraines",
      "Nausea",
      "Breast tenderness",
      "Breakthrough bleeding or spotting",
      "Bloating and water retention",
      "Reduced libido",
    ],
    cycleInfo: "Typically taken for 21 days with a 7-day break. Symptoms may fluctuate between active and break weeks.",
    packCycle: {
      length: 28,
      phases: [
        { days: [1, 21], name: "Active pills", description: "Estrogen + progestogen active. Hormone levels stable." },
        { days: [22, 28], name: "Break / placebo", description: "Hormone-free interval. Withdrawal bleed expected. Pain and mood changes may increase." },
      ],
    },
  },
  {
    value: "Progestogen-only pill",
    label: "Progestogen-only pill (mini pill)",
    description: "Contains only progestogen. Taken daily without a break.",
    examples: ["Slinda (drospirenone)", "Cerazette (desogestrel)", "Noriday", "Micronor", "Cerelle"],
    commonSideEffects: [
      "Mood changes and irritability",
      "Irregular bleeding or spotting (common in first months)",
      "Headaches",
      "Breast tenderness",
      "Acne (can improve or worsen)",
      "Bloating",
      "Reduced libido",
      "Depression or anxiety (some users)",
    ],
    cycleInfo: "Taken continuously. Some types (e.g., Slinda) have a 4-day placebo break per 28-day pack. Mood and symptom patterns often follow the pack cycle.",
    packCycle: {
      length: 28,
      phases: [
        { days: [1, 24], name: "Active pills", description: "Progestogen active. Some users notice mood changes and irritability, especially days 1-14 of a new pack." },
        { days: [25, 28], name: "Placebo pills", description: "No active hormone. Withdrawal bleed may occur. Mood may shift." },
      ],
      brandSpecific: {
        "Slinda (drospirenone)": {
          length: 28,
          phases: [
            { days: [1, 14], name: "Early active phase", description: "Drospirenone building up. Many users experience increased moodiness, irritability, or low mood during this phase." },
            { days: [15, 24], name: "Late active phase", description: "Hormone levels more stable. Mood often improves compared to early phase." },
            { days: [25, 28], name: "Placebo pills (green)", description: "No active hormone. Withdrawal bleed may occur. Some users feel better, others worse during this break." },
          ],
        },
        "Cerazette (desogestrel)": {
          length: 28,
          phases: [
            { days: [1, 28], name: "Continuous active", description: "Taken continuously without breaks. No placebo phase. Irregular spotting possible throughout." },
          ],
        },
      },
    },
  },
  {
    value: "Hormonal IUD",
    label: "Hormonal IUD (e.g. Mirena)",
    description: "Releases levonorgestrel locally in the uterus. Lasts 3-8 years depending on type.",
    examples: ["Mirena", "Kyleena", "Liletta", "Jaydess"],
    commonSideEffects: [
      "Irregular bleeding (especially first 3-6 months)",
      "Cramping after insertion",
      "Mood changes",
      "Headaches",
      "Acne",
      "Breast tenderness",
      "Ovarian cysts (usually harmless)",
      "Reduced or absent periods (after 6+ months)",
    ],
    cycleInfo: "Continuous low-dose hormone release. Many users see lighter or absent periods after 3-6 months. Natural cycle may still cause monthly fluctuations.",
  },
  {
    value: "GnRH agonist",
    label: "GnRH agonist (e.g. Zoladex, Lupron)",
    description: "Suppresses ovarian function, creating a temporary menopause-like state. Often used for severe endo.",
    examples: ["Zoladex (goserelin)", "Lupron/Prostap (leuprorelin)", "Synarel (nafarelin)", "Decapeptyl"],
    commonSideEffects: [
      "Hot flushes and night sweats",
      "Mood swings and emotional changes",
      "Vaginal dryness",
      "Joint and muscle pain",
      "Headaches",
      "Bone density loss (with prolonged use)",
      "Fatigue",
      "Sleep disturbances",
      "Initial symptom flare (first 2-4 weeks)",
    ],
    cycleInfo: "Usually given as monthly or 3-monthly injection. Initial flare of symptoms is common in weeks 1-2 before suppression takes effect. Often combined with add-back HRT.",
  },
  {
    value: "GnRH antagonist",
    label: "GnRH antagonist (e.g. Orilissa / Elagolix)",
    description: "Partially suppresses ovarian hormones without the initial flare of GnRH agonists.",
    examples: ["Orilissa/Elagolix", "Ryeqo (relugolix combination)", "Myfembree"],
    commonSideEffects: [
      "Hot flushes",
      "Mood changes",
      "Headaches",
      "Nausea",
      "Insomnia",
      "Irregular bleeding",
      "Joint pain",
      "Bone density concerns (long-term)",
    ],
    cycleInfo: "Daily oral tablet. No initial flare like GnRH agonists. Effects depend on dose — lower doses partially suppress hormones, higher doses more fully.",
  },
  {
    value: "Depo injection",
    label: "Depo injection (Depo-Provera)",
    description: "Progestogen injection given every 12-13 weeks.",
    examples: ["Depo-Provera (medroxyprogesterone)", "Sayana Press"],
    commonSideEffects: [
      "Irregular bleeding (especially first injection)",
      "Weight gain",
      "Mood changes and depression",
      "Headaches",
      "Reduced libido",
      "Delayed return of fertility",
      "Bone density changes",
      "Bloating",
    ],
    cycleInfo: "Given every 12-13 weeks. Symptoms may fluctuate — often worse in the weeks before the next injection as hormone levels drop.",
    packCycle: {
      length: 91,
      phases: [
        { days: [1, 14], name: "Peak hormone", description: "Highest progestogen levels after injection. Side effects may be strongest." },
        { days: [15, 60], name: "Stable phase", description: "Hormone levels gradually declining but still effective." },
        { days: [61, 91], name: "Pre-injection dip", description: "Hormone levels dropping. Symptoms and breakthrough bleeding may return. Time to schedule next injection." },
      ],
    },
  },
  {
    value: "Hormonal patch",
    label: "Hormonal patch",
    description: "Worn on the skin, releasing estrogen and progestogen. Changed weekly.",
    examples: ["Evra patch", "Xulane"],
    commonSideEffects: [
      "Skin irritation at patch site",
      "Headaches",
      "Nausea",
      "Breast tenderness",
      "Mood changes",
      "Breakthrough bleeding",
      "Bloating",
    ],
    cycleInfo: "Worn for 3 weeks (changing weekly), then 1 patch-free week. Symptom patterns may follow the 4-week cycle.",
    packCycle: {
      length: 28,
      phases: [
        { days: [1, 7], name: "Patch week 1", description: "Fresh patch applied. Hormone levels rising." },
        { days: [8, 14], name: "Patch week 2", description: "Stable hormone delivery. Change patch." },
        { days: [15, 21], name: "Patch week 3", description: "Final active week. Change patch." },
        { days: [22, 28], name: "Patch-free week", description: "No patch. Withdrawal bleed expected. Symptoms may increase." },
      ],
    },
  },
  {
    value: "Vaginal ring",
    label: "Vaginal ring (e.g. NuvaRing)",
    description: "Flexible ring worn inside the vagina releasing estrogen and progestogen.",
    examples: ["NuvaRing", "Annovera"],
    commonSideEffects: [
      "Headaches",
      "Vaginal discharge",
      "Nausea",
      "Breast tenderness",
      "Mood changes",
      "Breakthrough bleeding",
      "Ring discomfort",
    ],
    cycleInfo: "Worn for 3 weeks, removed for 1 week (NuvaRing) or worn continuously for a year (Annovera). Symptom patterns may follow the cycle.",
    packCycle: {
      length: 28,
      phases: [
        { days: [1, 21], name: "Ring in", description: "Active hormone delivery for 3 weeks." },
        { days: [22, 28], name: "Ring out", description: "Ring-free week. Withdrawal bleed expected. Symptoms may increase." },
      ],
    },
  },
  {
    value: "HRT / Add-back therapy",
    label: "HRT / Add-back therapy",
    description: "Low-dose hormone replacement to counteract side effects of GnRH treatments. Replaces some estrogen and/or progestogen.",
    examples: ["Tibolone", "Low-dose estradiol + norethisterone", "Livial"],
    commonSideEffects: [
      "Breakthrough bleeding",
      "Headaches",
      "Breast tenderness",
      "Bloating",
      "Mood changes",
      "Nausea (usually settles)",
    ],
    cycleInfo: "Usually taken daily alongside GnRH treatment. Helps prevent bone loss and menopausal symptoms while maintaining endo suppression.",
  },
  {
    value: "Dienogest",
    label: "Dienogest (Visanne)",
    description: "A progestogen specifically developed for endometriosis treatment. Taken daily without breaks.",
    examples: ["Visanne", "Dienogest generics"],
    commonSideEffects: [
      "Irregular bleeding or spotting",
      "Headaches",
      "Mood changes and depressive mood",
      "Breast tenderness",
      "Acne",
      "Hot flushes",
      "Weight changes",
      "Reduced libido",
    ],
    cycleInfo: "Taken continuously (no breaks). Irregular bleeding is common in the first months but usually decreases over time.",
  },
  {
    value: "Norethisterone",
    label: "Norethisterone",
    description: "A progestogen used to manage endometriosis symptoms and delay periods.",
    examples: ["Primolut N", "Norethisterone generics"],
    commonSideEffects: [
      "Breakthrough bleeding",
      "Bloating",
      "Mood changes",
      "Headaches",
      "Nausea",
      "Breast tenderness",
      "Acne",
    ],
    cycleInfo: "Can be taken cyclically or continuously depending on prescription. When taken continuously, periods usually stop.",
  },
  {
    value: "Other hormonal treatment",
    label: "Other hormonal treatment",
    description: "Another hormonal treatment not listed above.",
    examples: [],
    commonSideEffects: [],
    cycleInfo: "",
  },
];

export function getTreatmentInfo(value: string): HormonalTreatment | undefined {
  return hormonalTreatments.find((t) => t.value === value);
}

export interface PillDayInfo {
  day: number;
  totalDays: number;
  phase: PackPhase;
  packNumber: number;
}

export function calculatePillDay(
  treatmentCategory: string,
  brand: string,
  startDate: string,
  logDate: string,
): PillDayInfo | null {
  const treatment = getTreatmentInfo(treatmentCategory);
  if (!treatment?.packCycle || !startDate) return null;

  // Use brand-specific cycle if available
  const cycle = treatment.packCycle.brandSpecific?.[brand] ?? treatment.packCycle;
  const start = new Date(startDate + "T00:00:00");
  const log = new Date(logDate + "T00:00:00");
  const diffMs = log.getTime() - start.getTime();
  if (diffMs < 0) return null;

  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const dayInCycle = (totalDays % cycle.length) + 1;
  const packNumber = Math.floor(totalDays / cycle.length) + 1;

  // Find which phase this day falls in
  const phase = cycle.phases.find(
    (p) => dayInCycle >= p.days[0] && dayInCycle <= p.days[1],
  ) ?? cycle.phases[cycle.phases.length - 1];

  return { day: dayInCycle, totalDays: cycle.length, phase, packNumber };
}
