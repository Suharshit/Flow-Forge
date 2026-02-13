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

export interface NotionTokenResponse {
    access_token: string;
    token_type: string;
    bot_id: string;
    workspace_name: string;
    workspace_icon: string | null;
    workspace_id: string;
    owner: any;
}
