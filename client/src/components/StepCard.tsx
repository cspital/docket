import * as React from 'react';
import { Step } from '../model/job';
import { getStatus } from '../utils/effects';

interface StepCardProps {
    step: Step;
}

export const StepCard: React.StatelessComponent<StepCardProps> = (props: StepCardProps) => (
    <div className="card large card-shadow">
        <div className="section step-summary">
            <span className="card-info step-info">
                <h5 className="section">[{props.step.id}]</h5>
                <h5 className="section">{props.step.name}</h5>
                <h6 className="section">Took: {props.step.runDuration}s</h6>
                <p className="section step-message">Message: {props.step.message}</p>
            </span>
            <span className={`step-status ${getStatus(props.step.runResult)}`} />
        </div>
    </div>
);