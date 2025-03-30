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

// Create the initial configuration
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

/**
 * Updates the Gemini models list with dynamically fetched models
 * @param models Array of available Gemini model names
 */
export function updateGeminiModels(models: string[]) {
  if (models && models.length > 0) {
    // Keep the current model if it's in the new list, otherwise use first model
    const currentModel = models.includes(config.providers.gemini.currentModel) 
      ? config.providers.gemini.currentModel 
      : models[0];
      
    // Update the configuration
    config.providers.gemini.models = models;
    config.providers.gemini.currentModel = currentModel;
    
    console.log(`Updated Gemini models: ${models.join(', ')}`);
  }
}

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