export interface User {
  id: number;
  username: string;
  name?: string;
  email?: string;
  avatar?: string;
  plan: string;
}

export interface Resume {
  id: number;
  userId: number;
  name: string;
  language: string;
  content?: string;
  fileUrl?: string;
  skills?: string[];
  matchScore?: number;
  updatedAt: Date;
}

export interface Job {
  id: number;
  title: string;
  company: string;
  location?: string;
  description?: string;
  salary?: string;
  jobType?: string;
  skills?: string[];
  source?: string;
  remoteOption?: string;
  matchScore?: number;
  postedAt: Date;
}

export interface Application {
  id: number;
  userId: number;
  jobId: number;
  resumeId?: number;
  status: string;
  appliedAt: Date;
  notes?: string;
  source?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Additional utility types
export interface ResumeAnalysis {
  skills: string[];
  experience: string[];
  education: string[];
  summary: string;
}

export interface JobMatch {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export interface ApplicationStage {
  name: string;
  count: number;
  color: string;
}

export type ApplicationStatus = 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';

export interface JobSource {
  id: number;
  name: string;
  url?: string;
  apiKey?: string;
  lastSync?: Date;
}

export interface SearchResult {
  success: boolean;
  jobs: Job[];
  totalJobs: number;
  pageCount: number;
  currentPage: number;
  query?: any;
  source?: string;
  sourceType?: 'api' | 'scraper';
}
