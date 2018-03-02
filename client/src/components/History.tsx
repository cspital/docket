import * as React from 'react';
import { Job } from '../model/job';
import { ResultList } from './ResultList';

interface HistoryProps {
    results: Job[];
}

export const History: React.StatelessComponent<HistoryProps> = (props: HistoryProps) => (
    <div className="container buffered-bottom">
        <h2 className="center-text">Latest Run Results...</h2>
        <div className="row cols-md-8 cols-lg-6">
            <ResultList results={props.results} />
        </div>
    </div>
);