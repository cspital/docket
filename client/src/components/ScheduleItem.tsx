import * as React from 'react';
import { dateToString } from '../utils/util';

interface ScheduleItemProps {
    name: string;
    runDate: Date;
}

export const ScheduleItem: React.StatelessComponent<ScheduleItemProps> = (props: ScheduleItemProps) => (
    <li className="schedule-entry">
        <span className="schedule-name">{props.name}</span>
        <span className="schedule-time">{dateToString(props.runDate)}</span>
    </li>
);