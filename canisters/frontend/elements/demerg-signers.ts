import { sort_created_at_descending } from './demerg-app';
import {
    InitialState as DemergAppInitialState,
    State as DemergAppState,
} from './demerg-app/state';
import {
    _SERVICE,
    SignerProposal
} from '../dfx_generated/backend/backend.did';
import { Principal } from '@dfinity/principal';
import {
    html,
    render as litRender
} from 'lit-html';
import { createObjectStore } from 'reduxular';

import '@spectrum-web-components/theme/sp-theme.js';
import '@spectrum-web-components/theme/src/themes.js';
import '@spectrum-web-components/radio/sp-radio.js';
import '@spectrum-web-components/radio/sp-radio-group.js';

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
    creating_signer_proposal: boolean;
    error_message: string;
    hide_create_signer_proposal: boolean;
    hide_open_signer_proposals: boolean;
    hide_signers: boolean;
    loading_signers: boolean;
    loading_signer_proposals: boolean;
    show_error_dialog: boolean;
    signers: DemergAppState['signers'];
    signer_proposals: SignerProposal[];
    voting_on_proposals: {
        [proposalId: string]: {
            adopting: boolean;
            rejecting: boolean;
        }
    };
};

const InitialState: State = {
    backend: DemergAppInitialState.backend,
    creating_signer_proposal: false,
    error_message: '',
    hide_create_signer_proposal: true,
    hide_open_signer_proposals: true,
    hide_signers: false,
    loading_signers: false,
    loading_signer_proposals: false,
    show_error_dialog: false,
    signers: DemergAppInitialState.signers,
    signer_proposals: [],
    voting_on_proposals: {}
};

export class DemergSigners extends HTMLElement {
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

