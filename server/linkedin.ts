import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Fetches a LinkedIn profile data using the profile URL
 * @param profileUrl URL of the LinkedIn profile
 * @returns Parsed LinkedIn profile data
 */
export async function fetchLinkedInProfile(profileUrl: string): Promise<any> {
  try {
    // In a real implementation, this would use LinkedIn's API with proper OAuth
    // For this demo, we're using a simplified approach that would parse public profile data
    
    // Sample LinkedIn profile structure (would be fetched via API in production)
    const profileData = {
      basics: {
        name: "John Doe",
        headline: "Software Engineer at Tech Company",
        location: {
          city: "San Francisco",
          region: "CA"
        },
        summary: "Experienced software engineer with expertise in web development, cloud computing, and distributed systems."
      },
      work: [
        {
          company: "Tech Company",
          position: "Senior Software Engineer",
          website: "https://techcompany.com",
          startDate: "2018-01",
          endDate: null,
          summary: "Lead developer for cloud infrastructure projects, focused on scalability and reliability."
        },
        {
          company: "Previous Corp",
          position: "Software Engineer",
          website: "https://previouscorp.com",
          startDate: "2015-05",
          endDate: "2017-12",
          summary: "Full-stack developer working on customer-facing applications."
        }
      ],
      education: [
        {
          institution: "University of California, Berkeley",
          area: "Computer Science",
          studyType: "Bachelor",
          startDate: "2011-09",
          endDate: "2015-05"
        }
      ],
      skills: [
        "JavaScript",
        "TypeScript",
        "React",
        "Node.js",
        "AWS",
        "Docker",
        "Kubernetes",
        "REST APIs",
        "GraphQL",
        "CI/CD"
      ]
    };
    
    // For demonstration, extract username from URL to simulate different profiles
    const username = profileUrl.split('/').pop() || 'default';
    profileData.basics.name = `${username.charAt(0).toUpperCase() + username.slice(1)} User`;
    
    return profileData;
  } catch (error) {
    console.error('Error fetching LinkedIn profile:', error);
    throw new Error('Failed to fetch LinkedIn profile data');
  }
}

/**
 * Helper function to parse date ranges from LinkedIn
 */
function parseDateRange(dateRange: string): { startDate?: { month: number, year: number }, endDate?: { month: number, year: number } } {
  const parts = dateRange.split(' - ');
  const result: { startDate?: { month: number, year: number }, endDate?: { month: number, year: number } } = {};
  
  if (parts[0]) {
    result.startDate = parseLinkedInDate(parts[0]);
  }
  
  if (parts[1] && parts[1].toLowerCase() !== 'present') {
    result.endDate = parseLinkedInDate(parts[1]);
  }
  
  return result;
}

/**
 * Helper function to parse individual dates from LinkedIn
 */
function parseLinkedInDate(dateStr: string): { month: number, year: number } | undefined {
  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  
  try {
    const parts = dateStr.toLowerCase().trim().split(' ');
    if (parts.length === 2) {
      const month = months.indexOf(parts[0]) + 1;
      const year = parseInt(parts[1], 10);
      
      if (!isNaN(month) && !isNaN(year) && month >= 1 && month <= 12) {
        return { month, year };
      }
    } else if (parts.length === 1) {
      const year = parseInt(parts[0], 10);
      if (!isNaN(year)) {
        return { month: 1, year };
      }
    }
  } catch (error) {
    console.error('Error parsing LinkedIn date:', error);
  }
  
  return undefined;
}

/**
 * Exports a resume to LinkedIn format
 * @param resumeData Resume data from the application
 * @returns LinkedIn formatted data
 */
export function exportResumeToLinkedIn(resumeData: any): any {
  try {
    // Extract necessary data from resume
    const { personalInfo, summary, experience, education, skills } = resumeData;
    
    // Format data for LinkedIn
    const linkedInFormat = {
      intro: {
        name: personalInfo.name,
        headline: personalInfo.title,
        location: `${personalInfo.city}, ${personalInfo.state}`,
        about: extractSummaryFromContent(summary)
      },
      experience: extractExperienceFromContent(experience),
      education: extractEducationFromContent(education),
      skills: skills.map((skill: string) => ({ name: skill }))
    };
    
    return linkedInFormat;
  } catch (error) {
    console.error('Error exporting resume to LinkedIn format:', error);
    throw new Error('Failed to convert resume to LinkedIn format');
  }
}

