// We will implement Groq directly here for now or in a separate file

export type AIProvider = 'groq' | 'google' | 'openrouter';

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

  constructor(config: AIServiceConfig = { provider: 'openrouter' }) {
    this.config = config;
    // Default to environment variable if apiKey not passed explicitly
    if (!this.config.apiKey) {
      if (this.config.provider === 'groq') this.config.apiKey = process.env.GROQ_API_KEY;
      if (this.config.provider === 'google') this.config.apiKey = process.env.GOOGLE_GENAI_API_KEY;
      if (this.config.provider === 'openrouter') this.config.apiKey = process.env.OPENROUTER_API_KEY;
    }
  }

  async generateChatResponse(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    if (this.config.provider === 'openrouter') {
      return this.generateOpenRouterChat(messages, systemPrompt);
    } else if (this.config.provider === 'groq') {
      return this.generateGroqChat(messages, systemPrompt);
    } else if (this.config.provider === 'google') {
      return "[Google Provider Not Fully Ported Yet]";
    }
    throw new Error(`Unsupported provider: ${this.config.provider}`);
  }

  async generateJson<T>(prompt: string, schemaDescription: string): Promise<T> {
    if (this.config.provider === 'openrouter') {
      return this.generateOpenRouterJson<T>(prompt, schemaDescription);
    } else if (this.config.provider === 'groq') {
        return this.generateGroqJson<T>(prompt, schemaDescription);
    }
    throw new Error(`Unsupported provider for JSON: ${this.config.provider}`);
  }

  // --- OpenRouter Implementation ---

  private async generateOpenRouterChat(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    const allMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': 'https://lockedin.ai', // Required by OpenRouter
          'X-Title': 'LockedIn AI',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model || 'nousresearch/hermes-3-llama-3.1-405b:free', // Validated available free model
          messages: allMessages,
          temperature: 0.8, // Slightly higher for creativity/persona
          top_p: 0.9,
        })
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`OpenRouter API Error: ${res.status} - ${error}`);
      }

      const data = await res.json();
      return data.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("OpenRouter Generation Failed:", error);
      throw error;
    }
  }

  private async generateOpenRouterJson<T>(prompt: string, schemaDescription: string): Promise<T> {
    const systemPrompt = `You are a helpful AI that outputs strict JSON.
    The JSON structure should follow this description: ${schemaDescription}.
    Do not output markdown code blocks, just the raw JSON string.`;

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
          model: this.config.model || 'nousresearch/hermes-3-llama-3.1-405b:free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          response_format: { type: "json_object" }, // Supported by some OpenRouter models
          temperature: 0.3
        })
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`OpenRouter API Error (JSON): ${res.status} - ${error}`);
      }

      const data = await res.json();
      let content = data.choices[0]?.message?.content;

      // Cleanup markdown if present (common issue with some models)
      content = content.replace(/```json\n?|\n?```/g, "").trim();

      return JSON.parse(content);
    } catch (error) {
      console.error("OpenRouter JSON Generation Failed:", error);
      throw error;
    }
  }

  // --- Groq Implementation ---

  private async generateGroqChat(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    const allMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model || 'llama-3.1-70b-versatile',
          messages: allMessages,
          temperature: 0.7
        })
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Groq API Error: ${res.status} - ${error}`);
      }

      const data = await res.json();
      return data.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("Groq Generation Failed:", error);
      throw error;
    }
  }

  private async generateGroqJson<T>(prompt: string, schemaDescription: string): Promise<T> {
    // Llama 3.1 is good at JSON if instructed. We can force JSON mode or just prompt engineer.
    // Groq supports response_format: { type: "json_object" } for some models.

    const systemPrompt = `You are a helpful AI that outputs strict JSON.
    The JSON structure should follow this description: ${schemaDescription}.
    Do not output markdown code blocks, just the raw JSON string.`;

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model || 'llama-3.1-70b-versatile',
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
        throw new Error(`Groq API Error (JSON): ${res.status} - ${error}`);
      }

      const data = await res.json();
      const content = data.choices[0]?.message?.content;

      return JSON.parse(content);
    } catch (error) {
      console.error("Groq JSON Generation Failed:", error);
      throw error;
    }
  }
}

// Singleton instance with default config from env
export const aiService = new AIService({
    provider: (process.env.AI_PROVIDER as AIProvider) || 'openrouter'
});
