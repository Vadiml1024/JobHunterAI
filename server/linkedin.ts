import axios from 'axios';
import { load } from 'cheerio';

/**
 * Fetches a LinkedIn profile data using the profile URL
 * @param profileUrl URL of the LinkedIn profile
 * @returns Parsed LinkedIn profile data
 */
export async function fetchLinkedInProfile(profileUrl: string): Promise<any> {
  try {
    // In a real implementation, this would use LinkedIn API with proper OAuth
    // For now, we're implementing a simplified version that would need to be replaced with official API
    
    // Fetch the profile page
    const response = await axios.get(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobSearchApp/1.0)',
        'Accept': 'text/html',
      }
    });
    
    // Parse HTML to extract data
    const $ = load(response.data);
    
    // Extract basic profile information
    const profile: any = {
      publicProfileUrl: profileUrl,
      formattedName: $('.pv-top-card-section__name').text().trim() || 
                     $('.text-heading-xlarge').text().trim(),
      headline: $('.pv-top-card-section__headline').text().trim() || 
                $('.text-body-medium').text().trim(),
      location: $('.pv-top-card-section__location').text().trim() || 
                $('.text-body-small.inline.t-black--light.break-words').text().trim(),
      summary: $('#about + div .pv-shared-text-with-see-more').text().trim() || 
               $('.pv-about-section .pv-about__summary-text').text().trim(),
      skills: [],
      positions: { values: [] },
      educations: { values: [] }
    };
    
    // Extract skills
    $('.pv-skill-category-entity__name-text').each((i, elem) => {
      profile.skills.push({ name: $(elem).text().trim() });
    });
    
    // Alternative skill selector for newer LinkedIn layouts
    $('.skill-category-entity__name').each((i, elem) => {
      profile.skills.push({ name: $(elem).text().trim() });
    });
    
    // Extract experience
    $('.pv-entity__position-group').each((i, elem) => {
      const company = $('.pv-entity__company-summary-info h3').text().trim();
      
      $(elem).find('.pv-entity__role-details').each((j, role) => {
        const title = $(role).find('.pv-entity__summary-info-margin-top h3').text().trim();
        const dateRange = $(role).find('.pv-entity__date-range span:not(.visually-hidden)').text().trim();
        const dates = parseDateRange(dateRange);
        
        profile.positions.values.push({
          company: { name: company },
          title: title,
          startDate: dates.startDate,
          endDate: dates.endDate,
          summary: $(role).find('.pv-entity__description').text().trim()
        });
      });
    });
    
    // Alternative experience selector for newer LinkedIn layouts
    $('.experience-section .pv-profile-section__card-item').each((i, elem) => {
      const title = $(elem).find('.pv-entity__summary-info h3').text().trim();
      const company = $(elem).find('.pv-entity__secondary-title').text().trim();
      const dateRange = $(elem).find('.pv-entity__date-range span:not(.visually-hidden)').text().trim();
      const dates = parseDateRange(dateRange);
      
      profile.positions.values.push({
        company: { name: company },
        title: title,
        startDate: dates.startDate,
        endDate: dates.endDate,
        summary: $(elem).find('.pv-entity__description').text().trim()
      });
    });
    
    // Extract education
    $('.education-section .pv-profile-section__card-item').each((i, elem) => {
      const school = $(elem).find('.pv-entity__school-name').text().trim();
      const degree = $(elem).find('.pv-entity__degree-name .pv-entity__comma-item').text().trim();
      const field = $(elem).find('.pv-entity__fos .pv-entity__comma-item').text().trim();
      const dateRange = $(elem).find('.pv-entity__dates span:not(.visually-hidden)').text().trim();
      const dates = parseDateRange(dateRange);
      
      profile.educations.values.push({
        schoolName: school,
        degree: degree,
        fieldOfStudy: field,
        startDate: dates.startDate ? { year: dates.startDate.year } : undefined,
        endDate: dates.endDate ? { year: dates.endDate.year } : undefined
      });
    });
    
    return profile;
  } catch (error) {
    console.error('Error fetching LinkedIn profile:', error);
    throw new Error('Failed to fetch LinkedIn profile. Make sure the URL is correct and public.');
  }
}

/**
 * Helper function to parse date ranges from LinkedIn
 */
function parseDateRange(dateRange: string): { startDate?: { month: number, year: number }, endDate?: { month: number, year: number } } {
  const result: { startDate?: { month: number, year: number }, endDate?: { month: number, year: number } } = {};
  
  if (!dateRange) return result;
  
  // Format is typically "May 2018 - Present" or "May 2018 - Jun 2020"
  const parts = dateRange.split(' - ');
  if (parts.length < 1) return result;
  
  // Parse start date
  const startDate = parseLinkedInDate(parts[0]);
  if (startDate) {
    result.startDate = startDate;
  }
  
  // Parse end date if not "Present"
  if (parts.length > 1 && parts[1].toLowerCase() !== 'present') {
    const endDate = parseLinkedInDate(parts[1]);
    if (endDate) {
      result.endDate = endDate;
    }
  }
  
  return result;
}

/**
 * Helper function to parse individual dates from LinkedIn
 */
