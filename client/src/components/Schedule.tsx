import * as React from 'react';
import { Job } from '../model/job';
import { ScheduleList } from './ScheduleList';

interface ScheduleProps {
    upcoming: Job[];
}

export const Schedule: React.StatelessComponent<ScheduleProps> = (props: ScheduleProps) => (
    <div className="containter">
        <div className="row cols-sm-12 cols-md-10 cols-lg-6">
            <div className="col-md-offset-1 col-lg-offset-3 row card-wrapper">
                <div className="card large card-shadow">
                    <h2 className="section double-padded">Upcoming Job Runs...</h2>
                    <ScheduleList upcoming={props.upcoming} />
                </div>
            </div>
        </div>
    </div>
);