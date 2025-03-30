import OpenAI from "openai";
import { 
  AnalyzeResumeParams, 
  MatchJobSkillsParams, 
  CoverLetterParams, 
  ChatParams, 
  ImprovementParams 
} from "./llm-params";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Fetch available OpenAI models using the API
 * @returns Array of available model names suitable for chat completions
 */
export async function fetchOpenAIModels(): Promise<string[]> {
  try {
    // Only proceed if we have an API key
    if (!process.env.OPENAI_API_KEY) {
      console.log("OpenAI API key not found, skipping model fetch");
      return [];
    }

    // Fetch all models
    const response = await openai.models.list();
    
    // Filter models that are suitable for chat completions (GPT models)
    const chatModels = response.data
      .filter(model => 
        // Filter for models that start with "gpt-" as these are chat completion models
        model.id.startsWith('gpt-')
      )
      .map(model => model.id);
    
    console.log(`Found ${chatModels.length} OpenAI chat models`);
    return chatModels;
  } catch (error) {
    console.error("Error fetching OpenAI models:", error);
    // Return empty array if failed
    return [];
  }
}

// Analyze resume and extract skills
export async function analyzeResume(params: AnalyzeResumeParams): Promise<{
  skills: string[],
  experience: string[],
  education: string[],
  summary: string
}> {
  try {
    const { resumeText, modelName = "gpt-4o", temperature = 0.2 } = params;
    
    const response = await openai.chat.completions.create({
      model: modelName,
      temperature,
      max_tokens: params.maxTokens,
      top_p: params.topP,
      messages: [
        {
          role: "system",
          content:
            "You are a resume analysis expert. Extract key information from the provided resume and respond with JSON in this format: { 'skills': string[], 'experience': string[], 'education': string[], 'summary': string }",
        },
        {
          role: "user",
          content: resumeText,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Failed to get content from OpenAI response");
    }
    
    const result = JSON.parse(content);
    return result;
  } catch (error) {
    console.error("Failed to analyze resume:", error);
    throw new Error("Failed to analyze resume: " + (error as Error).message);
  }
}

// Match skills with job requirements
export async function matchJobSkills(params: MatchJobSkillsParams): Promise<{
  matchPercentage: number,
  matchedSkills: string[],
  missingSkills: string[]
}> {
  try {
    const { resumeSkills, jobDescription, modelName = "gpt-4o", temperature = 0.3 } = params;
    
    const response = await openai.chat.completions.create({
      model: modelName,
      temperature,
      max_tokens: params.maxTokens,
      top_p: params.topP,
      messages: [
        {
          role: "system",
          content:
            "You are a job matching expert. Given a list of candidate skills and a job description, determine the match percentage, skills that match, and skills that are missing. Respond with JSON in this format: { 'matchPercentage': number, 'matchedSkills': string[], 'missingSkills': string[] }",
        },
        {
          role: "user",
          content: `Candidate skills: ${resumeSkills.join(', ')}\n\nJob description: ${jobDescription}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Failed to get content from OpenAI response");
    }
    
    const result = JSON.parse(content);
    return result;
  } catch (error) {
    console.error("Failed to match job skills:", error);
    throw new Error("Failed to match job skills: " + (error as Error).message);
  }
}

// Generate customized cover letter
export async function generateCoverLetter(params: CoverLetterParams): Promise<string> {
  try {
    const { 
      resumeText, 
      jobDescription, 
      additionalInfo = "", 
      modelName = "gpt-4o", 
      temperature = 0.7,
      maxTokens = 1024
    } = params;
    
    const response = await openai.chat.completions.create({
      model: modelName,
      temperature,
      max_tokens: maxTokens,
      top_p: params.topP,
      messages: [
        {
          role: "system",
          content:
            "You are a professional cover letter writer. Create a personalized cover letter based on the provided resume and job description.",
        },
        {
          role: "user",
          content: `Resume: ${resumeText}\n\nJob description: ${jobDescription}\n\nAdditional information: ${additionalInfo}\n\nPlease write a professional cover letter.`,
        },
      ],
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Failed to generate cover letter:", error);
    throw new Error("Failed to generate cover letter: " + (error as Error).message);
  }
}

// Chat with job search assistant
export async function chatWithAssistant(params: ChatParams): Promise<string> {
  try {
    const { messages, userId, modelName = "gpt-4o", temperature = 0.7, maxTokens } = params;
    
    const systemMessage = {
      role: "system" as const,
      content: "You are JobAI, an advanced job search assistant powered by AI. Help users find jobs, improve their resumes, prepare for interviews, and provide career advice. Be concise, helpful, and professional."
    };
    
    // Convert messages to the OpenAI required format with proper typing
    const formattedMessages = messages.map(msg => ({
      role: (msg.role === "user" || msg.role === "assistant" || msg.role === "system") 
            ? msg.role as "user" | "assistant" | "system"
            : "user", // Default to user if invalid role
      content: msg.content
    }));
    
    const conversationHistory = [systemMessage, ...formattedMessages];
    
    const response = await openai.chat.completions.create({
      model: modelName,
      temperature,
      max_tokens: maxTokens,
      top_p: params.topP,
      messages: conversationHistory,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Failed to chat with assistant:", error);
    throw new Error("Failed to chat with assistant: " + (error as Error).message);
  }
}

// Suggest resume improvements
export async function suggestResumeImprovements(params: ImprovementParams): Promise<string[]> {
  try {
    const { resumeText, targetJob = "", modelName = "gpt-4o", temperature = 0.4 } = params;
    
    let prompt = "Analyze this resume and suggest specific improvements:";
    if (targetJob) {
      prompt += ` Focus on making it more appealing for ${targetJob} positions.`;
    }
    
    const response = await openai.chat.completions.create({
      model: modelName,
      temperature,
      max_tokens: params.maxTokens,
      top_p: params.topP,
      messages: [
        {
          role: "system",
          content:
            "You are a resume optimization expert. Provide actionable suggestions to improve the resume. Respond with JSON as an array of strings with each suggestion: ['suggestion1', 'suggestion2', ...]",
        },
        {
          role: "user",
          content: `${prompt}\n\nResume: ${resumeText}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Failed to get content from OpenAI response");
    }
    
    const result = JSON.parse(content);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Failed to suggest resume improvements:", error);
    throw new Error("Failed to suggest resume improvements: " + (error as Error).message);
  }
}
