import { google, Auth } from 'googleapis';
import ical, { ICalAlarmType } from 'ical-generator';

// Google OAuth2 client setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * Gets the Google OAuth2 URL for authorization
 * @returns Authorization URL for Google Calendar access
 */
export function getGoogleAuthUrl(): string {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ];
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent' // Force to get refresh token
  });
}

/**
 * Exchanges authorization code for tokens
 * @param code Authorization code from Google OAuth2
 * @returns Tokens including refresh token
 */
export async function getGoogleTokens(code: string): Promise<Auth.Credentials> {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Sets up OAuth2 client with refresh token
 * @param refreshToken Google OAuth2 refresh token
 * @returns Configured OAuth2 client
 */
export function getAuthClientWithRefreshToken(refreshToken: string): Auth.OAuth2Client {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  client.setCredentials({
    refresh_token: refreshToken
  });
  
  return client;
}

/**
 * Creates a calendar event for a job application
 * @param auth Authenticated Google OAuth2 client
 * @param applicationData Application data containing details for the event
 * @returns ID of the created calendar event
 */
export async function createCalendarEvent(auth: Auth.OAuth2Client, applicationData: any): Promise<string> {
  const calendar = google.calendar({ version: 'v3', auth });
  
  // Get job details
  const job = applicationData.job || { title: 'Job Application' };
  
  // Determine event details based on application status and dates
  let summary = `${applicationData.status.toUpperCase()}: ${job.title} at ${job.company}`;
  let description = `Application for ${job.title} position at ${job.company}.\n\n`;
  
  if (job.description) {
    description += `Job Description: ${job.description}\n\n`;
  }
  
  if (applicationData.notes) {
    description += `Notes: ${applicationData.notes}\n\n`;
  }
  
  // Set event date - use interview date, deadline date, or default to applied date
  let eventDate = new Date();
  let endTime = new Date();
  
  if (applicationData.interviewDate) {
    summary = `INTERVIEW: ${job.title} at ${job.company}`;
    eventDate = new Date(applicationData.interviewDate);
    endTime = new Date(eventDate.getTime() + 60 * 60 * 1000); // 1 hour interview by default
  } else if (applicationData.deadlineDate) {
    summary = `DEADLINE: ${job.title} at ${job.company}`;
    eventDate = new Date(applicationData.deadlineDate);
    endTime = new Date(eventDate.getTime() + 30 * 60 * 1000); // 30 minute event
  } else {
    // Use application date + 7 days for follow-up by default
    eventDate = new Date(applicationData.appliedAt);
    eventDate.setDate(eventDate.getDate() + 7);
    endTime = new Date(eventDate.getTime() + 30 * 60 * 1000); // 30 minute event
    summary = `FOLLOW UP: ${job.title} at ${job.company}`;
  }
  
  // Create the event
  const event = {
    summary,
    description,
    start: {
      dateTime: eventDate.toISOString(),
      timeZone: 'America/Los_Angeles', // Default timezone, should be user preference
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'America/Los_Angeles', // Default timezone, should be user preference
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 60 }, // 1 hour before
      ],
    },
    colorId: getColorForStatus(applicationData.status),
  };
  
  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });
    
    return response.data.id || '';
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw new Error('Failed to create calendar event');
  }
}

/**
 * Updates an existing calendar event
 * @param auth Authenticated Google OAuth2 client
 * @param eventId Existing event ID
 * @param applicationData Updated application data
 * @returns ID of the updated event
 */
