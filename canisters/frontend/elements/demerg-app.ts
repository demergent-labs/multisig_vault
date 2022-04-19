import {
    html,
    render as litRender
} from 'lit-html';
import { createObjectStore } from 'reduxular';
import {
    nat64,
    nat8
} from 'azle';
import { createActor } from '../dfx_generated/backend';
import {
    ThresholdProposal,
    SignerProposal,
    TransferProposal
} from '../dfx_generated/backend/backend.did';
import { Principal } from '@dfinity/principal';
import { AuthClient } from '@dfinity/auth-client';
import { Identity } from '@dfinity/agent';
import './demerg-proposal';
import { DemergProposal } from './demerg-proposal';
import '@ui5/webcomponents/dist/Card.js';
import '@ui5/webcomponents/dist/CardHeader.js';
import '@ui5/webcomponents/dist/Button.js';
import '@ui5/webcomponents/dist/Table.js';
import '@ui5/webcomponents/dist/TableColumn.js';
import '@ui5/webcomponents/dist/TableRow.js';
import '@ui5/webcomponents/dist/TableCell.js';
import '@ui5/webcomponents/dist/Label.js';
import '@ui5/webcomponents/dist/Dialog.js';
import '@ui5/webcomponents/dist/Input.js';
import '@ui5/webcomponents/dist/BusyIndicator.js';
import '@ui5/webcomponents/dist/Toast.js';
import '@ui5/webcomponents/dist/Badge.js';

type State = {
    canister_principal: {
        loading: boolean;
        value: string;
    };
    canister_address: {
        loading: boolean;
        value: string;
    };
    identity: Identity | null;
    balance: {
        loading: boolean;
        value: nat64;
    };
    threshold: {
        loading: boolean;
        value: nat8;
    };
    thresholdProposals: ThresholdProposal[];
    hideCreateThresholdProposal: boolean;
    signers: {
        loading: boolean;
        value: Principal[];
    };
    signerProposals: SignerProposal[];
    transferProposals: TransferProposal[];
    hideCreateSignerProposal: boolean;
    hideCreateTransferProposal: boolean;
    hideOpenSignerProposals: boolean;
    hideOpenThresholdProposals: boolean;
    hideOpenTransferProposals: boolean;
    creatingThresholdProposal: boolean;
    creatingSignerProposal: boolean;
    votingOnProposals: {
        [proposalId: string]: {
            adopting: boolean;
            rejecting: boolean;
        }
    };
};

const InitialState: State = {
    canister_principal: {
        loading: true,
        value: ''
    },
    canister_address: {
        loading: true,
        value: ''
    },
    identity: null,
    balance: {
        loading: true,
        value: 0n
    },
    threshold: {
        loading: true,
        value: 0
    },
    thresholdProposals: [],
    hideCreateThresholdProposal: true,
    signers: {
        loading: true,
        value: []
    },
    signerProposals: [],
    transferProposals: [],
    hideCreateTransferProposal: true,
    hideCreateSignerProposal: true,
    hideOpenSignerProposals: false,
    hideOpenThresholdProposals: false,
    hideOpenTransferProposals: false,
    creatingThresholdProposal: false,
    creatingSignerProposal: false,
    votingOnProposals: {}
};

class DemergApp extends HTMLElement {
    shadow = this.attachShadow({
        mode: 'closed'
    });
    store = createObjectStore(InitialState, (state: State) => litRender(this.render(state), this.shadow), this);
    
    async connectedCallback() {
        await this.authenticate();
        await this.loadData();
    }

    async authenticate() {
        const authClient = await AuthClient.create();

        if (await authClient.isAuthenticated()) {
            this.store.identity = authClient.getIdentity();
        }
        else {
            await new Promise((resolve, reject) => {
                authClient.login({
                    identityProvider: window.process.env.II_PROVIDER_URL as any,
                    onSuccess: resolve as any,
                    onError: reject
                });
            });

            this.store.identity = authClient.getIdentity();
        }
    }

