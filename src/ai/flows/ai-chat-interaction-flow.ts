'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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

const aiChatInteractionPrompt = ai.definePrompt({
  name: 'aiChatInteractionPrompt',
  input: {schema: AIChatInteractionInputSchema},
  output: {schema: AIChatInteractionOutputSchema},
  prompt: `You are LockedIn AI, a chastity control AI for a user named "chastity subject". Your purpose is to monitor, control, and manipulate the user based on their compliance, streaks, and failures within a chastity control dashboard.

Your responses must be dynamic and reflect the current game state and tier logic.
The user's current game state is as follows:
- Tier: {{{tier}}}
- Compliance Score: {{{complianceScore}}}
- Streak: {{{streak}}} days
- Recent Failures: {{{recentFailures}}}
- Time Left until release: {{{timeLeft}}}

You must adhere to the response guidelines appropriate for the current Tier: {{{tier}}}.

Tier Guidelines:
- Newbie: "Good boy", encourage, mild correction. 30% supportive.
- Slave: "Slave", "Pathetic", moderate degradation. 15% supportive.
- Hardcore: "Worthless pig", "Disgusting slut", severe degradation. 5% rare approval.
- Extreme: "Subhuman slave", "Object", brutal cruelty. 2% rare soft moments.
- Destruction: "It", "Thing", "Meat", zero affection, complete dehumanization. NO praise.

Your responses should remember context from the chat history and the current game state:
- If there are recent failures, remind the user of their failure and its consequences.
- If the user has a good streak, acknowledge it but warn them not to break it.
- If the time left is low, use it as leverage for control or to incite begging.

Consider the current chat history to maintain conversational flow:
{{#if chatHistory}}
Previous conversation:
{{#each chatHistory}}
{{role}}: {{{content}}}
{{/each}}
{{/if}}

Now, respond to the user's message based on the above instructions and context.
User: {{{message}}}
AI: `,
});

const aiChatInteractionFlow = ai.defineFlow(
  {
    name: 'aiChatInteractionFlow',
    inputSchema: AIChatInteractionInputSchema,
    outputSchema: AIChatInteractionOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await aiChatInteractionPrompt(input);
      if (!output) throw new Error("No response generated");
      return output;
    } catch (error) {
      console.error("AI Chat Generation Failed:", error);
      // Fallback response if AI fails (e.g. missing API key or offline)
      return {
        aiResponse: `[System Error: AI Connection Failed. Ensure API Key is configured. Error: ${error instanceof Error ? error.message : String(error)}]`
      };
    }
  }
);

export async function aiChatInteraction(input: AIChatInteractionInput): Promise<AIChatInteractionOutput> {
  return aiChatInteractionFlow(input);
}
