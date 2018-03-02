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
    results: Job[];
    timer?: NodeJS.Timer;
}

export class Docket extends React.Component<DocketProps, DocketState> {
    constructor(props: DocketProps) {
        super(props);
        this.state = {
            schedule: [],
            results: []
        };

        this.getFirstCache = this.getFirstCache.bind(this);
        this.refresh = this.refresh.bind(this);
    }

    async getFirstCache() {
        // bootstrap the application state
        const initial = getJobsSince(dateToMSInt(new Date()));
        const payload = await getJobs();
        const cache = Cache.New(payload);
        const initialJobs = await initial;

        // enrich initial with current average run duration from cache.
        for (let j of initialJobs) {
            const cached = cache.findJobById(j.id);
            if (cached) {
                j.avgRunDuration = cached.avgRunDuration;
                Cache.instances.set(j.statusGuid as string, j);
            }
        }

        return cache;
    }

    updateCache(nextCache: Cache) {
        for (let job of nextCache.jobs) {
            const old = Cache.instances.get(job.statusGuid as string);
            if (old && old.runResult !== job.runResult) {
                Cache.instances.set(old.statusGuid as string, job);
            }
        }
    }

    async refresh() {
        clearTimeout(this.state.timer as NodeJS.Timer);
        const jobTask = getJobs();
        window.scrollTo(0, 0);
        const payload = await jobTask;

        const nextCache = Cache.New(payload);
        this.updateCache(nextCache);
        const nextUpdate = Number(nextCache.expires);
        const refreshTimer = setTimeout(this.refresh, nextUpdate - Number(new Date()));
        
        this.setState({
            schedule: nextCache.schedule,
            results: nextCache.getAllJobs(),
            timer: refreshTimer
        });
    }

    async componentWillMount() {
        const cache = await this.getFirstCache();
        const nextUpdate = Number(cache.expires);
        const refreshTimer = setTimeout(this.refresh, nextUpdate - Number(new Date()));
        this.setState({
            schedule: cache.schedule,
            results: cache.getAllJobs(),
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