function parseLinkedInDate(dateStr: string): { month: number, year: number } | undefined {
  if (!dateStr) return undefined;
  
  const months: { [key: string]: number } = {
    'jan': 1, 'january': 1,
    'feb': 2, 'february': 2,
    'mar': 3, 'march': 3,
    'apr': 4, 'april': 4,
    'may': 5,
    'jun': 6, 'june': 6,
    'jul': 7, 'july': 7,
    'aug': 8, 'august': 8,
    'sep': 9, 'september': 9,
    'oct': 10, 'october': 10,
    'nov': 11, 'november': 11,
    'dec': 12, 'december': 12
  };
  
  // Try to extract month and year
  const parts = dateStr.trim().split(' ');
  
  if (parts.length === 1) {
    // Just a year
    const year = parseInt(parts[0]);
    if (!isNaN(year)) {
      return { month: 1, year };
    }
  } else if (parts.length >= 2) {
    // Month and year
    const monthStr = parts[0].toLowerCase();
    const month = months[monthStr];
    const year = parseInt(parts[parts.length - 1]);
    
    if (month && !isNaN(year)) {
      return { month, year };
    }
  }
  
  return undefined;
}

/**
 * Exports a resume to LinkedIn format
 * @param resumeData Resume data from the application
 * @returns LinkedIn formatted data
 */
export function exportResumeToLinkedIn(resumeData: any): any {
  // In a real implementation, this would format data according to LinkedIn API requirements
  // For now, we'll return a simplified structure that would need to be expanded for actual use
  
  return {
    firstName: resumeData.name?.split(' ')[0] || '',
    lastName: resumeData.name?.split(' ').slice(1).join(' ') || '',
    headline: `Job Seeker with skills in ${(resumeData.skills || []).slice(0, 3).join(', ')}`,
    summary: extractSummaryFromContent(resumeData.content || ''),
    experience: extractExperienceFromContent(resumeData.content || ''),
    education: extractEducationFromContent(resumeData.content || ''),
    skills: resumeData.skills || []
  };
}

// Helper functions to extract sections from resume content
function extractSummaryFromContent(content: string): string {
  // Simple parsing to extract summary section from markdown content
  const summaryMatch = content.match(/#+\s*Summary\s*\n+([\s\S]*?)(?=#+|$)/i);
  return summaryMatch ? summaryMatch[1].trim() : '';
}

function extractExperienceFromContent(content: string): any[] {
  // Simple parsing to extract experience section from markdown content
  const experienceMatch = content.match(/#+\s*Experience\s*\n+([\s\S]*?)(?=#+|$)/i);
  if (!experienceMatch) return [];
  
  const experienceContent = experienceMatch[1];
  const experiences: any[] = [];
  
  // Try to extract individual positions (this is a simplified version)
  const positionMatches = experienceContent.match(/###\s*(.*?)(?=###|$)/gs);
  
  if (positionMatches) {
    positionMatches.forEach(posMatch => {
      const titleMatch = posMatch.match(/###\s*(.*?)(?=\n|$)/);
      const title = titleMatch ? titleMatch[1].trim() : '';
      
      // Try to extract company and title
      const titleParts = title.split(' at ');
      const positionTitle = titleParts[0].trim();
      const company = titleParts.length > 1 ? titleParts[1].trim() : '';
      
      // Try to extract dates
      const dateMatch = posMatch.match(/(\d{1,2}\/\d{4})\s*-\s*(\d{1,2}\/\d{4}|Present)/i);
      
      experiences.push({
        title: positionTitle,
        company: { name: company },
        startDate: dateMatch ? parseResumeDate(dateMatch[1]) : undefined,
        endDate: dateMatch && dateMatch[2].toLowerCase() !== 'present' ? parseResumeDate(dateMatch[2]) : undefined,
        description: posMatch.replace(/###.*?\n/, '').trim()
      });
    });
  }
  
  return experiences;
}

function extractEducationFromContent(content: string): any[] {
  // Simple parsing to extract education section from markdown content
  const educationMatch = content.match(/#+\s*Education\s*\n+([\s\S]*?)(?=#+|$)/i);
  if (!educationMatch) return [];
  
  const educationContent = educationMatch[1];
  const educations: any[] = [];
  
  // Try to extract individual education entries
  const educationMatches = educationContent.match(/###\s*(.*?)(?=###|$)/gs);
  
  if (educationMatches) {
    educationMatches.forEach(eduMatch => {
      const degreeMatch = eduMatch.match(/###\s*(.*?)(?=\n|$)/);
      const degree = degreeMatch ? degreeMatch[1].trim() : '';
      
      // Try to extract degree and field
      const degreeParts = degree.split(' in ');
      const degreeTitle = degreeParts[0].trim();
      const field = degreeParts.length > 1 ? degreeParts[1].trim() : '';
      
      // Try to extract school name (second line)
      const lines = eduMatch.split('\n').map(l => l.trim()).filter(l => l);
      const school = lines.length > 1 ? lines[1] : '';
      
      // Try to extract years
      const yearMatch = eduMatch.match(/(\d{4})\s*-\s*(\d{4})/);
      
      educations.push({
        degree: degreeTitle,
        fieldOfStudy: field,
        schoolName: school,
        startDate: yearMatch ? { year: parseInt(yearMatch[1]) } : undefined,
        endDate: yearMatch ? { year: parseInt(yearMatch[2]) } : undefined
      });
    });
  }
  
  return educations;
}

function parseResumeDate(dateStr: string): { month: number, year: number } | undefined {
  // Parse dates in format MM/YYYY
  const parts = dateStr.split('/');
  if (parts.length === 2) {
    const month = parseInt(parts[0]);
    const year = parseInt(parts[1]);
    
    if (!isNaN(month) && !isNaN(year)) {
      return { month, year };
    }
  }
  
  return undefined;
}