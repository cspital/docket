import * as React from 'react';
import { Job } from '../model/job';
import { ResultCard } from './ResultCard';
import AnimateOnChange from 'react-animate-on-change';

interface ResultListProps {
    results: Map<string, Job>;
}

interface ResultListState {
    results: Job[];
    newResults: Job[];
    shouldUpdate: boolean;
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
            newResults: [],
            shouldUpdate: false
        };
    }

    componentWillReceiveProps(nextProps: ResultListProps) {
        const newres = getNewResults(this.props.results, nextProps.results);
        this.setState({
            results: getAllJobs(nextProps.results),
            newResults: newres,
            shouldUpdate: newres.length > 0
        });
    }

    render() {
        return (
            <AnimateOnChange
                baseClassName="col-md-offset-2 col-lg-offset-3"
                animationClassName="fade"
                animate={this.state.shouldUpdate}
            >
                <div
                    id="history_list"
                    className="row card-wrapper"
                >
                    {this.state.results.map((j) => <ResultCard key={j.statusGuid as string} job={j} />)}
                </div>
            </AnimateOnChange>
            
        );
    }
}