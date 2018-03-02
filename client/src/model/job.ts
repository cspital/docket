import { dateToMSInt, timeToMSInt } from '../utils/util';

/**
 * Possible values of job.runResult.
 */
export type RunState = 'Failed' | 'Succeeded' | 'Retry' | 'Cancelled' | 'Running' | null;

/**
 * Parameters needed to fetch the outcome details for a specific job run.
 */
export interface OutcomeQuery {
    guid: string;
    id: string;
    runDate: number;
    runTime: number;
}

/**
 * Represents a single job run summary.
 */
export interface Job {
    id: string;
    name: string;
    scheduled: boolean;
    runDate: Date | null;
    runDuration: number | null;
    avgRunDuration: number | null;
    runResult: RunState;
    nextRunDate: Date | null;

    readonly statusGuid: string | null;
    readonly scheduleGuid: string | null;
    readonly isRunning: boolean;
    readonly query: OutcomeQuery;
}

/**
 * Represents a step in the payload of /job.
 */
export interface StepPayload {
    job_id: string;
    name: string;
    step_id: number;
    step_name: string;
    message: string;
    run_date: string;
    run_duration: number;
    run_result: RunState;
}

/**
 * Represents a job from the /jobs payload.jobs list.
 */
export interface JobPayload {
    job_id: string;
    name: string;
    scheduled: boolean;
    run_date: string | null;
    run_duration: number | null;
    avg_run_duration: number | null;
    run_result: RunState;
    next_run: string | null;
}

/**
 * Represents a single job run summary.
 * @implements IJob
 */
export class SQLJob implements Job {
    id: string;
    name: string;
    scheduled: boolean;
    runDate: Date | null;
    runDuration: number | null;
    avgRunDuration: number | null;
    runResult: RunState;
    nextRunDate: Date | null;

    constructor(j: JobPayload) {
        this.id = j.job_id;
        this.name = j.name;
        this.scheduled = j.scheduled;
        this.runDate = j.run_date ? new Date(j.run_date) : null;
        this.runDuration = j.run_duration;
        this.avgRunDuration = j.avg_run_duration;
        this.runResult = j.run_result;
        this.nextRunDate = j.next_run ? new Date(j.next_run) : null;
    }

    /**
     * Returns a guid to use identifying this jobs last run.
     */
    get statusGuid(): string | null {
        if (!this.runDate) { return null; }
        return this.id + String(Number(this.runDate));
    }

    /**
     * Returns a guid to use identifying this jobs next run.
     */
    get scheduleGuid(): string | null {
        if (!this.nextRunDate) { return null; }
        return this.id + String(Number(this.nextRunDate));
    }

    /**
     * True if job.runResult is Running.
     */
    get isRunning(): boolean {
        return !!this.runResult && this.runResult === 'Running';
    }

    /**
     * Converts the runDate (date part) into a number per SQL Server specs on sp_help_jobhistory.
     */
    private get outcomeRunDate(): number | undefined {
        if (!this.runDate) { return undefined; }
        return dateToMSInt(this.runDate);
    }

    /**
     * Converts the runDate (time part) into a number per SQL Server specs on sp_help_jobhistory.
     */
    private get outcomeRunTime(): number | undefined {
        if (!this.runDate) { return undefined; }
        return timeToMSInt(this.runDate);
    }

    /**
     * Returns the query needed to get the outcome details about this job run.
     */
    get query(): OutcomeQuery {
        return {
            guid: this.statusGuid,
            id: this.id,
            runDate: this.outcomeRunDate,
            runTime: this.outcomeRunTime
        } as OutcomeQuery;
    }
}

/**
 * Represents a single step in the job outcome details.
 */
export class Step {
    outcome: Outcome;
    jobName: string;
    id: number;
    name: string;
    message: string;
    runDate: Date;
    runDuration: number;
    runResult: RunState;

    constructor(o: Outcome, j: StepPayload) {
        this.outcome = o;
        this.jobName = j.name;
        this.id = j.step_id;
        this.name = j.step_name;
        this.message = j.message;
        this.runDate = new Date(j.run_date);
        this.runDuration = j.run_duration;
        this.runResult = j.run_result;
    }
}

/**
 * Represents the outcome of a specific job run.
 */
export interface Outcome {
    guid: string;

    readonly jobStep: Step | null;
    readonly executionSteps: Step[];
}

/**
 * Represents the outcome of a specific job run.
 * @implements IOutcome
 */
export class JobOutcome implements Outcome {
    guid: string;
    private steps: Step[];

    constructor(guid: string, j: StepPayload[]) {
        this.guid = guid;
        this.steps = j.map((o: StepPayload) => new Step(this, o));
    }

    /**
     * Gets the summary step.
     */
    get jobStep(): Step | null {
        const outcome = this.steps.filter(s => s.id === 0);
        if (outcome.length) {
            return outcome[0];
        }
        return null;
    }

    /**
     * Gets the executed steps performed by the job. (no summary)
     */
    get executionSteps(): Step[] {
        return this.steps
            .sort((a, b) => b.id - a.id)
            .filter(s => s.id !== 0);
    }
}