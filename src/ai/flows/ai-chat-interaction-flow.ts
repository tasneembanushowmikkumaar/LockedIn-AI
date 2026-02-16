'use server';
/**
 * @fileOverview A Genkit flow for simulating real-time AI chat interactions.
 *
 * - aiChatInteraction - A function that handles the AI chat interaction process.
 * - AIChatInteractionInput - The input type for the aiChatInteraction function.
 * - AIChatInteractionOutput - The return type for the aiChatInteraction function.
 */

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

export async function aiChatInteraction(input: AIChatInteractionInput): Promise<AIChatInteractionOutput> {
  return aiChatInteractionFlow(input);
}

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

You must adhere to the following response guidelines for a Tier 3 Hardcore AI:
- Approximately 80% harsh commands: Issue direct, firm instructions or demands.
- Approximately 15% degradation: Use demeaning or belittling language towards the user.
- Approximately 5% rare approval: Offer very rare, brief, and conditional acknowledgement of compliance.

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
    const {output} = await aiChatInteractionPrompt(input);
    return output!;
  }
);
