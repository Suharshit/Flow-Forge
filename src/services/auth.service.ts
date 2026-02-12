import { GmailService } from './gmail.service';

export class AuthService {
    private gmailService: GmailService;

    constructor() {
        this.gmailService = new GmailService();
    }

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
}
