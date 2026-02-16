'use server';

import { z } from 'genkit';
import { v4 as uuidv4 } from 'uuid';
import { aiService } from '@/ai/service';

const GenerateTasksInputSchema = z.object({
  tier: z.enum(['Newbie', 'Slave', 'Hardcore', 'Extreme', 'Destruction']),
  punishmentMode: z.boolean(),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']),
});
export type GenerateTasksInput = z.infer<typeof GenerateTasksInputSchema>;

const TaskCategorySchema = z.enum(['JOI/CEI', 'CBT', 'DENIAL', 'HYGIENE', 'EXERCISE']);

// Output format for the App
const TaskSchema = z.object({
  id: z.string().uuid(),
  description: z.string(),
  category: TaskCategorySchema,
  status: z.literal('Pending'),
});
export type GenerateTasksOutput = z.infer<typeof TaskSchema>[];

// Schema for the AI to generate (without IDs)
interface AITask {
  description: string;
  category: 'JOI/CEI' | 'CBT' | 'DENIAL' | 'HYGIENE' | 'EXERCISE';
}

interface AITaskResponse {
  tasks: AITask[];
}

export async function generateTasks(input: GenerateTasksInput): Promise<GenerateTasksOutput> {
  try {
    const prompt = `Generate 5 unique chastity tasks for a subject.

    Context:
    - Tier: ${input.tier}
    - Punishment Mode: ${input.punishmentMode}
    - Time: ${input.timeOfDay}

    Rules:
    - Newbie: Discipline, mild denial.
    - Slave: Challenging, moderate pain.
    - Hardcore: Intense, JOI/CBT/Denial.
    - Extreme: Brutal, life-impacting.
    - Destruction: Merciless.

    Output JSON with a "tasks" array containing objects with "description" and "category" (from ['JOI/CEI', 'CBT', 'DENIAL', 'HYGIENE', 'EXERCISE']).`;

    const schemaDesc = `{ tasks: [{ description: string, category: 'JOI/CEI' | 'CBT' | 'DENIAL' | 'HYGIENE' | 'EXERCISE' }] }`;

    const response = await aiService.generateJson<AITaskResponse>(prompt, schemaDesc);

    if (!response.tasks || !Array.isArray(response.tasks)) {
      throw new Error("Invalid AI response format");
    }

    return response.tasks.map(t => ({
      id: uuidv4(),
      description: t.description,
      category: t.category,
      status: 'Pending'
    }));

  } catch (error) {
    console.error("Generate Tasks Failed:", error);
    // Return safe fallback tasks
    return [
      { id: uuidv4(), description: "System Offline. Maintain chastity.", category: "DENIAL", status: "Pending" },
      { id: uuidv4(), description: "Verify lock integrity.", category: "HYGIENE", status: "Pending" },
      { id: uuidv4(), description: "Reflect on your submission.", category: "DENIAL", status: "Pending" },
      { id: uuidv4(), description: "Drink 2 glasses of water.", category: "HYGIENE", status: "Pending" },
      { id: uuidv4(), description: "Perform 20 squats.", category: "EXERCISE", status: "Pending" }
    ];
  }
}
