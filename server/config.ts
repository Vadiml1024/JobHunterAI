// LLM Provider configuration

export type LLMProvider = "openai" | "gemini";

interface Config {
  defaultLLMProvider: LLMProvider;
  providers: {
    openai: {
      available: boolean;
      defaultModel: string;
    };
    gemini: {
      available: boolean;
      defaultModel: string;
    };
  };
}

// Check if API keys are available
const openaiAvailable = !!process.env.OPENAI_API_KEY;
const geminiAvailable = !!process.env.GEMINI_API_KEY;

// Set default provider based on available API keys
const getDefaultProvider = (): LLMProvider => {
  if (openaiAvailable) return "openai";
  if (geminiAvailable) return "gemini";
  return "openai"; // Default fallback
};

// Export the configuration
export const config: Config = {
  defaultLLMProvider: getDefaultProvider(),
  providers: {
    openai: {
      available: openaiAvailable,
      defaultModel: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
    },
    gemini: {
      available: geminiAvailable,
      defaultModel: "gemini-pro",
    },
  },
};

// Helper function to check if a provider is available
export function isProviderAvailable(provider: LLMProvider): boolean {
  return config.providers[provider].available;
}

// Helper function to get all available providers
export function getAvailableProviders(): LLMProvider[] {
  return Object.entries(config.providers)
    .filter(([_, value]) => value.available)
    .map(([key]) => key as LLMProvider);
}