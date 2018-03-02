import { Job, SQLJob, StepPayload, Outcome, OutcomeQuery, JobOutcome } from '../model/job';
import { CachePayload } from '../model/cache';

/**
 * Fetches details of each job run after since.
 * @param since get job runs before this date (as number)
 */
export async function getJobsSince(since: number): Promise<Job[]> {
    let resp = await fetch(`/jobs?since=${since}`, {
        method: 'get',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
    let payload = await resp.json();
    return payload.map((p: StepPayload) => {
        return new SQLJob({
            job_id: p.job_id,
            name: p.name,
            scheduled: true,
            run_date: p.run_date,
            run_duration: p.run_duration,
            avg_run_duration: null,
            run_result: p.run_result,
            next_run: null
        });
    })
    .sort((a: Job, b: Job) => Number(a.runDate) - Number(b.runDate));
}

/**
 * Fetches the current state of all jobs from server.
 */
export async function getJobs(): Promise<CachePayload> {
    let resp = await fetch('/jobs', {
        method: 'get',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
    let obj = await resp.json();
    return obj as CachePayload;
}

/**
 * Fetches the details of a specific job run, according to the provided query.
 * Returns the outcome from the cache if that query has been previously submitted.
 * @param query query parameters
 */
export async function getOutcome(query: OutcomeQuery): Promise<Outcome> {
    let resp = await fetch(`job/${query.id}?start_dt=${query.runDate}&start_tm=${query.runTime}`, {
        method: 'get',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
    let payload = await resp.json();
    return new JobOutcome(query.guid, payload) as Outcome;
}