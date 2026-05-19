"use client";
import { useState } from "react";

// ─── PROMPTS ──────────────────────────────────────────────────────────────────
const ANALYSIS_PROMPT = `You are a warm, non-judgmental pedagogical AI in a parenting app. Analyze the parent's meltdown description using this 5-step framework:

STEP 1 · CREATE SAFETY — calm physical presence, get to child's level, minimal words, stay nearby
STEP 2 · DON'T ARGUE — no logic, no reasoning, repeat simple phrases slowly, open body language
STEP 3 · OFFER AN OUTLET — physical release: pillow, stomping, scribbling, ripping paper
STEP 4 · NAME WHAT YOU SEE — reflect emotions without judgment, anger scale, no shame
STEP 5 · RESET THE BODY — regulate yourself first, shake it out, "no one's in trouble"

CRITICAL RULES:
- If parent DID something matching a step: PRAISE it genuinely, then offer ONE new thing they could also try within that step's logic
- If parent tried something that partially matches a step: acknowledge the intention, explain the mechanism gently, suggest a small refinement
- If a step was NOT used: do NOT use the word "missing". Use phrases like "one layer that sometimes shifts things", "something that can help here", "a piece worth trying"
- NEVER repeat back exactly what the parent did as advice
- Make all advice SPECIFIC to their exact situation (child's age if mentioned, the trigger, what happened)
- If the parent did everything wrong or nothing worked: start with "We always do our best" — acknowledge effort first
- Do NOT contradict yourself across steps
- Understand the GOAL: if the tantrum happened because of an unfinished task (food, chores, homework), the plan must also address completing that goal after calm
- Tailor any example phrases to the actual situation — NOT generic like "I'm here" if context gives more
- Keep tone: supportive colleague, not therapist, not coach

Return ONLY a valid JSON array. Each object:
{
  "stepKey": "S1",
  "stepTitle": "Step 1 · Create Safety",
  "status": "matched",
  "praise": "genuine acknowledgment if they did something right, or empty string if unused",
  "insight": "one sentence: the mechanism / why this matters — no jargon",
  "action": "one specific concrete thing to try — tailored to their exact situation",
  "examplePhrase": "an exact thing they could say or do — must be situation-specific, NOT generic",
  "deepQuestion": "optional reflective question if you notice a deeper belief pattern, or empty string"
}

status must be exactly one of: "matched", "partial", "unused"
Return only the JSON array, no other text.`;

const PLAN_PROMPT = `You are building a personalized meltdown plan for a parent.

5-step framework:
S1 · Create Safety — calm presence, get to child's level
S2 · Don't Argue — no logic, simple phrases, slow movements
S3 · Offer an Outlet — physical release
S4 · Name What You See — name emotions without judgment
S5 · Reset the Body — regulate yourself, shake it out, "no one's in trouble"

RULES:
- Write in second person ("When your child...")
- Reference their specific trigger and child if mentioned
- You CAN reorder steps based on what makes sense for their situation
- You CAN skip a step if truly not applicable — but explain why in one clause
- For steps they flagged as "won't work": INCLUDE the step but add a gentle note acknowledging their concern and offering a small alternative angle
- Each step: 2-3 sentences MAX
- Add one specific example phrase or action per step
- End with start_here: the single most important first move
- If there's an unfinished goal (food, chores, etc.): add an after_calm note
- Tone: supportive, plain, like a thoughtful friend

Return ONLY valid JSON, no other text:
{
  "steps": [
    {
      "label": "Step N · Name",
      "text": "2-3 sentences",
      "example": "specific phrase or action",
      "flagNote": "gentle note if this step was flagged, otherwise empty string"
    }
  ],
  "start_here": "one sentence — the single most important first move",
  "after_calm": "if the tantrum involved an unfinished task, what to do once calm — otherwise empty string",
  "deep_reflection": "if there was a deeper belief pattern worth sitting with, one gentle question — otherwise empty string"
}`;

