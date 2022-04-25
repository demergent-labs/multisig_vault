// TODO once everything is componentized, figure out how general we want to make everything

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
import { ActorSubclass } from '@dfinity/agent';
import {
    ControllersInfo,
    SignerProposal,
    _SERVICE,
    CycleStatsInfo
} from '../dfx_generated/backend/backend.did';
import { Principal } from '@dfinity/principal';
import { AuthClient } from '@dfinity/auth-client';
import { Identity } from '@dfinity/agent';

import './demerg-threshold';
import './demerg-transfers';

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
import '@ui5/webcomponents/dist/Link.js';
import '@ui5/webcomponents/dist/ToggleButton.js';
import '@ui5/webcomponents/dist/Icon.js';

import '@ui5/webcomponents-icons/dist/refresh.js';
import '@ui5/webcomponents-fiori/dist/Bar.js';

// TODO import the respective components into the component that directly depend on them
import '@spectrum-web-components/theme/sp-theme.js';
import '@spectrum-web-components/theme/src/themes.js';
import '@spectrum-web-components/number-field/sp-number-field.js';
import '@spectrum-web-components/slider/sp-slider.js';
import '@spectrum-web-components/radio/sp-radio.js';
import '@spectrum-web-components/radio/sp-radio-group.js';

// TODO split up into components
// TODO fully generalize proposal components

export type State = {
    backend: ActorSubclass<_SERVICE> | null;
    cycles_stats_info: CycleStatsInfo | null;
    controllers_info: ControllersInfo | null;
    canister_principal: {
        loading: boolean;
        value: string;
    };
    canister_address: {
        loading: boolean;
        value: string;
    };
    identity: Identity | null;
    signers: {
        loading: boolean;
        value: Principal[];
    };
    signerProposals: SignerProposal[];
    hideCreateSignerProposal: boolean;
    hideCreateTransferProposal: boolean;
    hideSigners: boolean;
    hideOpenSignerProposals: boolean;
    creatingSignerProposal: boolean;
    creatingTransferProposal: boolean;
    votingOnProposals: {
        [proposalId: string]: {
            adopting: boolean;
            rejecting: boolean;
        }
    };
    errorMessage: string;
    showErrorDialog: boolean;
    loadingSignerProposals: boolean;
    loadingSigners: boolean;
    loadingCycles: boolean;
};

