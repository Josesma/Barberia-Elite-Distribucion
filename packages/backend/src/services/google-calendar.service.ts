// packages/backend/src/services/google-calendar.service.ts
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import dayjs from 'dayjs';

export class GoogleCalendarService {
  private calendar: any;
  private calendarId: string = 'primary';
  private initialized = false;

  private ensureInitialized() {
    if (this.initialized) return;
    
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    console.log('[GCal] Initializing with email:', email);
    console.log('[GCal] Has private key:', !!key);

    const auth = new JWT({
      email,
      key,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    this.calendar = google.calendar({ version: 'v3', auth });
    this.calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    this.initialized = true;
  }

  /**
   * List busy slots between two dates
   */
  async getBusySlots(start: Date, end: Date) {
    this.ensureInitialized();
    const response = await this.calendar.freebusy.query({
      requestBody: {
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        items: [{ id: this.calendarId }],
      },
    });

    return response.data.calendars?.[this.calendarId].busy || [];
  }

  /**
   * Create an appointment event in Google Calendar
   */
  async createEvent(summary: string, description: string, start: Date, end: Date) {
    this.ensureInitialized();
    const response = await this.calendar.events.insert({
      calendarId: this.calendarId,
      requestBody: {
        summary,
        description,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
      },
    });

    return response.data;
  }

  /**
   * Delete an event by ID
   */
  async deleteEvent(eventId: string) {
    this.ensureInitialized();
    await this.calendar.events.delete({
      calendarId: this.calendarId,
      eventId,
    });
  }
}

export const googleCalendarService = new GoogleCalendarService();
