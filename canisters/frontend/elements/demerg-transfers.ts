import { nat64 } from 'azle';
import {
    _SERVICE,
    TransferProposal
} from '../dfx_generated/backend/backend.did';
import {
    // InitialState as DemergAppInitialState, // TODO I would like to do this but getting a circular dependency error
    State as DemergAppState,
    sortCreatedAtDescending
} from './demerg-app';
import {
    html,
    render as litRender
} from 'lit-html';
import { createObjectStore } from 'reduxular';

type State = {
    backend: DemergAppState['backend'];
    balance: {
        loading: boolean;
        value: nat64;
    };
    creatingTransferProposal: boolean;
    errorMessage: string;
    hideCreateTransferProposal: boolean;
    hideOpenTransferProposals: boolean;
    loadingTransferProposals: boolean;
    showErrorDialog: boolean;
    transferProposals: TransferProposal[];
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
    balance: {
        loading: true,
        value: 0n
    },
    creatingTransferProposal: false,
    errorMessage: '',
    hideCreateTransferProposal: true,
    hideOpenTransferProposals: false,
    loadingTransferProposals: false,
    showErrorDialog: false,
    transferProposals: [],
    votingOnProposals: {}
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

        this.loadBalance();
        this.loadTransferProposals();
    }

    async handleCreateTransferProposalClick() {
        if (this.store.backend === null) {
            this.store.errorMessage = 'You are not authenticated, please refresh.'
            this.store.showErrorDialog = true;

            return;
        }

        this.store.creatingTransferProposal = true;

        try {
            const description = (this.shadow.querySelector('#input-transfer-proposal-description') as any).value as string;
            const destinationAddress = (this.shadow.querySelector('#input-transfer-proposal-destination-address') as any).value as string;
            const amountString = (this.shadow.querySelector('#input-transfer-proposal-amount') as any).value.toString() as string;
            const decimals = amountString?.split('.')[1]?.length ?? 0;
            const amount = BigInt(Number(amountString ?? 0) * 10**decimals) * BigInt(10**(8 - decimals));

            const result = await this.store.backend.proposeTransfer(description, destinationAddress, amount);

            if (result.hasOwnProperty('ok')) {
                this.loadTransferProposals();
                (this.shadow.querySelector('#toast-proposal-created') as any).show();
            }
            else {
                this.handleError((result as any).err);
            }
        }
        catch(error) {
            this.handleError(error);
        }
        
        this.store.hideCreateTransferProposal = true;
        this.store.creatingTransferProposal = false;
    }

    async handleVoteOnTransferProposalClick(transferProposalId: string, adopt: boolean) {
        if (this.store.backend === null) {
            this.store.errorMessage = 'You are not authenticated, please refresh.'
            this.store.showErrorDialog = true;

            return;
        }

        this.store.votingOnProposals = {
            [transferProposalId]: {
                adopting: adopt === true,
                rejecting: adopt === false
            }
        };

        try {
            const result = await this.store.backend.voteOnTransferProposal(transferProposalId, adopt);

            if (result.hasOwnProperty('ok')) {
                this.loadBalance();
                this.loadTransferProposals();
                (this.shadow.querySelector('#toast-vote-recorded') as any).show();
            }
            else {
                this.handleError((result as any).err);
            }
        }
        catch(error) {
            this.handleError(error);
        }

        // TODO this is technically a memory leak, but probably won't be an issue
        this.store.votingOnProposals = {
            [transferProposalId]: {
                adopting: false,
                rejecting: false
            }
        };
    }

    async loadBalance() {
        if (this.store.backend === null) {
            this.store.errorMessage = 'You are not authenticated, please refresh.'
            this.store.showErrorDialog = true;

            return;
        }

        const vault_balance_result = await this.store.backend.getVaultBalance();

        if ('ok' in vault_balance_result) {
            this.store.balance = {
                loading: false,
                value: vault_balance_result.ok
            };
        }
        else {
            this.handleError((vault_balance_result as any).err);
        }
    }

    async loadTransferProposals() {
        if (this.store.backend === null) {
            this.store.errorMessage = 'You are not authenticated, please refresh.'
            this.store.showErrorDialog = true;

            return;
        }

        const transferProposals = await this.store.backend.getTransferProposals();
        
        this.store.transferProposals = sortCreatedAtDescending(transferProposals);
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
        const canisterBalanceText = state.balance.loading === true ? 'Loading...' : `${Number(state.balance.value * 10000n / BigInt(10**8)) / 10000} ICP available`;

        // TODO figure out the best way to not repeat styles now
        return html`
            <style>
                .main-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                    height: 100%;
                    padding-top: 1rem;
                }

                .proposals-container {
                    width: 75%;
                    padding-bottom: 1rem;
                }

                .proposals-table {
                    overflow-x: scroll;
                }

                .demerg-input-form {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: .5rem;
                    box-sizing: border-box;
                    width: 100%;
                }

                .demerg-input {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding-bottom: .75rem;
                    box-sizing: border-box;
                    width: 100%;
                }

                .demerg-input-and-label {
                    display: flex;
                    flex-direction: column;
                }

                .dialog-footer {
                    display: flex;
                    padding: .5rem;
                }

                .dialog-footer-main-button {
                    margin-right: .25rem;
                }

                .dialog-footer-space {
                    flex: 1;
                }

                .card-header-action-container {
                    display: flex;
                }

                .table-main-button {
                    margin-right: .25rem;
                }
            </style>

            <ui5-card>
                <ui5-card-header title-text="Transfers" subtitle-text="${canisterBalanceText}">
                    <div class="card-header-action-container" slot="action">
                        <ui5-button
                            class="table-main-button"
                            design="Emphasized"
                            @click=${() => this.store.hideCreateTransferProposal = false}
                        >
                            Create Proposal
                        </ui5-button>

                        <ui5-button
                            class="table-main-button"
                            ?hidden=${!state.hideOpenTransferProposals}
                            @click=${async () => {
                                this.store.hideOpenTransferProposals = false;
                                
                                this.store.loadingTransferProposals = true;
                                await this.loadTransferProposals();
                                this.store.loadingTransferProposals = false;
                            }}
                        >
                            View Open Proposals
                        </ui5-button>

                        <ui5-button
                            class="table-main-button"
                            ?hidden=${state.hideOpenTransferProposals}
                            @click=${async () => {
                                this.store.hideOpenTransferProposals = true;

                                this.store.loadingTransferProposals = true;
                                await this.loadTransferProposals();
                                this.store.loadingTransferProposals = false;
                            }}
                        >
                            View Closed Proposals
                        </ui5-button>

                        <ui5-busy-indicator
                            size="Small"
                            .active=${state.balance.loading || state.loadingTransferProposals}
                            delay="0"
                        >
                            <ui5-button
                                @click=${async () => {
                                    this.store.balance = {
                                        ...this.store.balance,
                                        loading: true
                                    };
                                    this.store.loadingTransferProposals = true;

                                    await Promise.all([
                                        this.loadBalance(),
                                        this.loadTransferProposals()
                                    ]);

                                    this.store.loadingTransferProposals = false;
                                }}
                            >
                                <ui5-icon name="refresh"></ui5-icon>
                            </ui5-button>
                        </ui5-busy-indicator>
                    </div>
                </ui5-card-header>

                <ui5-table
                    class="proposals-table"
                    no-data-text="No ${state.hideOpenTransferProposals === true ? 'closed' : 'open'} proposals"
                >
                    ${state.hideOpenTransferProposals === false ? html`
                        <ui5-table-column slot="columns"></ui5-table-column>
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

                    ${state.transferProposals.filter((transferProposal) => {
                        const open = transferProposal.adopted === false && transferProposal.rejected === false;
                        const hidden = (open && state.hideOpenTransferProposals === true) || (!open && state.hideOpenTransferProposals === false);

                        return hidden === false;
                    }).map((transferProposal) => {
                        const idTrimmed = `${transferProposal.id.slice(0, 5)}...${transferProposal.id.slice(transferProposal.id.length - 5, transferProposal.id.length)}`;
                        const proposerTrimmed = `${transferProposal.proposer.toString().slice(0, 5)}...${transferProposal.proposer.toString().slice(transferProposal.proposer.toString().length - 5, transferProposal.proposer.toString().length)}`;

                        const votesFor = transferProposal.votes.filter((vote) => vote.adopt === true).length;
                        const votesAgainst = transferProposal.votes.filter((vote) => vote.adopt === false).length;

                        const status = transferProposal.adopted === true ?
                            `Adopted ${new Date(Number((transferProposal.adopted_at[0] ?? 0n) / 1000000n)).toLocaleString()}` : transferProposal.rejected === true ?
                                `Rejected ${new Date(Number((transferProposal.rejected_at[0] ?? 0n) / 1000000n)).toLocaleString()}` : 'Open';

                        return html`
                            <ui5-table-row>
                                ${state.hideOpenTransferProposals === false ? html`
                                    <ui5-table-cell>
                                        <ui5-busy-indicator
                                            size="Small"
                                            .active=${state.votingOnProposals[transferProposal.id]?.adopting}
                                            delay="0"
                                        >
                                            <ui5-button
                                                design="Positive"
                                                @click=${() => this.handleVoteOnTransferProposalClick(transferProposal.id, true)}
                                            >
                                                Adopt
                                            </ui5-button>
                                        </ui5-busy-indicator>
                                    </ui5-table-cell>

                                    <ui5-table-cell>
                                        <ui5-busy-indicator
                                            size="Small"
                                            .active=${state.votingOnProposals[transferProposal.id]?.rejecting}
                                            delay="0"
                                        >
                                            <ui5-button
                                                design="Negative"
                                                @click=${() => this.handleVoteOnTransferProposalClick(transferProposal.id, false)}
                                            >
                                                Reject
                                            </ui5-button>
                                        </ui5-busy-indicator>
                                    </ui5-table-cell>
                                ` : ''}

                                <ui5-table-cell>
                                    <ui5-label title="${transferProposal.id}">${idTrimmed}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${new Date(Number(transferProposal.created_at / 1000000n)).toLocaleString()}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label title="${transferProposal.proposer}">${proposerTrimmed}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${transferProposal.description}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${transferProposal.destinationAddress}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${Number(transferProposal.amount * 10000n / BigInt(10**8)) / 10000} ICP</ui5-label>
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

            ${state.hideCreateTransferProposal === false ? html`
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
                        <ui5-busy-indicator
                            size="Small"
                            .active=${state.creatingTransferProposal}
                            delay="0"
                        >
                            <ui5-button
                                class="dialog-footer-main-button"
                                design="Emphasized"
                                @click=${() => this.handleCreateTransferProposalClick()}
                            >
                                Create
                            </ui5-button>
                        </ui5-busy-indicator>

                        <ui5-button @click=${() => this.store.hideCreateTransferProposal = true}>Cancel</ui5-button>
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

window.customElements.define('demerg-transfers', DemergTransfers);