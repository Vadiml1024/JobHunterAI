import { users, type User, type InsertUser, resumes, type Resume, type InsertResume, jobs, type Job, type InsertJob, applications, type Application, type InsertApplication } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  
  // Resume methods
  getResumes(userId: number): Promise<Resume[]>;
  getResume(id: number): Promise<Resume | undefined>;
  createResume(resume: InsertResume): Promise<Resume>;
  updateResume(id: number, data: Partial<Resume>): Promise<Resume | undefined>;
  deleteResume(id: number): Promise<boolean>;
  
  // Job methods
  getJobs(filters?: Partial<Job>): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  getRecommendedJobs(userId: number, limit?: number): Promise<Job[]>;
  
  // Application methods
  getApplications(userId: number): Promise<Application[]>;
  getApplication(id: number): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplicationStatus(id: number, status: string): Promise<Application | undefined>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private resumes: Map<number, Resume>;
  private jobs: Map<number, Job>;
  private applications: Map<number, Application>;
  private userIdCounter: number;
  private resumeIdCounter: number;
  private jobIdCounter: number;
  private applicationIdCounter: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.resumes = new Map();
    this.jobs = new Map();
    this.applications = new Map();
    this.userIdCounter = 1;
    this.resumeIdCounter = 1;
    this.jobIdCounter = 1;
    this.applicationIdCounter = 1;
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
    const user: User = { ...insertUser, id, plan: "free" };
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
      matchScore: Math.floor(Math.random() * 30) + 70, // Mock match score between 70-100
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
    const job: Job = { ...insertJob, id, postedAt: now };
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

  // Application methods
  async getApplications(userId: number): Promise<Application[]> {
    return Array.from(this.applications.values())
      .filter(app => app.userId === userId)
      .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
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
      appliedAt: now 
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
