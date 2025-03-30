import { config, LLMProvider } from "./config";
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
    return currentProvider === "openai" 
      ? await openaiService.analyzeResume(resumeText)
      : await geminiService.analyzeResume(resumeText);
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
    return currentProvider === "openai"
      ? await openaiService.matchJobSkills(resumeSkills, jobDescription)
      : await geminiService.matchJobSkills(resumeSkills, jobDescription);
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
    return currentProvider === "openai"
      ? await openaiService.generateCoverLetter(resumeText, jobDescription, additionalInfo)
      : await geminiService.generateCoverLetter(resumeText, jobDescription, additionalInfo);
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
    if (currentProvider === "openai") {
      // OpenAI requires userId as a number
      if (userId === undefined) {
        throw new Error("User ID is required for OpenAI chat");
      }
      return await openaiService.chatWithAssistant(messages, userId);
    } else {
      // Gemini doesn't require userId
      return await geminiService.chatWithAssistant(messages);
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
    return currentProvider === "openai"
      ? await openaiService.suggestResumeImprovements(resumeText, targetJob)
      : await geminiService.suggestResumeImprovements(resumeText, targetJob);
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
    defaultProvider: config.defaultLLMProvider
  };
}