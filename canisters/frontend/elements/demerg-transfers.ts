import { nat64 } from 'azle';
import { sort_created_at_descending } from './demerg-app';
import {
    InitialState as DemergAppInitialState,
    State as DemergAppState
} from './demerg-app/state';
import {
    _SERVICE,
    TransferProposal
} from '../dfx_generated/backend/backend.did';
import {
    html,
    render as litRender
} from 'lit-html';
import { createObjectStore } from 'reduxular';

import '@spectrum-web-components/theme/sp-theme.js';
import '@spectrum-web-components/theme/src/themes.js';
import '@spectrum-web-components/number-field/sp-number-field.js';

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
    balance: {
        loading: boolean;
        value: nat64;
    };
    creating_transfer_proposal: boolean;
    error_message: string;
    hide_create_transfer_proposal: boolean;
    hide_open_transfer_proposals: boolean;
    loading_transfer_proposals: boolean;
    show_error_dialog: boolean;
    transfer_proposals: TransferProposal[];
    voting_on_proposals: {
        [proposalId: string]: {
            adopting: boolean;
            rejecting: boolean;
        }
    };
};

const InitialState: State = {
    backend: DemergAppInitialState.backend,
    balance: {
        loading: true,
        value: 0n
    },
    creating_transfer_proposal: false,
    error_message: '',
    hide_create_transfer_proposal: true,
    hide_open_transfer_proposals: false,
    loading_transfer_proposals: false,
    show_error_dialog: false,
    transfer_proposals: [],
    voting_on_proposals: {}
};

class DemergTransfers extends HTMLElement {
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