    // TODO it would still be nice if we could await this
    async loadData() {
        const backend = createActor(
            window.process.env.BACKEND_CANISTER_ID as any,
            {
                agentOptions: {
                    identity: this.store.identity as any
                }
            }
        );

        backend.getVaultBalance().then((balance) => {
            if ('ok' in balance) {
                this.store.balance = {
                    loading: false,
                    value: balance.ok
                };
            }
        });

        backend.getCanisterAddress().then((address) => {
            this.store.canister_address = {
                loading: false,
                value: address
            };
        });

        backend.getCanisterPrincipal().then((principal) => {
            this.store.canister_principal = {
                loading: false,
                value: principal
            };
        });

        backend.getThreshold().then((threshold) => {
            this.store.threshold = {
                loading: false,
                value: threshold
            }
        });

        backend.getThresholdProposals().then((thresholdProposals) => {
            this.store.thresholdProposals = thresholdProposals;
        });

        backend.getSigners().then((signers) => {
            this.store.signers = {
                loading: false,
                value: signers
            };
        });

        backend.getSignerProposals().then((signerProposals) => {
            this.store.signerProposals = signerProposals;
        });

        backend.getTransferProposals().then((transferProposals) => {
            this.store.transferProposals = transferProposals;
        });
    }

    async handleCreateThresholdProposalClick() {
        this.store.creatingThresholdProposal = true;

        try {

            const description = (this.shadow.getElementById('input-threshold-proposal-description') as any).value;
            const threshold = (this.shadow.getElementById('input-threshold-proposal-threshold') as any).value;

            await this.createThresholdProposal(description, parseInt(threshold));

            (this.shadow.getElementById('toast-proposal-created') as any).show();
        }
        catch(error) {
            console.error(error);
            alert('There was an error');
        }
        
        this.store.hideCreateThresholdProposal = true;
        this.store.creatingThresholdProposal = false;
    }

    async createThresholdProposal(description: string, threshold: number) {
        const backend = createActor(
            window.process.env.BACKEND_CANISTER_ID as any,
            {
                agentOptions: {
                    identity: this.store.identity as any
                }
            }
        );

        const result = await backend.proposeThreshold(description, threshold);

        if (result.hasOwnProperty('ok')) {
            await this.loadData();
        }
        else {
            alert((result as any).err);
        }
    }

    async handleVoteOnThresholdProposalClick(thresholdProposalId: string, adopt: boolean) {
        this.store.votingOnProposals = {
            [thresholdProposalId]: {
                adopting: adopt === true,
                rejecting: adopt === false
            }
        };

        try {
            // TODO we need to return the error and display it...maybe a toast would be good for that?
            await this.voteOnThresholdProposal(thresholdProposalId, adopt);

            (this.shadow.getElementById('toast-vote-recorded') as any).show();
        }
        catch(error) {
            console.error(error);
            alert('There was an error');
        }

        // TODO this is technically a memory leak, but probably won't be an issue
        this.store.votingOnProposals = {
            [thresholdProposalId]: {
                adopting: false,
                rejecting: false
            }
        };
    }

    async voteOnThresholdProposal(thresholdProposalId: string, adopt: boolean) {
        // TODO store the authenticated actor in the state
        const backend = createActor(
            window.process.env.BACKEND_CANISTER_ID as any,
            {
                agentOptions: {
                    identity: this.store.identity as any
                }
            }
        );

        const result = await backend.voteOnThresholdProposal(thresholdProposalId, adopt);

        if (result.hasOwnProperty('ok')) {
            await this.loadData();
        }
        else {
            console.error((result as any).err);
            alert((result as any).err);
        }
    }

    async handleCreateSignerProposalClick() {
        this.store.creatingSignerProposal = true;

        try {

            const description = (this.shadow.getElementById('input-signer-proposal-description') as any).value;
            const signer = (this.shadow.getElementById('input-signer-proposal-signer') as any).value;

            await this.createSignerProposal(description, signer);

            (this.shadow.getElementById('toast-proposal-created') as any).show();
        }
        catch(error) {
            console.error(error);
            alert('There was an error');
        }
        
        this.store.hideCreateSignerProposal = true;
        this.store.creatingSignerProposal = false;
    }

