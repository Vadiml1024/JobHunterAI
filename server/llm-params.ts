/**
 * Common parameter interfaces for LLM service functions
 * This ensures consistency between different LLM providers (OpenAI and Gemini)
 */

// Common base parameters that apply to all LLM requests
export interface BaseLLMParams {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

// Parameters for analyzeResume
export interface AnalyzeResumeParams extends BaseLLMParams {
  resumeText: string;
  modelName?: string;
}

// Parameters for matchJobSkills
export interface MatchJobSkillsParams extends BaseLLMParams {
  resumeSkills: string[];
  jobDescription: string;
  modelName?: string;
}

// Parameters for generateCoverLetter
export interface CoverLetterParams extends BaseLLMParams {
  resumeText: string;
  jobDescription: string;
  additionalInfo?: string;
  modelName?: string;
}

// Parameters for chatWithAssistant
export interface ChatParams extends BaseLLMParams {
  messages: { role: string; content: string }[];
  userId?: number;
  modelName?: string;
}

// Parameters for suggestResumeImprovements
export interface ImprovementParams extends BaseLLMParams {
  resumeText: string;
  targetJob?: string;
  modelName?: string;
}