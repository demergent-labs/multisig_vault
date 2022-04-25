import { nat8 } from 'azle';
import { sort_created_at_descending } from './demerg-app';
import {
    InitialState as DemergAppInitialState,
    State as DemergAppState
} from './demerg-app/state';
import {
    _SERVICE,
    ThresholdProposal
} from '../dfx_generated/backend/backend.did';
import {
    html,
    render as litRender
} from 'lit-html';
import { createObjectStore } from 'reduxular';

import '@spectrum-web-components/theme/sp-theme.js';
import '@spectrum-web-components/theme/src/themes.js';
import '@spectrum-web-components/slider/sp-slider.js';

import '@ui5/webcomponents/dist/BusyIndicator.js';
import '@ui5/webcomponents/dist/Button.js';
import '@ui5/webcomponents/dist/Card.js';
import '@ui5/webcomponents/dist/CardHeader.js';
import '@ui5/webcomponents/dist/Dialog.js';
import '@ui5/webcomponents/dist/Icon.js';
import '@ui5/webcomponents/dist/Input.js';
import '@ui5/webcomponents/dist/Label.js';
import '@ui5/webcomponents/dist/Table.js';
import '@ui5/webcomponents/dist/TableCell.js';
import '@ui5/webcomponents/dist/TableColumn.js';
import '@ui5/webcomponents/dist/TableRow.js';
import '@ui5/webcomponents/dist/Toast.js';

import '@ui5/webcomponents-icons/dist/refresh.js';

type State = {
    backend: DemergAppState['backend'];
    creating_threshold_proposal: boolean;
    error_message: string;
    hide_create_threshold_proposal: boolean;
    hide_open_threshold_proposals: boolean;
    loading_threshold_proposals: boolean;
    show_error_dialog: boolean;
    signers: DemergAppState['signers'];
    threshold: {
        loading: boolean;
        value: nat8;
    };
    threshold_proposals: ThresholdProposal[];
    voting_on_proposals: {
        [proposalId: string]: {
            adopting: boolean;
            rejecting: boolean;
        }
    };
};

const InitialState: State = {
    backend: DemergAppInitialState.backend,
    creating_threshold_proposal: false,
    error_message: '',
    hide_create_threshold_proposal: true,
    hide_open_threshold_proposals: false,
    loading_threshold_proposals: false,
    show_error_dialog: false,
    signers: DemergAppInitialState.signers,
    threshold: {
        loading: true,
        value: 0
    },
    threshold_proposals: [],
    voting_on_proposals: {}
};

class DemergThreshold extends HTMLElement {
    shadow = this.attachShadow({
        mode: 'closed'
    });
    store = createObjectStore(InitialState, (state: State) => litRender(this.render(state), this.shadow), this);

    set backend(value: State['backend']) {
        if (this.store.backend === value) {
            return;
        }

        this.store.backend = value;

        if (this.store.backend === null) {
            return;
        }

        this.load_threshold();
        this.load_threshold_proposals();
    }

    async handle_create_threshold_proposal_click() {
        if (this.store.backend === null) {
            this.store.error_message = 'You are not authenticated, please refresh.'
            this.store.show_error_dialog = true;

            return;
        }

        this.store.creating_threshold_proposal = true;

        try {
            const description = (this.shadow.querySelector('#input-threshold-proposal-description') as any).value as string;
            const threshold = (this.shadow.querySelector('#input-threshold-proposal-threshold') as any).value as number;

            const result = await this.store.backend.propose_threshold(description, threshold);

            if (result.hasOwnProperty('ok')) {
                this.load_threshold_proposals();
                (this.shadow.querySelector('#toast-proposal-created') as any).show();
            }
            else {
                this.handle_error((result as any).err);
            }
        }
        catch(error) {
            this.handle_error(error);
        }
        
        this.store.hide_create_threshold_proposal = true;
        this.store.creating_threshold_proposal = false;
    }

    async handle_vote_on_threshold_proposal_click(thresholdProposalId: string, adopt: boolean) {
        if (this.store.backend === null) {
            this.store.error_message = 'You are not authenticated, please refresh.'
            this.store.show_error_dialog = true;

            return;
        }

        this.store.voting_on_proposals = {
            [thresholdProposalId]: {
                adopting: adopt === true,
                rejecting: adopt === false
            }
        };

        try {
            const result = await this.store.backend.vote_on_threshold_proposal(thresholdProposalId, adopt);

            if (result.hasOwnProperty('ok')) {
                this.load_threshold();
                this.load_threshold_proposals();
                (this.shadow.querySelector('#toast-vote-recorded') as any).show();
            }
            else {
                this.handle_error((result as any).err);
            }
        }
        catch(error) {
            this.handle_error(error);
        }

        delete this.store.voting_on_proposals[thresholdProposalId];

        this.store.dispatch({
            type: 'RENDER'
        });
    }