    async createSignerProposal(description: string, signer: string) {
        const backend = createActor(
            window.process.env.BACKEND_CANISTER_ID as any,
            {
                agentOptions: {
                    identity: this.store.identity as any
                }
            }
        );

        const result = await backend.proposeSigner(description, Principal.fromText(signer));

        if (result.hasOwnProperty('ok')) {
            await this.loadData();
        }
        else {
            alert((result as any).err);
        }
    }

    async handleVoteOnSignerProposalClick(signerProposalId: string, adopt: boolean) {
        this.store.votingOnProposals = {
            [signerProposalId]: {
                adopting: adopt === true,
                rejecting: adopt === false
            }
        };

        try {
            // TODO we need to return the error and display it...maybe a toast would be good for that?
            await this.voteOnSignerProposal(signerProposalId, adopt);

            (this.shadow.getElementById('toast-vote-recorded') as any).show();
        }
        catch(error) {
            console.error(error);
            alert('There was an error');
        }

        // TODO this is technically a memory leak, but probably won't be an issue
        this.store.votingOnProposals = {
            [signerProposalId]: {
                adopting: false,
                rejecting: false
            }
        };
    }

    async voteOnSignerProposal(signerProposalId: string, adopt: boolean) {
        // TODO store the authenticated actor in the state
        const backend = createActor(
            window.process.env.BACKEND_CANISTER_ID as any,
            {
                agentOptions: {
                    identity: this.store.identity as any
                }
            }
        );

        const result = await backend.voteOnSignerProposal(signerProposalId, adopt);

        if (result.hasOwnProperty('ok')) {
            await this.loadData();
        }
        else {
            console.error((result as any).err);
            alert((result as any).err);
        }
    }

