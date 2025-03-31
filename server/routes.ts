import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertResumeSchema, insertApplicationSchema, insertJobSchema, insertJobSourceSchema, type Job } from "@shared/schema";
import { z } from "zod";
import * as llmService from "./llm-service";
import { LLMProvider } from "./config";
import { upload, extractTextFromFile } from "./upload";
import { fetchLinkedInProfile, exportResumeToLinkedIn } from "./linkedin";
import * as calendar from "./calendar";
import { createJobBoardConnector, convertToInsertJob } from "./jobboards";
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

  // LinkedIn integration routes
  app.post("/api/linkedin/import", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const { profileUrl } = req.body;
      if (!profileUrl) {
        return res.status(400).send("LinkedIn profile URL is required");
      }
      
      // Fetch LinkedIn profile data
      const profileData = await fetchLinkedInProfile(profileUrl);
      
      // Save to user profile
      const updatedUser = await storage.saveLinkedinProfile(req.user.id, profileData);
      
      // Create a resume from LinkedIn data
      const resume = await storage.createResumeFromLinkedin(req.user.id, profileData);
      
      res.json({ 
        success: true, 
        user: updatedUser,
        resume
      });
    } catch (error) {
      console.error("LinkedIn import error:", error);
      res.status(500).send((error as Error).message);
    }
  });
  
  app.post("/api/linkedin/export", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const { resumeId } = req.body;
      if (!resumeId) {
        return res.status(400).send("Resume ID is required");
      }
      
      // Get resume data
      const resume = await storage.getResume(parseInt(resumeId));
      if (!resume || resume.userId !== req.user.id) {
        return res.status(404).send("Resume not found or access denied");
      }
      
      // Convert resume to LinkedIn format
      const linkedinData = exportResumeToLinkedIn(resume);
      
      res.json({
        success: true,
        data: linkedinData
      });
    } catch (error) {
      console.error("LinkedIn export error:", error);
      res.status(500).send((error as Error).message);
    }
  });
  
  // Share job application on LinkedIn
  app.post("/api/linkedin/share-application", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const { applicationId, message } = req.body;
      
      if (!applicationId) {
        return res.status(400).send("Application ID is required");
      }
      
      // Get application data
      const application = await storage.getApplication(parseInt(applicationId));
      if (!application || application.userId !== req.user.id) {
        return res.status(404).send("Application not found or access denied");
      }
      
      // Get job details to include in the share message
      const job = await storage.getJob(application.jobId);
      if (!job) {
        return res.status(404).send("Job not found");
      }
      
      // Generate a default message if not provided
      const shareMessage = message || `I'm excited to share that I've applied for a ${job.title} position at ${job.company}!`;
      
      // In a real implementation, this would use LinkedIn API to share the post
      // For demonstration purposes, we'll just return success
      
      res.json({
        success: true,
        message: "Application shared on LinkedIn",
        shareText: shareMessage
      });
    } catch (error) {
      console.error("LinkedIn share error:", error);
      res.status(500).send((error as Error).message);
    }
  });
  
  // Calendar integration routes
  app.get("/api/calendar/auth-url", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const authUrl = calendar.getGoogleAuthUrl();
    res.json({ authUrl });
  });
  
  app.post("/api/calendar/authorize", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).send("Authorization code is required");
      }
      
      // Exchange code for tokens
      const tokens = await calendar.getGoogleTokens(code);
      
      // Save refresh token to user profile
      if (!tokens.refresh_token) {
        return res.status(400).send("No refresh token received. Please try again with 'prompt=consent'");
      }
      
      const updatedUser = await storage.updateUser(req.user.id, {
        calendarIntegration: true,
        googleRefreshToken: tokens.refresh_token
      });
      
      res.json({
        success: true,
        user: updatedUser
      });
    } catch (error) {
      console.error("Calendar authorization error:", error);
      res.status(500).send((error as Error).message);
    }
  });
  
  app.post("/api/calendar/sync", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const { applicationId } = req.body;
      if (!applicationId) {
        return res.status(400).send("Application ID is required");
      }
      
      // Sync specific application with calendar
      const updatedApplication = await storage.syncApplicationWithCalendar(parseInt(applicationId));
      if (!updatedApplication) {
        return res.status(404).send("Application not found or calendar sync failed");
      }
      
      res.json({
        success: true,
        application: updatedApplication
      });
    } catch (error) {
      console.error("Calendar sync error:", error);
      res.status(500).send((error as Error).message);
    }
  });
  
  app.delete("/api/calendar/events/:applicationId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const applicationId = parseInt(req.params.applicationId);
      
      // Get application to check ownership
      const application = await storage.getApplication(applicationId);
      if (!application || application.userId !== req.user.id) {
        return res.status(404).send("Application not found or access denied");
      }
      
      // Remove calendar event
      const updatedApplication = await storage.removeCalendarEvent(applicationId);
      if (!updatedApplication) {
        return res.status(500).send("Failed to remove calendar event");
      }
      
      res.json({
        success: true,
        application: updatedApplication
      });
    } catch (error) {
      console.error("Calendar event deletion error:", error);
      res.status(500).send((error as Error).message);
    }
  });
  
  app.get("/api/calendar/export", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      // Get all applications with calendar events
      const applications = await storage.getApplicationsWithCalendarEvents(req.user.id);
      
      // Generate iCalendar file
      const icalData = calendar.generateICalendar(applications);
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=job_applications.ics');
      
      // Send the iCalendar data
      res.send(icalData);
    } catch (error) {
      console.error("iCalendar export error:", error);
      res.status(500).send((error as Error).message);
    }
  });
  
  // Job board integration routes
  app.get("/api/job-sources", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const jobSources = await storage.getJobSources();
      res.json(jobSources);
    } catch (error) {
      console.error("Job sources error:", error);
      res.status(500).send((error as Error).message);
    }
  });
  
  app.post("/api/job-sources", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      // For security, only admin users can add job sources in a real application
      // in a demo, we'll allow any authenticated user
      const jobSourceData = insertJobSourceSchema.parse(req.body);
      
      // Check if job source with this name already exists
      const existingSources = await storage.getJobSources();
      const exists = existingSources.some(
        source => source.name.toLowerCase() === jobSourceData.name.toLowerCase()
      );
      
      if (exists) {
        // Return the existing source instead of creating a duplicate
        const existingSource = existingSources.find(
          source => source.name.toLowerCase() === jobSourceData.name.toLowerCase()
        );
        return res.status(200).json(existingSource);
      }
      
      // Create new job source if it doesn't exist
      const jobSource = await storage.createJobSource(jobSourceData);
      
      res.status(201).json(jobSource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Job source creation error:", error);
      res.status(500).send((error as Error).message);
    }
  });
  
  app.put("/api/job-sources/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const sourceId = parseInt(req.params.id);
      const source = await storage.getJobSource(sourceId);
      
      if (!source) {
        return res.status(404).send("Job source not found");
      }
      
      // Update job source settings
      const updatedSource = await storage.updateJobSource(sourceId, req.body);
      
      res.json(updatedSource);
    } catch (error) {
      console.error("Job source update error:", error);
      res.status(500).send((error as Error).message);
    }
  });
  
  app.post("/api/job-sources/:id/sync", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const sourceId = parseInt(req.params.id);
      const source = await storage.getJobSource(sourceId);
      
      if (!source) {
        return res.status(404).send("Job source not found");
      }
      
      // Sync jobs from this source
      const jobs = await storage.syncJobsFromSource(sourceId);
      
      res.json({
        success: true,
        jobCount: jobs.length,
        jobs
      });
    } catch (error) {
      console.error("Job source sync error:", error);
      res.status(500).send((error as Error).message);
    }
  });
  
  app.post("/api/job-sources/search", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const { sourceIds, query } = req.body;
      
      if (!sourceIds || !Array.isArray(sourceIds) || sourceIds.length === 0 || !query) {
        return res.status(400).send("Source IDs array and search query are required");
      }
      
      // Using Promise.all to search multiple job boards in parallel
      const searchPromises = sourceIds.map(async (sourceId) => {
        try {
          // Get the job source
          const source = await storage.getJobSource(parseInt(sourceId));
          if (!source) {
            console.warn(`Job source ${sourceId} not found`);
            return null;
          }
          
          // Create connector for the job board - will automatically use web scraping if no API key
          const connector = createJobBoardConnector(source.name, source.apiKey || '');
  
          // Search for jobs
          const searchResult = await connector.searchJobs(query);
          
          // Convert to internal format and add source information with unique IDs
          const jobs = searchResult.jobs.map(job => {
            const convertedJob = convertToInsertJob(job);
            // Add source identifier to job ID
            const jobId = job.id;
            // Create a unique ID by combining the original ID with the source name
            const uniqueId = `${jobId}-${source.name}`;
            // Return job with source attribution and unique ID
            return {
              ...convertedJob,
              id: uniqueId, 
              source: source.name
            };
          });
          
          return {
            source: source.name,
            sourceType: source.apiKey ? 'api' : 'scraper',
            totalJobs: searchResult.totalJobs,
            pageCount: searchResult.pageCount,
            currentPage: searchResult.currentPage,
            jobs
          };
        } catch (error) {
          console.error(`Error searching source ${sourceId}:`, error);
          return null; // Return null for failed sources
        }
      });
      
      // Wait for all searches to complete
      const results = (await Promise.all(searchPromises)).filter(Boolean);
      
      // Combine results from all sources
      const combinedJobs = results.flatMap(result => result?.jobs || []);
      const totalJobs = results.reduce((sum, result) => sum + (result?.totalJobs || 0), 0);
      const sources = results.map(result => result?.source).filter(Boolean).join(', ');
      
      // Check if we got any results
      if (combinedJobs.length === 0) {
        // Just return empty results rather than an error
        return res.json({
          success: true,
          query,
          totalJobs: 0,
          pageCount: 0,
          currentPage: 1,
          jobs: [],
          sources,
          sourceCount: sourceIds.length
        });
      }
      
      res.json({
        success: true,
        query,
        totalJobs,
        pageCount: Math.ceil(totalJobs / (query.pageSize || 10)),
        currentPage: query.page || 1,
        jobs: combinedJobs,
        sources,
        sourceCount: results.length
      });
    } catch (error) {
      console.error("Job search error:", error);
      res.status(500).send((error as Error).message);
    }
  });
  
  // API Key management routes for job boards
  app.get("/api/job-sources/api-keys", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    // Get a list of which sources have API keys registered
    try {
      const jobSources = await storage.getJobSources();
      const sourceStatus = jobSources.map(source => ({
        id: source.id,
        name: source.name,
        hasApiKey: !!source.apiKey
      }));
      
      res.json(sourceStatus);
    } catch (error) {
      console.error("API key status error:", error);
      res.status(500).send((error as Error).message);
    }
  });
  
  app.post("/api/job-sources/:id/api-key", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const { apiKey } = req.body;
      const sourceId = parseInt(req.params.id);
      
      if (!apiKey) {
        return res.status(400).send("API key is required");
      }
      
      // Get the job source
      const source = await storage.getJobSource(sourceId);
      if (!source) {
        return res.status(404).send("Job source not found");
      }
      
      // Update the API key
      const updatedSource = await storage.updateJobSource(sourceId, { apiKey });
      
      // Don't return the actual API key in the response for security
      res.json({
        id: updatedSource?.id || sourceId,
        name: updatedSource?.name || source.name,
        hasApiKey: true
      });
    } catch (error) {
      console.error("API key update error:", error);
      res.status(500).send((error as Error).message);
    }
  });
  
  // Route for getting job details
  app.get("/api/job-sources/:sourceId/jobs/:jobId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const sourceId = parseInt(req.params.sourceId);
      const jobId = req.params.jobId;
      
      if (!sourceId || !jobId) {
        return res.status(400).send("Source ID and Job ID are required");
      }
      
      // Get the job source
      const source = await storage.getJobSource(sourceId);
      if (!source) {
        return res.status(404).send("Job source not found");
      }
      
      // Create connector for the job board
      const connector = createJobBoardConnector(source.name, source.apiKey || '');
      
      // Get job details
      const jobDetails = await connector.getJobDetails(jobId);
      
      if (!jobDetails) {
        return res.status(404).send("Job not found");
      }
      
      // Convert to internal format and add ID
      const job = {
        ...convertToInsertJob(jobDetails),
        id: `${jobId}-${source.name}`,
        source: source.name
      };
      
      res.json({
        success: true,
        job,
        fullDetails: jobDetails,
        source: source.name
      });
    } catch (error) {
      console.error("Job details error:", error);
      res.status(500).send((error as Error).message);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
