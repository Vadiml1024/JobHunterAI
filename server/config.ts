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
  features: {
    skipLocalTextExtraction: boolean; // When true, send original file to LLM instead of extracting text locally
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
  features: {
    skipLocalTextExtraction: false // Default to false, extract text locally first
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

/**
 * Updates the OpenAI models list with dynamically fetched models
 * @param models Array of available OpenAI model names
 */
export function updateOpenAIModels(models: string[]) {
  if (models && models.length > 0) {
    // Add default models if they're not in the API result (sometimes API doesn't return them all)
    const defaultModels = ["gpt-4o", "gpt-3.5-turbo", "gpt-4-turbo"];
    
    // Merge and deduplicate arrays without using Set spread
    const combinedModels: string[] = [];
    // Add default models first
    defaultModels.forEach(model => {
      if (!combinedModels.includes(model)) {
        combinedModels.push(model);
      }
    });
    // Add API-fetched models
    models.forEach(model => {
      if (!combinedModels.includes(model)) {
        combinedModels.push(model);
      }
    });
    
    // Keep the current model if it's in the new list, otherwise use gpt-4o
    const currentModel = combinedModels.includes(config.providers.openai.currentModel) 
      ? config.providers.openai.currentModel 
      : "gpt-4o";
      
    // Update the configuration
    config.providers.openai.models = combinedModels;
    config.providers.openai.currentModel = currentModel;
    
    console.log(`Updated OpenAI models: ${combinedModels.length} models available`);
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

/**
 * Updates the setting to skip local text extraction
 * @param skip Whether to skip local text extraction and send original files to LLMs
 */
export function setSkipLocalTextExtraction(skip: boolean): void {
  config.features.skipLocalTextExtraction = skip;
  console.log(`${skip ? 'Enabled' : 'Disabled'} direct file processing by LLMs`);
}

/**
 * Gets the current setting for skipping local text extraction
 * @returns The current setting value
 */
export function getSkipLocalTextExtraction(): boolean {
  return config.features.skipLocalTextExtraction;
}