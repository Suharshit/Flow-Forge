import { GmailService } from './gmail.service';
import { NotionService } from './notion.service';
import { GoogleCalendarService } from './google-calendar.service';

export class AuthService {
    private gmailService: GmailService;
    private notionService: NotionService;
    private calendarService: GoogleCalendarService;

    constructor() {
        this.gmailService = new GmailService();
        this.notionService = new NotionService();
        this.calendarService = new GoogleCalendarService();
    }

    // Gmail methods
    getGmailAuthUrl(): string {
        return this.gmailService.getAuthUrl();
    }

    async handleGmailCallback(code: string, userId: string): Promise<void> {
        await this.gmailService.handleCallback(code, userId);
    }

    async disconnectGmail(userId: string): Promise<void> {
        await this.gmailService.disconnect(userId);
    }

    async getGmailStatus(userId: string): Promise<{ connected: boolean }> {
        const connected = await this.gmailService.isConnected(userId);
        return { connected };
    }

    // Notion methods
    async getNotionDatabases() {
        return await this.notionService.listDatabases();
    }

    // Google Calendar methods
    getGoogleCalendarAuthUrl(): string {
        return this.calendarService.getAuthUrl();
    }

    async handleGoogleCalendarCallback(code: string, userId: string): Promise<void> {
        await this.calendarService.handleCallback(code, userId);
    }

    async disconnectGoogleCalendar(userId: string): Promise<void> {
        await this.calendarService.disconnect(userId);
    }

    async getGoogleCalendarStatus(userId: string): Promise<{ connected: boolean }> {
        const connected = await this.calendarService.isConnected(userId);
        return { connected };
    }

    async listGoogleCalendars(userId: string) {
        return await this.calendarService.listCalendars(userId);
    }
}
