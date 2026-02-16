import { config } from 'dotenv';
config({ path: '.env.local' }); // Explicitly load .env.local

import '@/ai/flows/ai-chat-interaction-flow.ts';
import '@/ai/flows/ai-generated-tasks.ts';