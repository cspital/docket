import * as React from 'react';
import { Job } from '../model/job';
import { ScheduleItem } from './ScheduleItem';
import AnimateOnChange from 'react-animate-on-change';

interface ScheduleListProps {
    upcoming: Job[];
}

interface ScheduleListState {
    shouldUpdate: boolean;
}

export class ScheduleList extends React.Component<ScheduleListProps, ScheduleListState> {
    constructor(props: ScheduleListProps) {
        super(props);
        this.state = {
            shouldUpdate: false
        };
    }

    componentWillReceiveProps(nextProps: ScheduleListProps) {
        const prev = this.props.upcoming;
        const next = nextProps.upcoming;
        if (prev.length !== next.length) {
            this.setState({
                shouldUpdate: true
            });
            return;
        }
        const a = prev.map(j => j.scheduleGuid as string);
        const b = next.map(j => j.scheduleGuid as string);
        const su = (!a.every(id => b.includes(id))) || (!b.every(id => a.includes(id)));
        this.setState({
            shouldUpdate: su
        });
    }

    shouldComponentUpdate(nextProps: ScheduleListProps, nextState: ScheduleListState): boolean {
        return nextState.shouldUpdate;
    }

    render() {
        return (
            <AnimateOnChange
                baseClassName=""
                animationClassName="fade"
                animate={this.state.shouldUpdate}
            >
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
            </AnimateOnChange>
        );
    }
}