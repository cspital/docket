import * as React from 'react';
import { Job } from '../model/job';
import { fadeIn, fadeOut } from '../utils/effects';
import { RunningCard } from './RunningCard';
import { notify } from '../utils/notify';
import { CompletedCard } from './CompletedCard';

interface ResultCardProps {
    job: Job;
}

export class ResultCard extends React.Component<ResultCardProps> {
    private element: HTMLElement | null;
    shouldComponentUpdate(nextProps: ResultCardProps): boolean {
        return nextProps.job.runResult !== this.props.job.runResult;
    }

    async componentWillUpdate() {
        if (this.element) {
            await fadeOut(this.element);
        }
    }

    async componentDidUpdate() {
        if (this.element) {
            await fadeIn(this.element);
        }
        if (this.props.job.runResult === 'Failed') {
            notify(this.props.job);
        }
    }

    render() {
        return (
            <div className="card large card-shadow">
                {this.props.job.isRunning ?
                        <RunningCard job={this.props.job} /> :
                        <CompletedCard job={this.props.job} />}
            </div>
            
        );
    }
}