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
    getGmailAuthUrl(userId: string): string {
        return this.gmailService.getAuthUrl(userId);
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
    getNotionAuthUrl(): string {
        return this.notionService.getAuthUrl();
    }

    async handleNotionCallback(code: string, userId: string): Promise<void> {
        await this.notionService.handleCallback(code, userId);
    }

    async getNotionDatabases(userId: string) {
        return await this.notionService.listDatabases(userId);
    }

    async disconnectNotion(userId: string): Promise<void> {
        await this.notionService.disconnect(userId);
    }

    async getNotionStatus(userId: string): Promise<{ connected: boolean }> {
        const connected = await this.notionService.isConnected(userId);
        return { connected };
    }

    // Google Calendar methods
    getGoogleCalendarAuthUrl(userId: string): string {
        return this.calendarService.getAuthUrl(userId);
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
