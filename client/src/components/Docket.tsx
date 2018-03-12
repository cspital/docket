import * as React from 'react';
import { Schedule } from './Schedule';
import { dateToMSInt } from '../utils/util';
import { getJobsSince, getJobs } from '../api/api';
import { Cache } from '../model/cache';
import { Job } from '../model/job';
import { requestNotify } from '../utils/notify';
import { History } from './History';

interface DocketProps {}

interface DocketState {
    schedule: Job[];
    results: Map<string, Job>;
    timer?: NodeJS.Timer;
}

function dateIsRecent(d: Date | null): boolean {
    if (d) {
        return dateToMSInt(d) >= dateToMSInt(new Date()) - 1;
    }
    return false;
}

export class Docket extends React.Component<DocketProps, DocketState> {
    constructor(props: DocketProps) {
        super(props);
        this.state = {
            schedule: [],
            results: new Map<string, Job>()
        };

        this.refresh = this.refresh.bind(this);
    }

    async refresh() {
        clearTimeout(this.state.timer as NodeJS.Timer);
        const jobTask = getJobs();
        window.scrollTo(0, 0);
        const payload = await jobTask;

        const nextCache = Cache.New(payload);
        const results = new Map<string, Job>(this.state.results);

        for (let job of nextCache.jobs) {
            const old = results.get(job.statusGuid as string);
            if (old && old.runResult === job.runResult) {
                continue;
            }

            if (!dateIsRecent(job.runDate)) {
                continue;
            }

            results.set(job.statusGuid as string, job);
        }

        const nextUpdate = Number(nextCache.expires);
        const refreshTimer = setTimeout(this.refresh, nextUpdate - Number(new Date()));
        
        this.setState({
            schedule: nextCache.schedule,
            results: results,
            timer: refreshTimer
        });
    }

    async componentWillMount() {
        // bootstrap the application state
        const initial = getJobsSince(dateToMSInt(new Date()));
        const payload = await getJobs();
        const cache = Cache.New(payload);
        const initialJobs = await initial;
        const results = new Map<string, Job>();

        // enrich initial with current average run duration from cache.
        for (let j of initialJobs) {
            const cached = cache.findJobById(j.id);
            if (cached) {
                j.avgRunDuration = cached.avgRunDuration;
            }
            results.set(j.statusGuid as string, j);
        }

        // capture running jobs
        for (let j of cache.jobs) {
            if (j.statusGuid) {
                if (j.isRunning || dateIsRecent(j.runDate)) {
                    results.set(j.statusGuid, j);
                }
            }
        }
        
        const nextUpdate = Number(cache.expires);
        const refreshTimer = setTimeout(this.refresh, nextUpdate - Number(new Date()));
        this.setState({
            schedule: cache.schedule,
            results: results,
            timer: refreshTimer
        });
        requestNotify();
    }

    render() {
        return (
            <div>
                <Schedule upcoming={this.state.schedule}/>
                <br/>
                <History results={this.state.results}/>
            </div>
        );
    }
}