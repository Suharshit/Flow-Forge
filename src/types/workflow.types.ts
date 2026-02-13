export type TriggerType = 'scheduled' | 'webhook' | 'manual';

export type WorkflowStatus = 'active' | 'inactive';

export interface WorkflowStep {
    id: string;
    type: string;
    config: Record<string, any>;
    order: number;
}

export interface TriggerConfig {
    cron?: string;
    webhookUrl?: string;
}

export interface Workflow {
    id: string;
    user_id?: string;
    name: string;
    description?: string;
    trigger_type: TriggerType;
    trigger_config: TriggerConfig;
    steps: WorkflowStep[];
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface CreateWorkflowDTO {
    name: string;
    description?: string;
    trigger_type: TriggerType;
    trigger_config: TriggerConfig;
    steps: WorkflowStep[];
}

export interface UpdateWorkflowDTO {
    name?: string;
    description?: string;
    trigger_config?: TriggerConfig;
    steps?: WorkflowStep[];
    is_active?: boolean;
}
