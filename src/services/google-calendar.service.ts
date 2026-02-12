import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { CredentialsRepository } from '../db/repositories/credentials.repository';
import { GoogleCalendar, CalendarEvent } from '../types/calendar.types';

export class GoogleCalendarService {
    private oauth2Client: OAuth2Client;
    private credentialsRepo: CredentialsRepository;

    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET,
            process.env.GOOGLE_CALENDAR_REDIRECT_URI
        );
        this.credentialsRepo = new CredentialsRepository();
    }

    getAuthUrl(): string {
        const scopes = [
            'https://www.googleapis.com/auth/calendar.events',
        ];

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent',
        });
    }

    async handleCallback(code: string, userId: string): Promise<void> {
        const { tokens } = await this.oauth2Client.getToken(code);

        if (!tokens.access_token) {
            throw new Error('No access token received');
        }

        const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : undefined;

        await this.credentialsRepo.create({
            user_id: userId,
            service: 'google-calendar',
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || undefined,
            token_expiry: expiryDate,
        });
    }

    async getAuthenticatedClient(userId: string): Promise<OAuth2Client> {
        const credential = await this.credentialsRepo.findByUserAndService(userId, 'google-calendar');

        if (!credential) {
            throw new Error('Google Calendar not connected for this user');
        }

        this.oauth2Client.setCredentials({
            access_token: credential.access_token,
            refresh_token: credential.refresh_token,
        });

        // Check if token is expired
        if (credential.token_expiry && new Date() >= credential.token_expiry) {
            const { credentials } = await this.oauth2Client.refreshAccessToken();

            if (credentials.access_token) {
                await this.credentialsRepo.update(userId, 'google-calendar', {
                    access_token: credentials.access_token,
                    token_expiry: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
                });

                this.oauth2Client.setCredentials(credentials);
            }
        }

        return this.oauth2Client;
    }

    async listCalendars(userId: string): Promise<GoogleCalendar[]> {
        const auth = await this.getAuthenticatedClient(userId);
        const calendar = google.calendar({ version: 'v3', auth });

        const response = await calendar.calendarList.list();

        return (response.data.items || []).map(cal => ({
            id: cal.id!,
            summary: cal.summary || 'Untitled Calendar',
            description: cal.description || undefined,
            isPrimary: cal.primary || false,
        }));
    }

    async createEvent(
        userId: string,
        calendarId: string,
        event: CalendarEvent
    ): Promise<string> {
        const auth = await this.getAuthenticatedClient(userId);
        const calendar = google.calendar({ version: 'v3', auth });

        const response = await calendar.events.insert({
            calendarId,
            requestBody: event,
        });

        return response.data.id!;
    }

    async disconnect(userId: string): Promise<void> {
        await this.credentialsRepo.delete(userId, 'google-calendar');
    }

    async isConnected(userId: string): Promise<boolean> {
        const credential = await this.credentialsRepo.findByUserAndService(userId, 'google-calendar');
        return credential !== null;
    }
}
