export {}
const apiKey = process.env.OPENROUTER_API_KEY;

async function listFreeModels() {
  if (!apiKey) return;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const data = await res.json();

    // Filter for free llama models
    const freeModels = data.data
      .filter((m: any) => m.id.includes('free') && m.id.includes('llama'))
      .map((m: any) => m.id);

    console.log("Available Free Llama Models:", freeModels);
  } catch (e) { console.error(e); }
}

listFreeModels();
