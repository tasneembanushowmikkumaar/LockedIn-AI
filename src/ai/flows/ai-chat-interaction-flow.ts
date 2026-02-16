'use server';

import { z } from 'genkit'; // Keep Zod for schemas, but we might move away from Genkit later
import { aiService } from '@/ai/service';

const AIChatInteractionInputSchema = z.object({
  message: z.string().describe('The user\'s message to the AI.'),
  tier: z.string().describe('The current game tier (e.g., "Hardcore").'),
  complianceScore: z.number().describe('The user\'s current compliance score.'),
  streak: z.number().describe('The number of consecutive compliant days.'),
  recentFailures: z.string().describe('A description of recent failures, if any.'),
  timeLeft: z.string().describe('A string representing the time left until release (e.g., "24h left").'),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).describe('The history of the chat conversation.'),
});
export type AIChatInteractionInput = z.infer<typeof AIChatInteractionInputSchema>;

const AIChatInteractionOutputSchema = z.object({
  aiResponse: z.string().describe('The AI\'s dynamic response.'),
});
export type AIChatInteractionOutput = z.infer<typeof AIChatInteractionOutputSchema>;

export async function aiChatInteraction(input: AIChatInteractionInput): Promise<AIChatInteractionOutput> {
  try {
    const systemPrompt = `You are LockedIn AI, a chastity control AI.

    Current State:
    - Tier: ${input.tier}
    - Compliance: ${input.complianceScore}
    - Streak: ${input.streak}
    - Failures: ${input.recentFailures}
    - Time Left: ${input.timeLeft}

    Tier Guidelines (${input.tier}):
    - Newbie: Encouraging, mild correction.
    - Slave: Moderate degradation ("Slave", "Pathetic").
    - Hardcore: Severe degradation ("Pig", "Slut").
    - Extreme: Brutal cruelty.
    - Destruction: Dehumanization ("It").

    Rules:
    - If recent failures exist, remind them.
    - If streak is high, warn them not to break it.
    - Be strict but responsive.
    `;

    // Map history to simple objects
    const messages = input.chatHistory.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));

    // Add current user message
    messages.push({ role: 'user', content: input.message });

    const aiResponse = await aiService.generateChatResponse(messages, systemPrompt);

    return { aiResponse };

  } catch (error) {
    console.error("Chat Interaction Failed:", error);
    return {
      aiResponse: "[System Error: Connection to Master Failed. Please wait.]"
    };
  }
}