    async load_threshold() {
        if (this.store.backend === null) {
            this.store.error_message = 'You are not authenticated, please refresh.'
            this.store.show_error_dialog = true;

            return;
        }

        const threshold = await this.store.backend.get_threshold();

        this.store.threshold = {
            loading: false,
            value: threshold
        };
    }

    async load_threshold_proposals() {
        if (this.store.backend === null) {
            this.store.error_message = 'You are not authenticated, please refresh.'
            this.store.show_error_dialog = true;

            return;
        }

        const threshold_proposals = await this.store.backend.get_threshold_proposals();
        
        this.store.threshold_proposals = sort_created_at_descending(threshold_proposals);
    }

    handle_error(error: any) {
        console.error(error);

        if (error.message !== undefined) {
            this.store.error_message = 'There was an error. See the console for more information.';
        }
        else if (error.startsWith('Rejection code')) {
            this.store.error_message = 'There was an error. See the console for more information.';
        }
        else {
            this.store.error_message = error;
        }

        this.store.show_error_dialog = true;
    }

    render(state: State) {
        const threshold_subtitle_text = state.threshold.loading === true || state.signers.loading === true ? 'Loading...' : `${state.threshold.value} of ${state.signers.value.length} signers required`;

        return html`
            <link rel="stylesheet" href="/index.css">

            <ui5-card>
                <ui5-card-header title-text="Threshold" subtitle-text="${threshold_subtitle_text}">
                    <div class="card-header-action-container" slot="action">
                        <ui5-button
                            class="table-main-button"
                            design="Emphasized"
                            @click=${() => this.store.hide_create_threshold_proposal = false}
                        >
                            Create Proposal
                        </ui5-button>

                        <ui5-button
                            class="table-main-button"
                            ?hidden=${!state.hide_open_threshold_proposals}
                            @click=${async () => {
                                this.store.hide_open_threshold_proposals = false;
                                
                                
                                this.store.loading_threshold_proposals = true;
                                await this.load_threshold_proposals();
                                this.store.loading_threshold_proposals = false;
                            }}
                        >
                            View Open Proposals
                        </ui5-button>
                        
                        <ui5-button
                            class="table-main-button"
                            ?hidden=${state.hide_open_threshold_proposals}
                            @click=${async () => {
                                this.store.hide_open_threshold_proposals = true;

                                this.store.loading_threshold_proposals = true;
                                await this.load_threshold_proposals();
                                this.store.loading_threshold_proposals = false;
                            }}
                        >
                            View Closed Proposals
                        </ui5-button>

                        <ui5-busy-indicator
                            size="Small"
                            .active=${state.loading_threshold_proposals}
                            delay="0"
                        >
                            <ui5-button
                                @click=${async () => {
                                    this.store.loading_threshold_proposals = true;

                                    await Promise.all([
                                        this.load_threshold(),
                                        this.load_threshold_proposals()
                                    ]);

                                    this.store.loading_threshold_proposals = false;
                                }}
                            >
                                <ui5-icon name="refresh"></ui5-icon>
                            </ui5-button>
                        </ui5-busy-indicator>
                    </div>
                </ui5-card-header>

                <ui5-table
                    class="proposals-table"
                    no-data-text="No ${state.hide_open_threshold_proposals === true ? 'closed' : 'open'} proposals"
                >
                    ${state.hide_open_threshold_proposals === false ? html`
                        <ui5-table-column slot="columns" demand-popin></ui5-table-column>
                    ` : ''}

                    <ui5-table-column slot="columns" demand-popin>
                        <ui5-label>ID</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column slot="columns" demand-popin>
                        <ui5-label>Created At</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column slot="columns" demand-popin>
                        <ui5-label>Proposer</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column slot="columns" demand-popin>
                        <ui5-label>Description</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column slot="columns" demand-popin>
                        <ui5-label>New Threshold</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column slot="columns" demand-popin>
                        <ui5-label>Votes For</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column slot="columns" demand-popin>
                        <ui5-label>Votes Against</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column slot="columns" demand-popin>
                        <ui5-label>Status</ui5-label>
                    </ui5-table-column>

                    ${state.threshold_proposals.filter((threshold_proposal) => {
                        const open = threshold_proposal.adopted === false && threshold_proposal.rejected === false;
                        const hidden = (open && state.hide_open_threshold_proposals === true) || (!open && state.hide_open_threshold_proposals === false);

                        return hidden === false;
                    }).map((threshold_proposal) => {
                        const id_trimmed = `${threshold_proposal.id.slice(0, 5)}...${threshold_proposal.id.slice(threshold_proposal.id.length - 5, threshold_proposal.id.length)}`;
                        const proposer_trimmed = `${threshold_proposal.proposer.toString().slice(0, 5)}...${threshold_proposal.proposer.toString().slice(threshold_proposal.proposer.toString().length - 5, threshold_proposal.proposer.toString().length)}`;

                        const votes_for = threshold_proposal.votes.filter((vote) => vote.adopt === true).length;
                        const votes_against = threshold_proposal.votes.filter((vote) => vote.adopt === false).length;

                        const status = threshold_proposal.adopted === true ?
                            `Adopted ${new Date(Number((threshold_proposal.adopted_at[0] ?? 0n) / 1000000n)).toLocaleString()}` : threshold_proposal.rejected === true ?
                                `Rejected ${new Date(Number((threshold_proposal.rejected_at[0] ?? 0n) / 1000000n)).toLocaleString()}` : 'Open';

                        return html`
                            <ui5-table-row>
                                ${state.hide_open_threshold_proposals === false ? html`
                                    <ui5-table-cell>
                                        <ui5-busy-indicator
                                            size="Small"
                                            .active=${state.voting_on_proposals[threshold_proposal.id]?.adopting}
                                            delay="0"
                                        >
                                            <ui5-button
                                                design="Positive"
                                                @click=${() => this.handle_vote_on_threshold_proposal_click(threshold_proposal.id, true)}
                                            >
                                                Adopt
                                            </ui5-button>
                                        </ui5-busy-indicator>

                                        <ui5-busy-indicator
                                            size="Small"
                                            .active=${state.voting_on_proposals[threshold_proposal.id]?.rejecting}
                                            delay="0"
                                        >
                                            <ui5-button
                                                design="Negative"
                                                @click=${() => this.handle_vote_on_threshold_proposal_click(threshold_proposal.id, false)}
                                            >
                                                Reject
                                            </ui5-button>
                                        </ui5-busy-indicator>
                                    </ui5-table-cell>
                                ` : ''}

                                <ui5-table-cell>
                                    <ui5-label title="${threshold_proposal.id}">${id_trimmed}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${new Date(Number(threshold_proposal.created_at / 1000000n)).toLocaleString()}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label title="${threshold_proposal.proposer}">${proposer_trimmed}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${threshold_proposal.description}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${threshold_proposal.threshold}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${votes_for}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${votes_against}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${status}</ui5-label>
                                </ui5-table-cell>
                            </ui5-table-row>
                        `;
                    })}
                </ui5-table>
            </ui5-card>

            ${state.hide_create_threshold_proposal === false ? html`
                <ui5-dialog
                    header-text="Threshold Proposal"
                    .open=${true}
                >
                    <section class="demerg-input-form">
                        <div class="demerg-input">
                            <div class="demerg-input-and-label">
                                <ui5-label for="input-threshold-proposal-description" required>Description:</ui5-label>
                                <ui5-input id="input-threshold-proposal-description" style="margin-bottom: .75rem"></ui5-input>
                                <ui5-label for="input-threshold-proposal-threshold" required>Threshold:</ui5-label>
                            </div>
                        </div>

                        <div class="demerg-input">
                            <sp-theme style="width: 100%" scale="large" color="dark">
                                <sp-slider
                                    id="input-threshold-proposal-threshold"
                                    variant="tick"
                                    tick-step="1"
                                    tick-labels
                                    value="${state.threshold.value}"
                                    min="0"
                                    max="${state.signers.value.length}"
                                ></sp-slider>
                            </sp-theme>
                        </div>
                    </section>

                    <div slot="footer" class="dialog-footer">
                        <div class="dialog-footer-space"></div>

                        <ui5-button
                            class="dialog-footer-main-button"
                            @click=${() => this.store.hide_create_threshold_proposal = true}
                        >
                            Cancel
                        </ui5-button>

                        <ui5-busy-indicator
                            size="Small"
                            .active=${state.creating_threshold_proposal}
                            delay="0"
                        >
                            <ui5-button
                                design="Emphasized"
                                @click=${() => this.handle_create_threshold_proposal_click()}
                            >
                                Create
                            </ui5-button>
                        </ui5-busy-indicator>
                    </div>
                </ui5-dialog>
            ` : ''}

            <ui5-toast id="toast-proposal-created" placement="TopCenter">Proposal Created</ui5-toast>
            <ui5-toast id="toast-vote-recorded" placement="TopCenter">Vote Recorded</ui5-toast>

            <ui5-dialog
                header-text="Error"
                .open=${state.show_error_dialog}
            >   
                <div>${state.error_message}</div>
                <div slot="footer" class="dialog-footer">
                    <div class="dialog-footer-space"></div>
                    <ui5-button
                        @click=${() => {
                            this.store.show_error_dialog = false;
                            this.store.error_message = '';
                        }}
                    >
                        Ok
                    </ui5-button>
                </div>
            </ui5-dialog>
        `;
    }
}

window.customElements.define('demerg-threshold', DemergThreshold);