        this.load_balance();
        this.load_transfer_proposals();
    }

    async handle_create_transfer_proposal_click() {
        if (this.store.backend === null) {
            this.store.error_message = 'You are not authenticated, please refresh.'
            this.store.show_error_dialog = true;

            return;
        }

        this.store.creating_transfer_proposal = true;

        try {
            const description = (this.shadow.querySelector('#input-transfer-proposal-description') as any).value as string;
            const destination_address = (this.shadow.querySelector('#input-transfer-proposal-destination-address') as any).value as string;
            const amount_string = (this.shadow.querySelector('#input-transfer-proposal-amount') as any).value.toString() as string;
            const decimals = amount_string?.split('.')[1]?.length ?? 0;
            const amount = BigInt(Number(amount_string ?? 0) * 10**decimals) * BigInt(10**(8 - decimals));

            const result = await this.store.backend.propose_transfer(description, destination_address, amount);

            if (result.hasOwnProperty('ok')) {
                this.load_transfer_proposals();
                (this.shadow.querySelector('#toast-proposal-created') as any).show();
            }
            else {
                this.handle_error((result as any).err);
            }
        }
        catch(error) {
            this.handle_error(error);
        }
        
        this.store.hide_create_transfer_proposal = true;
        this.store.creating_transfer_proposal = false;
    }

    async handle_vote_on_transfer_proposal_click(transferProposalId: string, adopt: boolean) {
        if (this.store.backend === null) {
            this.store.error_message = 'You are not authenticated, please refresh.'
            this.store.show_error_dialog = true;

            return;
        }

        this.store.voting_on_proposals = {
            [transferProposalId]: {
                adopting: adopt === true,
                rejecting: adopt === false
            }
        };

        try {
            const result = await this.store.backend.vote_on_transfer_proposal(transferProposalId, adopt);

            if (result.hasOwnProperty('ok')) {
                this.load_balance();
                this.load_transfer_proposals();
                (this.shadow.querySelector('#toast-vote-recorded') as any).show();
            }
            else {
                this.handle_error((result as any).err);
            }
        }
        catch(error) {
            this.handle_error(error);
        }

        delete this.store.voting_on_proposals[transferProposalId];

        this.store.dispatch({
            type: 'RENDER'
        });
    }

    async load_balance() {
        if (this.store.backend === null) {
            this.store.error_message = 'You are not authenticated, please refresh.'
            this.store.show_error_dialog = true;

            return;
        }

        const vault_balance_result = await this.store.backend.get_vault_balance();

        if ('ok' in vault_balance_result) {
            this.store.balance = {
                loading: false,
                value: vault_balance_result.ok
            };
        }
        else {
            this.handle_error((vault_balance_result as any).err);
        }
    }

    async load_transfer_proposals() {
        if (this.store.backend === null) {
            this.store.error_message = 'You are not authenticated, please refresh.'
            this.store.show_error_dialog = true;

            return;
        }

        const transfer_proposals = await this.store.backend.get_transfer_proposals();
        
        this.store.transfer_proposals = sort_created_at_descending(transfer_proposals);
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
        const canister_balance_text = state.balance.loading === true ? 'Loading...' : `${Number(state.balance.value * 10000n / BigInt(10**8)) / 10000} ICP available`;

        return html`
            <link rel="stylesheet" href="/index.css">

            <ui5-card>
                <ui5-card-header title-text="Transfers" subtitle-text="${canister_balance_text}">
                    <div class="card-header-action-container" slot="action">
                        <ui5-button
                            class="table-main-button"
                            design="Emphasized"
                            @click=${() => this.store.hide_create_transfer_proposal = false}
                        >
                            Create Proposal
                        </ui5-button>

                        <ui5-button
                            class="table-main-button"
                            ?hidden=${!state.hide_open_transfer_proposals}
                            @click=${async () => {
                                this.store.hide_open_transfer_proposals = false;
                                
                                this.store.loading_transfer_proposals = true;
                                await this.load_transfer_proposals();
                                this.store.loading_transfer_proposals = false;
                            }}
                        >
                            View Open Proposals
                        </ui5-button>

                        <ui5-button
                            class="table-main-button"
                            ?hidden=${state.hide_open_transfer_proposals}
                            @click=${async () => {
                                this.store.hide_open_transfer_proposals = true;

                                this.store.loading_transfer_proposals = true;
                                await this.load_transfer_proposals();
                                this.store.loading_transfer_proposals = false;
                            }}
                        >
                            View Closed Proposals
                        </ui5-button>

                        <ui5-busy-indicator
                            size="Small"
                            .active=${state.balance.loading || state.loading_transfer_proposals}
                            delay="0"
                        >
                            <ui5-button
                                @click=${async () => {
                                    this.store.balance = {
                                        ...this.store.balance,
                                        loading: true
                                    };
                                    this.store.loading_transfer_proposals = true;

                                    await Promise.all([
                                        this.load_balance(),
                                        this.load_transfer_proposals()
                                    ]);

                                    this.store.loading_transfer_proposals = false;
                                }}
                            >
                                <ui5-icon name="refresh"></ui5-icon>
                            </ui5-button>
                        </ui5-busy-indicator>
                    </div>
                </ui5-card-header>

                <ui5-table
                    class="proposals-table"
                    no-data-text="No ${state.hide_open_transfer_proposals === true ? 'closed' : 'open'} proposals"
                >
                    ${state.hide_open_transfer_proposals === false ? html`
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
                        <ui5-label>Destination Address</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column slot="columns" demand-popin>
                        <ui5-label>Amount</ui5-label>
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

                    ${state.transfer_proposals.filter((transfer_proposal) => {
                        const open = transfer_proposal.adopted === false && transfer_proposal.rejected === false;
                        const hidden = (open && state.hide_open_transfer_proposals === true) || (!open && state.hide_open_transfer_proposals === false);

                        return hidden === false;
                    }).map((transfer_proposal) => {
                        const id_trimmed = `${transfer_proposal.id.slice(0, 5)}...${transfer_proposal.id.slice(transfer_proposal.id.length - 5, transfer_proposal.id.length)}`;
                        const proposer_trimmed = `${transfer_proposal.proposer.toString().slice(0, 5)}...${transfer_proposal.proposer.toString().slice(transfer_proposal.proposer.toString().length - 5, transfer_proposal.proposer.toString().length)}`;

                        const votes_for = transfer_proposal.votes.filter((vote) => vote.adopt === true).length;
                        const votes_against = transfer_proposal.votes.filter((vote) => vote.adopt === false).length;

                        const status = transfer_proposal.adopted === true ?
                            `Adopted ${new Date(Number((transfer_proposal.adopted_at[0] ?? 0n) / 1000000n)).toLocaleString()}` : transfer_proposal.rejected === true ?
                                `Rejected ${new Date(Number((transfer_proposal.rejected_at[0] ?? 0n) / 1000000n)).toLocaleString()}` : 'Open';

                        return html`
                            <ui5-table-row>
                                ${state.hide_open_transfer_proposals === false ? html`
                                    <ui5-table-cell>
                                        <ui5-busy-indicator
                                            size="Small"
                                            .active=${state.voting_on_proposals[transfer_proposal.id]?.adopting}
                                            delay="0"
                                        >
                                            <ui5-button
                                                design="Positive"
                                                @click=${() => this.handle_vote_on_transfer_proposal_click(transfer_proposal.id, true)}
                                            >
                                                Adopt
                                            </ui5-button>
                                        </ui5-busy-indicator>

                                        <ui5-busy-indicator
                                            size="Small"
                                            .active=${state.voting_on_proposals[transfer_proposal.id]?.rejecting}
                                            delay="0"
                                        >
                                            <ui5-button
                                                design="Negative"
                                                @click=${() => this.handle_vote_on_transfer_proposal_click(transfer_proposal.id, false)}
                                            >
                                                Reject
                                            </ui5-button>
                                        </ui5-busy-indicator>
                                    </ui5-table-cell>
                                ` : ''}

                                <ui5-table-cell>
                                    <ui5-label title="${transfer_proposal.id}">${id_trimmed}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${new Date(Number(transfer_proposal.created_at / 1000000n)).toLocaleString()}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label title="${transfer_proposal.proposer}">${proposer_trimmed}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${transfer_proposal.description}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${transfer_proposal.destination_address}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${Number(transfer_proposal.amount * 10000n / BigInt(10**8)) / 10000} ICP</ui5-label>
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

            ${state.hide_create_transfer_proposal === false ? html`
                <ui5-dialog
                    header-text="Transfer Proposal"
                    .open=${true}
                >
                    <section class="demerg-input-form">
                        <div class="demerg-input">
                            <div class="demerg-input-and-label">
                                <ui5-label for="input-transfer-proposal-description" required>Description:</ui5-label>
                                <ui5-input id="input-transfer-proposal-description"></ui5-input>
                            </div>
                        </div>

                        <div class="demerg-input">
                            <div class="demerg-input-and-label">
                                <ui5-label for="input-transfer-proposal-destination-address" required>Destination Address:</ui5-label>
                                <ui5-input id="input-transfer-proposal-destination-address"></ui5-input>
                            </div>
                        </div>

                        <div class="demerg-input">
                            <div class="demerg-input-and-label">
                                <ui5-label for="input-transfer-proposal-amount" required>Amount:</ui5-label>
                                <sp-theme scale="large">
                                    <sp-number-field
                                        id="input-transfer-proposal-amount"
                                        style="width: 200px"
                                        value="0"
                                        format-options='{ "style": "currency", "currency": "ICP" }'
                                        min="0"
                                        max="${state.balance.loading === true ? 0 : Number(state.balance.value * 10000n / BigInt(10**8)) / 10000}"
                                    ></sp-number-field>
                                </sp-theme>
                            </div>
                        </div>
                    </section>

                    <div slot="footer" class="dialog-footer">
                        <div class="dialog-footer-space"></div>

                        <ui5-button
                            class="dialog-footer-main-button"
                            @click=${() => this.store.hide_create_transfer_proposal = true}
                        >Cancel</ui5-button>

                        <ui5-busy-indicator
                            size="Small"
                            .active=${state.creating_transfer_proposal}
                            delay="0"
                        >
                            <ui5-button
                                design="Emphasized"
                                @click=${() => this.handle_create_transfer_proposal_click()}
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

window.customElements.define('demerg-transfers', DemergTransfers);