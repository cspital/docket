import * as React from 'react';
import { getOutcome } from '../api/api';
import { Job, Outcome } from '../model/job';
import { dateToString } from '../utils/util';
import { getStatus } from '../utils/effects';
import * as ReactModal from 'react-modal';
import { OutcomeModal } from './OutcomeModal';

const modalStyle = {
    content : {
        top                   : '50%',
        left                  : '50%',
        right                 : 'auto',
        bottom                : 'auto',
        marginRight           : '-50%',
        transform             : 'translate(-50%, -50%)'
      }
};

interface CompletedCardProps {
    job: Job;
}

interface CompletedCardState {
    modalIsOpen: boolean;
    outcome?: Outcome;
}

export class CompletedCard extends React.Component<CompletedCardProps, CompletedCardState> {
    constructor(props: CompletedCardProps) {
        super(props);
        this.state = {
            modalIsOpen: false
        };

        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
    }

    async openModal() {
        if (this.state.outcome) {
            this.setState({
                modalIsOpen: true
            });
            return;
        }
        const query = this.props.job.query;
        const outcome = await getOutcome(query);
        this.setState({
            modalIsOpen: true,
            outcome: outcome
        });
    }

    closeModal() {
        this.setState({
            modalIsOpen: false
        });
    }

    render() {
        return (
            <div className="section job-status">
                <span className="card-info">
                    <h5 className="section"><b>{this.props.job.name}</b></h5>
                    <h6 className="section">Ran: {dateToString(this.props.job.runDate as Date)}</h6>
                    <h6 className="section">
                        Took: {this.props.job.runDuration}s
                        (avg: {this.props.job.avgRunDuration || this.props.job.runDuration})
                    </h6>
                </span>
                <span className={`card-status ${getStatus(this.props.job.runResult)}`} onClick={this.openModal}/>
                <ReactModal
                    isOpen={this.state.modalIsOpen}
                    onRequestClose={this.closeModal}
                    contentLabel="Modal"
                    style={modalStyle}
                >
                    <OutcomeModal outcome={this.state.outcome as Outcome} onClick={this.closeModal}/>
                </ReactModal>
            </div>
        );
    }
}