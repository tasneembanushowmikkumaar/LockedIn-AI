import { googleAI } from '@genkit-ai/google-genai';
import { genkit } from 'genkit';

export async function checkApiKey() {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    console.error('API Key Missing: Please set GOOGLE_GENAI_API_KEY environment variable.');
    return false;
  }

  try {
    const ai = genkit({
      plugins: [googleAI({ apiKey })],
      model: 'googleai/gemini-2.5-flash',
    });

    const { text } = await ai.generate('Hello');
    console.log('API Key Validated. Response:', text);
    return true;
  } catch (error) {
    console.error('API Key Validation Failed:', error);
    return false;
  }
}
