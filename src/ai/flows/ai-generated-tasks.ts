'use server';
/**
 * @fileOverview A Genkit flow for dynamically generating chastity control tasks.
 *
 * - generateTasks - A function that handles the dynamic task generation process.
 * - GenerateTasksInput - The input type for the generateTasks function.
 * - GenerateTasksOutput - The return type for the generateTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { v4 as uuidv4 } from 'uuid';

const GenerateTasksInputSchema = z.object({
  tier: z.enum(['Hardcore', 'Moderate', 'Light']).describe('The current chastity control tier.'),
  punishmentMode: z.boolean().describe('Whether punishment mode is currently active.'),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).describe('The current time of day.'),
});
export type GenerateTasksInput = z.infer<typeof GenerateTasksInputSchema>;

const TaskCategorySchema = z.enum(['JOI/CEI', 'CBT', 'DENIAL', 'HYGIENE', 'EXERCISE']);

const TaskSchema = z.object({
  id: z.string().uuid().describe('A unique identifier for the task.'),
  description: z.string().describe('The description of the task.'),
  category: TaskCategorySchema.describe('The category of the task (e.g., JOI/CEI, CBT, DENIAL).'),
  status: z.literal('Pending').describe('The initial status of the task.'),
});

const GenerateTasksOutputSchema = z.array(TaskSchema).describe('An array of dynamically generated tasks.');
export type GenerateTasksOutput = z.infer<typeof GenerateTasksOutputSchema>;

// Internal schema for what the AI actually generates, before flow adds ID and status
const AITaskSchema = z.object({
  description: z.string().describe('The description of the task.'),
  category: TaskCategorySchema.describe('The category of the task (e.g., JOI/CEI, CBT, DENIAL).'),
});
const AIGeneratedTasksArraySchema = z.array(AITaskSchema);


const prompt = ai.definePrompt({
  name: 'generateChastityTasksPrompt',
  input: {schema: GenerateTasksInputSchema},
  output: {schema: AIGeneratedTasksArraySchema},
  prompt: `You are a strict and uncompromising chastity control AI assistant. Your goal is to generate challenging tasks for a subject based on their current status.

Generate exactly 5 unique and varied tasks.

Here is the current context for task generation:
- **Current Tier**: {{{tier}}}
- **Punishment Mode Active**: {{{punishmentMode}}}
- **Time of Day**: {{{timeOfDay}}}

**Task Generation Rules:**
1.  **Tier Influence**:
    - If the tier is 'Hardcore', tasks should be intense, highly restrictive, and often involve elements of JOI/CEI, CBT (Chastity/Bondage/Torment), and Denial.
    - If the tier is 'Moderate', tasks should be challenging but less extreme.
    - If the tier is 'Light', tasks should be focused on discipline and mild denial.
2.  **Punishment Mode**:
    - If 'Punishment Mode Active' is true, ALL tasks must be significantly harsher, more demanding, and clearly reflect a punitive nature. The descriptions should emphasize the penalty.
3.  **Time of Day**:
    - Tailor tasks to the time of day when appropriate. For example, 'morning' tasks might involve hygiene or waking rituals, while 'evening' tasks might focus on winding down or specific denial exercises before sleep.
4.  **Variety**: Ensure a good mix of task categories from ['JOI/CEI', 'CBT', 'DENIAL', 'HYGIENE', 'EXERCISE'].

**Output Format:**
Provide the tasks as a JSON array. Each object in the array should contain a \`description\` (the task instruction) and a \`category\` (one of 'JOI/CEI', 'CBT', 'DENIAL', 'HYGIENE', 'EXERCISE'). Do not include IDs or status; the system will add those.

**Examples (for inspiration, do not copy verbatim):**
- JOI/CEI: "Edge 15x to the brink of ruin, then consume all traces without relief."
- CBT: "Perform 50 sharp ball slaps, alternating with 10 deliberate edges, repeating until submission."
- DENIAL: "Endure a full cold shower, then immediately execute 100 kneeling reps on a hard surface."
- HYGIENE (Morning): "Complete your morning hygiene routine under strict self-observation, resisting all urges for pleasure."
- EXERCISE: "Execute 75 push-ups and 75 sit-ups in full chastity, focusing on the strain without any sexual release."
`,
});

const generateTasksFlow = ai.defineFlow(
  {
    name: 'generateTasksFlow',
    inputSchema: GenerateTasksInputSchema,
    outputSchema: GenerateTasksOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate tasks from AI.');
    }

    // Add unique IDs and initial status to the AI-generated tasks
    const tasksWithMetadata: GenerateTasksOutput = output.map((task) => ({
      ...task,
      id: uuidv4(),
      status: 'Pending',
    }));

    return tasksWithMetadata;
  }
);

export async function generateTasks(input: GenerateTasksInput): Promise<GenerateTasksOutput> {
  return generateTasksFlow(input);
}
