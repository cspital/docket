import * as React from 'react';
import { Job } from '../model/job';
import { RunningCard } from './RunningCard';
import { notify } from '../utils/notify';
import { CompletedCard } from './CompletedCard';
import AnimateOnChange from 'react-animate-on-change';

interface ResultCardProps {
    job: Job;
}

interface ResultCardState {
    shouldUpdate: boolean;
}

export class ResultCard extends React.Component<ResultCardProps, ResultCardState> {
    constructor(props: ResultCardProps) {
        super(props);
        this.state = {
            shouldUpdate: true
        };
    }

    componentWillReceiveProps(nextProps: ResultCardProps) {
        this.setState({
            shouldUpdate: nextProps.job.runResult !== this.props.job.runResult
        });
    }

    shouldComponentUpdate(nextProps: ResultCardProps, nextState: ResultCardState): boolean {
        return nextState.shouldUpdate;
    }

    componentDidUpdate() {
        if (this.props.job.runResult === 'Failed') {
            notify(this.props.job);
        }
    }

    render() {
        return (
            <AnimateOnChange
                baseClassName="card large card-shadow"
                animationClassName="fade"
                animate={this.state.shouldUpdate}
            >
                {this.props.job.isRunning ?
                        <RunningCard job={this.props.job} /> :
                        <CompletedCard job={this.props.job} />}
            </AnimateOnChange>
        );
    }
}