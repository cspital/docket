import * as React from 'react';
import { Cache } from '../model/cache';
import { Job } from '../model/job';
import { fadeIn, fadeOut } from '../utils/effects';
import { ResultCard } from './ResultCard';

interface ResultListProps {
    results: Job[];
}

interface ResultListState {
    newResults: Job[];
}

export class ResultList extends React.Component<ResultListProps, ResultListState> {
    private element: HTMLElement | null;
    constructor(props: ResultListProps) {
        super(props);

        this.state = {
            newResults: []
        };
    }

    getNewResults(jobs: Job[]): Job[] {
        return jobs
            .filter(j => j.statusGuid && !Cache.instances.has(j.statusGuid as string))
            .sort((a, b) => Number(a.runDate) - Number(b.runDate));
    }

    componentWillReceiveProps(nextProps: ResultListProps) {
        const newResults = this.getNewResults(nextProps.results);
        this.setState({
            newResults: newResults
        });
    }

    async componentWillUpdate(nextProps: ResultListProps, nextState: ResultListState) {
        if (nextState.newResults.length > 0 && this.element) {
            await fadeOut(this.element);
        }
    }

    async componentDidUpdate(prevProps: ResultListProps) {
        if (this.state.newResults.length > 0 && this.element) {
            await fadeIn(this.element);
        }
    }

    render() {
        return (
            <div
                id="history_list"
                className="col-md-offset-2 col-lg-offset-3 row card-wrapper"
                ref={ref => this.element = ref}
            >
                {this.props.results.map((j, i) => <ResultCard key={i} job={j} />)}
            </div>
        );
    }
}