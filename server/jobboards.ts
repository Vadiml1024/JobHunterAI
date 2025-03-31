import axios from 'axios';
import { InsertJob } from '@shared/schema';

/**
 * Interface representing a job board API connector
 */
interface JobBoardConnector {
  /**
   * Get the name of the job board
   */
  getName(): string;
  
  /**
   * Search for jobs using job board-specific API
   */
  searchJobs(query: JobSearchQuery): Promise<JobSearchResult>;
  
  /**
   * Get details for a specific job by ID
   */
  getJobDetails(jobId: string): Promise<JobDetails | null>;
}

/**
 * Standard job search query parameters
 */
export interface JobSearchQuery {
  keywords?: string;
  location?: string;
  jobType?: string; // full-time, part-time, contract, etc.
  remote?: boolean;
  page?: number;
  pageSize?: number;
  datePosted?: string; // today, 3days, week, month
  salary?: string; // min-max
  experienceLevel?: string;
  sortBy?: string; // relevance, date, etc.
}

/**
 * Standard job search result interface
 */
export interface JobSearchResult {
  jobs: JobListing[];
  totalJobs: number;
  pageCount: number;
  currentPage: number;
}

/**
 * Standard job listing interface from search results
 */
export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description?: string;
  jobType?: string;
  datePosted: Date;
  url: string;
  source: string;
  remoteOption?: string;
}

/**
 * Detailed job information
 */
export interface JobDetails extends JobListing {
  fullDescription: string;
  requirements?: string[];
  benefits?: string[];
  contactInfo?: string;
  applicationUrl?: string;
  skills?: string[];
}

/**
 * LinkedIn Jobs API connector
 */
export class LinkedInConnector implements JobBoardConnector {
  private apiKey: string;
  private apiBaseUrl: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.apiBaseUrl = 'https://api.linkedin.com/v2';
  }
  
  getName(): string {
    return 'LinkedIn Jobs';
  }
  
  async searchJobs(query: JobSearchQuery): Promise<JobSearchResult> {
    try {
      // In a real implementation, this would use the LinkedIn API
      // This is a placeholder that would be replaced with actual API calls
      
      // Build query parameters
      const params = {
        keywords: query.keywords,
        location: query.location,
        jobType: this.mapJobType(query.jobType),
        remote: query.remote,
        start: query.page ? (query.page - 1) * (query.pageSize || 10) : 0,
        count: query.pageSize || 10,
        timePosted: this.mapDatePosted(query.datePosted),
        // Add other parameters as needed
      };
      
      const response = await axios.get(`${this.apiBaseUrl}/jobs/search`, {
        params,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });
      
      // Parse and transform the response
      return this.transformSearchResults(response.data);
    } catch (error) {
      console.error('LinkedIn Jobs API error:', error);
      return { jobs: [], totalJobs: 0, pageCount: 0, currentPage: 1 };
    }
  }
  
  async getJobDetails(jobId: string): Promise<JobDetails | null> {
    try {
      // In a real implementation, this would use the LinkedIn API
      // This is a placeholder that would be replaced with actual API calls
      
      const response = await axios.get(`${this.apiBaseUrl}/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });
      
      // Parse and transform the response
      return this.transformJobDetails(response.data);
    } catch (error) {
      console.error('LinkedIn Job Details API error:', error);
      return null;
    }
  }
  
  // Helper methods to map between our standard format and LinkedIn's API
  private mapJobType(jobType?: string): string | undefined {
    if (!jobType) return undefined;
    
    const jobTypeMap: { [key: string]: string } = {
      'full-time': 'F',
      'part-time': 'P',
      'contract': 'C',
      'internship': 'I',
      'temporary': 'T',
      'volunteer': 'V'
    };
    
    return jobTypeMap[jobType.toLowerCase()] || undefined;
  }
  
  private mapDatePosted(datePosted?: string): string | undefined {
    if (!datePosted) return undefined;
    
    const dateMap: { [key: string]: string } = {
      'today': 'r86400',
      '3days': 'r259200',
      'week': 'r604800',
      'month': 'r2592000'
    };
    
    return dateMap[datePosted.toLowerCase()] || undefined;
  }
  
  // Transform LinkedIn response to our standard format
  private transformSearchResults(data: any): JobSearchResult {
    // This would be implemented to transform LinkedIn's response format
    // to our standard JobSearchResult format
    
    // Placeholder implementation
    const jobs: JobListing[] = (data.elements || []).map((job: any) => ({
      id: job.entityUrn.split(':').pop(),
      title: job.title.text,
      company: job.companyDetails.company.name,
      location: job.formattedLocation,
      description: job.description?.text,
      datePosted: new Date(job.listedAt),
      url: `https://www.linkedin.com/jobs/view/${job.entityUrn.split(':').pop()}`,
      source: 'LinkedIn',
      remoteOption: job.workRemoteAllowed ? 'Remote' : 'On-site'
    }));
    
    return {
      jobs,
      totalJobs: data.paging?.total || jobs.length,
      pageCount: Math.ceil((data.paging?.total || jobs.length) / (data.paging?.count || 10)),
      currentPage: Math.floor((data.paging?.start || 0) / (data.paging?.count || 10)) + 1
    };
  }
  
  // Transform LinkedIn job details to our standard format
  private transformJobDetails(data: any): JobDetails | null {
    if (!data) return null;
    
    return {
      id: data.entityUrn.split(':').pop(),
      title: data.title.text,
      company: data.companyDetails.company.name,
      location: data.formattedLocation,
      description: data.description?.text,
      fullDescription: data.description?.text,
      datePosted: new Date(data.listedAt),
      url: `https://www.linkedin.com/jobs/view/${data.entityUrn.split(':').pop()}`,
      source: 'LinkedIn',
      remoteOption: data.workRemoteAllowed ? 'Remote' : 'On-site',
      requirements: this.extractRequirements(data.description?.text),
      skills: this.extractSkills(data.description?.text)
    };
  }
  
  // Helper to extract requirements from job description
  private extractRequirements(description?: string): string[] {
    if (!description) return [];
    
    // Look for sections that might contain requirements
    const requirementSections = [
      /requirements?:?\s*([\s\S]*?)(?=\n\s*[a-z]+:|\n\s*$)/i,
      /qualifications?:?\s*([\s\S]*?)(?=\n\s*[a-z]+:|\n\s*$)/i,
      /what you need:?\s*([\s\S]*?)(?=\n\s*[a-z]+:|\n\s*$)/i
    ];
    
    for (const pattern of requirementSections) {
      const match = description.match(pattern);
      if (match && match[1]) {
        // Split by bullets or newlines and clean up
        return match[1].split(/•|\*|\n/)
          .map(item => item.trim())
          .filter(item => item.length > 0);
      }
    }
    
    return [];
  }
  
  // Helper to extract skills from job description
  private extractSkills(description?: string): string[] {
    if (!description) return [];
    
    // Common tech skills to look for
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Angular', 'Vue',
      'Node.js', 'SQL', 'NoSQL', 'MongoDB', 'Express', 'Django',
      'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'REST API',
      'TypeScript', 'Go', 'PHP', 'Ruby', 'C#', 'C++', 'Swift',
      'HTML', 'CSS', 'SASS', 'LESS', 'GraphQL', 'Redux', 'Git'
    ];
    
    const skills: string[] = [];
    
    // Look for skills in the description
    for (const skill of commonSkills) {
      const pattern = new RegExp(`\\b${skill}\\b`, 'i');
      if (pattern.test(description)) {
        skills.push(skill);
      }
    }
    
    return skills;
  }
}

