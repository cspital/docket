import * as React from 'react';
import { Outcome } from '../model/job';
import { StepCard } from './StepCard';

interface OutcomeModalProps {
    outcome: Outcome;
    onClick: () => void;
}

export class OutcomeModal extends React.Component<OutcomeModalProps> {
    render() {
        return (
            <div className="container" onClick={this.props.onClick}>
                <h2 className="center-text">Executed Steps...</h2>
                <div className="row cols-md-12 cols-lg-12">
                    <div className="row card-wrapper">
                        {this.props.outcome.executionSteps
                            .map((s, i) => <StepCard key={`${s.jobName}${s.id}${i}`} step={s} />)}
                    </div>
                </div>
            </div>
        );
    }
}