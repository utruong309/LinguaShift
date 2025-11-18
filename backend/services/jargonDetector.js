export async function runJargonDetectionProxy({ text, glossary = [] }) {
  const response = await fetch(`${process.env.ML_SERVICE_URL}/detect-jargon`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, glossary })
  });

  if (!response.ok) {
    throw new Error(`Jargon service error: ${response.statusText}`);
  }

  return response.json();
}