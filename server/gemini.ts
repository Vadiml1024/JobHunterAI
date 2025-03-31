import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from "@google/generative-ai";
import { 
  AnalyzeResumeParams, 
  MatchJobSkillsParams, 
  CoverLetterParams, 
  ChatParams, 
  ImprovementParams 
} from "./llm-params";
import { config } from "./config";

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Function to get the model based on model name parameter
function getGeminiModel(modelName: string = "gemini-pro"): GenerativeModel {
  return genAI.getGenerativeModel({ model: modelName });
}

// Default generation config
const defaultConfig: GenerationConfig = {
  temperature: 0.7,
  topP: 0.8,
  topK: 40,
};

/**
 * Fetch available Gemini models using the API
 * @returns Array of available model names
 */
export async function fetchGeminiModels(): Promise<string[]> {
  try {
    // Build the URL with the API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    // Make the HTTP request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Gemini models: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Filter for generative models only
    const modelNames = data.models
      ?.filter((model: any) => model.name.includes('gemini'))
      ?.map((model: any) => model.name.split('/').pop())
      ?.filter(Boolean) || [];
    
    // If no models were found, return the default models
    if (modelNames.length === 0) {
      return ["gemini-pro", "gemini-pro-vision"];
    }
    
    return modelNames;
  } catch (error) {
    console.error("Error fetching Gemini models:", error);
    // Return default models if the API call fails
    return ["gemini-pro", "gemini-pro-vision"];
  }
}

/**
 * Analyze a resume text using Gemini
 * @param params Parameters for resume analysis
 * @returns Analysis results including skills, experience, education and summary
 */
import { extractTextFromFile } from './upload';

import * as fs from 'fs';

