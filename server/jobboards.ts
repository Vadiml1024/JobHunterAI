import axios from 'axios';
import { InsertJob } from '@shared/schema';
import { load as cheerioLoad } from 'cheerio';

// Keep track of API keys for each provider
interface ApiKeyRegistry {
  [provider: string]: string;
}

// Global API key registry to maintain valid keys
const apiKeyRegistry: ApiKeyRegistry = {};

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
 * Glassdoor Jobs API connector
 */
export class GlassdoorConnector implements JobBoardConnector {
  private apiKey: string;
  private apiBaseUrl: string;
  private partnerId: string;
  
  constructor(apiKey: string) {
    // For Glassdoor, the apiKey is expected to be in format "partnerId:apiKey"
    const [partnerId, key] = apiKey.includes(':') ? apiKey.split(':') : ['', apiKey];
    this.partnerId = partnerId;
    this.apiKey = key;
    this.apiBaseUrl = 'https://api.glassdoor.com/api/api.htm';
  }
  
  getName(): string {
    return 'Glassdoor Jobs';
  }
  
  async searchJobs(query: JobSearchQuery): Promise<JobSearchResult> {
    try {
      // Build query parameters for Glassdoor
      const params = {
        v: '1.1',
        format: 'json',
        't.p': this.partnerId,
        't.k': this.apiKey,
        action: 'jobs',
        keyword: query.keywords,
        location: query.location,
        jobType: this.mapJobType(query.jobType),
        fromAge: this.mapDatePosted(query.datePosted),
        page: query.page || 1,
        pageSize: query.pageSize || 10,
        returnJobListings: true
      };
      
      const response = await axios.get(this.apiBaseUrl, {
        params,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return this.transformSearchResults(response.data);
    } catch (error) {
      console.error('Glassdoor Jobs API error:', error);
      return { jobs: [], totalJobs: 0, pageCount: 0, currentPage: 1 };
    }
  }
  
  async getJobDetails(jobId: string): Promise<JobDetails | null> {
    try {
      // Glassdoor API for job details
      const params = {
        v: '1.1',
        format: 'json',
        't.p': this.partnerId,
        't.k': this.apiKey,
        action: 'job-listing',
        jobListingId: jobId
      };
      
      const response = await axios.get(this.apiBaseUrl, {
        params,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return this.transformJobDetails(response.data);
    } catch (error) {
      console.error('Glassdoor Job Details API error:', error);
      return null;
    }
  }
  
  // Helper methods to map between our standard format and Glassdoor's API
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
  
  // Transform Glassdoor response to our standard format
  private transformSearchResults(data: any): JobSearchResult {
    const response = data?.response || {};
    const jobListings = response.jobListings || [];
    
    const jobs: JobListing[] = jobListings.map((job: any) => ({
      id: job.jobListingId.toString(),
      title: job.jobTitle,
      company: job.employer.name,
      location: job.location,
      salary: job.salarySourceText,
      description: job.jobDescription,
      jobType: job.jobType,
      datePosted: new Date(job.listingDate),
      url: job.jobViewUrl,
      source: 'Glassdoor',
      remoteOption: job.isRemote ? 'Remote' : 'On-site'
    }));
    
    return {
      jobs,
      totalJobs: response.totalRecordCount || jobs.length,
      pageCount: Math.ceil((response.totalRecordCount || jobs.length) / (response.pageSize || 10)),
      currentPage: response.currentPageNumber || 1
    };
  }
  
  // Transform Glassdoor job details to our standard format
  private transformJobDetails(data: any): JobDetails | null {
    const jobListing = data?.response?.jobListing;
    if (!jobListing) return null;
    
    return {
      id: jobListing.jobListingId.toString(),
      title: jobListing.jobTitle,
      company: jobListing.employer.name,
      location: jobListing.location,
      salary: jobListing.salarySourceText,
      description: jobListing.jobDescription,
      fullDescription: jobListing.jobDescription,
      jobType: jobListing.jobType,
      datePosted: new Date(jobListing.listingDate),
      url: jobListing.jobViewUrl,
      source: 'Glassdoor',
      remoteOption: jobListing.isRemote ? 'Remote' : 'On-site',
      requirements: this.extractRequirements(jobListing.jobDescription),
      skills: this.extractSkills(jobListing.jobDescription),
      benefits: jobListing.benefits ? jobListing.benefits.split(',').map((b: string) => b.trim()) : undefined,
      applicationUrl: jobListing.applyUrl || jobListing.jobViewUrl
    };
  }
  
  // Helper to extract requirements from job description - reusing common implementation
  private extractRequirements(description?: string): string[] {
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
  
  // Helper to extract skills from job description - reusing common implementation
  private extractSkills(description?: string): string[] {
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
 * Web scraper connector for job boards without API
 * This uses web scraping as a fallback when API keys aren't available
 */
export class JobBoardScraperConnector implements JobBoardConnector {
  private source: string;
  private baseUrl: string;
  
  constructor(source: string) {
    this.source = source;
    
    // Set up the base URL based on the source
    switch (source.toLowerCase()) {
      case 'linkedin':
        this.baseUrl = 'https://www.linkedin.com/jobs';
        break;
      case 'indeed':
        this.baseUrl = 'https://www.indeed.com';
        break;
      case 'glassdoor':
        this.baseUrl = 'https://www.glassdoor.com/Job';
        break;
      default:
        this.baseUrl = 'https://www.google.com/search?q=jobs';
    }
  }
  
  getName(): string {
    return `${this.source} Jobs (Scraper)`;
  }
  
  async searchJobs(query: JobSearchQuery): Promise<JobSearchResult> {
    try {
      // Build URL based on the job board
      let searchUrl = '';
      const page = query.page || 1;
      
      if (this.source.toLowerCase() === 'linkedin') {
        searchUrl = `${this.baseUrl}/search?keywords=${encodeURIComponent(query.keywords || '')}&location=${encodeURIComponent(query.location || '')}&start=${(page - 1) * 10}`;
      } else if (this.source.toLowerCase() === 'indeed') {
        searchUrl = `${this.baseUrl}/jobs?q=${encodeURIComponent(query.keywords || '')}&l=${encodeURIComponent(query.location || '')}&start=${(page - 1) * 10}`;
      } else if (this.source.toLowerCase() === 'glassdoor') {
        searchUrl = `${this.baseUrl}/Search/results.htm?keyword=${encodeURIComponent(query.keywords || '')}&locId=0&locT=S&locName=${encodeURIComponent(query.location || '')}&page=${page}`;
      } else {
        searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${query.keywords || 'jobs'} ${query.location || ''} ${query.jobType || ''}`)}`;
      }
      
      // Make the request with a browser-like user agent
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });
      
      // Parse the HTML to extract job listings
      const $ = cheerioLoad(response.data);
      const jobs: JobListing[] = [];
      const totalJobs = 100; // It's hard to determine exact count from scraping
      
      // Different selectors based on the source
      if (this.source.toLowerCase() === 'linkedin') {
        $('.job-search-card').each((i, el) => {
          const id = $(el).data('id')?.toString() || `linkedin-${i}`;
          const title = $(el).find('.job-search-card__title').text().trim();
          const company = $(el).find('.job-search-card__company-name').text().trim();
          const location = $(el).find('.job-search-card__location').text().trim();
          const datePosted = $(el).find('time').attr('datetime') || new Date().toISOString();
          const url = $(el).find('a.job-search-card__link').attr('href') || '';
          
          jobs.push({
            id,
            title,
            company,
            location,
            datePosted: new Date(datePosted),
            url,
            source: 'LinkedIn'
          });
        });
      } else if (this.source.toLowerCase() === 'indeed') {
        $('.jobsearch-ResultsList .job_seen_beacon').each((i, el) => {
          const id = $(el).data('jk')?.toString() || `indeed-${i}`;
          const title = $(el).find('.jobTitle').text().trim();
          const company = $(el).find('.companyName').text().trim();
          const location = $(el).find('.companyLocation').text().trim();
          const dateText = $(el).find('.date').text().trim().replace('Posted ', '');
          const datePosted = this.parseDateText(dateText);
          const url = `https://www.indeed.com/viewjob?jk=${id}`;
          
          jobs.push({
            id,
            title,
            company,
            location,
            datePosted,
            url,
            source: 'Indeed'
          });
        });
      } else if (this.source.toLowerCase() === 'glassdoor') {
        $('.react-job-listing').each((i, el) => {
          const id = $(el).data('id')?.toString() || `glassdoor-${i}`;
          const title = $(el).find('.job-title').text().trim();
          const company = $(el).find('.employer-name').text().trim();
          const location = $(el).find('.location').text().trim();
          const datePosted = new Date(); // Glassdoor doesn't show posting date clearly
          const url = $(el).find('a').attr('href') || '';
          
          jobs.push({
            id,
            title,
            company,
            location,
            datePosted,
            url: url.startsWith('http') ? url : `https://www.glassdoor.com${url}`,
            source: 'Glassdoor'
          });
        });
      }
      
      return {
        jobs,
        totalJobs,
        pageCount: Math.ceil(totalJobs / (query.pageSize || 10)),
        currentPage: page
      };
    } catch (error) {
      console.error(`${this.source} scraping error:`, error);
      return { jobs: [], totalJobs: 0, pageCount: 0, currentPage: 1 };
    }
  }
  
  async getJobDetails(jobId: string): Promise<JobDetails | null> {
    try {
      let jobUrl = '';
      
      // Determine URL based on source and job ID
      if (this.source.toLowerCase() === 'linkedin') {
        jobUrl = `https://www.linkedin.com/jobs/view/${jobId}`;
      } else if (this.source.toLowerCase() === 'indeed') {
        jobUrl = `https://www.indeed.com/viewjob?jk=${jobId}`;
      } else if (this.source.toLowerCase() === 'glassdoor') {
        // Glassdoor needs the whole URL or a different format
        if (jobId.startsWith('glassdoor-')) {
          return null; // Can't determine URL from the ID format we generated
        }
        jobUrl = jobId.startsWith('http') ? jobId : `https://www.glassdoor.com/job-listing/${jobId}`;
      } else {
        return null;
      }
      
      // Make the request with a browser-like user agent
      const response = await axios.get(jobUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });
      
      // Parse the HTML to extract job details
      const $ = cheerioLoad(response.data);
      
      // Different selectors based on the source
      if (this.source.toLowerCase() === 'linkedin') {
        const title = $('.job-details-jobs-unified-top-card__job-title').text().trim();
        const company = $('.job-details-jobs-unified-top-card__company-name').text().trim();
        const location = $('.job-details-jobs-unified-top-card__bullet').first().text().trim();
        const fullDescription = $('.description__text').text().trim();
        
        return {
          id: jobId,
          title,
          company,
          location,
          description: fullDescription.substring(0, 200) + '...',
          fullDescription,
          datePosted: new Date(),
          url: jobUrl,
          source: 'LinkedIn',
          requirements: this.extractRequirements(fullDescription),
          skills: this.extractSkills(fullDescription)
        };
      } else if (this.source.toLowerCase() === 'indeed') {
        const title = $('.jobsearch-JobInfoHeader-title').text().trim();
        const company = $('.jobsearch-InlineCompanyRating-companyHeader').text().trim();
        const location = $('.jobsearch-JobInfoHeader-subtitle').find('.jobsearch-JobInfoHeader-subtitle-location').text().trim();
        const fullDescription = $('#jobDescriptionText').text().trim();
        
        return {
          id: jobId,
          title,
          company,
          location,
          description: fullDescription.substring(0, 200) + '...',
          fullDescription,
          datePosted: new Date(),
          url: jobUrl,
          source: 'Indeed',
          requirements: this.extractRequirements(fullDescription),
          skills: this.extractSkills(fullDescription)
        };
      } else if (this.source.toLowerCase() === 'glassdoor') {
        const title = $('.job-title').text().trim();
        const company = $('.employer-name').text().trim();
        const location = $('.location').text().trim();
        const fullDescription = $('.jobDescriptionContent').text().trim();
        
        return {
          id: jobId,
          title,
          company,
          location,
          description: fullDescription.substring(0, 200) + '...',
          fullDescription,
          datePosted: new Date(),
          url: jobUrl,
          source: 'Glassdoor',
          requirements: this.extractRequirements(fullDescription),
          skills: this.extractSkills(fullDescription)
        };
      }
      
      return null;
    } catch (error) {
      console.error(`${this.source} job details scraping error:`, error);
      return null;
    }
  }
  
  // Parse date text like "3 days ago", "Posted today", etc.
  private parseDateText(dateText: string): Date {
    const date = new Date();
    
    if (dateText.includes('today')) {
      return date;
    } else if (dateText.includes('yesterday')) {
      date.setDate(date.getDate() - 1);
      return date;
    } else if (dateText.includes('days ago')) {
      const days = parseInt(dateText.match(/(\d+)/)?.[1] || '0', 10);
      date.setDate(date.getDate() - days);
      return date;
    } else if (dateText.includes('weeks ago') || dateText.includes('week ago')) {
      const weeks = parseInt(dateText.match(/(\d+)/)?.[1] || '1', 10);
      date.setDate(date.getDate() - (weeks * 7));
      return date;
    } else if (dateText.includes('months ago') || dateText.includes('month ago')) {
      const months = parseInt(dateText.match(/(\d+)/)?.[1] || '1', 10);
      date.setMonth(date.getMonth() - months);
      return date;
    }
    
    return date;
  }
  
  // Common implementation for extracting requirements
  private extractRequirements(description: string): string[] {
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
  
  // Common implementation for extracting skills
  private extractSkills(description: string): string[] {
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
 * Registers an API key for a specific job board provider
 * @param provider The job board provider name
 * @param apiKey The API key for the provider
 */
export function registerApiKey(provider: string, apiKey: string): void {
  apiKeyRegistry[provider.toLowerCase()] = apiKey;
}

/**
 * Checks if an API key is registered for a provider
 * @param provider The job board provider name
 * @returns True if the provider has a registered API key
 */
export function hasApiKey(provider: string): boolean {
  return !!apiKeyRegistry[provider.toLowerCase()];
}

/**
 * Factory function to create a job board connector based on source name
 * @param source Name of the job board source
 * @param apiKey API key for the job board
 * @returns Connector instance for the specified job board
 */
export function createJobBoardConnector(source: string, apiKey: string): JobBoardConnector {
  // Register the API key if provided
  if (apiKey) {
    registerApiKey(source, apiKey);
  }
  
  // If we have a registered API key, use that instead
  const registeredKey = apiKeyRegistry[source.toLowerCase()];
  const effectiveKey = registeredKey || apiKey;
  
  // If we have a key, use the API connector
  if (effectiveKey) {
    switch (source.toLowerCase()) {
      case 'linkedin':
        return new LinkedInConnector(effectiveKey);
      case 'indeed':
        return new IndeedConnector(effectiveKey);
      case 'glassdoor':
        return new GlassdoorConnector(effectiveKey);
      default:
        // Fall back to scraping for unknown sources with keys
        return new JobBoardScraperConnector(source);
    }
  }
  
  // If no API key, fall back to web scraping
  return new JobBoardScraperConnector(source);
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