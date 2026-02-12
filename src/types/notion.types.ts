export interface NotionDatabase {
    id: string;
    title: string;
    url: string;
    icon?: {
        type: 'emoji' | 'external' | 'file';
        emoji?: string;
    };
    properties: Record<string, any>;
}

export interface NotionPageData {
    company: string;
    position?: string;
    status?: string;
    interviewDate?: string;
    interviewType?: string;
    recruiterName?: string;
    recruiterEmail?: string;
    emailLink?: string;
    priority?: string;
    notes?: string;
}
