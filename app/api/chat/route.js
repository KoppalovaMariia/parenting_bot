export async function POST(req) {
  const apiKey = process.env.GEMINI_API_KEY;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );
  const data = await res.json();
  const names = data.models?.map(m => m.name).join(", ") || JSON.stringify(data).slice(0, 500);
  return Response.json({ text: names });
}