/**
 * Indeed Jobs API connector
 */
export class IndeedConnector implements JobBoardConnector {
  private apiKey: string;
  private apiBaseUrl: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.apiBaseUrl = 'https://apis.indeed.com/v2';
  }
  
  getName(): string {
    return 'Indeed Jobs';
  }
  
  async searchJobs(query: JobSearchQuery): Promise<JobSearchResult> {
    try {
      // In a real implementation, this would use the Indeed API
      // This is a placeholder that would be replaced with actual API calls
      
      // Build query parameters
      const params = {
        q: query.keywords,
        l: query.location,
        jt: this.mapJobType(query.jobType),
        remote: query.remote ? 'true' : undefined,
        start: query.page ? (query.page - 1) * (query.pageSize || 10) : 0,
        limit: query.pageSize || 10,
        fromage: this.mapDatePosted(query.datePosted),
        // Add other parameters as needed
      };
      
      const response = await axios.get(`${this.apiBaseUrl}/jobs/search`, {
        params,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Parse and transform the response
      return this.transformSearchResults(response.data);
    } catch (error) {
      console.error('Indeed Jobs API error:', error);
      return { jobs: [], totalJobs: 0, pageCount: 0, currentPage: 1 };
    }
  }
  
  async getJobDetails(jobId: string): Promise<JobDetails | null> {
    try {
      // In a real implementation, this would use the Indeed API
      // This is a placeholder that would be replaced with actual API calls
      
      const response = await axios.get(`${this.apiBaseUrl}/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Parse and transform the response
      return this.transformJobDetails(response.data);
    } catch (error) {
      console.error('Indeed Job Details API error:', error);
      return null;
    }
  }
  
  // Helper methods to map between our standard format and Indeed's API
  private mapJobType(jobType?: string): string | undefined {
    if (!jobType) return undefined;
    
    const jobTypeMap: { [key: string]: string } = {
      'full-time': 'fulltime',
      'part-time': 'parttime',
      'contract': 'contract',
      'internship': 'internship',
      'temporary': 'temporary'
    };
    
    return jobTypeMap[jobType.toLowerCase()] || undefined;
  }
  
  private mapDatePosted(datePosted?: string): string | undefined {
    if (!datePosted) return undefined;
    
    const dateMap: { [key: string]: string } = {
      'today': '1',
      '3days': '3',
      'week': '7',
      'month': '30'
    };
    
    return dateMap[datePosted.toLowerCase()] || undefined;
  }
  
  // Transform Indeed response to our standard format
  private transformSearchResults(data: any): JobSearchResult {
    // This would be implemented to transform Indeed's response format
    // to our standard JobSearchResult format
    
    // Placeholder implementation
    const jobs: JobListing[] = (data.results || []).map((job: any) => ({
      id: job.jobkey,
      title: job.jobtitle,
      company: job.company,
      location: job.formattedLocation,
      salary: job.formattedRelativeTime,
      description: job.snippet,
      jobType: job.jobType,
      datePosted: new Date(job.date),
      url: job.url,
      source: 'Indeed',
      remoteOption: job.remote ? 'Remote' : 'On-site'
    }));
    
    return {
      jobs,
      totalJobs: data.totalResults || jobs.length,
      pageCount: Math.ceil((data.totalResults || jobs.length) / (data.pageSize || 10)),
      currentPage: Math.floor((data.start || 0) / (data.pageSize || 10)) + 1
    };
  }
  
  // Transform Indeed job details to our standard format
  private transformJobDetails(data: any): JobDetails | null {
    if (!data) return null;
    
    return {
      id: data.jobkey,
      title: data.jobtitle,
      company: data.company,
      location: data.formattedLocation,
      salary: data.formattedRelativeTime,
      description: data.snippet,
      fullDescription: data.jobDescription,
      jobType: data.jobType,
      datePosted: new Date(data.date),
      url: data.url,
      source: 'Indeed',
      remoteOption: data.remote ? 'Remote' : 'On-site',
      requirements: this.extractRequirements(data.jobDescription),
      skills: this.extractSkills(data.jobDescription)
    };
  }
  
  // Helper to extract requirements from job description
  private extractRequirements(description?: string): string[] {
    // Similar implementation as LinkedIn connector
    if (!description) return [];
    
    const requirementSections = [
      /requirements?:?\s*([\s\S]*?)(?=\n\s*[a-z]+:|\n\s*$)/i,
      /qualifications?:?\s*([\s\S]*?)(?=\n\s*[a-z]+:|\n\s*$)/i,
      /what you need:?\s*([\s\S]*?)(?=\n\s*[a-z]+:|\n\s*$)/i
    ];
    
    for (const pattern of requirementSections) {
      const match = description.match(pattern);
      if (match && match[1]) {
        return match[1].split(/•|\*|\n/)
          .map(item => item.trim())
          .filter(item => item.length > 0);
      }
    }
    
    return [];
  }
  
  // Helper to extract skills from job description
  private extractSkills(description?: string): string[] {
    // Similar implementation as LinkedIn connector
    if (!description) return [];
    
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Angular', 'Vue',
      'Node.js', 'SQL', 'NoSQL', 'MongoDB', 'Express', 'Django',
      'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'REST API',
      'TypeScript', 'Go', 'PHP', 'Ruby', 'C#', 'C++', 'Swift',
      'HTML', 'CSS', 'SASS', 'LESS', 'GraphQL', 'Redux', 'Git'
    ];
    
    const skills: string[] = [];
    
    for (const skill of commonSkills) {
      const pattern = new RegExp(`\\b${skill}\\b`, 'i');
      if (pattern.test(description)) {
        skills.push(skill);
      }
    }
    
    return skills;
  }
}

/**
 * Factory function to create a job board connector based on source name
 * @param source Name of the job board source
 * @param apiKey API key for the job board
 * @returns Connector instance for the specified job board
 */
export function createJobBoardConnector(source: string, apiKey: string): JobBoardConnector {
  switch (source.toLowerCase()) {
    case 'linkedin':
      return new LinkedInConnector(apiKey);
    case 'indeed':
      return new IndeedConnector(apiKey);
    default:
      throw new Error(`Unsupported job board source: ${source}`);
  }
}

/**
 * Convert a JobListing to InsertJob for storage
 * @param listing Job listing from API
 * @returns InsertJob formatted for database storage
 */
export function convertToInsertJob(listing: JobListing | JobDetails): InsertJob {
  return {
    title: listing.title,
    company: listing.company,
    location: listing.location,
    description: 'fullDescription' in listing ? listing.fullDescription : listing.description,
    salary: listing.salary,
    jobType: listing.jobType,
    skills: 'skills' in listing ? listing.skills : undefined,
    source: listing.source,
    remoteOption: listing.remoteOption,
    postedAt: listing.datePosted
  };
}