export const InitialState: State = {
    backend: null,
    cycles_stats_info: null,
    controllers_info: null,
    canister_principal: {
        loading: true,
        value: ''
    },
    canister_address: {
        loading: true,
        value: ''
    },
    identity: null,
    signers: {
        loading: true,
        value: []
    },
    signerProposals: [],
    hideCreateTransferProposal: true,
    hideCreateSignerProposal: true,
    hideSigners: false,
    hideOpenSignerProposals: true,
    creatingSignerProposal: false,
    creatingTransferProposal: false,
    votingOnProposals: {},
    errorMessage: '',
    showErrorDialog: false,
    loadingSignerProposals: false,
    loadingSigners: false,
    loadingCycles: false
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

        const backend = createActor(
            window.process.env.BACKEND_CANISTER_ID as any,
            {
                agentOptions: {
                    identity: this.store.identity as any
                }
            }
        );

        this.store.backend = backend;
    }

    async loadData() {
        if (this.store.backend === null) {
            this.store.errorMessage = 'You are not authenticated, please refresh.'
            this.store.showErrorDialog = true;

            return;
        }

        await Promise.all([
            this.store.backend.getCanisterAddress().then((address) => {
                this.store.canister_address = {
                    loading: false,
                    value: address
                };
            }),
            this.store.backend.getCanisterPrincipal().then((principal) => {
                this.store.canister_principal = {
                    loading: false,
                    value: principal
                };
            }),
            this.store.backend.get_controllers_info().then((controllers_info_result) => {
                if ('ok' in controllers_info_result) {
                    this.store.controllers_info = controllers_info_result.ok;
                }
                else {
                    this.handleError((controllers_info_result as any).err);
                }
            }),
            this.loadSigners(),
            this.loadSignerProposals(),
            this.loadCycleStats()
        ]);
    }

    async loadCycleStats() {
        if (this.store.backend === null) {
            this.store.errorMessage = 'You are not authenticated, please refresh.'
            this.store.showErrorDialog = true;

            return;
        }
        
        await this.snapshotCycles();
        const cycleStatsInfo = await this.store.backend.get_cycle_stats_info();

        this.store.cycles_stats_info = cycleStatsInfo;

        console.log('this.store.cycles_stats_info', this.store.cycles_stats_info);
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

    async loadSigners() {
        if (this.store.backend === null) {
            this.store.errorMessage = 'You are not authenticated, please refresh.'
            this.store.showErrorDialog = true;

            return;
        }

        const signers = await this.store.backend.getSigners();

        this.store.signers = {
            loading: false,
            value: signers
        };
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
                this.loadData();
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
                this.loadData();
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

    async snapshotCycles() {
        if (this.store.backend === null) {
            this.store.errorMessage = 'You are not authenticated, please refresh.'
            this.store.showErrorDialog = true;

            return;
        }

        const result = await this.store.backend.snapshot_cycles();

        if (result.hasOwnProperty('err')) {
            this.handleError((result as any).err);
        }
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
        const canisterAddressText = state.canister_address.loading === true ? 'Loading...' : state.canister_address.value;

        const frontend_cycles_remaining = state.cycles_stats_info === null ? 'Loading...' : separate_cycles(state.cycles_stats_info.frontend.cycles_remaining);
        const frontend_cycle_time_remaining = state.cycles_stats_info === null ? 'Loading...' : nanoseconds_to_time_remaining_string(state.cycles_stats_info.frontend.cycle_time_remaining);
        const frontend_cycles_per_year = state.cycles_stats_info === null ? 'Loading...' : separate_cycles(state.cycles_stats_info.frontend.cycles_per_year);
        const frontend_cycles_per_month = state.cycles_stats_info === null ? 'Loading...' : separate_cycles(state.cycles_stats_info.frontend.cycles_per_month);
        const frontend_cycles_per_week = state.cycles_stats_info === null ? 'Loading...' : separate_cycles(state.cycles_stats_info.frontend.cycles_per_week);
        const frontend_cycles_per_day = state.cycles_stats_info === null ? 'Loading...' : separate_cycles(state.cycles_stats_info.frontend.cycles_per_day);
        const frontend_cycles_per_hour = state.cycles_stats_info === null ? 'Loading...' : separate_cycles(state.cycles_stats_info.frontend.cycles_per_hour);
        const frontend_cycles_per_min = state.cycles_stats_info === null ? 'Loading...' : separate_cycles(state.cycles_stats_info.frontend.cycles_per_min);
        const frontend_cycles_per_sec = state.cycles_stats_info === null ? 'Loading...' : separate_cycles(state.cycles_stats_info.frontend.cycles_per_sec);

        const backend_cycles_remaining = state.cycles_stats_info === null ? 'Loading...' : separate_cycles(state.cycles_stats_info.backend.cycles_remaining);
        const backend_cycle_time_remaining = state.cycles_stats_info === null ? 'Loading...' : nanoseconds_to_time_remaining_string(state.cycles_stats_info.backend.cycle_time_remaining);
        const backend_cycles_per_year = state.cycles_stats_info === null ? 'Loading...' : separate_cycles(state.cycles_stats_info.backend.cycles_per_year);
        const backend_cycles_per_month = state.cycles_stats_info === null ? 'Loading...' : separate_cycles(state.cycles_stats_info.backend.cycles_per_month);
        const backend_cycles_per_week = state.cycles_stats_info === null ? 'Loading...' : separate_cycles(state.cycles_stats_info.backend.cycles_per_week);
        const backend_cycles_per_day = state.cycles_stats_info === null ? 'Loading...' : separate_cycles(state.cycles_stats_info.backend.cycles_per_day);
        const backend_cycles_per_hour = state.cycles_stats_info === null ? 'Loading...' : separate_cycles(state.cycles_stats_info.backend.cycles_per_hour);
        const backend_cycles_per_min = state.cycles_stats_info === null ? 'Loading...' : separate_cycles(state.cycles_stats_info.backend.cycles_per_min);
        const backend_cycles_per_sec = state.cycles_stats_info === null ? 'Loading...' : separate_cycles(state.cycles_stats_info.backend.cycles_per_sec);

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

            <ui5-bar design="Header">
                <ui5-link
                    slot="startContent"
                    href="/"
                    design="Emphasized"
                >
                    Multisig Vault
                </ui5-link>
                <ui5-label>My Principal: ${state.identity === null ? 'Loading...' : state.identity.getPrincipal().toString()}</ui5-label>
                <ui5-link
                    slot="endContent"
                    href="https://github.com/demergent-labs/multisig_vault"
                    target="_blank"
                >
                    Open Source
                </ui5-link>
            </ui5-bar>

            <div class="main-container">
                <div class="proposals-container">
                    <demerg-transfers
                        .backend=${state.backend}
                    ></demerg-transfers>
                </div>

                <div class="proposals-container">
                    <demerg-threshold
                        .backend=${state.backend}
                        .signers=${state.signers}
                    ></demerg-threshold>
                </div>
    
                <ui5-card class="proposals-container">
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
                            <ui5-busy-indicator
                                size="Small"
                                .active=${state.creatingSignerProposal}
                                delay="0"
                            >
                                <ui5-button
                                    class="dialog-footer-main-button"
                                    design="Emphasized"
                                    @click=${() => this.handleCreateSignerProposalClick()}
                                >
                                    Create
                                </ui5-button>
                            </ui5-busy-indicator>

                            <ui5-button @click=${() => this.store.hideCreateSignerProposal = true}>Cancel</ui5-button>
                        </div>
                    </ui5-dialog>
                ` : ''}

                <ui5-card class="proposals-container">
                    <ui5-card-header title-text="Stats and Info">
                        <div class="card-header-action-container" slot="action">
                            <ui5-busy-indicator
                                size="Small"
                                .active=${state.loadingCycles}
                                delay="0"
                            >
                                <ui5-button
                                    design="Emphasized"
                                    class="table-main-button"
                                    @click=${async () => {
                                        this.store.loadingCycles =  true;
                                        await this.loadCycleStats();
                                        this.store.loadingCycles = false;
                                    }}
                                >
                                    Recalculate
                                </ui5-button>
                            </ui5-busy-indicator>
                        </div>
                    </ui5-card-header>

                    <ui5-table class="proposals-table">
                        <ui5-table-column slot="columns" demand-popin>
                            <ui5-label>Canister Name</ui5-label>
                        </ui5-table-column>

                        <ui5-table-column slot="columns" demand-popin>
                            <ui5-label>Principal</ui5-label>
                        </ui5-table-column>

                        <ui5-table-column slot="columns" demand-popin>
                            <ui5-label>Cycles Remaining</ui5-label>
                        </ui5-table-column>

                        <ui5-table-column slot="columns" demand-popin>
                            <ui5-label>Cycle Time Remaining</ui5-label>
                        </ui5-table-column>

                        <ui5-table-column slot="columns" demand-popin>
                            <ui5-label>Cycles/year</ui5-label>
                        </ui5-table-column>

                        <ui5-table-column slot="columns" demand-popin>
                            <ui5-label>Cycles/month</ui5-label>
                        </ui5-table-column>

                        <ui5-table-column slot="columns" demand-popin>
                            <ui5-label>Cycles/week</ui5-label>
                        </ui5-table-column>

                        <ui5-table-column slot="columns" demand-popin>
                            <ui5-label>Cycles/day</ui5-label>
                        </ui5-table-column>

                        <ui5-table-column slot="columns" demand-popin>
                            <ui5-label>Cycles/hour</ui5-label>
                        </ui5-table-column>

                        <ui5-table-column slot="columns" demand-popin>
                            <ui5-label>Cycles/min</ui5-label>
                        </ui5-table-column>

                        <ui5-table-column slot="columns" demand-popin>
                            <ui5-label>Cycles/sec</ui5-label>
                        </ui5-table-column>

                        <ui5-table-column slot="columns" demand-popin>
                            <ui5-label>ICP Address</ui5-label>
                        </ui5-table-column>

                        <ui5-table-column slot="columns" demand-popin>
                            <ui5-label>Controllers</ui5-label>
                        </ui5-table-column>

                        <ui5-table-row>
                            <ui5-table-cell>
                                <ui5-label>frontend</ui5-label>
                            </ui5-table-cell>

                            <ui5-table-cell>
                                <ui5-label>${window.process.env.FRONTEND_CANISTER_ID}</ui5-label>
                            </ui5-table-cell>

                            <ui5-table-cell>
                                <ui5-label>${frontend_cycles_remaining}</ui5-label>
                            </ui5-table-cell>
    
                            <ui5-table-cell>
                                <ui5-label>${frontend_cycle_time_remaining}</ui5-label>
                            </ui5-table-cell>
    
                            <ui5-table-cell>
                                <ui5-label>${frontend_cycles_per_year}</ui5-label>
                            </ui5-table-cell>
    
                            <ui5-table-cell>
                                <ui5-label>${frontend_cycles_per_month}</ui5-label>
                            </ui5-table-cell>
    
                            <ui5-table-cell>
                                <ui5-label>${frontend_cycles_per_week}</ui5-label>
                            </ui5-table-cell>
    
                            <ui5-table-cell>
                                <ui5-label>${frontend_cycles_per_day}</ui5-label>
                            </ui5-table-cell>
    
                            <ui5-table-cell>
                                <ui5-label>${frontend_cycles_per_hour}</ui5-label>
                            </ui5-table-cell>
    
                            <ui5-table-cell>
                                <ui5-label>${frontend_cycles_per_min}</ui5-label>
                            </ui5-table-cell>
    
                            <ui5-table-cell>
                                <ui5-label>${frontend_cycles_per_sec}</ui5-label>
                            </ui5-table-cell>

                            <ui5-table-cell>
                                <ui5-label>N/A</ui5-label>
                            </ui5-table-cell>

                            <ui5-table-cell>
                                <ui5-label>${state.controllers_info === null ? 'Loading...' : state.controllers_info.frontend.length === 0 ? 'None' : state.controllers_info.frontend.join(' / ')}</ui5-label>
                            </ui5-table-cell>
                        </ui5-table-row>

                        <ui5-table-row>
                            <ui5-table-cell>
                                <ui5-label>backend</ui5-label>
                            </ui5-table-cell>

                            <ui5-table-cell>
                                <ui5-label>${window.process.env.BACKEND_CANISTER_ID}</ui5-label>
                            </ui5-table-cell>

                            <ui5-table-cell>
                                <ui5-label>${backend_cycles_remaining}</ui5-label>
                            </ui5-table-cell>
    
                            <ui5-table-cell>
                                <ui5-label>${backend_cycle_time_remaining}</ui5-label>
                            </ui5-table-cell>
    
                            <ui5-table-cell>
                                <ui5-label>${backend_cycles_per_year}</ui5-label>
                            </ui5-table-cell>
    
                            <ui5-table-cell>
                                <ui5-label>${backend_cycles_per_month}</ui5-label>
                            </ui5-table-cell>
    
                            <ui5-table-cell>
                                <ui5-label>${backend_cycles_per_week}</ui5-label>
                            </ui5-table-cell>
    
                            <ui5-table-cell>
                                <ui5-label>${backend_cycles_per_day}</ui5-label>
                            </ui5-table-cell>
    
                            <ui5-table-cell>
                                <ui5-label>${backend_cycles_per_hour}</ui5-label>
                            </ui5-table-cell>
    
                            <ui5-table-cell>
                                <ui5-label>${backend_cycles_per_min}</ui5-label>
                            </ui5-table-cell>
    
                            <ui5-table-cell>
                                <ui5-label>${backend_cycles_per_sec}</ui5-label>
                            </ui5-table-cell>

                            <ui5-table-cell>
                                <ui5-label>${canisterAddressText}</ui5-label>
                            </ui5-table-cell>

                            <ui5-table-cell>
                                <ui5-label>${state.controllers_info === null ? 'Loading...' : state.controllers_info.backend.length === 0 ? 'None' : state.controllers_info.backend.join(' / ')}</ui5-label>
                            </ui5-table-cell>
                        </ui5-table-row>
                    </ui5-table>
                </ui5-card>
            </div>

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

window.customElements.define('demerg-app', DemergApp);

export function sortCreatedAtDescending<T extends { created_at: nat64 }>(proposals: T[]): T[] {
    return [...proposals].sort((a, b) => {
        if (a.created_at > b.created_at) {
            return -1;
        }

        if (a.created_at < b.created_at) {
            return 1;
        }

        return 0;
    });
}

function separate_cycles(cycles: string | number | bigint) {
    return cycles
        .toString()
        .split('')
        .reverse()
        .reduce((result, char, index) => {
            return `${result}${index !== 0 && index % 3 === 0 ? '_' : ''}${char}`;
        }, '')
        .split('')
        .reverse()
        .join('');
}

// TODO let's double-check this math
function nanoseconds_to_time_remaining_string(nanoseconds: nat64): string {
    const NANOS_PER_SECOND = 1_000_000_000n;
    const NANOS_PER_MINUTE = 60n * NANOS_PER_SECOND;
    const NANOS_PER_HOUR = 60n * NANOS_PER_MINUTE;
    const NANOS_PER_DAY = 24n * NANOS_PER_HOUR;
    const NANOS_PER_WEEK = 7n * NANOS_PER_DAY;
    const NANOS_PER_MONTH = 4n * NANOS_PER_WEEK;
    const NANOS_PER_YEAR = 12n * NANOS_PER_MONTH;

    const total_years = nanoseconds / NANOS_PER_YEAR;
    const total_months = nanoseconds / NANOS_PER_MONTH;
    const total_weeks = nanoseconds / NANOS_PER_WEEK;
    const total_days = nanoseconds / NANOS_PER_DAY;
    const total_hours = nanoseconds / NANOS_PER_HOUR;
    const total_minutes = nanoseconds / NANOS_PER_MINUTE;
    const total_seconds = nanoseconds / NANOS_PER_SECOND;

    const remaining_years = total_years;
    const remaining_months = total_years === 0n ? total_months : (nanoseconds % NANOS_PER_YEAR) / NANOS_PER_MONTH;
    const remaining_weeks = total_months === 0n ? total_weeks : (nanoseconds % NANOS_PER_MONTH) / NANOS_PER_WEEK;
    const remaining_days = total_weeks === 0n ? total_days : (nanoseconds % NANOS_PER_WEEK) / NANOS_PER_DAY;
    const remaining_hours = total_days === 0n ? total_hours : (nanoseconds % NANOS_PER_DAY) / NANOS_PER_HOUR;
    const remaining_minutes = total_hours === 0n ? total_minutes : (nanoseconds % NANOS_PER_HOUR) / NANOS_PER_MINUTE;
    const remaining_seconds = total_minutes === 0n ? total_seconds : (nanoseconds % NANOS_PER_MINUTE) / NANOS_PER_SECOND;

    const years_string = remaining_years === 0n ? [] : [`${remaining_years} ${remaining_years === 1n ? 'year' : 'years'}`];
    const months_string = remaining_months === 0n ? [] : [`${remaining_months} ${remaining_months === 1n ? 'month' : 'months'}`];
    const weeks_string = remaining_weeks === 0n ? [] : [`${remaining_weeks} ${remaining_weeks === 1n ? 'week' : 'weeks'}`];
    const days_string = remaining_days === 0n ? [] : [`${remaining_days} ${remaining_days === 1n ? 'day' : 'days'}`];
    const hours_string = remaining_hours === 0n ? [] : [`${remaining_hours} ${remaining_hours === 1n ? 'hour' : 'hours'}`];
    const minutes_string = remaining_minutes === 0n ? [] : [`${remaining_minutes} ${remaining_minutes === 1n ? 'minute' : 'minutes'}`];
    const seconds_string = remaining_seconds === 0n ? [] : [`${remaining_seconds} ${remaining_seconds === 1n ? 'second' : 'seconds'}`];

    return [
        ...years_string,
        ...months_string,
        ...weeks_string,
        ...days_string,
        ...hours_string,
        ...minutes_string,
        ...seconds_string
    ].join(', ');
}