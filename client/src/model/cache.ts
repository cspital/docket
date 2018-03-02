import { JobPayload, Job, SQLJob } from './job';

/**
 * JSON data structure from /jobs
 */
export interface CachePayload {
    readonly expires: string;
    readonly jobs: JobPayload[];
}

/**
 * Represents the current state of all monitored jobs and upcoming schedule.
 * @implements ICache
 */
export class Cache {
    static instances = new Map<string, Job>();

    expires: Date;
    jobs: Job[];
    schedule: Job[];

    /**
     * Provides a new frozen ICache implementation.
     * @param payload cache state json
     * @constructor
     */
    static New(payload: CachePayload): Cache {
        return Object.freeze(new Cache(payload));
    }

    /**
     * Calculates the expected upcoming activity of the monitored jobs.
     * @param jobs current state of all monitored jobs
     */
    private static makeSchedule(jobs: Job[]): Job[] {
        const now = new Date();
        const later = new Date();
        later.setHours(now.getHours() + 4);
        return jobs
            .filter(job => {
                return job.scheduled &&
                    job.nextRunDate &&
                    job.nextRunDate > now &&
                    job.nextRunDate < later;
            })
            .sort((a, b) => Number(a.nextRunDate) - Number(b.nextRunDate));
    }

    getAllJobs(): Job[] {
        return Array.from(Cache.instances.values())
            .sort((a, b) => Number(b.runDate) - Number(a.runDate));
    }

    /**
     * Searches jobs by name.
     * @param name job name
     */
    findJobByName(name: string): Job | null {
        const search = this.jobs.filter(j => j.name === name);
        if (search.length) {
            return search[0];
        }
        return null;
    }

    /**
     * Searches jobs by guid.
     * @param id job guid
     */
    findJobById(id: string): Job | null {
        const search = this.jobs.filter(j => j.id === id);
        if (search.length) {
            return search[0];
        }
        return null;
    }

    /**
     * Constructor
     * @param payload cache state json
     */
    private constructor(payload: CachePayload) {
        const tmp = new Date(payload.expires);
        tmp.setMilliseconds(tmp.getMilliseconds() + 500); // nudge it a smidge

        this.expires = tmp;
        this.jobs = payload.jobs.map(j => new SQLJob(j));
        this.schedule = Cache.makeSchedule(this.jobs);
    }
}