export async function analyzeResume(params: AnalyzeResumeParams): Promise<{
  skills: string[];
  experience: string[];
  education: string[];
  summary: string;
}> {
  const { resumeText, resumeFilePath, modelName = "gemini-pro", temperature = 0.2 } = params;
  
  // Check if we should skip local text extraction
  const skipLocalTextExtraction = config.features.skipLocalTextExtraction;
  
  // Handle different resume input methods based on settings
  let resumeContent: string;
  
  try {
    if (resumeFilePath) {
      if (skipLocalTextExtraction) {
        // Skip local text extraction and use direct file processing approach
        console.log(`Using direct file processing for resume analysis with Gemini: ${resumeFilePath}`);
        
        // Get the file extension to determine MIME type
        const fileExtension = resumeFilePath.split('.').pop()?.toLowerCase();
        let mimeType = 'application/octet-stream'; // Default MIME type
        
        // Set appropriate MIME type based on file extension
        if (fileExtension === 'pdf') {
          mimeType = 'application/pdf';
        } else if (fileExtension === 'docx') {
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else if (fileExtension === 'doc') {
          mimeType = 'application/msword';
        }
        
        // Read the file as a buffer and convert to base64
        const fileBuffer = fs.readFileSync(resumeFilePath);
        const base64Data = fileBuffer.toString('base64');
        
        const model = getGeminiModel(modelName);
        
        // Create the contents array with user instruction text and file data
        const contents = [
          { 
            role: "user", 
            parts: [
              { 
                text: "Analyze this resume document and extract key information. Return ONLY a JSON object with this structure: { \"skills\": [array of technical and soft skills], \"experience\": [array of work experiences with company and position], \"education\": [array of educational qualifications], \"summary\": \"brief professional summary\" }"
              },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ];
        
        // Make the API request with the file data
        const result = await model.generateContent({
          contents,
          generationConfig: {
            ...defaultConfig,
            temperature,
            topP: params.topP,
            topK: params.topK,
            maxOutputTokens: params.maxTokens,
          },
        });
        
        const responseText = result.response.text();
        console.log('Gemini response for direct file analysis:', responseText);
        
        // Extract the JSON object from the response
        const jsonString = responseText.match(/\{[\s\S]*\}/)?.[0] || "{}";
        console.log('Extracted JSON string:', jsonString);
        
        const analysisResult = JSON.parse(jsonString);
        console.log('Parsed analysis result:', analysisResult);
        
        // Check if experience and education are arrays or strings
        let experienceData = analysisResult.experience || [];
        let educationData = analysisResult.education || [];
        
        // If experience or education is a string, keep it as is
        if (typeof experienceData === 'string') {
          experienceData = experienceData;
        } else if (!Array.isArray(experienceData)) {
          experienceData = [];
        }
        
        if (typeof educationData === 'string') {
          educationData = educationData;
        } else if (!Array.isArray(educationData)) {
          educationData = [];
        }
        
        const analysisOutput = {
          skills: analysisResult.skills || [],
          experience: experienceData,
          education: educationData,
          summary: analysisResult.summary || "",
        };
        
        console.log('Final analysis result to return:', analysisOutput);
        
        return analysisOutput;
        
      } else {
        // Extract text from the file using local processing
        resumeContent = await extractTextFromFile(resumeFilePath);
      }
    } else if (resumeText) {
      // Use the provided resume text
      resumeContent = resumeText;
    } else {
      throw new Error("Either resumeText or resumeFilePath must be provided");
    }
    
    // If we're using text (either extracted or provided), process it using the standard approach
    if (resumeContent) {
      const prompt = `
      You are an expert resume analyst with years of experience in HR and recruitment.
      Please analyze the following resume and extract key information.
      
      Resume text:
      ${resumeContent}
      
      Please extract and return ONLY a JSON object with the following structure:
      {
        "skills": [array of technical and soft skills present in the resume],
        "experience": [array of work experiences with company and position],
        "education": [array of educational qualifications],
        "summary": "brief professional summary based on the resume"
      }
      
      Return ONLY the JSON object, no other text.
      `;
      
      const model = getGeminiModel(modelName);
      const generationResult = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          ...defaultConfig,
          temperature,
          topP: params.topP,
          topK: params.topK,
          maxOutputTokens: params.maxTokens,
        },
      });
  
      const responseText = generationResult.response.text();
      console.log('Gemini response for text analysis:', responseText);
      
      // Extract the JSON object from the response
      const jsonString = responseText.match(/\{[\s\S]*\}/)?.[0] || "{}";
      console.log('Extracted JSON string:', jsonString);
      
      const analysisResult = JSON.parse(jsonString);
      console.log('Parsed analysis result:', analysisResult);
      
      // Check if experience and education are arrays or strings
      let experienceData = analysisResult.experience || [];
      let educationData = analysisResult.education || [];
      
      // If experience or education is a string, keep it as is
      if (typeof experienceData === 'string') {
        experienceData = experienceData;
      } else if (!Array.isArray(experienceData)) {
        experienceData = [];
      }
      
      if (typeof educationData === 'string') {
        educationData = educationData;
      } else if (!Array.isArray(educationData)) {
        educationData = [];
      }
      
      const textAnalysisOutput = {
        skills: analysisResult.skills || [],
        experience: experienceData,
        education: educationData,
        summary: analysisResult.summary || "",
      };
      
      console.log('Final analysis result to return:', textAnalysisOutput);
      
      return textAnalysisOutput;
    }
    
    throw new Error("Failed to process resume input");
  } catch (error) {
    console.error("Error analyzing resume with Gemini:", error);
    throw new Error("Failed to analyze resume: " + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Match job skills with user resume skills
 * @param params Parameters for job skills matching
 * @returns Match analysis with percentage and skill breakdown
 */
export async function matchJobSkills(params: MatchJobSkillsParams): Promise<{
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
}> {
  const { 
    resumeSkills, 
    jobDescription, 
    resumeDocument = "", 
    resumeFilePath = "",
    modelName = "gemini-pro", 
    temperature = 0.3 
  } = params;
  
  // Check if we should skip local text extraction
  const skipLocalTextExtraction = config.features.skipLocalTextExtraction;
  
  try {
    // Handle different resume input scenarios
    if (resumeFilePath && skipLocalTextExtraction) {
      // For direct file analysis with Gemini
      console.log(`Using direct file processing for job skills matching with Gemini: ${resumeFilePath}`);
      
      // Get the file extension to determine MIME type
      const fileExtension = resumeFilePath.split('.').pop()?.toLowerCase();
      let mimeType = 'application/octet-stream'; // Default MIME type
      
      // Set appropriate MIME type based on file extension
      if (fileExtension === 'pdf') {
        mimeType = 'application/pdf';
      } else if (fileExtension === 'docx') {
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (fileExtension === 'doc') {
        mimeType = 'application/msword';
      }
      
      // Read the file as a buffer and convert to base64
      const fileBuffer = fs.readFileSync(resumeFilePath);
      const base64Data = fileBuffer.toString('base64');
      
      const model = getGeminiModel(modelName);
      
      // Create the contents array with job description text and resume file data
      const contents = [
        { 
          role: "user", 
          parts: [
            { 
              text: `Analyze this resume document and compare it with the following job description:
              
${jobDescription}

Extract the required skills from the job description, the skills from my resume, and determine how well they match.
Return ONLY a JSON object with this structure:
{
  "requiredSkills": [array of skills required for the job],
  "matchedSkills": [array of skills from my resume that match the job requirements],
  "missingSkills": [array of skills required for the job that are missing from my resume],
  "matchPercentage": numerical percentage of how well my skills match the job requirements
}
Return ONLY the JSON object, no other text.`
            },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ];
      
      // Make the API request with the file data
      const result = await model.generateContent({
        contents,
        generationConfig: {
          ...defaultConfig,
          temperature,
          topP: params.topP,
          topK: params.topK,
          maxOutputTokens: params.maxTokens,
        },
      });
      
      const responseText = result.response.text();
      // Extract the JSON object from the response
      const jsonString = responseText.match(/\{[\s\S]*\}/)?.[0] || "{}";
      const analysisResult = JSON.parse(jsonString);
      
      return {
        matchPercentage: analysisResult.matchPercentage || 0,
        matchedSkills: analysisResult.matchedSkills || [],
        missingSkills: analysisResult.missingSkills || [],
      };
      
    } else {
      // Standard text-based approach
      let fullResumeContent = resumeDocument;
      if (resumeFilePath && !resumeDocument) {
        fullResumeContent = await extractTextFromFile(resumeFilePath);
      }
      
      const prompt = `
      You are an AI expert in job matching and skills analysis.
      
      I have a job description and my resume.
      
      ${fullResumeContent ? `Full resume document:
      ${fullResumeContent}
      
      ` : `Resume skills: ${resumeSkills.join(", ")}
      
      `}Job description:
      ${jobDescription}
      
      Please analyze the job description and extract the required skills. Then compare them with my resume skills.
      Return ONLY a JSON object with the following structure:
      {
        "requiredSkills": [array of skills required for the job],
        "matchedSkills": [array of my skills that match the job requirements],
        "missingSkills": [array of skills required for the job that are missing from my resume],
        "matchPercentage": numerical percentage of how well my skills match the job requirements
      }
      
      Return ONLY the JSON object, no other text.
      `;
      
      const model = getGeminiModel(modelName);
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          ...defaultConfig,
          temperature,
          topP: params.topP,
          topK: params.topK,
          maxOutputTokens: params.maxTokens,
        },
      });
      
      const responseText = result.response.text();
      // Extract the JSON object from the response
      const jsonString = responseText.match(/\{[\s\S]*\}/)?.[0] || "{}";
      const analysisResult = JSON.parse(jsonString);
      
      return {
        matchPercentage: analysisResult.matchPercentage || 0,
        matchedSkills: analysisResult.matchedSkills || [],
        missingSkills: analysisResult.missingSkills || [],
      };
    }
  } catch (error) {
    console.error("Error matching job skills with Gemini:", error);
    throw new Error("Failed to match job skills: " + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Generate a cover letter based on resume and job description
 * @param params Parameters for cover letter generation
 * @returns Generated cover letter
 */
export async function generateCoverLetter(params: CoverLetterParams): Promise<string> {
  const { 
    resumeText, 
    jobDescription, 
    additionalInfo = "", 
    modelName = "gemini-pro", 
    temperature = 0.7,
    maxTokens = 1024
  } = params;
  
  const prompt = `
  You are a professional cover letter writer with years of experience.
  
  Please create a personalized cover letter based on my resume and the job description.
  
  My resume:
  ${resumeText}
  
  Job description:
  ${jobDescription}
  
  Additional information:
  ${additionalInfo}
  
  Create a professional, compelling cover letter that highlights my relevant skills and experience for this specific job.
  Make it concise (no more than 400 words), well-structured, and persuasive.
  Avoid generic language and clichés. Focus on specific achievements and how they relate to the job requirements.
  `;

  try {
    const model = getGeminiModel(modelName);
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        ...defaultConfig,
        temperature,
        topP: params.topP,
        topK: params.topK,
        maxOutputTokens: maxTokens,
      },
    });

    return result.response.text();
  } catch (error) {
    console.error("Error generating cover letter with Gemini:", error);
    throw new Error("Failed to generate cover letter");
  }
}

/**
 * Chat with AI job search assistant
 * @param params Parameters for chat interaction
 * @returns AI response to continue the conversation
 */
export async function chatWithAssistant(params: ChatParams): Promise<string> {
  try {
    const { 
      messages, 
      modelName = "gemini-pro", 
      temperature = 0.7, 
      maxTokens = 800,
    } = params;
    
    // Extract system message if available
    const systemMessage = messages.find(msg => msg.role === "system")?.content || 
      "You are JobAI, an advanced job search assistant powered by AI. Help users find jobs, improve their resumes, prepare for interviews, and provide career advice. Be concise, helpful, and professional.";
    
    // Find the most recent user message
    const userMessages = messages.filter(msg => msg.role === "user");
    if (userMessages.length === 0) {
      throw new Error("No user messages found in the chat history");
    }
    
    const lastUserMessage = userMessages[userMessages.length - 1].content;
    
    // For Gemini, we'll avoid using chat history and instead construct a prompt that includes
    // context from previous messages to avoid the role ordering issues
    let fullPrompt = `${systemMessage}\n\n`;
    
    // Add conversation context (simplify to avoid role issues)
    if (messages.length > 1) {
      const contextMessages = messages.filter(msg => 
        msg.role !== "system" && 
        msg !== userMessages[userMessages.length - 1] // Exclude the last user message
      );
      
      // Add context from previous messages
      if (contextMessages.length > 0) {
        fullPrompt += "Previous conversation:\n";
        for (const msg of contextMessages) {
          const role = msg.role === "user" ? "User" : "Assistant";
          fullPrompt += `${role}: ${msg.content}\n`;
        }
        fullPrompt += "\n";
      }
    }
    
    // Add the current user query
    fullPrompt += `User: ${lastUserMessage}\n\nAssistant: `;
    
    // Use simple generateContent approach instead of chat to avoid role issues
    const model = getGeminiModel(modelName);
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig: {
        ...defaultConfig,
        temperature,
        topP: params.topP,
        topK: params.topK,
        maxOutputTokens: maxTokens,
      },
    });
    
    return result.response.text();
  } catch (error) {
    console.error("Error chatting with Gemini assistant:", error);
    throw new Error("Failed to chat with assistant");
  }
}

/**
 * Suggest improvements for a resume
 * @param params Parameters for resume improvement suggestions
 * @returns Array of suggested improvements
 */
export async function suggestResumeImprovements(params: ImprovementParams): Promise<string[]> {
  const { 
    resumeText, 
    targetJob = "", 
    modelName = "gemini-pro", 
    temperature = 0.4,
  } = params;
  
  const prompt = `
  You are an expert resume coach with years of experience helping job seekers improve their resumes.
  
  Please analyze the following resume ${targetJob ? `for a ${targetJob} position` : ""}:
  
  ${resumeText}
  
  Provide specific, actionable suggestions to improve this resume. Focus on:
  1. Content and phrasing
  2. Structure and organization
  3. Skills presentation
  4. Achievement highlighting
  5. ATS optimization
  
  Return ONLY a JSON array of suggestions, with each suggestion being clear and specific.
  Example: ["Add measurable achievements to your work experience", "Use more action verbs in your descriptions"]
  
  Return ONLY the JSON array, no other text.
  `;

  try {
    const model = getGeminiModel(modelName);
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        ...defaultConfig,
        temperature,
        topP: params.topP,
        topK: params.topK,
        maxOutputTokens: params.maxTokens,
      },
    });

    const responseText = result.response.text();
    // Extract the JSON array from the response
    const jsonString = responseText.match(/\[[\s\S]*\]/)?.[0] || "[]";
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error suggesting resume improvements with Gemini:", error);
    throw new Error("Failed to suggest resume improvements");
  }
}