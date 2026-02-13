import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { GmailEmail } from '../types/credentials.types';
import { CredentialsRepository } from '../db/repositories/credentials.repository';

export class GmailService {
    private oauth2Client: OAuth2Client;
    private credentialsRepo: CredentialsRepository;

    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET,
            process.env.GMAIL_REDIRECT_URI
        );
        this.credentialsRepo = new CredentialsRepository();
    }

    getAuthUrl(userId: string): string {
        const scopes = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.modify',
        ];

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent',
            state: userId,
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
            service: 'gmail',
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || undefined,
            token_expiry: expiryDate,
        });
    }

    async getAuthenticatedClient(userId: string): Promise<OAuth2Client> {
        const credential = await this.credentialsRepo.findByUserAndService(userId, 'gmail');

        if (!credential) {
            throw new Error('Gmail not connected for this user');
        }

        this.oauth2Client.setCredentials({
            access_token: credential.access_token,
            refresh_token: credential.refresh_token,
        });

        // Check if token is expired
        if (credential.token_expiry && new Date() >= credential.token_expiry) {
            // Refresh token
            const { credentials } = await this.oauth2Client.refreshAccessToken();

            if (credentials.access_token) {
                await this.credentialsRepo.update(userId, 'gmail', {
                    access_token: credentials.access_token,
                    token_expiry: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
                });

                this.oauth2Client.setCredentials(credentials);
            }
        }

        return this.oauth2Client;
    }

    async fetchEmails(
        userId: string,
        query: string = 'is:unread',
        maxResults: number = 50
    ): Promise<GmailEmail[]> {
        const auth = await this.getAuthenticatedClient(userId);
        const gmail = google.gmail({ version: 'v1', auth });

        // Search for messages
        const listResponse = await gmail.users.messages.list({
            userId: 'me',
            q: query,
            maxResults,
        });

        const messages = listResponse.data.messages || [];

        if (messages.length === 0) {
            return [];
        }

        // Fetch full message details
        const emails: GmailEmail[] = [];

        for (const message of messages) {
            if (!message.id) continue;

            const msgResponse = await gmail.users.messages.get({
                userId: 'me',
                id: message.id,
                format: 'full',
            });

            const msg = msgResponse.data;
            const headers = msg.payload?.headers || [];

            const getHeader = (name: string) => {
                const header = headers.find(h => h.name?.toLowerCase() === name.toLowerCase());
                return header?.value || '';
            };

            // Extract body
            let body = '';
            if (msg.payload?.body?.data) {
                body = Buffer.from(msg.payload.body.data, 'base64').toString('utf-8');
            } else if (msg.payload?.parts) {
                for (const part of msg.payload.parts) {
                    if (part.mimeType === 'text/plain' && part.body?.data) {
                        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
                        break;
                    }
                }
            }

            emails.push({
                id: msg.id!,
                threadId: msg.threadId!,
                subject: getHeader('Subject'),
                from: getHeader('From'),
                to: getHeader('To'),
                date: new Date(getHeader('Date') || Date.now()),
                snippet: msg.snippet || '',
                body,
                labels: msg.labelIds || [],
            });
        }

        return emails;
    }

    async markAsRead(userId: string, emailIds: string[]): Promise<void> {
        const auth = await this.getAuthenticatedClient(userId);
        const gmail = google.gmail({ version: 'v1', auth });

        await gmail.users.messages.batchModify({
            userId: 'me',
            requestBody: {
                ids: emailIds,
                removeLabelIds: ['UNREAD'],
            },
        });
    }

    async disconnect(userId: string): Promise<void> {
        await this.credentialsRepo.delete(userId, 'gmail');
    }

    async isConnected(userId: string): Promise<boolean> {
        const credential = await this.credentialsRepo.findByUserAndService(userId, 'gmail');
        return credential !== null;
    }
}