function extractSummaryFromContent(content: string): string {
  // Simple extraction - in a real app, this might need more processing
  return content || '';
}

function extractExperienceFromContent(content: string): any[] {
  // For demo purposes - in a real app, this would parse structured data
  if (!content) return [];
  
  try {
    // Sample parsing logic (would be more robust in production)
    const experiences = [];
    const lines = content.split('\n');
    
    let currentExp: any = {};
    
    for (const line of lines) {
      if (line.includes(' at ')) {
        // Start a new experience entry
        if (currentExp.title) {
          experiences.push(currentExp);
        }
        
        const parts = line.split(' at ');
        currentExp = {
          title: parts[0].trim(),
          company: parts[1].trim(),
          description: ''
        };
      } else if (line.match(/\d{2}\/\d{4}\s*-\s*(\d{2}\/\d{4}|Present)/i)) {
        // Date information
        const dateParts = line.split('-');
        const startDate = parseResumeDate(dateParts[0].trim());
        const endDate = dateParts[1].toLowerCase().includes('present') 
          ? null 
          : parseResumeDate(dateParts[1].trim());
        
        if (currentExp) {
          currentExp.startDate = startDate ? `${startDate.year}-${String(startDate.month).padStart(2, '0')}` : undefined;
          currentExp.endDate = endDate ? `${endDate.year}-${String(endDate.month).padStart(2, '0')}` : null;
        }
      } else if (line.trim() && currentExp) {
        // Add to description
        currentExp.description += line.trim() + ' ';
      }
    }
    
    // Add the last experience if exists
    if (currentExp.title) {
      experiences.push(currentExp);
    }
    
    return experiences;
  } catch (error) {
    console.error('Error extracting experience:', error);
    return [];
  }
}

function extractEducationFromContent(content: string): any[] {
  // For demo purposes - in a real app, this would parse structured data
  if (!content) return [];
  
  try {
    // Sample parsing logic (would be more robust in production)
    const educations = [];
    const lines = content.split('\n');
    
    let currentEdu: any = {};
    
    for (const line of lines) {
      if (line.includes(' - ') && (line.includes('University') || line.includes('College'))) {
        // Start a new education entry
        if (currentEdu.school) {
          educations.push(currentEdu);
        }
        
        const parts = line.split(' - ');
        currentEdu = {
          school: parts[0].trim(),
          degree: parts[1].trim(),
          field: ''
        };
      } else if (line.match(/\d{4}\s*-\s*\d{4}/)) {
        // Date information
        const dateParts = line.split('-');
        
        if (currentEdu) {
          currentEdu.startDate = dateParts[0].trim();
          currentEdu.endDate = dateParts[1].trim();
        }
      } else if (line.includes('Major:') || line.includes('Field:')) {
        // Field of study
        const parts = line.split(':');
        if (currentEdu && parts.length > 1) {
          currentEdu.field = parts[1].trim();
        }
      }
    }
    
    // Add the last education if exists
    if (currentEdu.school) {
      educations.push(currentEdu);
    }
    
    return educations;
  } catch (error) {
    console.error('Error extracting education:', error);
    return [];
  }
}

function parseResumeDate(dateStr: string): { month: number, year: number } | undefined {
  try {
    // Handle common date formats like MM/YYYY
    const match = dateStr.match(/(\d{2})\/(\d{4})/);
    if (match) {
      const month = parseInt(match[1], 10);
      const year = parseInt(match[2], 10);
      
      if (!isNaN(month) && !isNaN(year) && month >= 1 && month <= 12) {
        return { month, year };
      }
    }
  } catch (error) {
    console.error('Error parsing resume date:', error);
  }
  
  return undefined;
}