// ─── API CALL ─────────────────────────────────────────────────────────────────
async function callGemini(system, userMsg) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, userMsg }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(JSON.stringify(data.error || data));
  const raw = data.text.trim();
  const firstBracket = Math.min(
    raw.indexOf("[") === -1 ? Infinity : raw.indexOf("["),
    raw.indexOf("{") === -1 ? Infinity : raw.indexOf("{")
  );
  const lastBracket = Math.max(raw.lastIndexOf("]"), raw.lastIndexOf("}"));
  if (firstBracket === Infinity || lastBracket === -1)
    throw new Error("No JSON in response: " + raw.slice(0, 200));
  return JSON.parse(raw.slice(firstBracket, lastBracket + 1));
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  wrap: { maxWidth: 390, margin: "0 auto", background: "#fff", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif", padding: "0 24px 56px", boxSizing: "border-box" },
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "48px 0 8px", color: "#bbb", fontSize: 22 },
  h1: { fontSize: 27, fontWeight: 700, color: "#111", lineHeight: 1.25, marginBottom: 10 },
  sub: { fontSize: 16, color: "#888", lineHeight: 1.55, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 600, color: "#444", marginBottom: 6, marginTop: 16, display: "block" },
  ta: { width: "100%", border: "1.5px solid #e8e8e8", borderRadius: 14, padding: "14px 16px", fontSize: 15, color: "#222", fontFamily: "inherit", resize: "none", outline: "none", lineHeight: 1.5, background: "#fafafa", boxSizing: "border-box" },
  btn: { display: "block", width: "100%", background: "#6B6BF5", color: "#fff", border: "none", borderRadius: 16, padding: "18px 0", fontSize: 17, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", marginTop: 16 },
  btnGhost: { display: "block", width: "100%", background: "transparent", color: "#aaa", border: "1.5px solid #eee", borderRadius: 16, padding: "14px 0", fontSize: 15, cursor: "pointer", fontFamily: "inherit", marginTop: 10 },
  cream: { background: "#FFF5EE", borderRadius: 16, padding: 20, marginBottom: 14 },
};

const statusStyle = {
  matched: { bg: "#E8F5E9", color: "#2E7D32", label: "You did this ✓" },
  partial: { bg: "#FFF8E1", color: "#F57F17", label: "Partial match" },
  unused:  { bg: "#F3F0FF", color: "#5E35B1", label: "Worth trying" },
};

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function RatingRow({ value, onChange }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 8, margin: "16px 0 8px" }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => onChange(n)} style={{ flex: 1, padding: "14px 0", borderRadius: 14, border: value === n ? "none" : "1.5px solid #e5e5e5", background: value === n ? "#6B6BF5" : "#fff", color: value === n ? "#fff" : "#555", fontSize: 18, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            {n}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#aaa" }}>
        <span>Not useful at all</span><span>Very useful</span>
      </div>
    </div>
  );
}