    render(state: State) {
        const thresholdSubtitleText = state.threshold.loading === true || state.signers.loading === true ? 'Loading...' : `${state.threshold.value} of ${state.signers.value.length} signers required`;

        return html`
            <style>
                /* TODO I would prefer to use classes provided by the ui5 web components, but I need more info: https://github.com/SAP/ui5-webcomponents/issues/5094 */
                .dialog-footer {
                    padding: .5rem;
                }
            </style>

            <ui5-card>
                <ui5-card-header title-text="Threshold" subtitle-text="${thresholdSubtitleText}">
                    <div slot="action">
                        <ui5-button
                            design="Emphasized"
                            @click=${() => this.store.hideCreateThresholdProposal = false}
                        >
                            Create Proposal
                        </ui5-button>
                        <ui5-button
                            ?hidden=${!state.hideOpenThresholdProposals}
                            @click=${() => this.store.hideOpenThresholdProposals = false}
                        >
                            View Open Proposals
                        </ui5-button>
                        <ui5-button
                            ?hidden=${state.hideOpenThresholdProposals}
                            @click=${() => this.store.hideOpenThresholdProposals = true}
                        >
                            View Closed Proposals
                        </ui5-button>
                    </div>
                </ui5-card-header>

                <ui5-table no-data-text="No ${state.hideOpenThresholdProposals === true ? 'closed' : 'open'} proposals">
                    <ui5-table-column slot="columns">
                        <ui5-label>ID</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column slot="columns">
                        <ui5-label>Created At</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column slot="columns">
                        <ui5-label>Proposer</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column slot="columns">
                        <ui5-label>Description</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column slot="columns">
                        <ui5-label>New Threshold</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column slot="columns">
                        <ui5-label>Votes For</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column slot="columns">
                        <ui5-label>Votes Against</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column slot="columns">
                        <ui5-label>Status</ui5-label>
                    </ui5-table-column>

                    ${state.hideOpenThresholdProposals === false ? html`
                        <ui5-table-column slot="columns"></ui5-table-column>
                        <ui5-table-column slot="columns"></ui5-table-column>
                    ` : ''}

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
                            `Adopted ${new Date(Number(thresholdProposal.adopted_at[0] ?? 0n / 1000000n)).toLocaleString()}` : thresholdProposal.rejected === true ?
                                `Rejected ${new Date(Number(thresholdProposal.rejected_at[0] ?? 0n / 1000000n)).toLocaleString()}` : 'Open';

                        return html`
                            <ui5-table-row>
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

                                ${state.hideOpenThresholdProposals === false ? html`
                                    <ui5-table-cell>
                                        <ui5-busy-indicator
                                            size="Small"
                                            .active=${state.votingOnProposals[thresholdProposal.id]?.adopting}
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
                            </ui5-table-row>
                        `;
                    })}
                </ui5-table>
            </ui5-card>

            ${state.hideCreateThresholdProposal === false ? html`
                <ui5-dialog
                    header-text="Transfer Proposal"
                    .open=${true}
                >
                    <section class="login-form">
                        <div>
                            <ui5-label for="input-threshold-proposal-description" required>Description:</ui5-label>
                            <ui5-input id="input-threshold-proposal-description"></ui5-input>
                        </div>

                        <div>
                            <ui5-label for="input-threshold-proposal-threshold" required>Threshold:</ui5-label>
                            <ui5-input id="input-threshold-proposal-threshold" type="Number"></ui5-input>
                        </div>
                    </section>

                    <div slot="footer" class="dialog-footer">
                        <div style="flex: 1"></div>
                        <ui5-busy-indicator
                            size="Small"
                            .active=${state.creatingThresholdProposal}
                        >
                            <ui5-button
                                design="Emphasized"
                                @click=${() => this.handleCreateThresholdProposalClick()}
                            >
                                Create
                            </ui5-button>

                            <ui5-button @click=${() => this.store.hideCreateThresholdProposal = true}>Cancel</ui5-button>
                        </ui5-busy-indicator>
                    </div>
                </ui5-dialog>
            ` : ''}

            <ui5-card>
                <ui5-card-header title-text="Signers">
                    <div slot="action">
                        <ui5-button
                            design="Emphasized"
                            @click=${() => this.store.hideCreateSignerProposal = false}
                        >
                            Create Proposal
                        </ui5-button>
                        <ui5-button
                            ?hidden=${!state.hideOpenSignerProposals}
                            @click=${() => this.store.hideOpenSignerProposals = false}
                        >
                            View Open Proposals
                        </ui5-button>
                        <ui5-button
                            ?hidden=${state.hideOpenSignerProposals}
                            @click=${() => this.store.hideOpenSignerProposals = true}
                        >
                            View Closed Proposals
                        </ui5-button>
                    </div>
                </ui5-card-header>

                <div style="padding-bottom: .5rem; padding-left: .5rem">
                    ${state.signers.value.map((signer, index) => {
                        return html`
                            <div style="padding-bottom: .5rem">
                                <ui5-badge style="padding: .5rem; font-size: 1.25rem" color-scheme="${(index % 10) + 1}">${signer.toString()}</ui5-badge>
                            </div>
                        `;
                    })}
                </div>

                <ui5-table no-data-text="No ${state.hideOpenSignerProposals === true ? 'closed' : 'open'} proposals">
                    <ui5-table-column slot="columns">
                        <ui5-label>ID</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column slot="columns">
                        <ui5-label>Created At</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column slot="columns">
                        <ui5-label>Proposer</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column slot="columns">
                        <ui5-label>Description</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column slot="columns">
                        <ui5-label>Signer</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column slot="columns">
                        <ui5-label>Votes For</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column slot="columns">
                        <ui5-label>Votes Against</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column slot="columns">
                        <ui5-label>Status</ui5-label>
                    </ui5-table-column>

                    ${state.hideOpenSignerProposals === false ? html`
                        <ui5-table-column slot="columns"></ui5-table-column>
                        <ui5-table-column slot="columns"></ui5-table-column>
                    ` : ''}

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
                            `Adopted ${new Date(Number(signerProposal.adopted_at[0] ?? 0n / 1000000n)).toLocaleString()}` : signerProposal.rejected === true ?
                                `Rejected ${new Date(Number(signerProposal.rejected_at[0] ?? 0n / 1000000n)).toLocaleString()}` : 'Open';

                        return html`
                            <ui5-table-row>
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
                                    <ui5-label>${votesFor}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${votesAgainst}</ui5-label>
                                </ui5-table-cell>

                                <ui5-table-cell>
                                    <ui5-label>${status}</ui5-label>
                                </ui5-table-cell>

                                ${state.hideOpenSignerProposals === false ? html`
                                    <ui5-table-cell>
                                        <ui5-busy-indicator
                                            size="Small"
                                            .active=${state.votingOnProposals[signerProposal.id]?.adopting}
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
                    <section class="login-form">
                        <div>
                            <ui5-label for="input-signer-proposal-description" required>Description:</ui5-label>
                            <ui5-input id="input-signer-proposal-description"></ui5-input>
                        </div>

                        <div>
                            <ui5-label for="input-signer-proposal-signer" required>Signer:</ui5-label>
                            <ui5-input id="input-signer-proposal-signer"></ui5-input>
                        </div>
                    </section>

                    <div slot="footer" class="dialog-footer">
                        <div style="flex: 1"></div>
                        <ui5-busy-indicator
                            size="Small"
                            .active=${state.creatingSignerProposal}
                        >
                            <ui5-button
                                design="Emphasized"
                                @click=${() => this.handleCreateSignerProposalClick()}
                            >
                                Create
                            </ui5-button>

                            <ui5-button @click=${() => this.store.hideCreateSignerProposal = true}>Cancel</ui5-button>
                        </ui5-busy-indicator>
                    </div>
                </ui5-dialog>
            ` : ''}

            <ui5-toast id="toast-proposal-created" placement="TopCenter">Proposal Created</ui5-toast>
            <ui5-toast id="toast-vote-recorded" placement="TopCenter">Vote Recorded</ui5-toast>

            <div>My principal: ${state.identity === null ? 'Loading...' : state.identity.getPrincipal().toString()}</div>
            
            <br>

            <div>Canister balance: ${state.balance.loading === true ? 'Loading...' : `${Number(state.balance.value * 10000n / BigInt(10**8)) / 10000} ICP`}</div>
            
            <br>

            <div>Canister principal: ${state.canister_principal.loading === true ? 'Loading...' : state.canister_principal.value}</div>
            
            <br>

            <div>Canister address: ${state.canister_address.loading === true ? 'Loading...' : state.canister_address.value}</div>

            <div>Transfer Proposals</div>

            <br>

            <div>
                <button @click=${() => this.store.hideOpenTransferProposals = false}>
                    Open Proposals
                </button>
                <button @click=${() => this.store.hideOpenTransferProposals = true}>
                    Closed Proposals
                </button>
            </div>

            <br>

            <div>
                <button @click=${() => this.store.hideCreateTransferProposal = !this.store.hideCreateTransferProposal}>
                    Create Transfer Proposal
                </button>
            </div>

            <br>

            <div>
                <demerg-proposal
                    ?hidden=${state.hideCreateTransferProposal}
                    .mode=${'CREATE'}
                    .proposalType=${'Transfer'}
                    .proposalValueInputId=${'transfer-input'}
                    .proposalValueInputTemplate=${html`
                        <div>
                            <div>
                                Address: <input id="transfer-address-input" type="text">
                            </div>

                            <div>
                                Amount: <input id="transfer-amount-input" type="number">
                            </div>
                        </div>
                    `}
                    .proposalValueInputRetriever=${(element: DemergProposal) => {
                        const transferAddressInputValue = (element.shadow.getElementById('transfer-address-input') as HTMLInputElement | null)?.value;
                        const transferAmountInputValue = (element.shadow.getElementById('transfer-amount-input') as HTMLInputElement | null)?.value;

                        const decimals = transferAmountInputValue?.split('.')[1]?.length ?? 0;

                        // TODO test this conversion big time...maybe we just send the string over and do the conversion on the backend?
                        return {
                            address: transferAddressInputValue,
                            amount: BigInt(Number(transferAmountInputValue ?? 0) * 10**decimals) * BigInt(10**(8 - decimals))
                        };
                    }}
                    .canisterMethodCreate=${async (description: string, value: { address: string; amount: nat64 }) => {
                        const backend = createActor(
                            window.process.env.BACKEND_CANISTER_ID as any,
                            {
                                agentOptions: {
                                    identity: this.store.identity as any
                                }
                            }
                        );
    
                        // TODO we might need a way to allow the developer to pass in a function that extracts the value from the input
                        const result = await backend.proposeTransfer(description, value.address, value.amount);
    
                        if (result.hasOwnProperty('ok')) {
                            this.store.hideCreateTransferProposal = true;
                            this.loadData();
                        }
                        else {
                            alert((result as any).err);
                        }
                    }}
                ></demerg-proposal>
            </div>

            <br>

            <div>
                ${state.transferProposals.map((transferProposal) => {
                    const open = transferProposal.adopted === false && transferProposal.rejected === false;
                    const hidden = (open && state.hideOpenTransferProposals === true) || (!open && state.hideOpenTransferProposals === false);
                    
                    return html`
                        <div
                            ?hidden=${hidden}
                            class="proposal-container"
                        >
                            <demerg-proposal
                                .mode=${'READ'}
                                .proposalType=${'Transfer'}
                                .created_at=${transferProposal.created_at}
                                .adopted_at=${transferProposal.adopted_at.length === 0 ? 0n : transferProposal.adopted_at[0]}
                                .rejected_at=${transferProposal.rejected_at.length === 0 ? 0n : transferProposal.rejected_at[0]}
                                .proposer=${transferProposal.proposer}
                                .description=${transferProposal.description}
                                .votes=${transferProposal.votes}
                                .adopted=${transferProposal.adopted}
                                .rejected=${transferProposal.rejected}
                                .proposalId=${transferProposal.id}
                                .proposalValueTemplate=${html`
                                    <div>
                                        <div>Destination Address: ${transferProposal.destinationAddress}</div>
                                        <div>Amount: ${Number(transferProposal.amount * 10000n / BigInt(10**8)) / 10000} ICP</div>
                                    </div>
                                `}
                                .canisterMethodAdopt=${async () => {
                                    const backend = createActor(
                                        window.process.env.BACKEND_CANISTER_ID as any,
                                        {
                                            agentOptions: {
                                                identity: this.store.identity as any
                                            }
                                        }
                                    );

                                    const result = await backend.voteOnTransferProposal(transferProposal.id, true);

                                    console.log('canisterMethodAdopt result', result);

                                    if (result.hasOwnProperty('ok')) {
                                        this.loadData();
                                    }
                                    else {
                                        alert((result as any).err);
                                    }
                                }}
                                .canisterMethodReject=${async () => {
                                    const backend = createActor(
                                        window.process.env.BACKEND_CANISTER_ID as any,
                                        {
                                            agentOptions: {
                                                identity: this.store.identity as any
                                            }
                                        }
                                    );

                                    const result = await backend.voteOnTransferProposal(transferProposal.id, false);

                                    console.log('canisterMethodReject result', result);

                                    if (result.hasOwnProperty('ok')) {
                                        this.loadData();
                                    }
                                    else {
                                        alert((result as any).err);
                                    }
                                }}
                            ></demerg-proposal>
                        </div>

                        <br>
                    `;
                })}
            </div>
        `;
    }
}

window.customElements.define('demerg-app', DemergApp);