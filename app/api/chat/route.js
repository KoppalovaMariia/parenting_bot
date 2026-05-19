export async function POST(req) {
  const { system, userMsg } = await req.json();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  const prompt = `${system}\n\n---\n\n${userMsg}`;

  const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) return Response.json({ error: data }, { status: res.status });

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return Response.json({ text });
}