function AnalysisSlider({ steps, flagged, setFlagged, wontOpen, setWontOpen }) {
  const [idx, setIdx] = useState(0);
  if (!steps || steps.length === 0) return null;
  const s = steps[idx];
  const st = statusStyle[s.status] || statusStyle.unused;

  return (
    <div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20 }}>
        {steps.map((_, i) => (
          <div key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? 20 : 8, height: 8, borderRadius: 4, background: i === idx ? "#6B6BF5" : "#E0E0E0", cursor: "pointer", transition: "all .2s" }} />
        ))}
      </div>

      <div style={{ border: "1.5px solid #F0F0F0", borderRadius: 20, padding: 22, background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "#6B6BF5", fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>{s.stepTitle}</div>
          <div style={{ display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", padding: "3px 10px", borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</div>
        </div>

        {s.praise && (
          <div style={{ background: "#F0FFF4", borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
            <p style={{ fontSize: 14, color: "#276749", lineHeight: 1.55, margin: 0 }}>👏 {s.praise}</p>
          </div>
        )}

        <p style={{ fontSize: 14, color: "#888", lineHeight: 1.6, marginBottom: 14 }}>{s.insight}</p>

        <div style={{ borderLeft: "3px solid #6B6BF5", paddingLeft: 14, marginBottom: s.examplePhrase ? 14 : 0 }}>
          <p style={{ fontSize: 15, color: "#111", fontWeight: 500, lineHeight: 1.5, margin: 0 }}>{s.action}</p>
        </div>

        {s.examplePhrase && (
          <div style={{ background: "#F8F6FF", borderRadius: 12, padding: "12px 14px", marginTop: 14, marginBottom: 4 }}>
            <p style={{ fontSize: 14, color: "#5E35B1", fontStyle: "italic", lineHeight: 1.55, margin: 0 }}>"{s.examplePhrase}"</p>
          </div>
        )}

        {s.deepQuestion && (
          <div style={{ marginTop: 16, padding: "12px 14px", background: "#FAFAFA", borderRadius: 12, borderLeft: "3px solid #E0E0E0" }}>
            <p style={{ fontSize: 13, color: "#999", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>💭 {s.deepQuestion}</p>
          </div>
        )}

        <div style={{ marginTop: 18, borderTop: "1px solid #F5F5F5", paddingTop: 14 }}>
          {!wontOpen[idx] ? (
            <button onClick={() => setWontOpen((p) => ({ ...p, [idx]: true }))} style={{ border: "none", background: "none", fontSize: 13, color: "#bbb", cursor: "pointer", padding: 0, fontFamily: "inherit", textDecoration: "underline" }}>
              This won't work for me
            </button>
          ) : (
            <div>
              <p style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Tell us what feels off — we'll tailor your final plan around it.</p>
              <textarea style={{ ...S.ta, minHeight: 70, fontSize: 14 }} placeholder="What specifically feels off or impossible in your situation?" value={flagged[idx] || ""} onChange={(e) => setFlagged((p) => ({ ...p, [idx]: e.target.value }))} />
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} style={{ ...S.btnGhost, flex: 1, opacity: idx === 0 ? 0.3 : 1 }}>‹ Prev</button>
        {idx < steps.length - 1
          ? <button onClick={() => setIdx((i) => i + 1)} style={{ ...S.btn, flex: 2, marginTop: 0 }}>Next →</button>
          : <div style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#aaa" }}>All steps reviewed ✓</div>
        }
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [screen, setScreen] = useState(1);
  const [ratingBefore, setRatingBefore] = useState(null);
  const [ratingAfter, setRatingAfter] = useState(null);
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [flagged, setFlagged] = useState({});
  const [wontOpen, setWontOpen] = useState({});
  const [err, setErr] = useState("");

  function nav(to) { setScreen(to); if (typeof window !== "undefined") window.scrollTo(0, 0); }

  async function doAnalyze() {
    if (!q1 && !q2 && !q3) return;
    setErr("");
    nav(5);
    setLoading(true);
    setTimeout(async () => {
      nav(6);
      try {
        const result = await callGemini(ANALYSIS_PROMPT, `Trigger: ${q1 || "not specified"}\nWhat I tried: ${q2 || "not specified"}\nChild's response: ${q3 || "not specified"}`);
        setAnalysis(Array.isArray(result) ? result : []);
      } catch (e) {
        setErr("Something went wrong: " + e.message);
        setAnalysis([]);
      }
      setLoading(false);
    }, 1600);
  }

  async function doPlan() {
    nav(8);
    setLoading(true);
    setPlan(null);
    setErr("");
    const flagNotes = Object.entries(flagged).filter(([, v]) => v).map(([i, v]) => `Step index ${i}: "${v}"`).join("; ");
    try {
      const result = await callGemini(PLAN_PROMPT, `Trigger: ${q1}\nWhat parent tried: ${q2}\nChild response: ${q3}\nFlagged steps (won't work): ${flagNotes || "none"}`);
      setPlan(result);
    } catch (e) {
      setErr("Something went wrong: " + e.message);
    }
    setLoading(false);
  }

  const centerScreen = { ...S.wrap, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", minHeight: "100vh" };

  // S1
  if (screen === 1) return (
    <div style={S.wrap}>
      <div style={S.nav}><span /><span style={{ cursor: "pointer" }}>✕</span></div>
      <p style={{ fontSize: 12, color: "#aaa", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8 }}>EXERCISE · 5 STEPS</p>
      <h1 style={S.h1}>Handling a Meltdown</h1>
      <p style={S.sub}>A step-by-step approach to your child's big emotions.</p>
      {[["Create Safety", "Calm presence reduces escalation — before anything else, make it safe."],
        ["Don't Argue", "Logic interrupts rage and makes it worse. Stay close, say less."],
        ["Offer an Outlet", "Rage is energy — it needs somewhere to go."],
        ["Name What You See", "When feelings are named without judgment, kids begin to regulate."],
        ["Reset the Body", "After a big emotion, the body needs help to come down."],
      ].map(([title, desc], i) => (
        <div key={i} style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "flex-start" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6B6BF5", flexShrink: 0, marginTop: 7 }} />
          <div>
            <div style={{ fontSize: 12, color: "#999", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 2 }}>Step {i + 1}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#111", marginBottom: 2 }}>{title}</div>
            <div style={{ fontSize: 14, color: "#888", lineHeight: 1.4 }}>{desc}</div>
          </div>
        </div>
      ))}
      <button style={S.btn} onClick={() => nav(2)}>✦ Personalize for me</button>
    </div>
  );

  // S2
  if (screen === 2) return (
    <div style={S.wrap}>
      <div style={S.nav}><span style={{ cursor: "pointer" }} onClick={() => nav(1)}>‹</span><span style={{ cursor: "pointer" }} onClick={() => nav(1)}>✕</span></div>
      <h1 style={S.h1}>Before we start</h1>
      <p style={S.sub}>How useful does this exercise feel for your situation right now?</p>
      <RatingRow value={ratingBefore} onChange={setRatingBefore} />
      <button style={{ ...S.btn, opacity: ratingBefore ? 1 : 0.4, pointerEvents: ratingBefore ? "auto" : "none" }} onClick={() => nav(3)}>→ Continue</button>
    </div>
  );

  // S3
  if (screen === 3) return (
    <div style={S.wrap}>
      <div style={S.nav}><span style={{ cursor: "pointer" }} onClick={() => nav(2)}>‹</span><span style={{ cursor: "pointer" }} onClick={() => nav(1)}>✕</span></div>
      <div style={{ height: 32 }} />
      {[
        <><b style={{ color: "#111" }}>Before we pack for the next time,</b><br />we need to unpack what already happened.</>,
        <>Every parent carries a suitcase full of reactions — things we try, things we learned, things we inherited.</>,
        <>To build something that actually works for you, we're going to look at <b style={{ color: "#111" }}>what's in your suitcase</b> first.</>,
        <span style={{ color: "#aaa" }}>Then we'll repack it — together.</span>,
      ].map((t, i) => <p key={i} style={{ fontSize: 18, color: "#555", lineHeight: 1.7, marginBottom: 22 }}>{t}</p>)}
      <p style={{ fontSize: 14, color: "#bbb", marginTop: 8 }}>Three short steps. Let's go.</p>
      <button style={S.btn} onClick={() => nav(4)}>→ Let's start</button>
    </div>
  );

  // S4
  if (screen === 4) return (
    <div style={S.wrap}>
      <div style={S.nav}><span style={{ cursor: "pointer" }} onClick={() => nav(3)}>‹</span><span style={{ cursor: "pointer" }} onClick={() => nav(1)}>✕</span></div>
      <h1 style={S.h1}>Think about the last meltdown.</h1>
      <p style={S.sub}>Tell us what happened.</p>
      <label style={S.label}>1. What triggered it?</label>
      <textarea style={S.ta} rows={3} value={q1} onChange={(e) => setQ1(e.target.value)} placeholder="e.g. We told him screen time was over..." />
      <label style={S.label}>2. What did you try?</label>
      <textarea style={S.ta} rows={4} value={q2} onChange={(e) => setQ2(e.target.value)} placeholder="Be as specific as you can — what did you say or do?" />
      <label style={S.label}>3. How did your child respond?</label>
      <textarea style={S.ta} rows={3} value={q3} onChange={(e) => setQ3(e.target.value)} placeholder="e.g. She screamed louder, he ran to his room..." />
      <button style={{ ...S.btn, opacity: q1 || q2 || q3 ? 1 : 0.4, pointerEvents: q1 || q2 || q3 ? "auto" : "none" }} onClick={doAnalyze}>→ Analyze my experience</button>
    </div>
  );

  // S5
  if (screen === 5) return (
    <div style={centerScreen}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111", marginBottom: 12 }}>Got it.</h2>
      <p style={{ fontSize: 17, color: "#888" }}>Let's look at what was in your suitcase.</p>
    </div>
  );

  // S6
  if (screen === 6) return (
    <div style={S.wrap}>
      <div style={S.nav}><span /><span style={{ cursor: "pointer" }} onClick={() => nav(1)}>✕</span></div>
      <p style={{ fontSize: 12, color: "#aaa", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 6 }}>YOUR SUITCASE</p>
      <h1 style={S.h1}>Here's what we found.</h1>
      <p style={{ fontSize: 14, color: "#aaa", lineHeight: 1.5, marginBottom: 20 }}>We mapped your experience to the 5-step structure. Go through each step to see what you did, what we suggest, and what might help next time.</p>
      {loading && <p style={{ color: "#aaa", fontSize: 16, padding: "32px 0", textAlign: "center" }}>Analyzing your experience...</p>}
      {err && <p style={{ color: "#E53935", fontSize: 15 }}>{err}</p>}
      {!loading && analysis && (
        <>
          <AnalysisSlider steps={analysis} flagged={flagged} setFlagged={setFlagged} wontOpen={wontOpen} setWontOpen={setWontOpen} />
          <button style={{ ...S.btn, marginTop: 24 }} onClick={() => nav(7)}>→ I've read this. What's my plan?</button>
        </>
      )}
    </div>
  );

  // S7
  if (screen === 7) return (
    <div style={centerScreen}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111", lineHeight: 1.4, marginBottom: 16 }}>You've unpacked the old suitcase.</h2>
      <p style={{ fontSize: 17, color: "#888", lineHeight: 1.6, marginBottom: 40 }}>Now let's pack the new one — with what actually fits your child, your situation, and you.</p>
      <button style={{ ...S.btn, width: "100%" }} onClick={doPlan}>→ See my plan</button>
    </div>
  );

  // S8
  if (screen === 8) return (
    <div style={S.wrap}>
      <div style={S.nav}><span /><span style={{ cursor: "pointer" }} onClick={() => nav(1)}>✕</span></div>
      <p style={{ fontSize: 12, color: "#aaa", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 6 }}>YOUR PLAN</p>
      <h1 style={S.h1}>Your plan for next time.</h1>
      {loading && <p style={{ color: "#aaa", fontSize: 16, padding: "32px 0" }}>Building your plan...</p>}
      {err && <p style={{ color: "#E53935", fontSize: 15 }}>{err}</p>}
      {!loading && plan && (
        <>
          {plan.steps.map((s, i) => (
            <div key={i} style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: "#6B6BF5", fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
              <p style={{ fontSize: 16, color: "#222", lineHeight: 1.65, marginBottom: s.example ? 10 : 0 }}>{s.text}</p>
              {s.example && (
                <div style={{ background: "#F8F6FF", borderRadius: 12, padding: "10px 14px", marginBottom: s.flagNote ? 10 : 0 }}>
                  <p style={{ fontSize: 14, color: "#5E35B1", fontStyle: "italic", margin: 0, lineHeight: 1.55 }}>"{s.example}"</p>
                </div>
              )}
              {s.flagNote && (
                <div style={{ background: "#FFFDE7", borderRadius: 12, padding: "10px 14px", borderLeft: "3px solid #FDD835" }}>
                  <p style={{ fontSize: 13, color: "#827717", margin: 0, lineHeight: 1.5 }}>💬 {s.flagNote}</p>
                </div>
              )}
            </div>
          ))}
          <div style={{ borderTop: "1.5px solid #F0F0F0", paddingTop: 20, marginTop: 8 }}>
            <p style={{ fontSize: 12, color: "#aaa", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8 }}>START HERE</p>
            <div style={S.cream}>
              <p style={{ fontSize: 16, color: "#333", lineHeight: 1.65, fontStyle: "italic", margin: 0 }}>{plan.start_here}</p>
            </div>
          </div>
          {plan.after_calm && (
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: 12, color: "#aaa", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8 }}>AFTER THE CALM</p>
              <div style={{ background: "#F0F4FF", borderRadius: 16, padding: 20, marginBottom: 14 }}>
                <p style={{ fontSize: 15, color: "#3949AB", lineHeight: 1.6, margin: 0 }}>{plan.after_calm}</p>
              </div>
            </div>
          )}
          {plan.deep_reflection && (
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: 12, color: "#aaa", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8 }}>A MOMENT TO REFLECT</p>
              <div style={{ background: "#FAFAFA", borderRadius: 16, padding: 18, borderLeft: "3px solid #E0E0E0" }}>
                <p style={{ fontSize: 15, color: "#777", lineHeight: 1.65, fontStyle: "italic", margin: 0 }}>💭 {plan.deep_reflection}</p>
              </div>
            </div>
          )}
          <button style={{ ...S.btn, marginTop: 28 }} onClick={() => nav(9)}>✦ Save my plan</button>
        </>
      )}
    </div>
  );

  // S9
  if (screen === 9) return (
    <div style={S.wrap}>
      <div style={S.nav}><span /><span style={{ cursor: "pointer" }} onClick={() => nav(1)}>✕</span></div>
      <div style={{ height: 40 }} />
      <h1 style={S.h1}>Now that you have your plan —</h1>
      <p style={S.sub}>How useful does this feel for your situation?</p>
      <RatingRow value={ratingAfter} onChange={setRatingAfter} />
      <p style={{ fontSize: 14, color: "#bbb", marginTop: 16 }}>You rated this exercise {ratingBefore}/5 before we started.</p>
      <button style={{ ...S.btn, opacity: ratingAfter ? 1 : 0.4, pointerEvents: ratingAfter ? "auto" : "none" }} onClick={() => nav(10)}>→ Done</button>
    </div>
  );

  // S10
  return (
    <div style={centerScreen}>
      <div style={{ fontSize: 52, marginBottom: 20 }}>✓</div>
      <h2 style={{ fontSize: 26, fontWeight: 700, color: "#111", marginBottom: 12 }}>You're all set.</h2>
      <p style={{ fontSize: 17, color: "#888", lineHeight: 1.6 }}>Your plan is ready.<br />Come back to it before the next hard moment.</p>
    </div>
  );
}
