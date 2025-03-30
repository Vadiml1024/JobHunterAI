import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertResumeSchema, insertApplicationSchema, insertJobSchema } from "@shared/schema";
import { z } from "zod";
import * as llmService from "./llm-service";
import { LLMProvider } from "./config";

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

  app.post("/api/resumes", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const resumeData = insertResumeSchema.parse({ ...req.body, userId: req.user.id });
      const resume = await storage.createResume(resumeData);
      res.status(201).json(resume);
    } catch (error) {
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

  // Resume analysis route
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
    if (req.query.title) filters.title = req.query.title;
    if (req.query.company) filters.company = req.query.company;
    if (req.query.location) filters.location = req.query.location;
    if (req.query.remoteOption) filters.remoteOption = req.query.remoteOption;
    
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
      
      const response = await llmService.chatWithAssistant(messages, req.user.id);
      res.json({ response });
    } catch (error) {
      res.status(500).send((error as Error).message);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
