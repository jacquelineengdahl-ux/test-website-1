"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { hormonalTreatments, getTreatmentInfo } from "@/lib/hormonal-treatments";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" });
}

function calcAge(dateStr: string): number | null {
  if (!dateStr) return null;
  const birth = new Date(dateStr + "T00:00:00");
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function timeToDiagnosis(symptomDate: string, diagDate: string): string | null {
  if (!symptomDate || !diagDate) return null;
  const s = new Date(symptomDate + "T00:00:00");
  const d = new Date(diagDate + "T00:00:00");
  if (d <= s) return null;
  let years = d.getFullYear() - s.getFullYear();
  let months = d.getMonth() - s.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (d.getDate() < s.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  return parts.length > 0 ? parts.join(", ") : "Less than a month";
}

function diagnosisEmpathyMessage(symptomYear: string, diagYear: string): string | null {
  if (!symptomYear || !diagYear) return null;
  const years = Number(diagYear) - Number(symptomYear);
  if (years <= 0) return null;
  if (years <= 2) return "Faster than most — but that doesn't mean it was easy.";
  if (years <= 6) return "Time spent searching for answers. That takes persistence.";
  if (years <= 10) return "Unfortunately, this is the average time for diagnosis. It should not have to take this long. Living with uncertainty for that long takes endurance.";
  return "Far longer than it should ever take. You deserved answers much sooner.";
}

const ENDO_STAGES: { value: string; label: string; description: string }[] = [
  { value: "Stage I", label: "Stage I — Minimal", description: "Small lesions or implants on or around organs in the pelvis. Little to no scar tissue." },
  { value: "Stage II", label: "Stage II — Mild", description: "More and slightly deeper implants than Stage I. Some scar tissue may be present." },
  { value: "Stage III", label: "Stage III — Moderate", description: "Many deep implants, small cysts on one or both ovaries, and bands of scar tissue (adhesions)." },
  { value: "Stage IV", label: "Stage IV — Severe", description: "Widespread deep implants, large cysts on ovaries, and dense adhesions affecting organs." },
  { value: "Not sure", label: "Not sure", description: "You may not have had a laparoscopy yet, or your stage wasn't communicated to you." },
];

function extractYear(dateStr: string): string {
  if (!dateStr) return "";
  const match = dateStr.match(/^(\d{4})/);
  return match ? match[1] : "";
}

function yearToDate(year: string): string {
  if (!year) return "";
  return `${year}-01-01`;
}

interface Provider {
  clinic: string;
  name: string;
  contact: string;
}

interface MedicalEvent {
  year: string;
  month: string;
  type: string;
  notes: string;
}

const MEDICAL_EVENT_TYPES = [
  "ER Visit", "Cyst Rupture", "Surgery", "Hospital Stay", "Specialist Visit",
  "GP Visit", "Symptoms", "Side Effects", "Quality of Life", "Treatment", "Other",
];

const MEDICAL_TREATMENT_OPTIONS = [
  "Pain medication", "Anti-inflammatory drugs", "Hormonal therapy", "Laparoscopy",
  "Excision surgery", "Hysterectomy", "IVF / Fertility treatment", "Physiotherapy",
  "Pain management program", "Nerve block", "Bowel surgery", "Bladder surgery",
];

const SUPPORTING_TREATMENT_OPTIONS = [
  "Supplements", "Anti-inflammatory diet", "Gluten-free diet", "Exercise",
  "Yoga", "Meditation", "Acupuncture", "Physiotherapy", "CBD",
  "Heat therapy", "TENS machine", "Sleep hygiene", "Stress management",
  "Counseling/Therapy", "Pelvic floor therapy",
];

const GOAL_OPTIONS = [
  "Manage mood swings", "Brain fog", "Pain management", "Surgery preparation",
  "Egg freezing", "Supplements", "Diet changes", "Exercise routine",
  "Better sleep", "Reduce inflammation", "Fertility planning", "Mental health",
  "Work-life balance", "Reduce medication", "Find specialist",
];

const SUPPORTING_SUB_OPTIONS: Record<string, string[]> = {
  "Supplements": ["Omega-3", "Magnesium", "Vitamin B", "Vitamin C", "Vitamin D3", "Calcium", "Iron", "Zinc", "NAC", "Turmeric/Curcumin", "Probiotics", "Vitamin B complex", "CoQ10", "DIM", "Resveratrol"],
  "Anti-inflammatory diet": ["No red meat", "No dairy", "No gluten", "No sugar", "No alcohol", "No caffeine", "Mediterranean diet", "Whole foods"],
  "Exercise": ["Walking", "Swimming", "Pilates", "Strength training", "Running", "Cycling", "Dancing"],
  "Yoga": ["Yin yoga", "Restorative yoga", "Hatha yoga", "Vinyasa"],
};

const GOAL_SUB_OPTIONS: Record<string, string[]> = {
  "Pain management": ["Reduce daily pain", "Better pain medication", "Pain-free days", "Nerve pain relief", "Period pain control"],
  "Supplements": ["Find right supplement stack", "Consistent supplement routine", "Reduce inflammation naturally"],
  "Diet changes": ["Anti-inflammatory diet", "Identify trigger foods", "Meal planning", "Reduce sugar", "Reduce dairy"],
  "Surgery preparation": ["Find surgeon", "Pre-surgery fitness", "Recovery planning", "Second opinion"],
  "Exercise routine": ["Start gentle movement", "Build consistency", "Strength building", "Flexibility"],
  "Mental health": ["Therapy/counseling", "Anxiety management", "Acceptance", "Support group", "Mindfulness"],
};

/* ── Phone number data ── */
const COUNTRY_CODES = [
  { flag: "🇸🇪", code: "+46", name: "Sweden" },
  { flag: "🇺🇸", code: "+1", name: "United States" },
  { flag: "🇬🇧", code: "+44", name: "United Kingdom" },
  { flag: "🇩🇪", code: "+49", name: "Germany" },
  { flag: "🇫🇷", code: "+33", name: "France" },
  { flag: "🇳🇴", code: "+47", name: "Norway" },
  { flag: "🇩🇰", code: "+45", name: "Denmark" },
  { flag: "🇫🇮", code: "+358", name: "Finland" },
  { flag: "🇳🇱", code: "+31", name: "Netherlands" },
  { flag: "🇪🇸", code: "+34", name: "Spain" },
  { flag: "🇮🇹", code: "+39", name: "Italy" },
  { flag: "🇵🇹", code: "+351", name: "Portugal" },
  { flag: "🇦🇹", code: "+43", name: "Austria" },
  { flag: "🇨🇭", code: "+41", name: "Switzerland" },
  { flag: "🇧🇪", code: "+32", name: "Belgium" },
  { flag: "🇮🇪", code: "+353", name: "Ireland" },
  { flag: "🇵🇱", code: "+48", name: "Poland" },
  { flag: "🇨🇿", code: "+420", name: "Czech Republic" },
  { flag: "🇬🇷", code: "+30", name: "Greece" },
  { flag: "🇦🇺", code: "+61", name: "Australia" },
  { flag: "🇳🇿", code: "+64", name: "New Zealand" },
  { flag: "🇨🇦", code: "+1", name: "Canada" },
  { flag: "🇯🇵", code: "+81", name: "Japan" },
  { flag: "🇰🇷", code: "+82", name: "South Korea" },
  { flag: "🇮🇳", code: "+91", name: "India" },
  { flag: "🇧🇷", code: "+55", name: "Brazil" },
  { flag: "🇲🇽", code: "+52", name: "Mexico" },
  { flag: "🇿🇦", code: "+27", name: "South Africa" },
  { flag: "🇮🇱", code: "+972", name: "Israel" },
  { flag: "🇹🇷", code: "+90", name: "Turkey" },
];

function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // Parse existing value into code + number
  const [selectedCode, setSelectedCode] = useState(() => {
    // Try to match an existing area code from the value
    if (value) {
      const match = COUNTRY_CODES.find((c) => value.startsWith(c.code));
      if (match) return match.code;
    }
    return "+46"; // default Sweden
  });
  const [localNumber, setLocalNumber] = useState(() => {
    if (value) {
      const match = COUNTRY_CODES.find((c) => value.startsWith(c.code));
      if (match) return value.slice(match.code.length).trim();
      // If value doesn't start with a code, treat entire thing as local
      if (!value.startsWith("+")) return value;
    }
    return "";
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = COUNTRY_CODES.find((c) => c.code === selectedCode) ?? COUNTRY_CODES[0];

  const filtered = search
    ? COUNTRY_CODES.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.includes(search)
      )
    : COUNTRY_CODES;

  function updateFull(code: string, num: string) {
    const cleaned = num.replace(/^\s+/, "");
    const full = cleaned ? `${code} ${cleaned}` : "";
    onChange(full);
  }

  // Sync combined value on mount if local number exists but stored value doesn't have the code
  useEffect(() => {
    if (localNumber && value && !value.startsWith("+")) {
      updateFull(selectedCode, localNumber);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelectCode(code: string) {
    setSelectedCode(code);
    setDropdownOpen(false);
    setSearch("");
    updateFull(code, localNumber);
  }

  function handleNumberChange(num: string) {
    setLocalNumber(num);
    updateFull(selectedCode, num);
  }

  return (
    <div className="flex gap-2">
      {/* Country code selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex h-full items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground hover:bg-surface transition-colors"
        >
          <span className="text-base">{selected.flag}</span>
          <span className="text-muted">{selected.code}</span>
          <svg className="h-3 w-3 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {dropdownOpen && (
          <div className="absolute left-0 top-full z-40 mt-1 w-64 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
            <div className="border-b border-border px-3 py-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country..."
                autoFocus
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.map((c) => (
                <button
                  key={`${c.flag}${c.code}${c.name}`}
                  type="button"
                  onMouseDown={() => handleSelectCode(c.code)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-background transition-colors"
                >
                  <span className="text-base">{c.flag}</span>
                  <span className="text-muted">{c.code}</span>
                  <span className="text-foreground">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Number input */}
      <input
        type="tel"
        value={localNumber}
        onChange={(e) => handleNumberChange(e.target.value)}
        placeholder="70 123 4567"
        className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent-green focus:outline-none"
      />
    </div>
  );
}

function formatPhoneDisplay(phone: string): string {
  if (!phone) return "";
  // Find matching country code
  const match = COUNTRY_CODES.find((c) => phone.startsWith(c.code));
  if (!match) return phone;
  const local = phone.slice(match.code.length).trim();
  if (!local) return match.code;

  // US/Canada: +1(917)992-1234
  if (match.code === "+1" && local.length >= 10) {
    const digits = local.replace(/\D/g, "");
    if (digits.length === 10) {
      return `${match.code}(${digits.slice(0, 3)})${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return `${match.code}(${local})`;
  }

  // Most other countries: +46 (0)707644253
  // If local starts with 0, wrap it: +46 (0)707644253
  if (local.startsWith("0")) {
    return `${match.code} (0)${local.slice(1)}`;
  }
  // If no leading 0, just format as +46 707644253
  return `${match.code} ${local}`;
}

/* ── Location autocomplete component ── */
function LocationAutocomplete({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setQuery(value); }, [value]);

  function handleInput(input: string) {
    setQuery(input);
    onChange(input);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (input.length < 2) { setSuggestions([]); return; }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(input)}&count=6&language=en&format=json`
        );
        const data = await res.json();
        if (data.results) {
          const items = data.results.map(
            (r: { name: string; country: string; admin1?: string }) =>
              r.admin1 && r.admin1 !== r.name ? `${r.name}, ${r.admin1}, ${r.country}` : `${r.name}, ${r.country}`
          );
          // Deduplicate
          setSuggestions([...new Set<string>(items)]);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }

  function selectSuggestion(s: string) {
    setQuery(s);
    onChange(s);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  return (
    <div className="relative">
      <input
        id="location"
        type="text"
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder="Start typing a city..."
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent-green focus:outline-none"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={() => selectSuggestion(s)}
              className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-background transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Tooltip component ── */
function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block ml-1">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-muted/40 text-[10px] font-bold text-muted hover:text-foreground hover:border-foreground"
      >
        ?
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-normal normal-case tracking-normal text-foreground shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
}

/* ── Collapsible Pill/Chip selector component ── */
function CollapsiblePillSelector({
  options,
  selected,
  onChange,
  otherValue,
  onOtherChange,
  subOptions,
  subSelections,
  onSubSelectionsChange,
}: {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  otherValue: string;
  onOtherChange: (value: string) => void;
  subOptions?: Record<string, string[]>;
  subSelections?: Record<string, string[]>;
  onSubSelectionsChange?: (subs: Record<string, string[]>) => void;
}) {
  const [expandedPill, setExpandedPill] = useState<string | null>(null);
  const isOtherSelected = selected.includes("Other") || otherValue.trim() !== "";

  function toggle(option: string) {
    if (option === "Other") {
      if (isOtherSelected) {
        onChange(selected.filter((s) => s !== "Other"));
        onOtherChange("");
      } else {
        onChange([...selected, "Other"]);
      }
      return;
    }
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
      if (subOptions?.[option] && onSubSelectionsChange && subSelections) {
        const updated = { ...subSelections };
        delete updated[option];
        onSubSelectionsChange(updated);
      }
      if (expandedPill === option) setExpandedPill(null);
    } else {
      onChange([...selected, option]);
      if (subOptions?.[option]) setExpandedPill(option);
    }
  }

  function toggleSub(parent: string, sub: string) {
    if (!onSubSelectionsChange || !subSelections) return;
    const current = subSelections[parent] ?? [];
    const updated = current.includes(sub)
      ? current.filter((s) => s !== sub)
      : [...current, sub];
    onSubSelectionsChange({ ...subSelections, [parent]: updated });
  }

  return (
    <div className="space-y-3">
      {/* Sub-options panel — appears at the TOP when a pill with subs is expanded */}
      {expandedPill && subOptions?.[expandedPill] && (
        <div className="rounded-xl border border-accent-green/30 bg-accent-green/[0.04] px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-full bg-foreground px-3 py-1.5 text-sm text-surface">{expandedPill}</span>
            <button
              type="button"
              onClick={() => setExpandedPill(null)}
              className="text-xs text-muted hover:text-foreground"
            >
              Done
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {subOptions[expandedPill].map((sub) => {
              const isSubSelected = (subSelections?.[expandedPill] ?? []).includes(sub);
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => toggleSub(expandedPill, sub)}
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    isSubSelected
                      ? "bg-accent-green/20 border border-accent-green/40 text-foreground"
                      : "border border-border text-muted hover:border-foreground/30 hover:text-foreground"
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected pills list — those with sub-pills first, then simple ones */}
      {(() => {
        const selectedItems = selected.filter((s) => s !== "Other" && s !== expandedPill);
        // Sort: items with sub-selections first
        const withSubs = selectedItems.filter((s) => (subSelections?.[s] ?? []).length > 0 || (subOptions && subOptions[s]));
        const withoutSubs = selectedItems.filter((s) => !((subSelections?.[s] ?? []).length > 0 || (subOptions && subOptions[s])));
        const sorted = [...withSubs, ...withoutSubs];
        if (sorted.length === 0) return null;
        return (
          <div className="space-y-1.5">
            {sorted.map((item) => {
              const subs = subSelections?.[item] ?? [];
              const hasSubs = subOptions && subOptions[item];
              return (
                <div key={item} className="flex gap-2">
                  <span className="shrink-0 rounded-full bg-foreground px-3 py-1 text-sm text-surface self-start mt-0.5">{item}</span>
                  <div className="flex flex-1 flex-wrap items-center gap-1.5">
                    {subs.map((sub) => (
                      <span key={sub} className="rounded-full bg-accent-green/15 border border-accent-green/30 px-2 py-0.5 text-[11px] text-foreground">
                        {sub}
                      </span>
                    ))}
                    {hasSubs && (
                      <button
                        type="button"
                        onClick={() => setExpandedPill(item)}
                        className="text-[11px] text-muted hover:text-foreground"
                      >
                        {subs.length > 0 ? "edit" : "+ details"}
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(item)}
                    className="shrink-0 self-start mt-1 text-muted hover:text-red-500"
                    title="Remove"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Unselected pills — available to pick */}
      {(() => {
        const unselected = options.filter((o) => !selected.includes(o) && o !== expandedPill);
        if (unselected.length === 0 && isOtherSelected) return null;
        return (
          <div className="flex flex-wrap gap-1.5">
            {unselected.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggle(option)}
                className="rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                {option}
              </button>
            ))}
            {!isOtherSelected && (
              <button
                type="button"
                onClick={() => toggle("Other")}
                className="rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                Other
              </button>
            )}
          </div>
        );
      })()}

      {/* Other text input */}
      {isOtherSelected && (
        <input
          type="text"
          value={otherValue}
          onChange={(e) => onOtherChange(e.target.value)}
          placeholder="Specify other..."
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-accent-green focus:outline-none"
        />
      )}
    </div>
  );
}

/* ── Parse comma-separated pills string into array + other + sub-selections ── */
function parsePills(value: string, knownOptions: string[], subOptionsMap?: Record<string, string[]>): { selected: string[]; other: string; subSelections: Record<string, string[]> } {
  if (!value) return { selected: [], other: "", subSelections: {} };
  // Split on commas but respect "Parent: sub1, sub2" pattern
  // Format: "Pill1, Parent: sub1, sub2, Pill2" — we need to parse parent:subs groups
  const subSelections: Record<string, string[]> = {};
  const selected: string[] = [];
  const others: string[] = [];

  // First pass: find "Parent: sub1, sub2" patterns
  let remaining = value;
  if (subOptionsMap) {
    // Sort parent keys by length descending to match longest first
    const parentKeys = Object.keys(subOptionsMap).sort((a, b) => b.length - a.length);
    for (const parent of parentKeys) {
      const regex = new RegExp(`${parent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*([^,]+(,\\s*[^,]+)*)`, 'g');
      const match = regex.exec(remaining);
      if (match) {
        const subsStr = match[1];
        const subs = subsStr.split(",").map((s) => s.trim()).filter((s) => subOptionsMap[parent].includes(s));
        if (subs.length > 0) {
          subSelections[parent] = subs;
        }
        if (!selected.includes(parent)) selected.push(parent);
        // Remove the matched portion from remaining
        remaining = remaining.replace(match[0], "").replace(/,\s*,/g, ",").replace(/^,\s*|,\s*$/g, "");
      }
    }
  }

  // Second pass: parse remaining items
  const items = remaining.split(",").map((s) => s.trim()).filter(Boolean);
  for (const item of items) {
    if (knownOptions.includes(item)) {
      if (!selected.includes(item)) selected.push(item);
    } else if (item) {
      others.push(item);
    }
  }
  if (others.length > 0) {
    selected.push("Other");
  }
  return { selected, other: others.join(", "), subSelections };
}

function pillsToString(selected: string[], otherValue: string, subSelections?: Record<string, string[]>): string {
  const items: string[] = [];
  for (const s of selected) {
    if (s === "Other") continue;
    const subs = subSelections?.[s];
    if (subs && subs.length > 0) {
      items.push(`${s}: ${subs.join(", ")}`);
    } else {
      items.push(s);
    }
  }
  if (otherValue.trim()) {
    items.push(otherValue.trim());
  }
  return items.join(", ");
}

/* ── Accordion Section Component ── */
function AccordionSection({ id, title, subtitle, isOpen, onToggle, onEdit, children }: {
  id: string;
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-background/50"
      >
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          {subtitle && !isOpen && <p className="mt-0.5 text-sm text-muted truncate">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2 ml-3">
          {onEdit && isOpen && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onEdit(); } }}
              className="text-xs text-muted hover:text-foreground"
            >
              Edit
            </span>
          )}
          <svg
            className={`h-5 w-5 text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="border-t border-border px-5 pb-5 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "1";
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Personal info state
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Endo state
  const [diagnosisStatus, setDiagnosisStatus] = useState<"" | "diagnosed" | "suspected" | "no">("");
  const [firstSymptomYear, setFirstSymptomYear] = useState("");
  const [diagnosisYear, setDiagnosisYear] = useState("");
  const [endoStage, setEndoStage] = useState("");
  const [hormonalTreatment, setHormonalTreatment] = useState("");
  const [hormonalBrand, setHormonalBrand] = useState("");
  const [hormonalTreatmentStartDate, setHormonalTreatmentStartDate] = useState("");
  const [treatmentPlanSelected, setTreatmentPlanSelected] = useState<string[]>([]);
  const [treatmentPlanOther, setTreatmentPlanOther] = useState("");
  const [supportingSelected, setSupportingSelected] = useState<string[]>([]);
  const [supportingOther, setSupportingOther] = useState("");
  const [supportingSubSelections, setSupportingSubSelections] = useState<Record<string, string[]>>({});
  const [healthcareProviders, setHealthcareProviders] = useState<Provider[]>([]);
  const [treatmentGoals, setTreatmentGoals] = useState<string[]>([]);

  // Medical events state (stored in localStorage until DB column is added)
  const [medicalEvents, setMedicalEvents] = useState<MedicalEvent[]>([]);

  // Accordion state (multi-open)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  // Locked (saved/view) states per section
  const [personalLocked, setPersonalLocked] = useState(false);
  const [medicalLocked, setMedicalLocked] = useState(false);
  const [treatmentLocked, setTreatmentLocked] = useState(false);
  const [providersLocked, setProvidersLocked] = useState(false);

  // Goals: other text input
  const [goalOther, setGoalOther] = useState("");
  const [goalSubSelections, setGoalSubSelections] = useState<Record<string, string[]>>({});

  // Toast
  const [savedToast, setSavedToast] = useState(false);

  function showSavedToast() {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  }

  // Save / error
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingMedical, setSavingMedical] = useState(false);
  const [savingTreatment, setSavingTreatment] = useState(false);
  const [savingProviders, setSavingProviders] = useState(false);
  const [error, setError] = useState("");

  // Letter state
  const [storyContent, setStoryContent] = useState("");
  const [storyDraft, setStoryDraft] = useState("");
  const [storySaving, setStorySaving] = useState(false);
  const [writingLetter, setWritingLetter] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/login");
        return;
      }

      const uid = data.user.id;
      setUserId(uid);
      setEmail(data.user.email ?? "");

      // Load profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();

      if (profile) {
        setName(profile.name ?? "");
        setDateOfBirth(profile.date_of_birth ?? "");
        setMobileNumber(profile.mobile_number ?? "");
        setCountry(profile.country ?? "");
        setFirstSymptomYear(extractYear(profile.first_symptom_date ?? ""));
        setDiagnosisYear(extractYear(profile.diagnosis_date ?? ""));
        setEndoStage(profile.endo_stage ?? "");

        // Infer diagnosis status from existing data
        if (profile.diagnosis_date || profile.endo_stage) {
          setDiagnosisStatus("diagnosed");
        } else if (profile.first_symptom_date) {
          setDiagnosisStatus("suspected");
        }

        // Parse hormonal treatment: may be "Category:Brand"
        const rawHormonal = profile.hormonal_treatment ?? "";
        if (rawHormonal.includes(":")) {
          const [cat, brand] = rawHormonal.split(":");
          setHormonalTreatment(cat);
          setHormonalBrand(brand);
        } else {
          setHormonalTreatment(rawHormonal);
          setHormonalBrand("");
        }

        setHormonalTreatmentStartDate(profile.hormonal_treatment_start_date ?? "");

        // Parse treatment plan pills
        const tp = parsePills(profile.treatment_plan ?? "", MEDICAL_TREATMENT_OPTIONS);
        setTreatmentPlanSelected(tp.selected);
        setTreatmentPlanOther(tp.other);

        // Parse supporting treatment pills (with sub-options)
        const st = parsePills(profile.supporting_treatment ?? "", SUPPORTING_TREATMENT_OPTIONS, SUPPORTING_SUB_OPTIONS);
        setSupportingSelected(st.selected);
        setSupportingOther(st.other);
        setSupportingSubSelections(st.subSelections);

        setHealthcareProviders(profile.healthcare_providers ?? []);
        setProvidersLocked((profile.healthcare_providers ?? []).length > 0);

        // Initialize locked states based on existing data
        if (profile.name || profile.date_of_birth || profile.country) {
          setPersonalLocked(true);
        }
        if (profile.first_symptom_date || profile.diagnosis_date || profile.endo_stage) {
          setMedicalLocked(true);
        }
        if (profile.hormonal_treatment || profile.treatment_plan || profile.supporting_treatment || (profile.treatment_goals ?? []).length > 0) {
          setTreatmentLocked(true);
        }

        // Parse goals (with sub-selections)
        const goals = profile.treatment_goals ?? [];
        const knownGoals: string[] = [];
        const otherGoals: string[] = [];
        const parsedGoalSubs: Record<string, string[]> = {};
        for (const g of goals) {
          // Check for "Parent: sub1, sub2" format
          const colonIdx = g.indexOf(":");
          if (colonIdx > 0) {
            const parent = g.substring(0, colonIdx).trim();
            if (GOAL_OPTIONS.includes(parent) && GOAL_SUB_OPTIONS[parent]) {
              const subs = g.substring(colonIdx + 1).split(",").map((s: string) => s.trim()).filter((s: string) => GOAL_SUB_OPTIONS[parent].includes(s));
              if (subs.length > 0) {
                parsedGoalSubs[parent] = subs;
              }
              if (!knownGoals.includes(parent)) knownGoals.push(parent);
              continue;
            }
          }
          if (GOAL_OPTIONS.includes(g)) {
            knownGoals.push(g);
          } else if (g.trim()) {
            otherGoals.push(g);
          }
        }
        setTreatmentGoals([...knownGoals, ...otherGoals]);
        setGoalSubSelections(parsedGoalSubs);
        if (otherGoals.length > 0) {
          setGoalOther(otherGoals.join(", "));
        }
      }

      // Load medical events from localStorage
      // TODO: Migrate to DB column `medical_events` (jsonb) — needs Supabase migration
      try {
        const stored = localStorage.getItem(`medical_events_${uid}`);
        if (stored) setMedicalEvents(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }

      // Open first section if welcome flow or no profile data
      const hasData = profile && (profile.name || profile.country || profile.diagnosis_date);
      if (isWelcome || !hasData) {
        setOpenSections(new Set(["personal"]));
      }

      // Load story
      const { data: story } = await supabase
        .from("endo_stories")
        .select("content")
        .eq("user_id", uid)
        .maybeSingle();

      if (story && story.content) {
        setStoryContent(story.content);
      }

      setLoading(false);
    }

    init();
  }, [router, isWelcome]);

  // ── Generate PDF preview when letter or name changes ──
  useEffect(() => {
    if (!loading && storyContent) {
      generatePdfPreview(storyContent);
    }
    return () => {
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyContent, name, loading]);

  // ── Toggle accordion section (multi-open) ──
  function toggleSection(id: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // ── Avatar upload ──
  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploading(true);
    setError("");

    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    const url = `${urlData.publicUrl}?t=${Date.now()}`;
    setAvatarUrl(url);

    await supabase
      .from("profiles")
      .upsert({ id: userId, avatar_url: url, updated_at: new Date().toISOString() });

    setUploading(false);
  }

  // ── Save personal info ──
  async function handleSavePersonal(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSavingPersonal(true);

    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: userId,
      name: name || null,
      date_of_birth: dateOfBirth || null,
      mobile_number: mobileNumber || null,
      country: country || null,
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    });

    setSavingPersonal(false);
    if (upsertError) {
      setError(upsertError.message);
    } else {
      setPersonalLocked(true);
      showSavedToast();
      if (isWelcome) {
        setOpenSections(new Set(["medical"]));
      }
    }
  }

  // ── Save medical background (year fields, endo stage, medical events) ──
  async function handleSaveMedicalBackground(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSavingMedical(true);

    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: userId,
      first_symptom_date: yearToDate(firstSymptomYear) || null,
      diagnosis_date: yearToDate(diagnosisYear) || null,
      endo_stage: endoStage || null,
      updated_at: new Date().toISOString(),
    });

    // Auto-sort events chronologically (newest first) before saving
    const sorted = [...medicalEvents]
      .filter((e) => e.year || e.type || e.notes)
      .sort((a, b) => {
        const yDiff = Number(b.year || 0) - Number(a.year || 0);
        if (yDiff !== 0) return yDiff;
        return Number(b.month || 0) - Number(a.month || 0);
      });
    setMedicalEvents(sorted);

    // Save medical events to localStorage
    // TODO: Migrate to DB column `medical_events` (jsonb) — needs Supabase migration
    if (userId) {
      localStorage.setItem(`medical_events_${userId}`, JSON.stringify(sorted));
    }

    setSavingMedical(false);
    if (upsertError) {
      setError(upsertError.message);
    } else {
      setMedicalLocked(true);
      showSavedToast();
      if (isWelcome) {
        setOpenSections(new Set(["treatment"]));
      }
    }
  }

  // ── Save treatment plan (hormonal, medical plan pills, supporting pills, goals) ──
  async function handleSaveTreatment(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSavingTreatment(true);

    // Build hormonal treatment string with brand
    let hormonalValue = hormonalTreatment;
    if (hormonalTreatment && hormonalBrand) {
      hormonalValue = `${hormonalTreatment}:${hormonalBrand}`;
    }

    // Build goals: known goals (with sub-selections) + other custom goals
    const knownSelected = treatmentGoals.filter((g) => GOAL_OPTIONS.includes(g));
    const goalsWithSubs = knownSelected.map((g) => {
      const subs = goalSubSelections[g];
      if (subs && subs.length > 0) return `${g}: ${subs.join(", ")}`;
      return g;
    });
    const customGoals = goalOther.split(",").map((s) => s.trim()).filter(Boolean);
    const allGoals = [...goalsWithSubs, ...customGoals];

    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: userId,
      hormonal_treatment: hormonalValue || null,
      hormonal_treatment_start_date: hormonalTreatmentStartDate || null,
      treatment_plan: pillsToString(treatmentPlanSelected, treatmentPlanOther) || null,
      supporting_treatment: pillsToString(supportingSelected, supportingOther, supportingSubSelections) || null,
      treatment_goals: allGoals,
      updated_at: new Date().toISOString(),
    });

    setSavingTreatment(false);
    if (upsertError) {
      setError(upsertError.message);
    } else {
      setTreatmentGoals(allGoals);
      setTreatmentLocked(true);
      showSavedToast();
      if (isWelcome) {
        setOpenSections(new Set(["providers"]));
      }
    }
  }

  // ── Save healthcare providers ──
  async function handleSaveProviders(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSavingProviders(true);

    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: userId,
      healthcare_providers: healthcareProviders,
      updated_at: new Date().toISOString(),
    });

    setSavingProviders(false);
    if (upsertError) {
      setError(upsertError.message);
    } else {
      setProvidersLocked(healthcareProviders.length > 0);
      showSavedToast();
      if (isWelcome) {
        router.push("/dashboard/log?first=1");
      }
    }
  }

  // ── Healthcare providers helpers ──
  function addProvider() {
    setHealthcareProviders([...healthcareProviders, { clinic: "", name: "", contact: "" }]);
  }

  function updateProvider(index: number, field: keyof Provider, value: string) {
    const updated = [...healthcareProviders];
    updated[index] = { ...updated[index], [field]: value };
    setHealthcareProviders(updated);
  }

  function removeProvider(index: number) {
    setHealthcareProviders(healthcareProviders.filter((_, i) => i !== index));
  }

  // ── Medical events helpers ──
  function addMedicalEvent() {
    setMedicalEvents([...medicalEvents, { year: "", month: "", type: "", notes: "" }]);
  }

  function updateMedicalEvent(index: number, field: keyof MedicalEvent, value: string) {
    const updated = [...medicalEvents];
    updated[index] = { ...updated[index], [field]: value };
    setMedicalEvents(updated);
  }

  function removeMedicalEvent(index: number) {
    setMedicalEvents(medicalEvents.filter((_, i) => i !== index));
  }

  function moveMedicalEvent(index: number, direction: "up" | "down") {
    const newEvents = [...medicalEvents];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newEvents.length) return;
    [newEvents[index], newEvents[swapIndex]] = [newEvents[swapIndex], newEvents[index]];
    setMedicalEvents(newEvents);
  }

  // ── Goal helpers ──
  function moveGoal(index: number, direction: "up" | "down") {
    const newGoals = [...treatmentGoals];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newGoals.length) return;
    [newGoals[index], newGoals[swapIndex]] = [newGoals[swapIndex], newGoals[index]];
    setTreatmentGoals(newGoals);
  }

  function removeGoal(index: number) {
    const goal = treatmentGoals[index];
    setTreatmentGoals(treatmentGoals.filter((_, i) => i !== index));
    // If it was a custom goal, also remove from goalOther
    if (!GOAL_OPTIONS.includes(goal)) {
      const others = goalOther.split(",").map((s) => s.trim()).filter((s) => s !== goal);
      setGoalOther(others.join(", "));
    }
  }

  // ── Generate PDF preview ──
  async function generatePdfPreview(content: string) {
    if (!content) {
      setPdfUrl(null);
      return;
    }
    const doc = await buildPdfFromContent(content);
    const blob = doc.output("blob");
    setPdfUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(blob);
    });
  }

  // ── Letter handlers ──
  function handleOpenLetter() {
    setStoryDraft(storyContent);
    setWritingLetter(true);
  }

  async function handleSaveLetter() {
    if (!userId) return;
    setStorySaving(true);
    await supabase.from("endo_stories").upsert(
      { user_id: userId, content: storyDraft, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    setStoryContent(storyDraft);
    setStorySaving(false);
    setWritingLetter(false);
  }

  function handleCancelLetter() {
    setStoryDraft("");
    setWritingLetter(false);
  }

  function sanitizeForPdf(text: string): string {
    // Common unicode replacements
    let s = text
      .replace(/[\u2018\u2019\u201A\u02BC\u0060\u00B4]/g, "'")
      .replace(/[\u201C\u201D\u201E\u00AB\u00BB]/g, '"')
      .replace(/[\u2013\u2014\u2012\u2015]/g, "-")
      .replace(/\u2026/g, "...")
      .replace(/[\u00B7\u2022\u25CF\u25CB\u25AA\u25A0\u2023\u25E6]/g, "-")
      .replace(/\u00A0/g, " ")       // non-breaking space
      .replace(/[\u200B\u200C\u200D\uFEFF]/g, ""); // zero-width chars
    // Replace ALL remaining non-ASCII with nothing
    s = s.replace(/[^\x20-\x7E\n\r\t]/g, "");
    return s;
  }

  async function buildPdfFromContent(content: string) {
    const jsPDF = (await import("jspdf")).default;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const usableWidth = pageWidth - margin * 2;

    function addFooter() {
      doc.setFontSize(9);
      doc.setTextColor(120, 113, 108);
      doc.text("Living with Endo", pageWidth / 2, pageHeight - 12, { align: "center" });
    }

    const safeContent = sanitizeForPdf(content || "(No story written yet.)");
    const safeName = sanitizeForPdf(name);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(44, 40, 37);
    doc.text("My Endo Story", pageWidth / 2, 30, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120, 113, 108);
    const meta = [safeName, new Date().toLocaleDateString()].filter(Boolean).join("  -  ");
    if (meta) doc.text(meta, pageWidth / 2, 38, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(44, 40, 37);

    const lines = doc.splitTextToSize(safeContent, usableWidth);
    let y = 50;

    for (const line of lines) {
      if (y > pageHeight - 25) {
        addFooter();
        doc.addPage();
        y = margin;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(44, 40, 37);
      doc.text(line, margin, y);
      y += 5.5;
    }

    addFooter();
    return doc;
  }

  async function buildPdf() {
    return buildPdfFromContent(storyContent);
  }

  async function handleDownloadPdf() {
    const doc = await buildPdf();
    doc.save("my-endo-story.pdf");
  }

  async function handleEmailPdf() {
    const doc = await buildPdf();
    const blob = doc.output("blob");
    const file = new File([blob], "my-endo-story.pdf", { type: "application/pdf" });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: "My Endo Letter" + (name ? ` \u2014 ${name}` : ""),
        files: [file],
      });
    } else {
      // Fallback: download PDF and open mailto
      doc.save("my-endo-story.pdf");
      window.location.href = `mailto:?subject=${encodeURIComponent("My Endo Letter" + (name ? ` \u2014 ${name}` : ""))}&body=${encodeURIComponent("Please find my letter attached.")}`;
    }
  }

  // ── Computed values ──
  const firstSymptomDate = yearToDate(firstSymptomYear);
  const diagnosisDate = yearToDate(diagnosisYear);
  const ttd = timeToDiagnosis(firstSymptomDate, diagnosisDate);

  // Get selected treatment info for brand dropdown
  const selectedTreatmentInfo = getTreatmentInfo(hormonalTreatment);
  const brandOptions = selectedTreatmentInfo?.examples ?? [];

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  const age = calcAge(dateOfBirth);

  // ── Dynamic subtitles ──
  const personalSubtitle = name
    ? [name, age !== null ? `${age}` : "", country].filter(Boolean).join(" \u00B7 ")
    : undefined;

  const filledEvents = medicalEvents.filter((e) => e.year || e.type);
  const medicalSubtitle = [
    diagnosisStatus === "diagnosed" ? "Diagnosed" : diagnosisStatus === "suspected" ? "Suspected" : "",
    diagnosisYear && diagnosisStatus === "diagnosed" ? `${diagnosisYear}` : "",
    endoStage,
    filledEvents.length > 0 ? `${filledEvents.length} Recorded Medical Event${filledEvents.length === 1 ? "" : "s"}` : "",
  ].filter(Boolean).join(" \u00B7 ") || undefined;

  const activeGoals = treatmentGoals.filter((g) => g.trim());
  const treatmentPillsSummary = treatmentPlanSelected.filter((s) => s !== "Other").slice(0, 2);
  const supportingSummary = supportingSelected.filter((s) => s !== "Other").slice(0, 2);
  const treatmentSubtitle = [
    hormonalTreatment || "",
    treatmentPillsSummary.length > 0 ? treatmentPillsSummary.join(", ") : "",
    supportingSummary.length > 0 ? supportingSummary.join(", ") : "",
    activeGoals.length > 0 ? `${activeGoals.length} goal${activeGoals.length === 1 ? "" : "s"}` : "",
  ].filter(Boolean).join(" \u00B7 ") || undefined;

  const providersSubtitle = healthcareProviders.length > 0
    ? `${healthcareProviders.length} provider${healthcareProviders.length === 1 ? "" : "s"}`
    : undefined;

  const letterSubtitle = storyContent ? "Written" : "Not started";

  return (
    <div className="min-h-screen bg-background py-10 md:py-16 px-4 md:px-6">
      {/* Saved toast */}
      {savedToast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-[fadeIn_0.2s_ease] flex items-center gap-2 rounded-full bg-accent-green px-6 py-3 text-sm font-medium text-white shadow-lg">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Your changes have been saved
        </div>
      )}
      <div className="mx-auto w-full max-w-lg space-y-4">
        <div>
          <p className="section-label">Account</p>
          <h1 className="font-serif text-3xl font-light text-foreground">
            My Profile
          </h1>
        </div>

        {isWelcome && (
          <div className="rounded-xl border border-accent-green bg-accent-green/10 px-4 py-3 text-center text-sm text-foreground">
            <p className="font-medium">Welcome! Let&apos;s set up your profile first.</p>
            <p className="mt-1 text-muted">Fill in your details below, then head to the dashboard to log your first entry.</p>
          </div>
        )}

        {/* ── Large Photo (top, centered) ── */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative h-36 w-36 overflow-hidden rounded-full border-2 border-border bg-background">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-3xl font-semibold text-muted">
                {name ? name[0].toUpperCase() : "?"}
              </span>
            )}
          </div>
          {name && (
            <p className="font-serif text-xl font-semibold text-foreground">{name}</p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-sm text-muted hover:text-foreground disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Change photo"}
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-2.5 text-center text-sm text-red-700">{error}</div>
        )}

        {/* ── 1. Personal Information ── */}
        <AccordionSection
          id="personal"
          title="Personal Information"
          subtitle={personalSubtitle}
          isOpen={openSections.has("personal")}
          onToggle={() => toggleSection("personal")}
          onEdit={personalLocked ? () => setPersonalLocked(false) : undefined}
        >
          {personalLocked ? (
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Name</p>
                <p className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">{name || <span className="text-muted">Not set</span>}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Date of birth</p>
                <p className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">
                  {dateOfBirth ? `${formatDate(dateOfBirth)}${age !== null ? ` (${age} years old)` : ""}` : <span className="text-muted">Not set</span>}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Email</p>
                <p className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">{email}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Phone number</p>
                <p className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">{mobileNumber ? formatPhoneDisplay(mobileNumber) : <span className="text-muted">Not set</span>}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Location</p>
                <p className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">{country || <span className="text-muted">Not set</span>}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSavePersonal} className="space-y-3">
              <div>
                <label htmlFor="name" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent-green focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="date-of-birth" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Date of birth</label>
                <input
                  id="date-of-birth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent-green focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Email</label>
                <p className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">{email}</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Phone number</label>
                <PhoneInput value={mobileNumber} onChange={setMobileNumber} />
              </div>
              <div>
                <label htmlFor="location" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Location</label>
                <LocationAutocomplete value={country} onChange={setCountry} />
              </div>
              <button
                type="submit"
                disabled={savingPersonal}
                className="w-full rounded-full bg-foreground py-2 font-medium text-surface transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
              >
                {savingPersonal ? "Saving..." : "Save"}
              </button>
            </form>
          )}
        </AccordionSection>

        {/* ── 2. Medical Background ── */}
        <AccordionSection
          id="medical"
          title="Medical Background"
          subtitle={medicalSubtitle}
          isOpen={openSections.has("medical")}
          onToggle={() => toggleSection("medical")}
          onEdit={medicalLocked ? () => setMedicalLocked(false) : undefined}
        >
          {medicalLocked ? (
            <div className="space-y-3">
              {/* Diagnosis status */}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Diagnosis status</p>
                <p className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">
                  {diagnosisStatus === "diagnosed" ? "Diagnosed with endometriosis" :
                   diagnosisStatus === "suspected" ? "Suspected endometriosis (not yet diagnosed)" :
                   diagnosisStatus === "no" ? "Not diagnosed" :
                   <span className="text-muted">Not set</span>}
                </p>
              </div>
              {/* Years + time to diagnosis side by side */}
              {(firstSymptomYear || (diagnosisYear && diagnosisStatus === "diagnosed")) && (
                <div className="flex gap-3">
                  {/* Left: year fields stacked */}
                  <div className="flex-1 space-y-3">
                    {firstSymptomYear && (
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Year symptoms started</p>
                        <p className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">{firstSymptomYear}</p>
                      </div>
                    )}
                    {diagnosisYear && diagnosisStatus === "diagnosed" && (
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Year of diagnosis</p>
                        <p className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">{diagnosisYear}</p>
                      </div>
                    )}
                  </div>
                  {/* Right: time to diagnosis — aligned with the white boxes, not the labels */}
                  {ttd && diagnosisStatus === "diagnosed" && (
                    <div className="flex-1 mt-5 rounded-xl border-2 border-accent-green bg-accent-green/[0.04] px-4 py-3 flex flex-col justify-center">
                      <p className="flex items-center gap-1.5 text-foreground">
                        <svg className="h-4 w-4 shrink-0 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                        <span className="text-lg font-serif font-semibold">{ttd}</span>
                        <span className="text-sm">to diagnosis</span>
                      </p>
                      {diagnosisEmpathyMessage(firstSymptomYear, diagnosisYear) && (
                        <p className="mt-1.5 text-xs text-muted italic">{diagnosisEmpathyMessage(firstSymptomYear, diagnosisYear)}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* Endo stage */}
              {endoStage && diagnosisStatus === "diagnosed" && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Endo stage</p>
                  <div className="rounded-xl border border-border bg-background px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{ENDO_STAGES.find((s) => s.value === endoStage)?.label || endoStage}</p>
                    {(() => {
                      const stage = ENDO_STAGES.find((s) => s.value === endoStage);
                      if (!stage) return null;
                      return <p className="mt-1 text-xs text-muted">{stage.description}</p>;
                    })()}
                  </div>
                </div>
              )}
              {/* Medical events timeline (locked view) — grouped by year */}
              {(() => {
                const MONTH_NAMES = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                const sortedEvents = [...medicalEvents]
                  .filter((e) => e.year || e.type)
                  .sort((a, b) => {
                    const yDiff = Number(b.year || 0) - Number(a.year || 0);
                    if (yDiff !== 0) return yDiff;
                    return Number(b.month || 0) - Number(a.month || 0);
                  });
                if (sortedEvents.length === 0) return null;
                // Group by year
                const grouped: { year: string; events: MedicalEvent[] }[] = [];
                for (const event of sortedEvents) {
                  const y = event.year || "?";
                  const last = grouped[grouped.length - 1];
                  if (last && last.year === y) {
                    last.events.push(event);
                  } else {
                    grouped.push({ year: y, events: [event] });
                  }
                }
                return (
                  <div className="pt-4 border-t border-border">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Medical Events</p>
                    <div className="relative pl-6">
                      <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border" />
                      <div className="space-y-5">
                        {grouped.map((group) => (
                          <div key={group.year} className="relative">
                            <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-accent-green bg-surface" />
                            <p className="font-serif text-lg font-semibold text-foreground">{group.year}</p>
                            <div className="mt-1.5 space-y-2">
                              {group.events.map((event, j) => (
                                <div key={j}>
                                  {event.month && (
                                    <p className="text-[11px] font-medium text-muted mb-0.5">{MONTH_NAMES[Number(event.month)]}</p>
                                  )}
                                  {event.type && (
                                    <span className="inline-block rounded-full bg-accent-green/15 border border-accent-green/30 px-2 py-0.5 text-[11px] font-medium text-foreground">
                                      {event.type}
                                    </span>
                                  )}
                                  {event.notes && (
                                    <p className="mt-0.5 text-sm text-muted">{event.notes}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <form onSubmit={handleSaveMedicalBackground} className="space-y-3">
              {/* Diagnosis status */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
                  Have you been diagnosed with endometriosis?
                </label>
                <div className="flex flex-wrap gap-2">
                  {([
                    { value: "diagnosed", label: "Yes, diagnosed" },
                    { value: "suspected", label: "Suspected, not yet diagnosed" },
                    { value: "no", label: "No diagnosis" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDiagnosisStatus(opt.value)}
                      className={`rounded-full px-4 py-2 text-sm transition-colors ${
                        diagnosisStatus === opt.value
                          ? "bg-foreground text-surface"
                          : "border border-border text-foreground hover:bg-background"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {diagnosisStatus === "suspected" && (
                  <p className="mt-2 rounded-xl bg-accent-green/[0.06] px-4 py-2.5 text-xs text-muted">
                    You don&apos;t need a diagnosis to track your symptoms. This app is here to help you understand your body and collect data for your healthcare providers.
                  </p>
                )}
                {diagnosisStatus === "no" && (
                  <p className="mt-2 rounded-xl bg-accent-green/[0.06] px-4 py-2.5 text-xs text-muted">
                    Tracking your symptoms can be valuable even without a diagnosis. Your data can help you identify patterns and support conversations with your doctor.
                  </p>
                )}
              </div>

              {/* Year of first symptom — always shown if any status selected */}
              {diagnosisStatus && (
                <div>
                  <label htmlFor="first-symptom-year" className="mb-1 flex items-center text-xs font-semibold uppercase tracking-wider text-muted">
                    Year symptoms started
                    <Tooltip text="You don't need to know exactly, but if you remember when you first started having issues, enter that year." />
                  </label>
                  <input
                    id="first-symptom-year"
                    type="number"
                    min="1950"
                    max={new Date().getFullYear()}
                    value={firstSymptomYear}
                    onChange={(e) => setFirstSymptomYear(e.target.value)}
                    placeholder="e.g. 2015"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent-green focus:outline-none"
                  />
                </div>
              )}

              {/* Diagnosis-specific fields */}
              {diagnosisStatus === "diagnosed" && (
                <>
                  <div>
                    <label htmlFor="diagnosis-year" className="mb-1 flex items-center text-xs font-semibold uppercase tracking-wider text-muted">
                      Year of diagnosis
                      <Tooltip text="The year you received your endometriosis diagnosis." />
                    </label>
                    <input
                      id="diagnosis-year"
                      type="number"
                      min="1950"
                      max={new Date().getFullYear()}
                      value={diagnosisYear}
                      onChange={(e) => setDiagnosisYear(e.target.value)}
                      placeholder="e.g. 2020"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent-green focus:outline-none"
                    />
                  </div>
                  {/* Time to diagnosis highlight box */}
                  {ttd && (
                    <div className="rounded-xl border-2 border-accent-green bg-accent-green/[0.06] px-5 py-4 text-center">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">Time to diagnosis</p>
                      <p className="text-2xl font-serif font-semibold text-foreground">{ttd}</p>
                      {diagnosisEmpathyMessage(firstSymptomYear, diagnosisYear) && (
                        <p className="mt-2 text-sm text-muted italic">{diagnosisEmpathyMessage(firstSymptomYear, diagnosisYear)}</p>
                      )}
                    </div>
                  )}
                  <div>
                    <label htmlFor="endo-stage" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Endo stage</label>
                    <select
                      id="endo-stage"
                      value={endoStage}
                      onChange={(e) => setEndoStage(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent-green focus:outline-none"
                    >
                      <option value="">Select...</option>
                      {ENDO_STAGES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    {endoStage && (() => {
                      const stage = ENDO_STAGES.find((s) => s.value === endoStage);
                      if (!stage) return null;
                      return (
                        <p className="mt-2 rounded-xl bg-accent-green/[0.04] border border-accent-green/20 px-4 py-2.5 text-xs text-muted">
                          {stage.description}
                        </p>
                      );
                    })()}
                  </div>
                </>
              )}

              {/* Medical Events Timeline (edit mode) */}
              <div className="pt-6 border-t border-border mt-6">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">Medical Events</label>
                <p className="mb-3 text-sm text-muted">Track important medical events in your endo journey.</p>

                {medicalEvents.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {medicalEvents.map((event, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="number"
                              min="1950"
                              max={new Date().getFullYear()}
                              value={event.year}
                              onChange={(e) => updateMedicalEvent(i, "year", e.target.value)}
                              placeholder="Year"
                              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-accent-green focus:outline-none"
                            />
                            <select
                              value={event.month}
                              onChange={(e) => updateMedicalEvent(i, "month", e.target.value)}
                              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-accent-green focus:outline-none"
                            >
                              <option value="">Month (optional)</option>
                              {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, idx) => (
                                <option key={m} value={String(idx + 1)}>{m}</option>
                              ))}
                            </select>
                            <select
                              value={event.type}
                              onChange={(e) => updateMedicalEvent(i, "type", e.target.value)}
                              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-accent-green focus:outline-none"
                            >
                              <option value="">Type...</option>
                              {MEDICAL_EVENT_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                          <input
                            type="text"
                            value={event.notes}
                            onChange={(e) => updateMedicalEvent(i, "notes", e.target.value)}
                            placeholder="Short description (optional)"
                            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-accent-green focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMedicalEvent(i)}
                          className="mt-2 shrink-0 rounded p-1 text-muted hover:text-red-600"
                          title="Remove"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={addMedicalEvent}
                  className="text-sm text-accent-green hover:underline"
                >
                  + Add event
                </button>
              </div>

              <button
                type="submit"
                disabled={savingMedical}
                className="w-full rounded-full bg-foreground py-2 font-medium text-surface transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
              >
                {savingMedical ? "Saving..." : "Save"}
              </button>
            </form>
          )}
        </AccordionSection>

        {/* ── 3. Treatment Plan ── */}
        <AccordionSection
          id="treatment"
          title="Treatment Plan"
          subtitle={treatmentSubtitle}
          isOpen={openSections.has("treatment")}
          onToggle={() => toggleSection("treatment")}
          onEdit={treatmentLocked ? () => setTreatmentLocked(false) : undefined}
        >
          {treatmentLocked ? (
            <div className="space-y-4">
              {/* Hormonal Treatment (locked) */}
              {hormonalTreatment && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Hormonal Treatment</p>
                  <div className="rounded-xl border-2 border-accent-green bg-accent-green/[0.06] px-5 py-4">
                    <p className="text-base font-medium text-foreground">
                      {hormonalTreatment}{hormonalBrand && hormonalBrand !== "__other__" ? ` \u00B7 ${hormonalBrand}` : ""}
                    </p>
                    {hormonalTreatmentStartDate && (
                      <p className="mt-1 text-sm text-muted">Started {formatDate(hormonalTreatmentStartDate)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Medical Treatment Plan (locked) */}
              {(treatmentPlanSelected.filter((s) => s !== "Other").length > 0 || treatmentPlanOther) && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Medical Treatment Plan</p>
                  <div className="flex flex-wrap gap-1.5">
                    {treatmentPlanSelected.filter((s) => s !== "Other").map((item) => (
                      <span key={item} className="rounded-full bg-foreground px-3 py-1.5 text-sm text-surface">
                        {item}
                      </span>
                    ))}
                    {treatmentPlanOther && (
                      <span className="rounded-full bg-foreground px-3 py-1.5 text-sm text-surface">
                        {treatmentPlanOther}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Supporting Treatment (locked) */}
              {(supportingSelected.filter((s) => s !== "Other").length > 0 || supportingOther) && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Supporting Treatment</p>
                  <div className="space-y-1.5">
                    {supportingSelected.filter((s) => s !== "Other").map((item) => {
                      const subs = supportingSubSelections[item];
                      return (
                        <div key={item} className="text-sm">
                          <span className="font-medium text-foreground">{item}</span>
                          {subs && subs.length > 0 && (
                            <span className="text-muted"> &mdash; {subs.join(", ")}</span>
                          )}
                        </div>
                      );
                    })}
                    {supportingOther && (
                      <div className="text-sm">
                        <span className="font-medium text-foreground">{supportingOther}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Goals (locked) */}
              {activeGoals.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Goals &amp; Next Steps</p>
                  <ol className="space-y-1">
                    {activeGoals.map((goal, i) => {
                      // Check if goal has sub-selections encoded as "Parent: sub1, sub2"
                      const colonIdx = goal.indexOf(":");
                      let parent = goal;
                      let subsText = "";
                      if (colonIdx > 0) {
                        parent = goal.substring(0, colonIdx).trim();
                        subsText = goal.substring(colonIdx + 1).trim();
                      }
                      return (
                        <li key={`${goal}-${i}`} className="flex items-baseline gap-2 text-sm">
                          <span className="shrink-0 font-serif text-base font-semibold text-accent-green">{i + 1}.</span>
                          <span>
                            <span className="font-medium text-foreground">{parent}</span>
                            {subsText && <span className="text-muted"> &mdash; {subsText}</span>}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}

            </div>
          ) : (
            <form onSubmit={handleSaveTreatment} className="space-y-3">
              {/* Hormonal Treatment */}
              <div>
                <label htmlFor="hormonal-treatment" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Hormonal Treatment</label>
                <select
                  id="hormonal-treatment"
                  value={hormonalTreatment}
                  onChange={(e) => {
                    setHormonalTreatment(e.target.value);
                    setHormonalBrand("");
                    if (!e.target.value) setHormonalTreatmentStartDate("");
                  }}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent-green focus:outline-none"
                >
                  <option value="">None / not currently on treatment</option>
                  {hormonalTreatments.filter(t => t.value !== "Other hormonal treatment").map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                  <option value="Other hormonal treatment">Other hormonal treatment</option>
                </select>

                {/* Step 2: Brand selector */}
                {hormonalTreatment && (
                  <div className="mt-3">
                    <label htmlFor="hormonal-brand" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Specific Brand</label>
                    {brandOptions.length > 0 ? (
                      <select
                        id="hormonal-brand"
                        value={hormonalBrand}
                        onChange={(e) => setHormonalBrand(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent-green focus:outline-none"
                      >
                        <option value="">Select brand...</option>
                        {brandOptions.map((brand) => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                        <option value="__other__">Other</option>
                      </select>
                    ) : (
                      <input
                        id="hormonal-brand"
                        type="text"
                        value={hormonalBrand}
                        onChange={(e) => setHormonalBrand(e.target.value)}
                        placeholder="Enter brand or medication name..."
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent-green focus:outline-none"
                      />
                    )}
                    {hormonalBrand === "__other__" && (
                      <input
                        type="text"
                        value=""
                        onChange={(e) => setHormonalBrand(e.target.value)}
                        placeholder="Enter brand name..."
                        className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent-green focus:outline-none"
                      />
                    )}
                  </div>
                )}

                {hormonalTreatment && (
                  <div className="mt-3">
                    <label htmlFor="treatment-start-date" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Treatment Start Date</label>
                    <input
                      id="treatment-start-date"
                      type="date"
                      value={hormonalTreatmentStartDate}
                      onChange={(e) => setHormonalTreatmentStartDate(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent-green focus:outline-none"
                    />
                  </div>
                )}
                {(() => {
                  const info = getTreatmentInfo(hormonalTreatment);
                  if (!info || info.commonSideEffects.length === 0) return null;
                  return (
                    <div className="mt-3 rounded-xl border border-accent-green/20 bg-accent-green/[0.04] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Known Side Effects</p>
                      <p className="text-xs text-muted mb-2">{info.description}</p>
                      <ul className="space-y-0.5 text-xs text-muted">
                        {info.commonSideEffects.map((se) => (
                          <li key={se} className="flex items-start gap-1.5">
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-accent-green" />
                            {se}
                          </li>
                        ))}
                      </ul>
                      {info.cycleInfo && (
                        <p className="mt-2 text-xs text-accent-green/80">{info.cycleInfo}</p>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Medical Treatment Plan - pills */}
              <div className="pt-6 border-t border-border mt-6">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">Medical Treatment Plan</label>
                <CollapsiblePillSelector
                  options={MEDICAL_TREATMENT_OPTIONS}
                  selected={treatmentPlanSelected}
                  onChange={setTreatmentPlanSelected}
                  otherValue={treatmentPlanOther}
                  onOtherChange={setTreatmentPlanOther}
                />
              </div>

              {/* Supporting Treatment - pills */}
              <div className="pt-6 border-t border-border mt-6">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">Supporting Treatment</label>
                <CollapsiblePillSelector
                  options={SUPPORTING_TREATMENT_OPTIONS}
                  selected={supportingSelected}
                  onChange={setSupportingSelected}
                  otherValue={supportingOther}
                  onOtherChange={setSupportingOther}
                  subOptions={SUPPORTING_SUB_OPTIONS}
                  subSelections={supportingSubSelections}
                  onSubSelectionsChange={setSupportingSubSelections}
                />
              </div>

              {/* Personal Goals & Next Steps */}
              <div className="pt-6 border-t border-border mt-6">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">Personal Goals & Next Steps</label>
                <p className="mb-2 text-sm text-muted">Select your priorities:</p>
                <CollapsiblePillSelector
                  options={GOAL_OPTIONS}
                  selected={treatmentGoals.filter((g) => GOAL_OPTIONS.includes(g))}
                  onChange={(selected) => {
                    // Keep custom goals, update known goals
                    const custom = treatmentGoals.filter((g) => !GOAL_OPTIONS.includes(g));
                    setTreatmentGoals([...selected, ...custom]);
                  }}
                  otherValue={goalOther}
                  onOtherChange={setGoalOther}
                  subOptions={GOAL_SUB_OPTIONS}
                  subSelections={goalSubSelections}
                  onSubSelectionsChange={setGoalSubSelections}
                />

                {/* Your priorities list with reorder */}
                {treatmentGoals.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Your priorities</p>
                    <div className="space-y-1.5">
                      {treatmentGoals.map((goal, i) => {
                        const subs = goalSubSelections[goal];
                        const displayLabel = subs && subs.length > 0 ? `${goal}: ${subs.join(", ")}` : goal;
                        return (
                          <div key={`${goal}-${i}`} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                            <span className="flex-1 text-sm text-foreground">{displayLabel}</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => moveGoal(i, "up")}
                                disabled={i === 0}
                                className="rounded p-0.5 text-muted hover:text-foreground disabled:opacity-30"
                                title="Move up"
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 4l4 4H4l4-4z" fill="currentColor"/></svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => moveGoal(i, "down")}
                                disabled={i === treatmentGoals.length - 1}
                                className="rounded p-0.5 text-muted hover:text-foreground disabled:opacity-30"
                                title="Move down"
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 12l4-4H4l4 4z" fill="currentColor"/></svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => removeGoal(i)}
                                className="rounded p-0.5 text-muted hover:text-red-600"
                                title="Remove"
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={savingTreatment}
                className="w-full rounded-full bg-foreground py-2 font-medium text-surface transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
              >
                {savingTreatment ? "Saving..." : "Save"}
              </button>
            </form>
          )}
        </AccordionSection>

        {/* ── 4. Healthcare Providers ── */}
        <AccordionSection
          id="providers"
          title="Healthcare Providers"
          subtitle={providersSubtitle}
          isOpen={openSections.has("providers")}
          onToggle={() => toggleSection("providers")}
          onEdit={providersLocked && healthcareProviders.length > 0 ? () => setProvidersLocked(false) : undefined}
        >
          {providersLocked && healthcareProviders.length > 0 ? (
            <div className="space-y-3">
              {healthcareProviders.map((p, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
                  <svg className="h-8 w-8 shrink-0 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  <div>
                    <p className="font-medium text-foreground">{p.clinic || "Unnamed clinic"}</p>
                    {p.name && <p className="text-sm text-foreground mt-0.5">{p.name}</p>}
                    {p.contact && <p className="text-sm text-muted mt-0.5">{p.contact}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSaveProviders} className="space-y-3">
              <div className="space-y-2">
                {healthcareProviders.map((p, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="flex-1 space-y-1">
                      <input
                        type="text"
                        value={p.clinic}
                        onChange={(e) => updateProvider(i, "clinic", e.target.value)}
                        placeholder="Name of clinic"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-accent-green focus:outline-none"
                      />
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => updateProvider(i, "name", e.target.value)}
                        placeholder="Name of doctor"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-accent-green focus:outline-none"
                      />
                      <input
                        type="text"
                        value={p.contact}
                        onChange={(e) => updateProvider(i, "contact", e.target.value)}
                        placeholder="Contact details"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-accent-green focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProvider(i)}
                      className="mt-1 shrink-0 rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-red-600 hover:border-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addProvider}
                className="text-sm text-accent-green hover:underline"
              >
                + Add provider
              </button>
              <button
                type="submit"
                disabled={savingProviders}
                className="w-full rounded-full bg-foreground py-2 font-medium text-surface transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
              >
                {savingProviders ? "Saving..." : "Save"}
              </button>
            </form>
          )}
        </AccordionSection>

        {/* ── 5. My Endometriosis Journey Letter ── */}
        <AccordionSection
          id="letter"
          title="My Endometriosis Journey Letter"
          subtitle={letterSubtitle}
          isOpen={openSections.has("letter")}
          onToggle={() => toggleSection("letter")}
        >
          {writingLetter ? (
            <div className="space-y-4">
              <textarea
                rows={12}
                value={storyDraft}
                onChange={(e) => setStoryDraft(e.target.value)}
                placeholder="Start writing your story..."
                autoFocus
                className="w-full rounded-xl border border-border bg-background px-4 py-3 font-serif text-foreground text-sm leading-relaxed resize-y focus:border-accent-green focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancelLetter}
                  className="flex-1 rounded-full border border-border py-2 text-sm font-medium text-foreground hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveLetter}
                  disabled={storySaving}
                  className="flex-1 rounded-full bg-foreground py-2 font-medium text-surface transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
                >
                  {storySaving ? "Saving..." : "Save letter"}
                </button>
              </div>
            </div>
          ) : storyContent ? (
            <div className="space-y-4">
              <p className="text-sm text-muted">
                Write a personal letter about your journey. Share it with loved ones or healthcare providers.
              </p>
              <ul className="space-y-1 text-sm text-muted list-disc pl-5">
                <li>When did you first notice something wasn&apos;t right?</li>
                <li>What has your journey to diagnosis looked like?</li>
                <li>What are your symptoms?</li>
                <li>What treatments have you tried and consider trying? How do they feel?</li>
                <li>How has endo affected your daily life?</li>
                <li>What do you wish people understood about living with endometriosis?</li>
                <li>What gives you strength on difficult days?</li>
                <li>Reflections &amp; lessons from your Endometriosis journey</li>
              </ul>

              {/* PDF attachment card */}
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 transition-colors hover:bg-surface"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <path d="M5 2h8l5 5v13a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="#e15759" strokeWidth="1.5" strokeLinejoin="round" />
                      <path d="M13 2v5h5" stroke="#e15759" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <text x="6" y="17" fill="#e15759" fontSize="5.5" fontWeight="bold" fontFamily="Helvetica">PDF</text>
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">my-endo-story.pdf</p>
                    <p className="text-xs text-muted">Tap to preview</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-muted">
                    <path d="M3 8.5V13a1 1 0 001 1h8a1 1 0 001-1V8.5M8 2v8M8 2l3 3M8 2L5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              )}

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleOpenLetter}
                  className="flex-1 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background text-center"
                >
                  Update Letter
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="flex-1 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background text-center"
                >
                  Download as PDF
                </button>
                <button
                  type="button"
                  onClick={handleEmailPdf}
                  className="flex-1 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background text-center"
                >
                  Send as Attachment
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted">
                Write a personal letter about your journey. Share it with loved ones or healthcare providers.
              </p>
              <button
                type="button"
                onClick={handleOpenLetter}
                className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-surface transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                Write a letter about your Endometriosis journey
              </button>
              <ul className="space-y-1 text-left text-sm text-muted list-disc pl-5 pt-1">
                <li>When did you first notice something wasn&apos;t right?</li>
                <li>What has your journey to diagnosis looked like?</li>
                <li>What are your symptoms?</li>
                <li>What treatments have you tried and consider trying? How do they feel?</li>
                <li>How has endo affected your daily life?</li>
                <li>What do you wish people understood about living with endometriosis?</li>
                <li>What gives you strength on difficult days?</li>
                <li>Reflections &amp; lessons from your Endometriosis journey</li>
              </ul>
            </div>
          )}
        </AccordionSection>

      </div>
    </div>
  );
}

/* ── Reusable view-mode row ── */
function ViewRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
