import * as React from 'react';
import { Job } from '../model/job';
import { ScheduleItem } from './ScheduleItem';

export interface ScheduleListProps {
    upcoming: Job[];
}

export class ScheduleList extends React.Component<ScheduleListProps> {
    constructor(props: ScheduleListProps) {
        super(props);
    }

    shouldComponentUpdate(nextProps: ScheduleListProps): boolean {
        const prev = this.props.upcoming;
        const next = nextProps.upcoming;
        if (prev.length !== next.length) {
            return true;
        }
        const a = prev.map(j => j.scheduleGuid as string);
        const b = next.map(j => j.scheduleGuid as string);
        return (!a.every(id => b.includes(id))) || (!b.every(id => a.includes(id)));
    }

    render() {
        return (
            <ul id="schedule_list" className="none">
                {this.props.upcoming.map((job, i) => {
                    return (
                        <ScheduleItem
                            name={job.name}
                            runDate={job.nextRunDate as Date}
                            key={job.name + i}
                        />
                    );
                })}
            </ul>
        );
    }
}