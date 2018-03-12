import * as React from 'react';
import { Job } from '../model/job';
import { ResultCard } from './ResultCard';

interface ResultListProps {
    results: Map<string, Job>;
}

interface ResultListState {
    results: Job[];
    newResults: Job[];
}

function getAllJobs(m: Map<string, Job>): Job[] {
    return Array.from(m.values())
        .sort((a, b) => Number(b.runDate) - Number(a.runDate));
}

function getNewResults(prev: Map<string, Job>, next: Map<string, Job>): Job[] {
    return Array.from(next.values())
        .filter(j => j.statusGuid && !prev.has(j.statusGuid as string))
        .sort((a, b) => Number(a.runDate) - Number(b.runDate));
}

export class ResultList extends React.Component<ResultListProps, ResultListState> {
    constructor(props: ResultListProps) {
        super(props);

        this.state = {
            results: [],
            newResults: []
        };
    }

    componentWillReceiveProps(nextProps: ResultListProps) {
        this.setState({
            results: getAllJobs(nextProps.results),
            newResults: getNewResults(this.props.results, nextProps.results)
        });
    }

    render() {
        return (
            <div
                id="history_list"
                className="col-md-offset-2 col-lg-offset-3 row card-wrapper"
            >
                {this.state.results.map((j) => <ResultCard key={j.statusGuid as string} job={j} />)}
            </div>
        );
    }
}