import { users, type User, type InsertUser, resumes, type Resume, type InsertResume, jobs, type Job, type InsertJob, applications, type Application, type InsertApplication, jobSources, type JobSource, type InsertJobSource } from "@shared/schema";
import session from "express-session";
import memorystore from "memorystore";

// Create the MemoryStore constructor with session
const MemoryStore = memorystore(session);
// Define the type for the session store instances
type SessionStore = session.Store;

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  saveLinkedinProfile(userId: number, profile: any): Promise<User | undefined>;
  
  // Resume methods
  getResumes(userId: number): Promise<Resume[]>;
  getResume(id: number): Promise<Resume | undefined>;
  createResume(resume: InsertResume): Promise<Resume>;
  updateResume(id: number, data: Partial<Resume>): Promise<Resume | undefined>;
  deleteResume(id: number): Promise<boolean>;
  createResumeFromLinkedin(userId: number, linkedinData: any): Promise<Resume>;
  
  // Job methods
  getJobs(filters?: Partial<Job> & Record<string, any>): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  getRecommendedJobs(userId: number, limit?: number): Promise<Job[]>;
  
  // Job Sources methods
  getJobSources(): Promise<JobSource[]>;
  getJobSource(id: number): Promise<JobSource | undefined>;
  createJobSource(source: InsertJobSource): Promise<JobSource>;
  updateJobSource(id: number, data: Partial<JobSource>): Promise<JobSource | undefined>;
  deleteJobSource(id: number): Promise<boolean>;
  syncJobsFromSource(sourceId: number): Promise<Job[]>;
  
  // Application methods
  getApplications(userId: number): Promise<Application[]>;
  getApplication(id: number): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplicationStatus(id: number, status: string): Promise<Application | undefined>;
  updateApplication(id: number, data: Partial<Application>): Promise<Application | undefined>;
  getApplicationsWithCalendarEvents(userId: number): Promise<Application[]>;
  
  // Calendar methods
  syncApplicationWithCalendar(applicationId: number): Promise<Application | undefined>;
  removeCalendarEvent(applicationId: number): Promise<Application | undefined>;
  
  // Session store
  sessionStore: SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private resumes: Map<number, Resume>;
  private jobs: Map<number, Job>;
  private applications: Map<number, Application>;
  private jobSources: Map<number, JobSource>;
  private userIdCounter: number;
  private resumeIdCounter: number;
  private jobIdCounter: number;
  private applicationIdCounter: number;
  private jobSourceIdCounter: number;
  sessionStore: SessionStore;

  constructor() {
    this.users = new Map();
    this.resumes = new Map();
    this.jobs = new Map();
    this.applications = new Map();
    this.jobSources = new Map();
    this.userIdCounter = 1;
    this.resumeIdCounter = 1;
    this.jobIdCounter = 1;
    this.applicationIdCounter = 1;
    this.jobSourceIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Seed some jobs for demo
    this.seedJobs();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    // Add default values for all required fields in the User type
    const user: User = { 
      ...insertUser, 
      id, 
      name: insertUser.name || null,
      email: insertUser.email || null,
      avatar: null,
      plan: "free",
      linkedinProfile: null,
      linkedinData: null,
      calendarIntegration: false,
      googleRefreshToken: null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async saveLinkedinProfile(userId: number, profile: any): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      linkedinProfile: profile.publicProfileUrl || "",
      linkedinData: profile
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Resume methods
  async getResumes(userId: number): Promise<Resume[]> {
    return Array.from(this.resumes.values()).filter(
      (resume) => resume.userId === userId,
    );
  }

  async getResume(id: number): Promise<Resume | undefined> {
    return this.resumes.get(id);
  }

  async createResume(insertResume: InsertResume): Promise<Resume> {
    const id = this.resumeIdCounter++;
    const now = new Date();
    const resume: Resume = { 
      ...insertResume, 
      id,
      content: insertResume.content || null,
      fileUrl: insertResume.fileUrl || null,
      skills: insertResume.skills || [],
      matchScore: insertResume.matchScore || Math.floor(Math.random() * 30) + 70, // Mock match score between 70-100
      updatedAt: now 
    };
    this.resumes.set(id, resume);
    return resume;
  }

  async updateResume(id: number, data: Partial<Resume>): Promise<Resume | undefined> {
    const resume = await this.getResume(id);
    if (!resume) return undefined;
    
    const now = new Date();
    const updatedResume = { ...resume, ...data, updatedAt: now };
    this.resumes.set(id, updatedResume);
    return updatedResume;
  }

  async deleteResume(id: number): Promise<boolean> {
    return this.resumes.delete(id);
  }
  
  async createResumeFromLinkedin(userId: number, linkedinData: any): Promise<Resume> {
    // Extract relevant info from LinkedIn profile to create a resume
    const skills = linkedinData.skills?.map((s: any) => s.name) || [];
    const experiences = linkedinData.positions?.values || [];
    const education = linkedinData.educations?.values || [];
    
    // Create a formatted resume content from the LinkedIn data
    let content = `# ${linkedinData.formattedName || 'Professional Resume'}\n\n`;
    content += `## Contact Information\n`;
    content += `${linkedinData.emailAddress || ''}\n`;
    content += `${linkedinData.phoneNumbers?.values?.[0]?.phoneNumber || ''}\n\n`;
    
    content += `## Summary\n${linkedinData.summary || ''}\n\n`;
    
    content += `## Experience\n`;
    experiences.forEach((exp: any) => {
      content += `### ${exp.title} at ${exp.company?.name}\n`;
      if (exp.startDate && exp.endDate) {
        content += `${exp.startDate.month}/${exp.startDate.year} - ${exp.endDate.month}/${exp.endDate.year}\n`;
      } else if (exp.startDate) {
        content += `${exp.startDate.month}/${exp.startDate.year} - Present\n`;
      }
      content += `${exp.summary || ''}\n\n`;
    });
    
    content += `## Education\n`;
    education.forEach((edu: any) => {
      content += `### ${edu.degree} in ${edu.fieldOfStudy}\n`;
      content += `${edu.schoolName}\n`;
      if (edu.startDate && edu.endDate) {
        content += `${edu.startDate.year} - ${edu.endDate.year}\n`;
      }
      content += `\n`;
    });
    
    content += `## Skills\n`;
    content += skills.join(', ');
    
    // Create a new resume with the extracted data
    const resumeData: InsertResume = {
      userId,
      name: `${linkedinData.formattedName}'s LinkedIn Resume`,
      language: 'en',
      content,
      skills,
    };
    
    return this.createResume(resumeData);
  }

  // Job methods
  async getJobs(filters?: Partial<Job> & Record<string, any>): Promise<Job[]> {
    let jobs = Array.from(this.jobs.values());
    
    if (filters) {
      jobs = jobs.filter(job => {
        for (const [key, value] of Object.entries(filters)) {
          // If the filter value is a function, use it for custom filtering
          if (typeof value === 'function') {
            if (!value(job)) {
              return false;
            }
          } 
          // Skip internal keys that start with underscore (used for special filters)
          else if (!key.startsWith('_') && job[key as keyof Job] !== value) {
            return false;
          }
        }
        return true;
      });
    }
    
    return jobs;
  }

  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = this.jobIdCounter++;
    const now = new Date();
    const job: Job = { 
      ...insertJob, 
      id, 
      location: insertJob.location || null,
      description: insertJob.description || null,
      salary: insertJob.salary || null,
      jobType: insertJob.jobType || null,
      skills: insertJob.skills || [],
      source: insertJob.source || null,
      remoteOption: insertJob.remoteOption || null,
      matchScore: insertJob.matchScore || null,
      postedAt: now 
    };
    this.jobs.set(id, job);
    return job;
  }

  async getRecommendedJobs(userId: number, limit: number = 3): Promise<Job[]> {
    // In a real application, this would be based on the user's resume and preferences
    const jobs = Array.from(this.jobs.values())
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .slice(0, limit);
      
    return jobs;
  }
  
  // Job Sources methods
  async getJobSources(): Promise<JobSource[]> {
    return Array.from(this.jobSources.values());
  }
  
  async getJobSource(id: number): Promise<JobSource | undefined> {
    return this.jobSources.get(id);
  }
  
  async createJobSource(source: InsertJobSource): Promise<JobSource> {
    const id = this.jobSourceIdCounter++;
    const jobSource: JobSource = { 
      ...source, 
      id, 
      apiKey: source.apiKey || null,
      isEnabled: source.isEnabled !== undefined ? source.isEnabled : true,
      configOptions: source.configOptions || {},
      lastSync: null 
    };
    this.jobSources.set(id, jobSource);
    return jobSource;
  }
  
  async updateJobSource(id: number, data: Partial<JobSource>): Promise<JobSource | undefined> {
    const source = await this.getJobSource(id);
    if (!source) return undefined;
    
    const updatedSource = { ...source, ...data };
    this.jobSources.set(id, updatedSource);
    return updatedSource;
  }
  
  async deleteJobSource(id: number): Promise<boolean> {
    return this.jobSources.delete(id);
  }
  
  async syncJobsFromSource(sourceId: number): Promise<Job[]> {
    const source = await this.getJobSource(sourceId);
    if (!source || !source.isEnabled) {
      return [];
    }
    
    // In a real application, this would make an API call to the job source
    // For now, we'll create some mock jobs from this source
    const newJobs: Job[] = [];
    const now = new Date();
    
    // Update the lastSync timestamp
    await this.updateJobSource(sourceId, { lastSync: now });
    
    return newJobs;
  }

  // Application methods
  async getApplications(userId: number): Promise<Application[]> {
    return Array.from(this.applications.values())
      .filter(app => app.userId === userId)
      .sort((a, b) => {
        // Handle null dates by treating them as earlier than any actual date
        if (!a.appliedAt) return 1;
        if (!b.appliedAt) return -1;
        
        // Ensure we have valid Date objects before calling getTime()
        const dateA = a.appliedAt instanceof Date ? a.appliedAt : new Date(a.appliedAt);
        const dateB = b.appliedAt instanceof Date ? b.appliedAt : new Date(b.appliedAt);
        
        return dateB.getTime() - dateA.getTime();
      });
  }

  async getApplication(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = this.applicationIdCounter++;
    const now = new Date();
    const application: Application = { 
      ...insertApplication, 
      id, 
      status: insertApplication.status || "applied",
      source: insertApplication.source || null,
      resumeId: insertApplication.resumeId || null,
      appliedAt: now,
      notes: insertApplication.notes || null,
      calendarEventId: insertApplication.calendarEventId || null,
      deadlineDate: insertApplication.deadlineDate || null,
      interviewDate: insertApplication.interviewDate || null,
      isCalendarSynced: insertApplication.isCalendarSynced || false
    };
    this.applications.set(id, application);
    return application;
  }

  async updateApplicationStatus(id: number, status: string): Promise<Application | undefined> {
    const application = await this.getApplication(id);
    if (!application) return undefined;
    
    const updatedApplication = { ...application, status };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }
  
  async updateApplication(id: number, data: Partial<Application>): Promise<Application | undefined> {
    const application = await this.getApplication(id);
    if (!application) return undefined;
    
    const updatedApplication = { ...application, ...data };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }
  
  async getApplicationsWithCalendarEvents(userId: number): Promise<Application[]> {
    const applications = await this.getApplications(userId);
    return applications.filter(app => app.isCalendarSynced && app.calendarEventId);
  }
  
  async syncApplicationWithCalendar(applicationId: number): Promise<Application | undefined> {
    const application = await this.getApplication(applicationId);
    if (!application) return undefined;
    
    // In a real implementation, this would create a calendar event using Google Calendar API
    // For now, we'll just update the application with mock event data
    const eventId = `event_${Date.now()}_${applicationId}`;
    
    const updatedApplication = { 
      ...application, 
      calendarEventId: eventId,
      isCalendarSynced: true 
    };
    
    this.applications.set(applicationId, updatedApplication);
    return updatedApplication;
  }
  
  async removeCalendarEvent(applicationId: number): Promise<Application | undefined> {
    const application = await this.getApplication(applicationId);
    if (!application) return undefined;
    
    // In a real implementation, this would delete the calendar event using Google Calendar API
    // For now, we'll just update the application to remove the event reference
    const updatedApplication = { 
      ...application, 
      calendarEventId: null,
      isCalendarSynced: false 
    };
    
    this.applications.set(applicationId, updatedApplication);
    return updatedApplication;
  }

  // Seed some initial jobs
  private seedJobs() {
    const companies = ["Google", "Stripe", "Airbnb", "Shopify", "Microsoft", "Amazon", "Meta", "Apple"];
    const titles = ["Software Engineer", "Frontend Developer", "Full Stack Developer", "React Developer", "Product Designer", "UX/UI Designer", "Data Scientist"];
    const locations = ["San Francisco, CA", "New York, NY", "Seattle, WA", "Remote", "Austin, TX", "Boston, MA"];
    const jobTypes = ["Full-time", "Part-time", "Contract", "Internship"];
    const remoteOptions = ["Remote", "Hybrid", "On-site"];
    const sources = ["LinkedIn", "Indeed", "Glassdoor", "ZipRecruiter"];
    
    // Create some sample jobs
    for (let i = 0; i < 20; i++) {
      const company = companies[Math.floor(Math.random() * companies.length)];
      const title = titles[Math.floor(Math.random() * titles.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];
      const remoteOption = remoteOptions[Math.floor(Math.random() * remoteOptions.length)];
      const source = sources[Math.floor(Math.random() * sources.length)];
      const matchScore = Math.floor(Math.random() * 20) + 80; // 80-100
      const salaryMin = (Math.floor(Math.random() * 7) + 8) * 10000; // 80k-140k
      const salaryMax = salaryMin + (Math.floor(Math.random() * 5) + 2) * 10000; // +20k-60k from min
      
      const job: InsertJob = {
        title,
        company,
        location,
        description: `We're looking for a talented ${title} to join our growing team. You'll be responsible for building user interfaces, implementing designs, and collaborating with our product team to create exceptional experiences.`,
        salary: `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()}`,
        jobType,
        remoteOption,
        matchScore,
        source,
        skills: ["JavaScript", "React", "Node.js", "TypeScript"].slice(0, 2 + Math.floor(Math.random() * 3)),
        postedAt: new Date(Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000) // 0-14 days ago
      };
      
      this.createJob(job);
    }
  }
}

export const storage = new MemStorage();