        this.load_signers();
        this.load_signer_proposals();
    }

    async handle_create_signer_proposal_click() {
        if (this.store.backend === null) {
            this.store.error_message = 'You are not authenticated, please refresh.'
            this.store.show_error_dialog = true;

            return;
        }

        this.store.creating_signer_proposal = true;

        try {
            const description = (this.shadow.querySelector('#input-signer-proposal-description') as any).value as string;
            const signer = (this.shadow.querySelector('#input-signer-proposal-signer') as any).value as string;
            const remove = (this.shadow.querySelector('#input-signer-proposal-remove') as any).checked as boolean;

            const result = await this.store.backend.propose_signer(description, Principal.fromText(signer), remove);

            if (result.hasOwnProperty('ok')) {
                this.load_signer_proposals();
                (this.shadow.querySelector('#toast-proposal-created') as any).show();
            }
            else {
                this.handle_error((result as any).err);
            }
        }
        catch(error) {
            this.handle_error(error);
        }
        
        this.store.hide_create_signer_proposal = true;
        this.store.creating_signer_proposal = false;
    }

    async handle_vote_on_signer_proposal_click(signerProposalId: string, adopt: boolean) {
        if (this.store.backend === null) {
            this.store.error_message = 'You are not authenticated, please refresh.'
            this.store.show_error_dialog = true;

            return;
        }

        this.store.voting_on_proposals = {
            [signerProposalId]: {
                adopting: adopt === true,
                rejecting: adopt === false
            }
        };

        try {
            const result = await this.store.backend.vote_on_signer_proposal(signerProposalId, adopt);

            if (result.hasOwnProperty('ok')) {
                this.load_signers();
                this.load_signer_proposals();
                (this.shadow.querySelector('#toast-vote-recorded') as any).show();
            }
            else {
                this.handle_error((result as any).err);
            }

        }
        catch(error) {
            this.handle_error(error);
        }

        delete this.store.voting_on_proposals[signerProposalId];

        this.store.dispatch({
            type: 'RENDER'
        });
    }

    async load_signers() {
        if (this.store.backend === null) {
            this.store.error_message = 'You are not authenticated, please refresh.'
            this.store.show_error_dialog = true;

            return;
        }

        const signers = await this.store.backend.get_signers();

        this.dispatchEvent(new CustomEvent('signers-changed', {
            detail: {
                loading: false,
                value: signers
            }
        }));
    }

    async load_signer_proposals() {
        if (this.store.backend === null) {
            this.store.error_message = 'You are not authenticated, please refresh.'
            this.store.show_error_dialog = true;

            return;
        }

        const signer_proposals = await this.store.backend.get_signer_proposals();
        
        this.store.signer_proposals = sort_created_at_descending(signer_proposals);
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
        return html`
            <link rel="stylesheet" href="/index.css">

            <ui5-card>
                <ui5-card-header title-text="Signers">
                    <div class="card-header-action-container" slot="action">
                        <ui5-button
                            class="table-main-button"
                            design="Emphasized"
                            @click=${() => this.store.hide_create_signer_proposal = false}
                        >
                            Create Proposal
                        </ui5-button>

                        <ui5-button
                            class="table-main-button"
                            design="Attention"
                            @click=${async () => {
                                this.store.hide_signers = false;
                                this.store.hide_open_signer_proposals = true;
                            
                                this.store.loading_signers = true;
                                await this.load_signers();
                                this.store.loading_signers = false;
                            }}
                        >
                            View Signers
                        </ui5-button>

                        <ui5-button
                            class="table-main-button"
                            ?hidden=${!state.hide_open_signer_proposals}
                            @click=${async () => {
                                this.store.hide_signers = true;
                                this.store.hide_open_signer_proposals = false;

                                this.store.loading_signer_proposals = true;
                                await this.load_signer_proposals();
                                this.store.loading_signer_proposals = false;
                            }}
                        >
                            View Open Proposals
                        </ui5-button>

                        <ui5-button
                            class="table-main-button"
                            ?hidden=${state.hide_open_signer_proposals}
                            @click=${async () => {
                                this.store.hide_signers = true;
                                this.store.hide_open_signer_proposals = true;

                                this.store.loading_signer_proposals = true;
                                await this.load_signer_proposals();
                                this.store.loading_signer_proposals = false;
                            }}
                        >
                            View Closed Proposals
                        </ui5-button>

                        <ui5-busy-indicator
                            size="Small"
                            .active=${state.loading_signers || state.loading_signer_proposals}
                            delay="0"
                        >
                            <ui5-button
                                @click=${async () => {
                                    this.store.loading_signers = true;
                                    this.store.loading_signer_proposals = true;

                                    await Promise.all([
                                        this.load_signers(),
                                        this.load_signer_proposals()
                                    ]);

                                    this.store.loading_signers = false;
                                    this.store.loading_signer_proposals = false;
                                }}
                            >
                                <ui5-icon name="refresh"></ui5-icon>
                            </ui5-button>
                        </ui5-busy-indicator>
                    </div>
                </ui5-card-header>

                <ui5-table
                    ?hidden=${!state.hide_signers}
                    class="proposals-table"
                    no-data-text="No ${state.hide_open_signer_proposals === true ? 'closed' : 'open'} proposals"
                >
                    ${state.hide_open_signer_proposals === false ? html`
                        <ui5-table-column slot="columns"></ui5-table-column>
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
                        <ui5-label>Signer</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column slot="columns" demand-popin>
                        <ui5-label>Add/Remove</ui5-label>
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

                    ${state.signer_proposals.filter((signer_proposal) => {
                        const open = signer_proposal.adopted === false && signer_proposal.rejected === false;
                        const hidden = (open && state.hide_open_signer_proposals === true) || (!open && state.hide_open_signer_proposals === false);

                        return hidden === false;
                    }).map((signer_proposal) => {
                        const id_trimmed = `${signer_proposal.id.slice(0, 5)}...${signer_proposal.id.slice(signer_proposal.id.length - 5, signer_proposal.id.length)}`;
                        const proposer_trimmed = `${signer_proposal.proposer.toString().slice(0, 5)}...${signer_proposal.proposer.toString().slice(signer_proposal.proposer.toString().length - 5, signer_proposal.proposer.toString().length)}`;

                        const votes_for = signer_proposal.votes.filter((vote) => vote.adopt === true).length;
                        const votes_against = signer_proposal.votes.filter((vote) => vote.adopt === false).length;

                        const status = signer_proposal.adopted === true ?
                            `Adopted ${new Date(Number((signer_proposal.adopted_at[0] ?? 0n) / 1000000n)).toLocaleString()}` : signer_proposal.rejected === true ?
                                `Rejected ${new Date(Number((signer_proposal.rejected_at[0] ?? 0n) / 1000000n)).toLocaleString()}` : 'Open';

                        return html`
                            <ui5-table-row>
                                ${state.hide_open_signer_proposals === false ? html`
                                    <ui5-table-cell>
                                        <ui5-busy-indicator
                                            size="Small"
                                            .active=${state.voting_on_proposals[signer_proposal.id]?.adopting}
                                            delay="0"
                                        >
                                            <ui5-button
                                                design="Positive"
                                                @click=${() => this.handle_vote_on_signer_proposal_click(signer_proposal.id, true)}
                                            >
                                                Adopt
                                            </ui5-button>
                                        </ui5-busy-indicator>
                                        
                                        <ui5-busy-indicator
                                            size="Small"
                                            .active=${state.voting_on_proposals[signer_proposal.id]?.rejecting}
                                            delay="0"
                                        >
                                            <ui5-button
                                                design="Negative"
                                                @click=${() => this.handle_vote_on_signer_proposal_click(signer_proposal.id, false)}
                                            >
                                                Reject
                                            </ui5-button>
                                        </ui5-busy-indicator>
                                    </ui5-table-cell>
                                ` : ''}

                                <ui5-table-cell>
                                    <ui5-label title="${signer_proposal.id}">${id_trimmed}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${new Date(Number(signer_proposal.created_at / 1000000n)).toLocaleString()}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label title="${signer_proposal.proposer}">${proposer_trimmed}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${signer_proposal.description}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${signer_proposal.signer}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${signer_proposal.remove === true ? 'Remove' : 'Add'}</ui5-label>
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

                <ui5-table
                        ?hidden=${state.hide_signers}
                        class="proposals-table"
                        no-data-text="No signers"
                    >
                        <ui5-table-column slot="columns" demand-popin>
                            <ui5-label>Principal</ui5-label>
                        </ui5-table-column>

                        ${state.signers.value.map((signer) => {
                            return html`
                                <ui5-table-row>
                                    <ui5-table-cell>
                                        <ui5-label>${signer}</ui5-label>
                                    </ui5-table-cell>
                                </ui5-table-row>
                            `;
                        })}
                </ui5-table>
            </ui5-card>

            ${state.hide_create_signer_proposal === false ? html`
                <ui5-dialog
                    header-text="Signer Proposal"
                    .open=${true}
                >
                    <section class="demerg-input-form">
                        <div class="demerg-input">
                            <div class="demerg-input-and-label">
                                <ui5-label for="input-signer-proposal-description" required>Description:</ui5-label>
                                <ui5-input id="input-signer-proposal-description"></ui5-input>
                            </div>
                        </div>

                        <div class="demerg-input">
                            <div class="demerg-input-and-label">
                                <ui5-label for="input-signer-proposal-signer" required>Signer:</ui5-label>
                                <ui5-input id="input-signer-proposal-signer"></ui5-input>
                            </div>
                        </div>

                        <div class="demerg-input">
                            <sp-theme scale="medium">
                                <sp-radio-group
                                    selected="add-signer"
                                    vertical
                                >
                                    <sp-radio value="add-signer">Add signer</sp-radio>
                                    <sp-radio id="input-signer-proposal-remove" value="remove-signer">Remove signer</sp-radio>
                                </sp-radio-group>
                            </sp-theme>
                        </div>
                    </section>

                    <div slot="footer" class="dialog-footer">
                        <div class="dialog-footer-space"></div>

                        <ui5-button
                            class="dialog-footer-main-button"
                            @click=${() => this.store.hide_create_signer_proposal = true}
                        >
                            Cancel
                        </ui5-button>
                        
                        <ui5-busy-indicator
                            size="Small"
                            .active=${state.creating_signer_proposal}
                            delay="0"
                        >
                            <ui5-button
                                design="Emphasized"
                                @click=${() => this.handle_create_signer_proposal_click()}
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

window.customElements.define('demerg-signers', DemergSigners);