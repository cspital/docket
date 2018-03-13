import * as React from 'react';
import { Job } from '../model/job';
import { dateToString } from '../utils/util';
import { getStatus } from '../utils/effects';

interface RunningCardProps {
    job: Job;
}

export const RunningCard: React.StatelessComponent<RunningCardProps> = (props: RunningCardProps) => (
    <div className="section job-status">
        <span className="card-info">
            <h5 className="section"><b>{props.job.name}</b></h5>
            <h6>Ran: {dateToString(props.job.runDate as Date)}</h6>
        </span>
        <span className={`card-status ${getStatus(props.job.runResult)}`} />
    </div>
);