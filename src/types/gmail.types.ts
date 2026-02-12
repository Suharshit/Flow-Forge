export interface ClassifiedEmail {
    email: any;
    isJobRelated: boolean;
    confidence: number;
    matchedKeywords: string[];
}

export interface JobData {
    company?: string;
    position?: string;
    interviewDate?: string;
    interviewType?: 'phone' | 'video' | 'onsite' | 'unknown';
    recruiterName?: string;
    emailId: string;
}
