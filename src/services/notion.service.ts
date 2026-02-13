import { Client } from '@notionhq/client';
import { CredentialsRepository } from '../db/repositories/credentials.repository';
import { NotionDatabase, NotionPageData, NotionTokenResponse } from '../types/notion.types';

export class NotionService {
    private credentialsRepo: CredentialsRepository;

    constructor() {
        this.credentialsRepo = new CredentialsRepository();
    }

    /**
     * Get OAuth authorization URL
     */
    getAuthUrl(): string {
        const clientId = process.env.NOTION_CLIENT_ID;
        const redirectUri = process.env.NOTION_REDIRECT_URI;

        if (!clientId || !redirectUri) {
            throw new Error('NOTION_CLIENT_ID and NOTION_REDIRECT_URI must be set');
        }

        return `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}`;
    }

    /**
     * Handle OAuth callback and exchange code for token
     */
    async handleCallback(code: string, userId: string): Promise<void> {
        const clientId = process.env.NOTION_CLIENT_ID;
        const clientSecret = process.env.NOTION_CLIENT_SECRET;
        const redirectUri = process.env.NOTION_REDIRECT_URI;

        if (!clientId || !clientSecret || !redirectUri) {
            throw new Error('Notion OAuth credentials not configured');
        }

        // Exchange authorization code for access token
        const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        const response = await fetch('https://api.notion.com/v1/oauth/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Notion OAuth failed: ${error}`);
        }

        const data = (await response.json()) as NotionTokenResponse;

        // Store access token for this user
        await this.credentialsRepo.create({
            user_id: userId,
            service: 'notion',
            access_token: data.access_token,
            // Notion tokens don't expire, but store workspace info
            token_expiry: undefined,
            refresh_token: undefined,
        });

        console.log(`✅ Notion connected for user ${userId}`);
    }

    /**
     * Get authenticated Notion client for a specific user
     */
    async getAuthenticatedClient(userId: string): Promise<Client> {
        const credential = await this.credentialsRepo.findByUserAndService(userId, 'notion');

        if (!credential) {
            throw new Error('Notion not connected for this user. Please connect Notion first.');
        }

        return new Client({ auth: credential.access_token });
    }

    /**
     * List databases accessible to the user
     */
    async listDatabases(userId: string): Promise<NotionDatabase[]> {
        try {
            const notion = await this.getAuthenticatedClient(userId);

            const response = await notion.search({
                filter: { property: 'object', value: 'database' as any },
                sort: { direction: 'descending', timestamp: 'last_edited_time' },
            });

            return response.results.map((db: any) => ({
                id: db.id,
                title: db.title?.[0]?.plain_text || 'Untitled',
                url: db.url,
                icon: db.icon,
                properties: db.properties,
            }));
        } catch (error) {
            console.error('Error listing databases:', error);
            throw new Error('Failed to list Notion databases');
        }
    }

    /**
     * Get database properties
     */
    async getDatabaseProperties(userId: string, databaseId: string): Promise<Record<string, any>> {
        try {
            const notion = await this.getAuthenticatedClient(userId);
            const database = await notion.databases.retrieve({ database_id: databaseId });
            return (database as any).properties;
        } catch (error) {
            console.error('Error getting database properties:', error);
            throw new Error('Failed to get database properties');
        }
    }

    /**
     * Create a page in Notion database
     */
    async createPage(userId: string, databaseId: string, data: NotionPageData): Promise<string> {
        try {
            const notion = await this.getAuthenticatedClient(userId);

            const properties: any = {
                Company: {
                    title: [{ text: { content: data.company } }],
                },
            };

            if (data.position) {
                properties.Position = {
                    rich_text: [{ text: { content: data.position } }],
                };
            }

            if (data.status) {
                properties.Status = {
                    select: { name: data.status },
                };
            }

            if (data.interviewDate) {
                properties['Interview Date'] = {
                    date: { start: data.interviewDate },
                };
            }

            if (data.interviewType) {
                properties['Interview Type'] = {
                    select: { name: data.interviewType },
                };
            }

            if (data.recruiterName) {
                properties['Recruiter Name'] = {
                    rich_text: [{ text: { content: data.recruiterName } }],
                };
            }

            if (data.recruiterEmail) {
                properties['Recruiter Email'] = {
                    email: data.recruiterEmail,
                };
            }

            if (data.emailLink) {
                properties['Email Link'] = {
                    url: data.emailLink,
                };
            }

            if (data.priority) {
                properties.Priority = {
                    select: { name: data.priority },
                };
            }

            if (data.notes) {
                properties.Notes = {
                    rich_text: [{ text: { content: data.notes } }],
                };
            }

            const response = await notion.pages.create({
                parent: { database_id: databaseId },
                properties,
            });

            return response.id;
        } catch (error) {
            console.error('Error creating Notion page:', error);
            throw new Error('Failed to create Notion page');
        }
    }

    /**
     * Query database for existing entries (duplicate detection)
     */
    async queryDatabase(userId: string, databaseId: string, emailLink: string): Promise<any[]> {
        try {
            const notion = await this.getAuthenticatedClient(userId);

            const response = await notion.request({
                path: `databases/${databaseId}/query`,
                method: 'post',
                body: {
                    filter: {
                        property: 'Email Link',
                        url: {
                            equals: emailLink,
                        },
                    },
                },
            });

            return (response as any).results;
        } catch (error) {
            console.error('Error querying database:', error);
            return [];
        }
    }

    /**
     * Update an existing page
     */
    async updatePage(userId: string, pageId: string, data: Partial<NotionPageData>): Promise<void> {
        try {
            const notion = await this.getAuthenticatedClient(userId);

            const properties: any = {};

            if (data.status) {
                properties.Status = {
                    select: { name: data.status },
                };
            }

            if (data.notes) {
                properties.Notes = {
                    rich_text: [{ text: { content: data.notes } }],
                };
            }

            await notion.pages.update({
                page_id: pageId,
                properties,
            });
        } catch (error) {
            console.error('Error updating Notion page:', error);
            throw new Error('Failed to update Notion page');
        }
    }

    /**
     * Disconnect Notion for a user
     */
    async disconnect(userId: string): Promise<void> {
        await this.credentialsRepo.delete(userId, 'notion');
    }

    /**
     * Check if user has connected Notion
     */
    async isConnected(userId: string): Promise<boolean> {
        const credential = await this.credentialsRepo.findByUserAndService(userId, 'notion');
        return credential !== null;
    }
}
