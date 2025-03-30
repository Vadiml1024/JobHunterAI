// LLM Provider configuration

export type LLMProvider = "openai" | "gemini";

export interface ProviderConfig {
  available: boolean;
  defaultModel: string;
  models: string[];
  currentModel: string;
}

interface Config {
  defaultLLMProvider: LLMProvider;
  providers: {
    openai: ProviderConfig;
    gemini: ProviderConfig;
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
      models: ["gpt-4o", "gpt-3.5-turbo", "gpt-4-turbo"],
      currentModel: "gpt-4o"
    },
    gemini: {
      available: geminiAvailable,
      defaultModel: "gemini-pro",
      models: ["gemini-pro", "gemini-pro-vision"],
      currentModel: "gemini-pro"
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