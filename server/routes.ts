import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertResumeSchema, insertApplicationSchema, insertJobSchema, type Job } from "@shared/schema";
import { z } from "zod";
import * as llmService from "./llm-service";
import { LLMProvider } from "./config";
import { upload, extractTextFromFile } from "./upload";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Resume routes
  app.get("/api/resumes", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const resumes = await storage.getResumes(req.user.id);
    res.json(resumes);
  });

  app.get("/api/resumes/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const resume = await storage.getResume(parseInt(req.params.id));
    if (!resume) return res.status(404).send("Resume not found");
    if (resume.userId !== req.user.id) return res.status(403).send("Forbidden");
    
    res.json(resume);
  });

  // Serve uploaded files
  app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    next();
  }, express.static(path.join(process.cwd(), 'uploads')));

  app.post("/api/resumes", upload.single('file'), async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      // We need to handle multipart form data differently
      const { name, language } = req.body;
      
      // Check required fields
      if (!name) {
        return res.status(400).json({ error: "Resume name is required" });
      }
      
      let fileUrl = null;
      let content = null;
      let skills = null;
      let matchScore = 70; // Default score for now
      
      // If a file was uploaded, save its path and extract content
      if (req.file) {
        fileUrl = `/uploads/${path.basename(req.file.path)}`;
        content = await extractTextFromFile(req.file.path);
        
        // If we have content, analyze it to extract skills
        if (content) {
          try {
            console.log("Analyzing resume content to extract skills...");
            const analysis = await llmService.analyzeResume(content);
            if (analysis && analysis.skills && Array.isArray(analysis.skills)) {
              skills = analysis.skills;
              console.log(`Extracted ${skills.length} skills from resume`);
            }
          } catch (analysisError) {
            console.error("Error analyzing resume:", analysisError);
            // Continue without skills rather than failing the upload
          }
        }
      }
      
      // Create resume data object
      const resumeData = {
        userId: req.user.id,
        name,
        language: language || "English",
        content,
        fileUrl,
        skills,
        matchScore
      };
      
      // Validate and save
      const validatedData = insertResumeSchema.parse(resumeData);
      const resume = await storage.createResume(validatedData);
      
      // If we didn't get skills during initial analysis but created the resume,
      // analyze it in the background and update later
      if (!skills && content) {
        (async () => {
          try {
            console.log("Running background analysis for resume ID:", resume.id);
            const analysis = await llmService.analyzeResume(content);
            if (analysis && analysis.skills && Array.isArray(analysis.skills)) {
              await storage.updateResume(resume.id, { 
                skills: analysis.skills 
              });
              console.log(`Updated resume ${resume.id} with ${analysis.skills.length} skills`);
            }
          } catch (bgError) {
            console.error("Background resume analysis failed:", bgError);
          }
        })();
      }
      
      res.status(201).json(resume);
    } catch (error) {
      console.error("Resume upload error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).send("Internal Server Error");
    }
  });

  app.put("/api/resumes/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const resume = await storage.getResume(parseInt(req.params.id));
    if (!resume) return res.status(404).send("Resume not found");
    if (resume.userId !== req.user.id) return res.status(403).send("Forbidden");
    
    try {
      const updatedResume = await storage.updateResume(parseInt(req.params.id), req.body);
      res.json(updatedResume);
    } catch (error) {
      res.status(500).send("Internal Server Error");
    }
  });

  app.delete("/api/resumes/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const resume = await storage.getResume(parseInt(req.params.id));
    if (!resume) return res.status(404).send("Resume not found");
    if (resume.userId !== req.user.id) return res.status(403).send("Forbidden");
    
    const success = await storage.deleteResume(parseInt(req.params.id));
    if (success) {
      res.status(204).send();
    } else {
      res.status(500).send("Failed to delete resume");
    }
  });

  // Resume analysis routes
  app.post("/api/resumes/analyze", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const { resumeText } = req.body;
      if (!resumeText) return res.status(400).send("Resume text is required");
      
      const analysis = await llmService.analyzeResume(resumeText);
      res.json(analysis);
    } catch (error) {
      res.status(500).send((error as Error).message);
    }
  });
  
  // Analyze an existing resume by ID
  app.post("/api/resumes/:id/analyze", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const resumeId = parseInt(req.params.id);
      const resume = await storage.getResume(resumeId);
      
      if (!resume) {
        return res.status(404).send("Resume not found");
      }
      
      if (resume.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      if (!resume.content) {
        return res.status(400).send("Resume has no content to analyze");
      }
      
      // Call LLM to analyze resume
      const analysis = await llmService.analyzeResume(resume.content);
      
      if (!analysis || !analysis.skills) {
        return res.status(500).send("Failed to extract skills from resume");
      }
      
      // Update resume with extracted skills
      const updatedResume = await storage.updateResume(resumeId, {
        skills: analysis.skills
      });
      
      res.json({
        success: true,
        resume: updatedResume,
        skills: analysis.skills
      });
    } catch (error) {
      console.error("Resume analysis error:", error);
      res.status(500).send((error as Error).message);
    }
  });
  
  app.post("/api/resumes/improve", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const { resumeText, targetJobTitle } = req.body;
      if (!resumeText) return res.status(400).send("Resume text is required");
      
      const suggestions = await llmService.suggestResumeImprovements(resumeText, targetJobTitle);
      res.json(suggestions);
    } catch (error) {
      res.status(500).send((error as Error).message);
    }
  });

  // Job routes
  app.get("/api/jobs", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const filters: any = {};
    
    // Basic filters
    if (req.query.title) filters.title = req.query.title;
    if (req.query.company) filters.company = req.query.company;
    if (req.query.location) filters.location = req.query.location;
    
    // Filter by job type
    if (req.query.jobType) {
      const jobTypes = Array.isArray(req.query.jobType) 
        ? req.query.jobType 
        : [req.query.jobType];
        
      // Convert UI filter format to match database format
      // The database has "Full-time" but the UI sends "fulltime"
      const mappedJobTypes = jobTypes.map(type => {
        if (type === 'fulltime') return 'Full-time';
        if (type === 'parttime') return 'Part-time';
        if (type === 'contract') return 'Contract';
        if (type === 'internship') return 'Internship';
        return type;
      });
      
      // Special handling for job type to filter by each selected value
      filters.jobType = (job: Job) => {
        return mappedJobTypes.includes(job.jobType || '');
      };
    }
    
    // Filter by remote option
    if (req.query.remoteOptions) {
      const remoteOptions = Array.isArray(req.query.remoteOptions) 
        ? req.query.remoteOptions 
        : [req.query.remoteOptions];
      
      // Map remote options to match database format
      const mappedRemoteOptions = remoteOptions.map(option => {
        if (option === 'remote') return 'Remote';
        if (option === 'hybrid') return 'Hybrid';
        if (option === 'onsite') return 'On-site';
        return option;
      });
      
      filters.remoteOption = (job: Job) => {
        return mappedRemoteOptions.includes(job.remoteOption || '');
      };
    }
    
    // If query parameter is provided, search through titles and descriptions
    if (req.query.query) {
      const query = (req.query.query as string).toLowerCase();
      
      // Special handling for search query
      filters._query = (job: Job) => {
        return (
          job.title.toLowerCase().includes(query) ||
          (job.description && job.description.toLowerCase().includes(query)) ||
          job.company.toLowerCase().includes(query)
        );
      };
    }
    
    const jobs = await storage.getJobs(Object.keys(filters).length > 0 ? filters : undefined);
    res.json(jobs);
  });

  app.get("/api/jobs/recommended", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
    const recommendedJobs = await storage.getRecommendedJobs(req.user.id, limit);
    res.json(recommendedJobs);
  });

  app.get("/api/jobs/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const job = await storage.getJob(parseInt(req.params.id));
    if (!job) return res.status(404).send("Job not found");
    
    res.json(job);
  });

  app.post("/api/jobs/match", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const { resumeSkills, jobDescription } = req.body;
      if (!resumeSkills || !jobDescription) {
        return res.status(400).send("Resume skills and job description are required");
      }
      
      const matchResult = await llmService.matchJobSkills(resumeSkills, jobDescription);
      res.json(matchResult);
    } catch (error) {
      res.status(500).send((error as Error).message);
    }
  });

  // Application routes
  app.get("/api/applications", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const applications = await storage.getApplications(req.user.id);
    res.json(applications);
  });

  app.post("/api/applications", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const applicationData = insertApplicationSchema.parse({ ...req.body, userId: req.user.id });
      const application = await storage.createApplication(applicationData);
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).send("Internal Server Error");
    }
  });

  app.put("/api/applications/:id/status", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const { status } = req.body;
    if (!status) return res.status(400).send("Status is required");
    
    const application = await storage.getApplication(parseInt(req.params.id));
    if (!application) return res.status(404).send("Application not found");
    if (application.userId !== req.user.id) return res.status(403).send("Forbidden");
    
    const updatedApplication = await storage.updateApplicationStatus(parseInt(req.params.id), status);
    res.json(updatedApplication);
  });

  // Cover letter generation
  app.post("/api/cover-letter", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const { resumeText, jobDescription, candidateName } = req.body;
      if (!resumeText || !jobDescription) {
        return res.status(400).send("Resume text and job description are required");
      }
      
      const coverLetter = await llmService.generateCoverLetter(
        resumeText, 
        jobDescription,
        candidateName || req.user.name || "Candidate"
      );
      res.json({ coverLetter });
    } catch (error) {
      res.status(500).send((error as Error).message);
    }
  });

  // Chat assistant
  app.post("/api/chat", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).send("Valid messages array is required");
      }
      
      // Validate message format
      const validRoles = ["user", "assistant", "system"];
      const isValidMessages = messages.every(msg => 
        msg && typeof msg === "object" && 
        typeof msg.content === "string" && 
        validRoles.includes(msg.role)
      );
      
      if (!isValidMessages) {
        return res.status(400).send("Invalid message format. Each message must have 'role' and 'content' properties.");
      }
      
      // Make sure we have at least one user message
      if (!messages.some(msg => msg.role === "user")) {
        return res.status(400).send("At least one user message is required");
      }
      
      const response = await llmService.chatWithAssistant(messages, req.user.id);
      res.json({ response });
    } catch (error) {
      console.error("Chat API error:", error);
      res.status(500).send((error as Error).message);
    }
  });
  
  // LLM Provider settings
  app.get("/api/llm-providers", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const providersInfo = llmService.getProvidersInfo();
    res.json(providersInfo);
  });
  
  app.post("/api/llm-providers/set", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const { provider } = req.body;
    if (!provider) return res.status(400).send("Provider name is required");
    
    const success = llmService.setProvider(provider);
    if (!success) {
      return res.status(400).send(`Provider '${provider}' is not available`);
    }
    
    res.json({ provider, success });
  });
  
  app.post("/api/llm-providers/model", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const { provider, model } = req.body;
    if (!provider || !model) {
      return res.status(400).send("Provider and model are required");
    }
    
    const success = llmService.setProviderModel(provider, model);
    if (!success) {
      return res.status(400).send(`Model '${model}' for provider '${provider}' is not available`);
    }
    
    res.json({ 
      provider, 
      model,
      success 
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
