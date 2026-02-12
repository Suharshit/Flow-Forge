export type ServiceType = 'gmail' | 'notion' | 'google-calendar' | 'slack';

export interface UserCredential {
    id: string;
    user_id: string;
    service: ServiceType;
    access_token: string;
    refresh_token?: string;
    token_expiry?: Date;
    created_at: Date;
    updated_at: Date;
}

export interface CreateCredentialDTO {
    user_id: string;
    service: ServiceType;
    access_token: string;
    refresh_token?: string;
    token_expiry?: Date;
}

export interface GmailEmail {
    id: string;
    threadId: string;
    subject: string;
    from: string;
    to: string;
    date: Date;
    snippet: string;
    body: string;
    labels: string[];
}
