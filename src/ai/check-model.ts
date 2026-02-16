const apiKey = process.env.OPENROUTER_API_KEY;

async function checkModels() {
  if (!apiKey) {
    console.error("No API Key");
    return;
  }

  try {
    // List models to confirm ID
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!res.ok) {
      console.error("Failed to list models:", await res.text());
      return;
    }

    const data = await res.json();
    const models = data.data;

    const target1 = "meta-llama/llama-3.1-8b-instruct:free";
    const target2 = "nousresearch/hermes-3-llama-3.1-405b:free";
    const target3 = "nousresearch/hermes-3-llama-3.1-8b"; // The broken one

    console.log(`Checking for '${target1}':`, models.find((m: any) => m.id === target1) ? "FOUND" : "MISSING");
    console.log(`Checking for '${target2}':`, models.find((m: any) => m.id === target2) ? "FOUND" : "MISSING");
    console.log(`Checking for '${target3}':`, models.find((m: any) => m.id === target3) ? "FOUND" : "MISSING");

  } catch (e) {
    console.error(e);
  }
}

checkModels();
