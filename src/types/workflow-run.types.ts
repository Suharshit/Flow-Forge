export type WorkflowRunStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface WorkflowRun {
    id: string;
    workflow_id: string;
    status: WorkflowRunStatus;
    started_at: Date;
    completed_at?: Date;
    error_message?: string;
    execution_logs: LogEntry[];
    step_results: Record<string, any>;
}

export interface LogEntry {
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    stepId?: string;
}

export interface CreateWorkflowRunDTO {
    workflow_id: string;
}
