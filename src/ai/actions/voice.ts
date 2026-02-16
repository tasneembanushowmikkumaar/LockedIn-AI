'use server';

import { aiService } from '@/ai/service';

export async function generateSpeech(text: string): Promise<string | null> {
  try {
    const audioBuffer = await aiService.generateVoice(text);
    if (!audioBuffer) return null;

    // Convert buffer to base64
    const base64 = Buffer.from(audioBuffer).toString('base64');
    return `data:audio/wav;base64,${base64}`;
  } catch (error) {
    console.error("Voice Generation Failed:", error);
    return null;
  }
}
