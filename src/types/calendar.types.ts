export interface GoogleCalendar {
    id: string;
    summary: string;
    description?: string;
    isPrimary: boolean;
}

export interface CalendarEvent {
    summary: string;
    description?: string;
    start: {
        dateTime?: string;
        date?: string;
        timeZone?: string;
    };
    end: {
        dateTime?: string;
        date?: string;
        timeZone?: string;
    };
    location?: string;
    attendees?: Array<{ email: string }>;
}
