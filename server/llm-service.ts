import { config, LLMProvider, ProviderConfig } from "./config";
import * as openaiService from "./openai";
import * as geminiService from "./gemini";
import { ChatMessage } from "../client/src/types";

// Default provider from config
let currentProvider: LLMProvider = config.defaultLLMProvider;

/**
 * Set the current LLM provider
 * @param provider The provider to use (openai or gemini)
 * @returns Boolean indicating if the change was successful
 */
export function setProvider(provider: LLMProvider): boolean {
  if (!config.providers[provider].available) {
    return false;
  }
  
  currentProvider = provider;
  return true;
}

/**
 * Set the model for a specific provider
 * @param provider The provider to set the model for
 * @param model The model name
 * @returns Boolean indicating if the change was successful
 */
export function setProviderModel(provider: LLMProvider, model: string): boolean {
  const providerConfig = config.providers[provider];
  
  if (!providerConfig.available || !providerConfig.models.includes(model)) {
    return false;
  }
  
  providerConfig.currentModel = model;
  return true;
}

/**
 * Get the current model for a provider
 * @param provider The provider to get the model for
 * @returns The current model name
 */
export function getProviderModel(provider: LLMProvider): string {
  return config.providers[provider].currentModel;
}

/**
 * Get the current LLM provider
 * @returns The current provider name
 */
export function getCurrentProvider(): LLMProvider {
  return currentProvider;
}

/**
 * Analyze a resume using the selected LLM provider
 * @param resumeText Resume content to analyze
 * @returns Analysis of the resume
 */
export async function analyzeResume(resumeText: string) {
  try {
    const model = config.providers[currentProvider].currentModel;
    
    return currentProvider === "openai" 
      ? await openaiService.analyzeResume(resumeText, model)
      : await geminiService.analyzeResume(resumeText, model);
  } catch (error) {
    console.error(`Error in ${currentProvider} analyzeResume:`, error);
    throw error;
  }
}

/**
 * Match job skills using the selected LLM provider
 * @param resumeSkills Skills from the user's resume
 * @param jobDescription Job description to analyze
 * @returns Job match analysis
 */
export async function matchJobSkills(resumeSkills: string[], jobDescription: string) {
  try {
    const model = config.providers[currentProvider].currentModel;
    
    return currentProvider === "openai"
      ? await openaiService.matchJobSkills(resumeSkills, jobDescription, model)
      : await geminiService.matchJobSkills(resumeSkills, jobDescription, model);
  } catch (error) {
    console.error(`Error in ${currentProvider} matchJobSkills:`, error);
    throw error;
  }
}

/**
 * Generate a cover letter using the selected LLM provider
 * @param resumeText Resume content
 * @param jobDescription Job description
 * @param additionalInfo Additional information or preferences
 * @returns Generated cover letter
 */
export async function generateCoverLetter(
  resumeText: string,
  jobDescription: string,
  additionalInfo: string = ""
) {
  try {
    const model = config.providers[currentProvider].currentModel;
    
    return currentProvider === "openai"
      ? await openaiService.generateCoverLetter(resumeText, jobDescription, additionalInfo, model)
      : await geminiService.generateCoverLetter(resumeText, jobDescription, additionalInfo, model);
  } catch (error) {
    console.error(`Error in ${currentProvider} generateCoverLetter:`, error);
    throw error;
  }
}

/**
 * Chat with the AI assistant using the selected LLM provider
 * @param messages Chat history
 * @param userId User ID for personalized context
 * @returns AI assistant response
 */
export async function chatWithAssistant(messages: ChatMessage[], userId?: number) {
  try {
    const model = config.providers[currentProvider].currentModel;
    
    if (currentProvider === "openai") {
      // OpenAI requires userId as a number
      if (userId === undefined) {
        throw new Error("User ID is required for OpenAI chat");
      }
      return await openaiService.chatWithAssistant(messages, userId, model);
    } else {
      // Gemini doesn't require userId
      return await geminiService.chatWithAssistant(messages, model);
    }
  } catch (error) {
    console.error(`Error in ${currentProvider} chatWithAssistant:`, error);
    throw error;
  }
}

/**
 * Get resume improvement suggestions using the selected LLM provider
 * @param resumeText Resume content
 * @param targetJob Optional target job
 * @returns Array of improvement suggestions
 */
export async function suggestResumeImprovements(
  resumeText: string,
  targetJob: string = ""
) {
  try {
    const model = config.providers[currentProvider].currentModel;
    
    return currentProvider === "openai"
      ? await openaiService.suggestResumeImprovements(resumeText, targetJob, model)
      : await geminiService.suggestResumeImprovements(resumeText, targetJob, model);
  } catch (error) {
    console.error(`Error in ${currentProvider} suggestResumeImprovements:`, error);
    throw error;
  }
}

/**
 * Get information about available LLM providers
 * @returns Provider configuration information
 */
export function getProvidersInfo() {
  return {
    current: currentProvider,
    available: Object.entries(config.providers)
      .filter(([_, data]) => data.available)
      .map(([key]) => key),
    defaultProvider: config.defaultLLMProvider,
    providers: {
      openai: {
        models: config.providers.openai.models,
        currentModel: config.providers.openai.currentModel
      },
      gemini: {
        models: config.providers.gemini.models,
        currentModel: config.providers.gemini.currentModel
      }
    }
  };
}