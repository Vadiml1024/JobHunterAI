import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from "@google/generative-ai";

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
 * @param resumeText The content of the resume to analyze
 * @param modelName The name of the Gemini model to use
 * @returns Analysis results including skills, experience, education and summary
 */
export async function analyzeResume(
  resumeText: string,
  modelName: string = "gemini-pro"
): Promise<{
  skills: string[];
  experience: string[];
  education: string[];
  summary: string;
}> {
  const prompt = `
  You are an expert resume analyst with years of experience in HR and recruitment.
  Please analyze the following resume and extract key information.
  
  Resume text:
  ${resumeText}
  
  Please extract and return ONLY a JSON object with the following structure:
  {
    "skills": [array of technical and soft skills present in the resume],
    "experience": [array of work experiences with company and position],
    "education": [array of educational qualifications],
    "summary": "brief professional summary based on the resume"
  }
  
  Return ONLY the JSON object, no other text.
  `;

  try {
    const model = getGeminiModel(modelName);
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        ...defaultConfig,
        temperature: 0.2, // Lower temperature for more factual responses
      },
    });

    const responseText = result.response.text();
    // Extract the JSON object from the response
    const jsonString = responseText.match(/\{[\s\S]*\}/)?.[0] || "{}";
    const analysisResult = JSON.parse(jsonString);

    return {
      skills: analysisResult.skills || [],
      experience: analysisResult.experience || [],
      education: analysisResult.education || [],
      summary: analysisResult.summary || "",
    };
  } catch (error) {
    console.error("Error analyzing resume with Gemini:", error);
    throw new Error("Failed to analyze resume");
  }
}

/**
 * Match job skills with user resume skills
 * @param resumeSkills Array of skills from the user's resume
 * @param jobDescription The job description to analyze
 * @returns Match analysis with percentage and skill breakdown
 */
export async function matchJobSkills(
  resumeSkills: string[],
  jobDescription: string,
  modelName: string = "gemini-pro"
): Promise<{
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
}> {
  const prompt = `
  You are an AI expert in job matching and skills analysis.
  
  I have a job description and a list of skills from my resume.
  
  Resume skills: ${resumeSkills.join(", ")}
  
  Job description:
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

  try {
    const model = getGeminiModel(modelName);
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        ...defaultConfig,
        temperature: 0.3,
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
  } catch (error) {
    console.error("Error matching job skills with Gemini:", error);
    throw new Error("Failed to match job skills");
  }
}

/**
 * Generate a cover letter based on resume and job description
 * @param resumeText The content of the user's resume
 * @param jobDescription The job description
 * @param additionalInfo Any additional information or preferences
 * @returns Generated cover letter
 */
export async function generateCoverLetter(
  resumeText: string,
  jobDescription: string,
  additionalInfo: string = "",
  modelName: string = "gemini-pro"
): Promise<string> {
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
        temperature: 0.7,
        maxOutputTokens: 1024,
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
 * @param messages Array of previous chat messages
 * @returns AI response to continue the conversation
 */
export async function chatWithAssistant(
  messages: { role: string; content: string }[],
  modelName: string = "gemini-pro"
): Promise<string> {
  try {
    // Format messages for Gemini
    const formattedMessages = messages.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    // Create a chat session
    const model = getGeminiModel(modelName);
    const chat = model.startChat({
      generationConfig: {
        ...defaultConfig,
        maxOutputTokens: 800,
      },
      history: formattedMessages.slice(0, -1) as any, // Add all but the last message to history
    });

    // Send the last message to get a response
    const lastMessage = formattedMessages[formattedMessages.length - 1];
    const result = await chat.sendMessage(lastMessage.parts[0].text);
    
    return result.response.text();
  } catch (error) {
    console.error("Error chatting with Gemini assistant:", error);
    throw new Error("Failed to chat with assistant");
  }
}

/**
 * Suggest improvements for a resume
 * @param resumeText The content of the resume
 * @param targetJob Optional target job to tailor suggestions
 * @returns Array of suggested improvements
 */
export async function suggestResumeImprovements(
  resumeText: string,
  targetJob: string = "",
  modelName: string = "gemini-pro"
): Promise<string[]> {
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
        temperature: 0.4,
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