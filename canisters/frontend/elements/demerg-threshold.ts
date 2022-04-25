import { nat8 } from 'azle';
import {
    // InitialState as DemergAppInitialState, // TODO I would like to do this but getting a circular dependency error
    State as DemergAppState,
    sortCreatedAtDescending
} from './demerg-app';
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
    creatingThresholdProposal: boolean;
    errorMessage: string;
    hideCreateThresholdProposal: boolean;
    hideOpenThresholdProposals: boolean;
    loadingThresholdProposals: boolean;
    showErrorDialog: boolean;
    signers: DemergAppState['signers'];
    threshold: {
        loading: boolean;
        value: nat8;
    };
    thresholdProposals: ThresholdProposal[];
    votingOnProposals: {
        [proposalId: string]: {
            adopting: boolean;
            rejecting: boolean;
        }
    };
};

const InitialState: State = {
    // backend: DemergAppInitialState.backend, // TODO I would like to do this but getting a circular dependency error
    backend: null,
    creatingThresholdProposal: false,
    errorMessage: '',
    hideCreateThresholdProposal: true,
    hideOpenThresholdProposals: false,
    loadingThresholdProposals: false,
    showErrorDialog: false,
    // signers: DemergAppInitialState.signers, // TODO I would like to do this but getting a circular dependency error
    signers: {
        loading: false,
        value: []
    },
    threshold: {
        loading: true,
        value: 0
    },
    thresholdProposals: [],
    votingOnProposals: {}
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

        this.loadThreshold();
        this.loadThresholdProposals();
    }

    async handleCreateThresholdProposalClick() {
        if (this.store.backend === null) {
            this.store.errorMessage = 'You are not authenticated, please refresh.'
            this.store.showErrorDialog = true;

            return;
        }

        this.store.creatingThresholdProposal = true;

        try {
            const description = (this.shadow.querySelector('#input-threshold-proposal-description') as any).value as string;
            const threshold = (this.shadow.querySelector('#input-threshold-proposal-threshold') as any).value as number;

            const result = await this.store.backend.proposeThreshold(description, threshold);

            if (result.hasOwnProperty('ok')) {
                this.loadThresholdProposals();
                (this.shadow.querySelector('#toast-proposal-created') as any).show();
            }
            else {
                this.handleError((result as any).err);
            }
        }
        catch(error) {
            this.handleError(error);
        }
        
        this.store.hideCreateThresholdProposal = true;
        this.store.creatingThresholdProposal = false;
    }

    async handleVoteOnThresholdProposalClick(thresholdProposalId: string, adopt: boolean) {
        if (this.store.backend === null) {
            this.store.errorMessage = 'You are not authenticated, please refresh.'
            this.store.showErrorDialog = true;

            return;
        }

        this.store.votingOnProposals = {
            [thresholdProposalId]: {
                adopting: adopt === true,
                rejecting: adopt === false
            }
        };

        try {
            const result = await this.store.backend.voteOnThresholdProposal(thresholdProposalId, adopt);

            if (result.hasOwnProperty('ok')) {
                this.loadThreshold();
                this.loadThresholdProposals();
                (this.shadow.querySelector('#toast-vote-recorded') as any).show();
            }
            else {
                this.handleError((result as any).err);
            }
        }
        catch(error) {
            this.handleError(error);
        }

        delete this.store.votingOnProposals[thresholdProposalId];

        this.store.dispatch({
            type: 'RENDER'
        });
    }

    async loadThreshold() {
        if (this.store.backend === null) {
            this.store.errorMessage = 'You are not authenticated, please refresh.'
            this.store.showErrorDialog = true;

            return;
        }

        const threshold = await this.store.backend.getThreshold();

        this.store.threshold = {
            loading: false,
            value: threshold
        };
    }

    async loadThresholdProposals() {
        if (this.store.backend === null) {
            this.store.errorMessage = 'You are not authenticated, please refresh.'
            this.store.showErrorDialog = true;

            return;
        }

        const thresholdProposals = await this.store.backend.getThresholdProposals();
        
        this.store.thresholdProposals = sortCreatedAtDescending(thresholdProposals);
    }

    handleError(error: any) {
        console.error(error);

        if (error.message !== undefined) {
            this.store.errorMessage = 'There was an error. See the console for more information.';
        }
        else if (error.startsWith('Rejection code')) {
            this.store.errorMessage = 'There was an error. See the console for more information.';
        }
        else {
            this.store.errorMessage = error;
        }

        this.store.showErrorDialog = true;
    }

    render(state: State) {
        const thresholdSubtitleText = state.threshold.loading === true || state.signers.loading === true ? 'Loading...' : `${state.threshold.value} of ${state.signers.value.length} signers required`;

        return html`
            <link rel="stylesheet" href="/index.css">

            <ui5-card>
                <ui5-card-header title-text="Threshold" subtitle-text="${thresholdSubtitleText}">
                    <div class="card-header-action-container" slot="action">
                        <ui5-button
                            class="table-main-button"
                            design="Emphasized"
                            @click=${() => this.store.hideCreateThresholdProposal = false}
                        >
                            Create Proposal
                        </ui5-button>

                        <ui5-button
                            class="table-main-button"
                            ?hidden=${!state.hideOpenThresholdProposals}
                            @click=${async () => {
                                this.store.hideOpenThresholdProposals = false;
                                
                                
                                this.store.loadingThresholdProposals = true;
                                await this.loadThresholdProposals();
                                this.store.loadingThresholdProposals = false;
                            }}
                        >
                            View Open Proposals
                        </ui5-button>
                        
                        <ui5-button
                            class="table-main-button"
                            ?hidden=${state.hideOpenThresholdProposals}
                            @click=${async () => {
                                this.store.hideOpenThresholdProposals = true;

                                this.store.loadingThresholdProposals = true;
                                await this.loadThresholdProposals();
                                this.store.loadingThresholdProposals = false;
                            }}
                        >
                            View Closed Proposals
                        </ui5-button>

                        <ui5-busy-indicator
                            size="Small"
                            .active=${state.loadingThresholdProposals}
                            delay="0"
                        >
                            <ui5-button
                                @click=${async () => {
                                    this.store.loadingThresholdProposals = true;
                                    await this.loadThresholdProposals();
                                    this.store.loadingThresholdProposals = false;
                                }}
                            >
                                <ui5-icon name="refresh"></ui5-icon>
                            </ui5-button>
                        </ui5-busy-indicator>
                    </div>
                </ui5-card-header>

                <ui5-table
                    class="proposals-table"
                    no-data-text="No ${state.hideOpenThresholdProposals === true ? 'closed' : 'open'} proposals"
                >
                    ${state.hideOpenThresholdProposals === false ? html`
                        <ui5-table-column slot="columns" demand-popin></ui5-table-column>
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

                    ${state.thresholdProposals.filter((thresholdProposal) => {
                        const open = thresholdProposal.adopted === false && thresholdProposal.rejected === false;
                        const hidden = (open && state.hideOpenThresholdProposals === true) || (!open && state.hideOpenThresholdProposals === false);

                        return hidden === false;
                    }).map((thresholdProposal) => {
                        const idTrimmed = `${thresholdProposal.id.slice(0, 5)}...${thresholdProposal.id.slice(thresholdProposal.id.length - 5, thresholdProposal.id.length)}`;
                        const proposerTrimmed = `${thresholdProposal.proposer.toString().slice(0, 5)}...${thresholdProposal.proposer.toString().slice(thresholdProposal.proposer.toString().length - 5, thresholdProposal.proposer.toString().length)}`;

                        const votesFor = thresholdProposal.votes.filter((vote) => vote.adopt === true).length;
                        const votesAgainst = thresholdProposal.votes.filter((vote) => vote.adopt === false).length;

                        const status = thresholdProposal.adopted === true ?
                            `Adopted ${new Date(Number((thresholdProposal.adopted_at[0] ?? 0n) / 1000000n)).toLocaleString()}` : thresholdProposal.rejected === true ?
                                `Rejected ${new Date(Number((thresholdProposal.rejected_at[0] ?? 0n) / 1000000n)).toLocaleString()}` : 'Open';

                        return html`
                            <ui5-table-row>
                                ${state.hideOpenThresholdProposals === false ? html`
                                    <ui5-table-cell>
                                        <ui5-busy-indicator
                                            size="Small"
                                            .active=${state.votingOnProposals[thresholdProposal.id]?.adopting}
                                            delay="0"
                                        >
                                            <ui5-button
                                                design="Positive"
                                                @click=${() => this.handleVoteOnThresholdProposalClick(thresholdProposal.id, true)}
                                            >
                                                Adopt
                                            </ui5-button>
                                        </ui5-busy-indicator>
                                    </ui5-table-cell>

                                    <ui5-table-cell>
                                        <ui5-busy-indicator
                                            size="Small"
                                            .active=${state.votingOnProposals[thresholdProposal.id]?.rejecting}
                                            delay="0"
                                        >
                                            <ui5-button
                                                design="Negative"
                                                @click=${() => this.handleVoteOnThresholdProposalClick(thresholdProposal.id, false)}
                                            >
                                                Reject
                                            </ui5-button>
                                        </ui5-busy-indicator>
                                    </ui5-table-cell>
                                ` : ''}

                                <ui5-table-cell>
                                    <ui5-label title="${thresholdProposal.id}">${idTrimmed}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${new Date(Number(thresholdProposal.created_at / 1000000n)).toLocaleString()}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label title="${thresholdProposal.proposer}">${proposerTrimmed}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${thresholdProposal.description}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${thresholdProposal.threshold}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${votesFor}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${votesAgainst}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${status}</ui5-label>
                                </ui5-table-cell>
                            </ui5-table-row>
                        `;
                    })}
                </ui5-table>
            </ui5-card>

            ${state.hideCreateThresholdProposal === false ? html`
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
                            @click=${() => this.store.hideCreateThresholdProposal = true}
                        >
                            Cancel
                        </ui5-button>

                        <ui5-busy-indicator
                            size="Small"
                            .active=${state.creatingThresholdProposal}
                            delay="0"
                        >
                            <ui5-button
                                design="Emphasized"
                                @click=${() => this.handleCreateThresholdProposalClick()}
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
                .open=${state.showErrorDialog}
            >   
                <div>${state.errorMessage}</div>
                <div slot="footer" class="dialog-footer">
                    <div class="dialog-footer-space"></div>
                    <ui5-button
                        @click=${() => {
                            this.store.showErrorDialog = false;
                            this.store.errorMessage = '';
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