import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { logs, hormonalTreatment, hormonalTreatmentStartDate } = await req.json();

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json(
        { error: "No log data provided" },
        { status: 400 },
      );
    }

    const prompt = `You are a health data analyst for an endometriosis symptom tracker app. Analyze the following symptom log data and provide actionable insights.

The data contains daily logs with these fields (all scored 0-10 unless noted):
- Pain: pelvic_pain, lower_back_pain, leg_pain, chest_pain, shoulder_pain, headache, bowel_pain, urination_pain, intercourse_pain
- Symptoms: bloating, nausea, diarrhea, constipation, fatigue, inflammation, mood
- Lifestyle triggers: stress, inactivity, overexertion, coffee, alcohol, smoking, diet, sleep
- Cycle phase: menstrual, follicular, ovulation, luteal, on_hormonal_treatment (can be null)
- hormonal_treatment_note: free text observations about hormonal treatment side effects or patterns (can be null)
- pill_day: which day of the hormonal treatment pack/cycle this entry was logged on (integer, can be null)
- pill_day_phase: which phase of the pack cycle (e.g., "Active pills", "Placebo pills", "Early active phase") (can be null)
- Notes: free text observations

${hormonalTreatment ? `The user is currently on: ${hormonalTreatment}${hormonalTreatmentStartDate ? `, started on ${hormonalTreatmentStartDate}` : ""}. When analyzing, pay special attention to how symptoms correlate with pill_day and pill_day_phase — for example, many users on progestogen-only pills like Slinda experience increased moodiness in the early active phase (days 1-14).` : "The user is not currently on hormonal treatment."}

Analyze this data for:
1. **Trigger Correlations**: Which lifestyle factors (stress, coffee, alcohol, sleep, diet, etc.) correlate with higher pain levels? Be specific about which triggers affect which symptoms.
2. **Cycle Phase Patterns**: How do symptoms vary across cycle phases? Which phases tend to be worst?
3. **Hormonal Treatment Impact**: How do symptoms relate to the hormonal treatment? Look at hormonal_treatment_note entries for the user's own observations. If treatment start date is available, compare before/after patterns.
4. **Trends**: Are symptoms improving, worsening, or stable over time?
5. **Key Observations**: Any notable patterns the user should be aware of.

Important guidelines:
- Be warm, supportive, and empathetic — this is a person living with a chronic condition
- Use clear, simple language
- Only mention patterns that are actually visible in the data — do not fabricate correlations
- If there isn't enough data to draw conclusions, say so honestly
- Do NOT give medical advice or diagnoses — frame everything as observations from the data
- Keep each section concise (2-4 sentences)

Respond in this exact JSON format:
{
  "triggerCorrelations": "Your analysis of lifestyle trigger correlations...",
  "cyclePatterns": "Your analysis of cycle phase patterns...",
  "hormonalTreatment": "Your analysis of hormonal treatment impact and side effects...",
  "trends": "Your analysis of trends over time...",
  "keyObservations": "Notable patterns and observations...",
  "summary": "A brief 1-2 sentence overall summary"
}

Here is the log data (${logs.length} entries):
${JSON.stringify(logs, null, 0)}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const insights = JSON.parse(jsonMatch[0]);
    return NextResponse.json(insights);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Insights API error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
