// Type definitions for the client application

// User types
export interface User {
  id: number;
  username: string;
  name?: string;
  email?: string;
  avatar?: string;
  plan?: string;
  linkedinProfile?: string;
  linkedinData?: any;
  calendarIntegration?: boolean;
  googleRefreshToken?: string;
}

// Resume types
export interface Resume {
  id: number;
  userId: number;
  name: string;
  language: string;
  content?: string;
  fileUrl?: string;
  skills?: any[];
  matchScore?: number;
  updatedAt?: Date;
}

// Job types
export interface Job {
  id: number;
  title: string;
  company: string;
  location?: string;
  description?: string;
  salary?: string;
  jobType?: string;
  skills?: any[];
  source?: string;
  remoteOption?: string;
  matchScore?: number;
  postedAt?: Date;
  url?: string;
}

// Application types
export type ApplicationStatus = 'applied' | 'screening' | 'interview' | 'technical' | 'offer' | 'accepted' | 'rejected' | 'withdrawn';

export interface Application {
  id: number;
  userId: number;
  jobId: number;
  resumeId?: number;
  status: ApplicationStatus;
  appliedAt: Date;
  notes?: string;
  source?: string;
  calendarEventId?: string;
  deadlineDate?: Date;
  interviewDate?: Date;
  isCalendarSynced?: boolean;
}

// Job source types
export interface JobSource {
  id: number;
  name: string;
  url?: string;
  apiKey?: string;
  isEnabled: boolean;
  lastSync?: Date;
  configOptions?: Record<string, any>;
}

// Job search query types
export interface JobSearchQuery {
  keywords?: string;
  location?: string;
  jobType?: string;
  remote?: boolean;
  page?: number;
  pageSize?: number;
  datePosted?: string;
  salary?: string;
  experienceLevel?: string;
  sortBy?: string;
  sources?: number[];
}