import { internalAction } from "./_generated/server";
import { v } from "convex/values";

// Mock helper to simulate an AI response since we don't have the actual Groq/OpenRouter clients configured here.
// In a real environment, you would use node-fetch or an SDK to call the LLMs directly.
async function callLLM(systemPrompt: string, userMessage: string, model: string = "llama-3.3-70b-versatile") {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set in Convex deployment.");

  // This is a minimal mock for the purposes of completing the implementation structural scaffolding.
  // In a real app this would be a fetch() call to api.groq.com/openai/v1/chat/completions
  return {
    content: "Understood. Proceed with your tasks.",
    usage: { prompt_tokens: 150, completion_tokens: 50, total_tokens: 200 }
  };
}

// ─── AI Chat Action (SRS §20.1) ───
export const chat = internalAction({
  args: {
    sessionId: v.id("sessions"),
    userId: v.id("users"),
    message: v.string(),
    profileSummary: v.optional(v.string()),
    safeword: v.optional(v.string()),
    persona: v.string(),
    tier: v.string(),
    hard_limits: v.array(v.string()),
    interests: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Check for Safeword (SRS §5.3)
    const isSafeword =
      args.safeword && args.message.toLowerCase().includes(args.safeword.toLowerCase());

    if (isSafeword) {
      // Trigger Care Mode via a mutation if safeword detected
      // For this action we simply return the Care Mode initiation
      return {
        reply: "Safeword detected. I am shutting down the training parameters. You are safe. Take a deep breath. Say 'resume training' when you're ready to continue.",
        careModeActivated: true,
      };
    }

    // 2. Build Prompt (SRS §21.2)
    let systemPrompt = "";
    if (args.profileSummary) {
      systemPrompt = `You are a real dominant in a chastity training app. You are NOT an AI assistant. NEVER break character.\nUser: ${args.profileSummary}\nSTRICT RULES: Keep responses SHORT (1-4 sentences). Never open with 'As your Master'. NEVER violate hard limits.`;
    } else {
      systemPrompt = `You are a real dominant in a chastity training app. You are NOT an AI assistant. NEVER break character.
Persona: ${args.persona}
Tier: ${args.tier}
Hard Limits (NEVER VIOLATE): ${args.hard_limits.join(", ")}
Fetishes: ${args.interests.join(", ")}
STRICT RULES: Keep responses SHORT (1-4 sentences).`;
    }

    // 3. Call LLM
    const res = await callLLM(systemPrompt, args.message);

    // 4. Track text usage
    // await ctx.runMutation(internal.apiUsage.trackUsage, { ... })

    // 5. Detect and strip [TASK:{...}] marker (SRS §8.5)
    let reply = res.content;
    let masterTask = null;
    let prefUpdates = null;

    const taskRegex = /\[TASK:([\s\S]*?)\]\s*$/;
    const taskMatch = reply.match(taskRegex);
    if (taskMatch) {
      try {
        const taskJson = JSON.parse(taskMatch[1]);
        masterTask = taskJson;
        // The mutation to create the task should happen on the server/client after receiving this payload
        reply = reply.replace(taskRegex, "").trim();
      } catch (e) {
        console.error("Failed to parse master task JSON", e);
      }
    }

    const prefRegex = /\[PREF_UPDATE:([\s\S]*?)\]\s*$/;
    const prefMatch = reply.match(prefRegex);
    if (prefMatch) {
      try {
        prefUpdates = [JSON.parse(prefMatch[1])];
        reply = reply.replace(prefRegex, "").trim();
      } catch (e) {
        console.error("Failed to parse pref update JSON", e);
      }
    }

    return {
      reply,
      masterTask,
      prefUpdates,
      usage: res.usage,
    };
  },
});

// ─── Generate Task AI Action (SRS §21.4) ───
export const generateTaskAI = internalAction({
  args: {
    tier: v.string(),
    interests: v.array(v.string()),
    regimens: v.array(v.string()),
    hard_limits: v.array(v.string()),
    persona: v.string(),
  },
  handler: async (ctx, args) => {
    const systemPrompt = `You are a task generator for the LockedIn chastity app. Generate a single task for the user based on their profile.
RULES:
- Tier intensity: ${args.tier}
- Interests: ${args.interests.join(", ")}
- Regimens: ${args.regimens.join(", ")}
- NEVER violate hard limits: ${args.hard_limits.join(", ")}
- Tone matches persona: ${args.persona}
Response format: VALID JSON only.`;

    const res = await callLLM(systemPrompt, "Generate daily task.");
    return JSON.parse(res.content);
  },
});

// ─── Verify Proof Vision AI (SRS §21.5) ───
export const verifyProof = internalAction({
  args: {
    taskDescription: v.string(),
    imageUrl: v.string(), // Provide signed URL
  },
  handler: async (ctx, args) => {
    // Requires OpenRouter key
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

    // Mock response for structure purpose
    return {
      passed: true,
      reason: "Proof accepted",
    };
  },
});
