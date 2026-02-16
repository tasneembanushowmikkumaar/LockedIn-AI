// We will implement Groq directly here for now or in a separate file

export type AIProvider = 'groq' | 'google' | 'openrouter' | 'huggingface';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIServiceConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
}

export class AIService {
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig = { provider: 'groq' }) {
    this.config = config;

    // Force override from env var if present, otherwise default to groq
    const envProvider = process.env.AI_PROVIDER as AIProvider;
    if (envProvider) {
        this.config.provider = envProvider;
    }

    // Default to environment variable if apiKey not passed explicitly
    if (!this.config.apiKey) {
      if (this.config.provider === 'groq') this.config.apiKey = process.env.GROQ_API_KEY;
      if (this.config.provider === 'google') this.config.apiKey = process.env.GOOGLE_GENAI_API_KEY;
      if (this.config.provider === 'openrouter') this.config.apiKey = process.env.OPENROUTER_API_KEY;
      if (this.config.provider === 'huggingface') this.config.apiKey = process.env.HF_TOKEN;
    }
  }

  async generateChatResponse(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    console.log(`[AIService] Generating Chat Response using provider: ${this.config.provider}`);

    if (this.config.provider === 'groq') {
      return this.generateGroqChat(messages, systemPrompt);
    } else if (this.config.provider === 'openrouter') {
      return this.generateOpenRouterChat(messages, systemPrompt);
    } else if (this.config.provider === 'huggingface') {
      return this.generateHuggingFaceChat(messages, systemPrompt);
    }
    throw new Error(`Unsupported provider: ${this.config.provider}`);
  }

  async generateJson<T>(prompt: string, schemaDescription: string): Promise<T> {
    if (this.config.provider === 'groq') {
        return this.generateGroqJson<T>(prompt, schemaDescription);
    } else if (this.config.provider === 'openrouter') {
      return this.generateOpenRouterJson<T>(prompt, schemaDescription);
    } else if (this.config.provider === 'huggingface') {
        return this.generateHuggingFaceJson<T>(prompt, schemaDescription);
    }
    throw new Error(`Unsupported provider for JSON: ${this.config.provider}`);
  }

  async generateVoice(text: string): Promise<ArrayBuffer | null> {
    // Groq doesn't support voice natively yet.
    // Return null to gracefully degrade (UI will hide audio controls).
    return null;
  }

  // --- Hugging Face Implementation ---

  private async generateHuggingFaceChat(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    // Models
    const primaryModel = "HuggingFaceH4/zephyr-7b-beta";
    const fallbackModel = "microsoft/DialoGPT-large";

    const allMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    // Convert OpenAI-style messages to a single prompt string for HF Inference if needed,
    // but Zephyr supports chat templating via the messages API on HF Inference (usually).
    // Let's try the modern messages API first.

    try {
        const output = await this.callHfInference(primaryModel, {
            inputs: this.formatPromptForZephyr(allMessages),
            parameters: { max_new_tokens: 500, temperature: 0.7, return_full_text: false }
        });
        return output[0]?.generated_text || "";
    } catch (e) {
        console.warn(`Zephyr failed, falling back to ${fallbackModel}`, e);
        // Fallback to DialoGPT (simpler chat model)
        const lastUserMessage = messages[messages.length - 1].content;
        try {
            const output = await this.callHfInference(fallbackModel, {
                inputs: lastUserMessage,
                parameters: { max_new_tokens: 100, return_full_text: false }
            });
            return output[0]?.generated_text || "";
        } catch (e2) {
            console.error("All HF models failed", e2);
            throw e2;
        }
    }
  }

  private async generateHuggingFaceJson<T>(prompt: string, schemaDescription: string): Promise<T> {
    const model = "HuggingFaceH4/zephyr-7b-beta"; // DialoGPT is too weak for JSON
    const systemPrompt = `You are a helpful AI that outputs strict JSON.
    The JSON structure should follow this description: ${schemaDescription}.
    Do not output markdown code blocks, just the raw JSON string.`;

    const fullPrompt = `<|system|>\n${systemPrompt}</s>\n<|user|>\n${prompt}</s>\n<|assistant|>\n`;

    try {
        const output = await this.callHfInference(model, {
            inputs: fullPrompt,
            parameters: { max_new_tokens: 1000, temperature: 0.3, return_full_text: false }
        });

        let content = output[0]?.generated_text || "{}";
        content = content.replace(/```json\n?|\n?```/g, "").trim();
        return JSON.parse(content);
    } catch (e) {
        console.error("HF JSON failed", e);
        throw e;
    }
  }

  private async generateHuggingFaceVoice(text: string): Promise<ArrayBuffer> {
    const model = "microsoft/speecht5_tts";
    // Updated endpoint per HF 410 error
    const res = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text })
    });

    if (!res.ok) throw new Error(`TTS Failed: ${res.status}`);
    return await res.arrayBuffer();
  }

  private async callHfInference(model: string, body: any) {
      // Updated endpoint per HF 410 error
      const res = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
          method: "POST",
          headers: {
              "Authorization": `Bearer ${this.config.apiKey}`,
              "Content-Type": "application/json",
          },
          body: JSON.stringify(body)
      });
      if (!res.ok) {
          const err = await res.text();
          throw new Error(`HF API Error (${model}): ${res.status} - ${err}`);
      }
      return await res.json();
  }

  private formatPromptForZephyr(messages: any[]) {
      // Manual formatting if the API doesn't support 'messages' directly for this model
      return messages.map(m => {
          if (m.role === 'system') return `<|system|>\n${m.content}</s>\n`;
          if (m.role === 'user') return `<|user|>\n${m.content}</s>\n`;
          if (m.role === 'assistant') return `<|assistant|>\n${m.content}</s>\n`;
          return "";
      }).join("") + "<|assistant|>\n";
  }

  // --- OpenRouter Implementation ---

  // List of models to try in order. If one fails (rate limit/offline), try next.
  private OPENROUTER_MODELS = [
    'nousresearch/hermes-3-llama-3.1-405b:free',  // Primary: Best Quality
    'meta-llama/llama-3.3-70b-instruct:free',     // Fallback 1: Strong & Fast
    'google/gemini-2.0-flash-exp:free',           // Fallback 2: Very Fast
    'meta-llama/llama-3.2-3b-instruct:free'       // Fallback 3: Lightweight
  ];

  private async generateOpenRouterChat(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    const allMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    let lastError: any;

    for (const model of this.OPENROUTER_MODELS) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'HTTP-Referer': 'https://lockedin.ai',
            'X-Title': 'LockedIn AI',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: allMessages,
            temperature: 0.8,
            top_p: 0.9,
          })
        });

        if (!res.ok) {
          const errorText = await res.text();
          // If rate limited (429) or server error (5xx), continue to next model
          if (res.status === 429 || res.status >= 500) {
            console.warn(`OpenRouter Model ${model} failed (${res.status}). Switching...`);
            lastError = new Error(`OpenRouter API Error: ${res.status} - ${errorText}`);
            continue;
          }
          throw new Error(`OpenRouter API Error: ${res.status} - ${errorText}`);
        }

        const data = await res.json();
        console.log(`AI Success using model: ${model}`);
        return data.choices[0]?.message?.content || "";

      } catch (error) {
        console.warn(`OpenRouter Model ${model} error:`, error);
        lastError = error;
      }
    }

    console.error("All OpenRouter models failed.");
    throw lastError;
  }

  private async generateOpenRouterJson<T>(prompt: string, schemaDescription: string): Promise<T> {
    const systemPrompt = `You are a helpful AI that outputs strict JSON.
    The JSON structure should follow this description: ${schemaDescription}.
    Do not output markdown code blocks, just the raw JSON string.`;

    let lastError: any;

    for (const model of this.OPENROUTER_MODELS) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'HTTP-Referer': 'https://lockedin.ai',
            'X-Title': 'LockedIn AI',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3
          })
        });

        if (!res.ok) {
          const errorText = await res.text();
          if (res.status === 429 || res.status >= 500) {
             console.warn(`OpenRouter JSON Model ${model} failed (${res.status}). Switching...`);
             lastError = new Error(`OpenRouter API Error (JSON): ${res.status} - ${errorText}`);
             continue;
          }
          throw new Error(`OpenRouter API Error (JSON): ${res.status} - ${errorText}`);
        }

        const data = await res.json();
        let content = data.choices[0]?.message?.content;

        // Cleanup markdown if present
        content = content.replace(/```json\n?|\n?```/g, "").trim();

        console.log(`AI JSON Success using model: ${model}`);
        return JSON.parse(content);

      } catch (error) {
        console.warn(`OpenRouter JSON Model ${model} error:`, error);
        lastError = error;
      }
    }

    console.error("All OpenRouter JSON models failed.");
    throw lastError;
  }

  // --- Groq Implementation ---

  private async generateGroqChat(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    const allMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    // Use current valid models: llama-3.3-70b-versatile (Primary), llama-3.1-8b-instant (Fallback)
    const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];

    let lastError: any;

    for (const model of models) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: allMessages,
            temperature: 0.7
          })
        });

        if (!res.ok) {
          const error = await res.text();
          // If model decommissioned (400) or rate limited (429), try next
          if (res.status === 400 || res.status === 429) {
             console.warn(`Groq Model ${model} failed (${res.status}). Switching...`);
             lastError = new Error(`Groq API Error: ${res.status} - ${error}`);
             continue;
          }
          throw new Error(`Groq API Error: ${res.status} - ${error}`);
        }

        const data = await res.json();
        console.log(`Groq Success with ${model}`);
        return data.choices[0]?.message?.content || "";
      } catch (error) {
        console.error(`Groq Generation Failed (${model}):`, error);
        lastError = error;
      }
    }
    throw lastError;
  }

  private async generateGroqJson<T>(prompt: string, schemaDescription: string): Promise<T> {
    const systemPrompt = `You are a helpful AI that outputs strict JSON.
    The JSON structure should follow this description: ${schemaDescription}.
    Do not output markdown code blocks, just the raw JSON string.`;

    // JSON mode is supported well on these
    const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
    let lastError: any;

    for (const model of models) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3
          })
        });

        if (!res.ok) {
          const error = await res.text();
          if (res.status === 400 || res.status === 429) {
             console.warn(`Groq JSON Model ${model} failed (${res.status}). Switching...`);
             lastError = new Error(`Groq API Error (JSON): ${res.status} - ${error}`);
             continue;
          }
          throw new Error(`Groq API Error (JSON): ${res.status} - ${error}`);
        }

        const data = await res.json();
        const content = data.choices[0]?.message?.content;
        console.log(`Groq JSON Success with ${model}`);
        return JSON.parse(content);
      } catch (error) {
        console.error(`Groq JSON Generation Failed (${model}):`, error);
        lastError = error;
      }
    }
    throw lastError;
  }
}

// Singleton instance with default config from env
export const aiService = new AIService({
    provider: (process.env.AI_PROVIDER as AIProvider) || 'openrouter'
});