export async function updateCalendarEvent(auth: Auth.OAuth2Client, eventId: string, applicationData: any): Promise<string> {
  const calendar = google.calendar({ version: 'v3', auth });
  
  try {
    // First get the existing event
    const existingEvent = await calendar.events.get({
      calendarId: 'primary',
      eventId,
    });
    
    if (!existingEvent.data) {
      throw new Error('Event not found');
    }
    
    // Get job details
    const job = applicationData.job || { title: 'Job Application' };
    
    // Update event details based on application status and dates
    let summary = `${applicationData.status.toUpperCase()}: ${job.title} at ${job.company}`;
    let description = `Application for ${job.title} position at ${job.company}.\n\n`;
    
    if (job.description) {
      description += `Job Description: ${job.description}\n\n`;
    }
    
    if (applicationData.notes) {
      description += `Notes: ${applicationData.notes}\n\n`;
    }
    
    // Set event date - use interview date, deadline date, or default to applied date
    let eventDate = new Date();
    let endTime = new Date();
    
    if (applicationData.interviewDate) {
      summary = `INTERVIEW: ${job.title} at ${job.company}`;
      eventDate = new Date(applicationData.interviewDate);
      endTime = new Date(eventDate.getTime() + 60 * 60 * 1000); // 1 hour interview by default
    } else if (applicationData.deadlineDate) {
      summary = `DEADLINE: ${job.title} at ${job.company}`;
      eventDate = new Date(applicationData.deadlineDate);
      endTime = new Date(eventDate.getTime() + 30 * 60 * 1000); // 30 minute event
    } else {
      // Use current date and time from existing event
      eventDate = new Date(existingEvent.data.start?.dateTime || '');
      endTime = new Date(existingEvent.data.end?.dateTime || '');
      
      // If status changed, update the summary
      if (applicationData.status) {
        summary = `${applicationData.status.toUpperCase()}: ${job.title} at ${job.company}`;
      }
    }
    
    // Prepare the update
    const event = {
      summary,
      description,
      start: {
        dateTime: eventDate.toISOString(),
        timeZone: existingEvent.data.start?.timeZone || 'America/Los_Angeles',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: existingEvent.data.end?.timeZone || 'America/Los_Angeles',
      },
      colorId: getColorForStatus(applicationData.status),
    };
    
    // Update the event
    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: event,
    });
    
    return response.data.id || '';
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw new Error('Failed to update calendar event');
  }
}

/**
 * Deletes a calendar event
 * @param auth Authenticated Google OAuth2 client
 * @param eventId ID of the event to delete
 * @returns True if deletion was successful
 */
export async function deleteCalendarEvent(auth: Auth.OAuth2Client, eventId: string): Promise<boolean> {
  const calendar = google.calendar({ version: 'v3', auth });
  
  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return false;
  }
}

/**
 * Generates an iCalendar file for all application events
 * @param applications List of job applications
 * @returns iCalendar data as string
 */
export function generateICalendar(applications: any[]): string {
  const cal = ical({
    name: 'Job Application Calendar',
    prodId: { company: 'Job Search App', product: 'Calendar' },
    timezone: 'America/Los_Angeles'
  });
  
  applications.forEach(app => {
    const job = app.job || {};
    
    // Determine event details
    let summary = `${app.status.toUpperCase()}: ${job.title || 'Job'} at ${job.company || 'Company'}`;
    let description = `Application for ${job.title || 'position'} at ${job.company || 'company'}`;
    
    if (app.notes) {
      description += `\n\nNotes: ${app.notes}`;
    }
    
    // Determine date
    let start = app.interviewDate 
      ? new Date(app.interviewDate) 
      : app.deadlineDate 
        ? new Date(app.deadlineDate) 
        : new Date(app.appliedAt);
    
    // Create event
    const event = cal.createEvent({
      start,
      end: new Date(start.getTime() + 60 * 60 * 1000), // Add 1 hour
      summary,
      description,
      url: job.url || '',
      timezone: 'America/Los_Angeles'
    });
    
    // Add alert/alarm 1 day before
    event.createAlarm({
      type: 'display' as ICalAlarmType,
      trigger: 60 * 24 // 1 day in minutes
    });
  });
  
  return cal.toString();
}

/**
 * Helper function to get Google Calendar color ID based on application status
 * @param status Application status
 * @returns Google Calendar color ID
 */
function getColorForStatus(status: string): string {
  // Color IDs in Google Calendar:
  // 1: Lavender, 2: Sage, 3: Grape, 4: Flamingo, 5: Banana
  // 6: Tangerine, 7: Peacock, 8: Graphite, 9: Blueberry, 10: Basil, 11: Tomato
  
  switch (status?.toLowerCase()) {
    case 'applied':
      return '9'; // Blue
    case 'interview':
      return '5'; // Yellow/Banana 
    case 'offer':
      return '10'; // Green/Basil
    case 'rejected':
      return '11'; // Red/Tomato
    case 'declined':
      return '8'; // Gray/Graphite
    case 'accepted':
      return '7'; // Peacock (Teal)
    default:
      return '1'; // Lavender (default)
  }
}