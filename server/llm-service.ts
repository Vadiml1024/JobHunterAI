import { config, LLMProvider, ProviderConfig, updateGeminiModels, updateOpenAIModels } from "./config";
import * as openaiService from "./openai";
import * as geminiService from "./gemini";
import { ChatMessage } from "../client/src/types";
import { 
  AnalyzeResumeParams, 
  MatchJobSkillsParams, 
  CoverLetterParams, 
  ChatParams, 
  ImprovementParams 
} from "./llm-params";

// Default provider from config
let currentProvider: LLMProvider = config.defaultLLMProvider;

// Initialize providers by fetching available models
export async function initializeProviders() {
  try {
    // Fetch Gemini models if the API key is available
    if (process.env.GEMINI_API_KEY) {
      const geminiModels = await geminiService.fetchGeminiModels();
      updateGeminiModels(geminiModels);
    }
    
    // Fetch OpenAI models if the API key is available
    if (process.env.OPENAI_API_KEY) {
      const openaiModels = await openaiService.fetchOpenAIModels();
      updateOpenAIModels(openaiModels);
    }
    
    console.log("LLM providers initialized successfully");
  } catch (error) {
    console.error("Error initializing LLM providers:", error);
  }
}

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
 * @param params Resume analysis parameters, can be text or file path
 * @returns Analysis of the resume
 */
export async function analyzeResume(params: string | {resumeText?: string, resumeFilePath?: string}) {
  try {
    const modelName = config.providers[currentProvider].currentModel;
    
    // Convert string input to proper parameter object
    const analysisParams: AnalyzeResumeParams = typeof params === 'string' 
      ? { resumeText: params, modelName } 
      : { ...params, modelName };
    
    return currentProvider === "openai" 
      ? await openaiService.analyzeResume(analysisParams)
      : await geminiService.analyzeResume(analysisParams);
  } catch (error) {
    console.error(`Error in ${currentProvider} analyzeResume:`, error);
    throw error;
  }
}

/**
 * Match job skills using the selected LLM provider
 * @param resumeSkills Skills from the user's resume
 * @param jobDescription Job description to analyze
 * @param resumeDocumentOrFilePath Optional full resume text or file path to analyze instead of just skills list
 * @returns Job match analysis
 */
export async function matchJobSkills(resumeSkills: string[], jobDescription: string, resumeDocumentOrFilePath?: string) {
  try {
    const modelName = config.providers[currentProvider].currentModel;
    
    // Determine if we're dealing with a file path or a document text
    const isFilePath = resumeDocumentOrFilePath?.startsWith('/uploads/');
    
    const params: MatchJobSkillsParams = {
      resumeSkills,
      jobDescription,
      modelName
    };
    
    // Set either resumeDocument or resumeFilePath based on the input
    if (resumeDocumentOrFilePath) {
      if (isFilePath) {
        params.resumeFilePath = resumeDocumentOrFilePath;
      } else {
        params.resumeDocument = resumeDocumentOrFilePath;
      }
    }
    
    return currentProvider === "openai"
      ? await openaiService.matchJobSkills(params)
      : await geminiService.matchJobSkills(params);
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
    const modelName = config.providers[currentProvider].currentModel;
    
    const params: CoverLetterParams = {
      resumeText,
      jobDescription,
      additionalInfo,
      modelName
    };
    
    return currentProvider === "openai"
      ? await openaiService.generateCoverLetter(params)
      : await geminiService.generateCoverLetter(params);
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
    const modelName = config.providers[currentProvider].currentModel;
    
    const params: ChatParams = {
      messages,
      userId,
      modelName
    };
    
    return currentProvider === "openai"
      ? await openaiService.chatWithAssistant(params)
      : await geminiService.chatWithAssistant(params);
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
    const modelName = config.providers[currentProvider].currentModel;
    
    const params: ImprovementParams = {
      resumeText,
      targetJob,
      modelName
    };
    
    return currentProvider === "openai"
      ? await openaiService.suggestResumeImprovements(params)
      : await geminiService.suggestResumeImprovements(params);
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