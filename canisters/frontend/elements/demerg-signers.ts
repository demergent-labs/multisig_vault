import {
    // InitialState as DemergAppInitialState, // TODO I would like to do this but getting a circular dependency error
    State as DemergAppState,
    sortCreatedAtDescending
} from './demerg-app';
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

type State = {
    backend: DemergAppState['backend'];
    creatingSignerProposal: boolean;
    errorMessage: string;
    hideCreateSignerProposal: boolean;
    hideOpenSignerProposals: boolean;
    hideSigners: boolean;
    loadingSigners: boolean;
    loadingSignerProposals: boolean;
    showErrorDialog: boolean;
    signers: DemergAppState['signers'];
    signerProposals: SignerProposal[];
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
    creatingSignerProposal: false,
    errorMessage: '',
    hideCreateSignerProposal: true,
    hideOpenSignerProposals: true,
    hideSigners: false,
    loadingSigners: false,
    loadingSignerProposals: false,
    showErrorDialog: false,
    // signers: DemergAppInitialState.signers, // TODO I would like to do this but getting a circular dependency error
    signers: {
        loading: false,
        value: []
    },
    signerProposals: [],
    votingOnProposals: {}
};

class DemergSigners extends HTMLElement {
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

        this.loadSigners();
        this.loadSignerProposals();
    }

    async handleCreateSignerProposalClick() {
        if (this.store.backend === null) {
            this.store.errorMessage = 'You are not authenticated, please refresh.'
            this.store.showErrorDialog = true;

            return;
        }

        this.store.creatingSignerProposal = true;

        try {
            const description = (this.shadow.querySelector('#input-signer-proposal-description') as any).value as string;
            const signer = (this.shadow.querySelector('#input-signer-proposal-signer') as any).value as string;
            const remove = (this.shadow.querySelector('#input-signer-proposal-remove') as any).checked as boolean;

            const result = await this.store.backend.proposeSigner(description, Principal.fromText(signer), remove);

            if (result.hasOwnProperty('ok')) {
                this.loadSignerProposals();
                (this.shadow.querySelector('#toast-proposal-created') as any).show();
            }
            else {
                this.handleError((result as any).err);
            }
        }
        catch(error) {
            this.handleError(error);
        }
        
        this.store.hideCreateSignerProposal = true;
        this.store.creatingSignerProposal = false;
    }

    async handleVoteOnSignerProposalClick(signerProposalId: string, adopt: boolean) {
        if (this.store.backend === null) {
            this.store.errorMessage = 'You are not authenticated, please refresh.'
            this.store.showErrorDialog = true;

            return;
        }

        this.store.votingOnProposals = {
            [signerProposalId]: {
                adopting: adopt === true,
                rejecting: adopt === false
            }
        };

        try {
            const result = await this.store.backend.voteOnSignerProposal(signerProposalId, adopt);

            if (result.hasOwnProperty('ok')) {
                this.loadSigners();
                this.loadSignerProposals();
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
        // TODO we could also just delete the property and do a manually dispatch
        this.store.votingOnProposals = {
            [signerProposalId]: {
                adopting: false,
                rejecting: false
            }
        };
    }

    async loadSigners() {
        if (this.store.backend === null) {
            this.store.errorMessage = 'You are not authenticated, please refresh.'
            this.store.showErrorDialog = true;

            return;
        }

        const signers = await this.store.backend.getSigners();

        this.dispatchEvent(new CustomEvent('signers-changed', {
            detail: {
                loading: false,
                value: signers
            }
        }));
    }

    async loadSignerProposals() {
        if (this.store.backend === null) {
            this.store.errorMessage = 'You are not authenticated, please refresh.'
            this.store.showErrorDialog = true;

            return;
        }

        const signerProposals = await this.store.backend.getSignerProposals();
        
        this.store.signerProposals = sortCreatedAtDescending(signerProposals);
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
                <ui5-card-header title-text="Signers">
                    <div class="card-header-action-container" slot="action">
                        <ui5-button
                            class="table-main-button"
                            design="Emphasized"
                            @click=${() => this.store.hideCreateSignerProposal = false}
                        >
                            Create Proposal
                        </ui5-button>

                        <ui5-button
                            class="table-main-button"
                            design="Attention"
                            @click=${async () => {
                                this.store.hideSigners = false;
                                this.store.hideOpenSignerProposals = true;
                            
                                this.store.loadingSigners = true;
                                await this.loadSigners();
                                this.store.loadingSigners = false;
                            }}
                        >
                            View Signers
                        </ui5-button>

                        <ui5-button
                            class="table-main-button"
                            ?hidden=${!state.hideOpenSignerProposals}
                            @click=${async () => {
                                this.store.hideSigners = true;
                                this.store.hideOpenSignerProposals = false;

                                this.store.loadingSignerProposals = true;
                                await this.loadSignerProposals();
                                this.store.loadingSignerProposals = false;
                            }}
                        >
                            View Open Proposals
                        </ui5-button>

                        <ui5-button
                            class="table-main-button"
                            ?hidden=${state.hideOpenSignerProposals}
                            @click=${async () => {
                                this.store.hideSigners = true;
                                this.store.hideOpenSignerProposals = true;

                                this.store.loadingSignerProposals = true;
                                await this.loadSignerProposals();
                                this.store.loadingSignerProposals = false;
                            }}
                        >
                            View Closed Proposals
                        </ui5-button>

                        <ui5-busy-indicator
                            size="Small"
                            .active=${state.loadingSigners || state.loadingSignerProposals}
                            delay="0"
                        >
                            <ui5-button
                                @click=${async () => {
                                    this.store.loadingSigners = true;
                                    this.store.loadingSignerProposals = true;

                                    await Promise.all([
                                        this.loadSigners(),
                                        this.loadSignerProposals()
                                    ]);

                                    this.store.loadingSigners = false;
                                    this.store.loadingSignerProposals = false;
                                }}
                            >
                                <ui5-icon name="refresh"></ui5-icon>
                            </ui5-button>
                        </ui5-busy-indicator>
                    </div>
                </ui5-card-header>

                <ui5-table
                    ?hidden=${!state.hideSigners}
                    class="proposals-table"
                    no-data-text="No ${state.hideOpenSignerProposals === true ? 'closed' : 'open'} proposals"
                >
                    ${state.hideOpenSignerProposals === false ? html`
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

                    ${state.signerProposals.filter((signerProposal) => {
                        const open = signerProposal.adopted === false && signerProposal.rejected === false;
                        const hidden = (open && state.hideOpenSignerProposals === true) || (!open && state.hideOpenSignerProposals === false);

                        return hidden === false;
                    }).map((signerProposal) => {
                        const idTrimmed = `${signerProposal.id.slice(0, 5)}...${signerProposal.id.slice(signerProposal.id.length - 5, signerProposal.id.length)}`;
                        const proposerTrimmed = `${signerProposal.proposer.toString().slice(0, 5)}...${signerProposal.proposer.toString().slice(signerProposal.proposer.toString().length - 5, signerProposal.proposer.toString().length)}`;

                        const votesFor = signerProposal.votes.filter((vote) => vote.adopt === true).length;
                        const votesAgainst = signerProposal.votes.filter((vote) => vote.adopt === false).length;

                        const status = signerProposal.adopted === true ?
                            `Adopted ${new Date(Number((signerProposal.adopted_at[0] ?? 0n) / 1000000n)).toLocaleString()}` : signerProposal.rejected === true ?
                                `Rejected ${new Date(Number((signerProposal.rejected_at[0] ?? 0n) / 1000000n)).toLocaleString()}` : 'Open';

                        return html`
                            <ui5-table-row>
                                ${state.hideOpenSignerProposals === false ? html`
                                    <ui5-table-cell>
                                        <ui5-busy-indicator
                                            size="Small"
                                            .active=${state.votingOnProposals[signerProposal.id]?.adopting}
                                            delay="0"
                                        >
                                            <ui5-button
                                                design="Positive"
                                                @click=${() => this.handleVoteOnSignerProposalClick(signerProposal.id, true)}
                                            >
                                                Adopt
                                            </ui5-button>
                                        </ui5-busy-indicator>
                                    </ui5-table-cell>

                                    <ui5-table-cell>
                                        <ui5-busy-indicator
                                            size="Small"
                                            .active=${state.votingOnProposals[signerProposal.id]?.rejecting}
                                            delay="0"
                                        >
                                            <ui5-button
                                                design="Negative"
                                                @click=${() => this.handleVoteOnSignerProposalClick(signerProposal.id, false)}
                                            >
                                                Reject
                                            </ui5-button>
                                        </ui5-busy-indicator>
                                    </ui5-table-cell>
                                ` : ''}

                                <ui5-table-cell>
                                    <ui5-label title="${signerProposal.id}">${idTrimmed}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${new Date(Number(signerProposal.created_at / 1000000n)).toLocaleString()}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label title="${signerProposal.proposer}">${proposerTrimmed}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${signerProposal.description}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${signerProposal.signer}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${signerProposal.remove === true ? 'Remove' : 'Add'}</ui5-label>
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

                <ui5-table
                        ?hidden=${state.hideSigners}
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

            ${state.hideCreateSignerProposal === false ? html`
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
                            @click=${() => this.store.hideCreateSignerProposal = true}
                        >
                            Cancel
                        </ui5-button>
                        
                        <ui5-busy-indicator
                            size="Small"
                            .active=${state.creatingSignerProposal}
                            delay="0"
                        >
                            <ui5-button
                                design="Emphasized"
                                @click=${() => this.handleCreateSignerProposalClick()}
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

window.customElements.define('demerg-signers', DemergSigners);