import { Client } from '@notionhq/client';
import { NotionDatabase, NotionPageData } from '../types/notion.types';

export class NotionService {
    private notion: Client;

    constructor() {
        const token = process.env.NOTION_TOKEN;
        if (!token) {
            throw new Error('NOTION_TOKEN environment variable not set');
        }
        this.notion = new Client({ auth: token, notionVersion: '2022-06-28' });
    }

    async listDatabases(): Promise<NotionDatabase[]> {
        try {
            const response = await this.notion.search({
                sort: { direction: 'descending', timestamp: 'last_edited_time' },
            });

            // Filter for databases client-side (newer API may return 'database' or 'data_source')
            const databases = response.results.filter(
                (result: any) => result.object === 'database' || result.object === 'data_source'
            );

            return databases.map((db: any) => ({
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

    async getDatabaseProperties(databaseId: string): Promise<Record<string, any>> {
        try {
            const database = await this.notion.databases.retrieve({ database_id: databaseId });
            return (database as any).properties;
        } catch (error) {
            console.error('Error getting database properties:', error);
            throw new Error('Failed to get database properties');
        }
    }

    async createPage(databaseId: string, data: NotionPageData): Promise<string> {
        try {
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

            const response = await this.notion.pages.create({
                parent: { database_id: databaseId },
                properties,
            });

            return response.id;
        } catch (error) {
            console.error('Error creating Notion page:', error);
            throw new Error('Failed to create Notion page');
        }
    }

    async queryDatabase(databaseId: string, emailLink: string): Promise<any[]> {
        try {
            // Use search to find pages, then filter by parent database and email link
            const response = await this.notion.search({
                query: emailLink,
                filter: { property: 'object', value: 'page' },
            });

            // Filter results to only include pages from the target database
            return response.results.filter((page: any) =>
                page.parent?.database_id === databaseId
            );
        } catch (error) {
            console.error('Error querying database:', error);
            return [];
        }
    }

    async updatePage(pageId: string, data: Partial<NotionPageData>): Promise<void> {
        try {
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

            await this.notion.pages.update({
                page_id: pageId,
                properties,
            });
        } catch (error) {
            console.error('Error updating Notion page:', error);
            throw new Error('Failed to update Notion page');
        }
    }
}
