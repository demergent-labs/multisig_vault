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
    ThresholdProposal,
    SignerProposal,
    TransferProposal,
    _SERVICE,
    CycleStatsInfo
} from '../dfx_generated/backend/backend.did';
import { Principal } from '@dfinity/principal';
import { AuthClient } from '@dfinity/auth-client';
import { Identity } from '@dfinity/agent';
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
import '@ui5/webcomponents-fiori/dist/Bar.js';

import '@spectrum-web-components/theme/sp-theme.js';
import '@spectrum-web-components/theme/src/themes.js';
import '@spectrum-web-components/number-field/sp-number-field.js';
import '@spectrum-web-components/slider/sp-slider.js';

// TODO use ui5-step-input instead of number input, set min and max, set initial value to the current threshold

// TODO split up into components
// TODO fully generalize proposal components

type State = {
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
    hideSigners: boolean;
    hideOpenSignerProposals: boolean;
    hideOpenThresholdProposals: boolean;
    hideOpenTransferProposals: boolean;
    creatingThresholdProposal: boolean;
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
    loadingTransferProposals: boolean;
    loadingSignerProposals: boolean;
    loadingSigners: boolean;
    loadingThresholdProposals: boolean;
    loadingCycles: boolean;
};

const InitialState: State = {
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
    hideSigners: false,
    hideOpenSignerProposals: true,
    hideOpenThresholdProposals: false,
    hideOpenTransferProposals: false,
    creatingThresholdProposal: false,
    creatingSignerProposal: false,
    creatingTransferProposal: false,
    votingOnProposals: {},
    errorMessage: '',
    showErrorDialog: false,
    loadingTransferProposals: false,
    loadingSignerProposals: false,
    loadingSigners: false,
    loadingThresholdProposals: false,
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
            this.store.backend.getVaultBalance().then((balance) => {
                if ('ok' in balance) {
                    this.store.balance = {
                        loading: false,
                        value: balance.ok
                    };
                }
                else {
                    this.handleError((balance as any).err);
                }
            }),
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
            this.store.backend.getThreshold().then((threshold) => {
                this.store.threshold = {
                    loading: false,
                    value: threshold
                }
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
            this.loadTransferProposals(),
            this.loadSignerProposals(),
            this.loadThresholdProposals(),
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

    async loadTransferProposals() {
        if (this.store.backend === null) {
            this.store.errorMessage = 'You are not authenticated, please refresh.'
            this.store.showErrorDialog = true;

            return;
        }

        const transferProposals = await this.store.backend.getTransferProposals();
        
        this.store.transferProposals = sortCreatedAtDescending(transferProposals);
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

    async loadThresholdProposals() {
        if (this.store.backend === null) {
            this.store.errorMessage = 'You are not authenticated, please refresh.'
            this.store.showErrorDialog = true;

            return;
        }

        const thresholdProposals = await this.store.backend.getThresholdProposals();
        
        this.store.thresholdProposals = sortCreatedAtDescending(thresholdProposals);
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
        this.store.votingOnProposals = {
            [thresholdProposalId]: {
                adopting: false,
                rejecting: false
            }
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
            const remove = (this.shadow.querySelector('#input-signer-proposal-remove') as any).pressed as boolean;

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
        this.store.votingOnProposals = {
            [transferProposalId]: {
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
        const thresholdSubtitleText = state.threshold.loading === true || state.signers.loading === true ? 'Loading...' : `${state.threshold.value} of ${state.signers.value.length} signers required`;

        const canisterBalanceText = state.balance.loading === true ? 'Loading...' : `${Number(state.balance.value * 10000n / BigInt(10**8)) / 10000} ICP available`;
        
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

                /* TODO I would prefer to use classes provided by the ui5 web components, but I need more info: https://github.com/SAP/ui5-webcomponents/issues/5094 */
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

                .create-proposal-button {
                    margin-right: .25rem;
                }

                .view-signers-button {
                    margin-right: .25rem;
                }

                .number-input {

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
                <ui5-card class="proposals-container">
                    <ui5-card-header title-text="Transfers" subtitle-text="${canisterBalanceText}">
                        <div class="card-header-action-container" slot="action">
                            <ui5-button
                                class="create-proposal-button"
                                design="Emphasized"
                                @click=${() => this.store.hideCreateTransferProposal = false}
                            >
                                Create Proposal
                            </ui5-button>

                            <ui5-busy-indicator
                                size="Small"
                                .active=${state.loadingTransferProposals}
                            >
                                <ui5-button
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
                            </ui5-busy-indicator>
                        </div>
                    </ui5-card-header>
    
                    <ui5-table
                        class="proposals-table"
                        no-data-text="No ${state.hideOpenTransferProposals === true ? 'closed' : 'open'} proposals"
                    >
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
    
                        ${state.hideOpenTransferProposals === false ? html`
                            <ui5-table-column slot="columns"></ui5-table-column>
                            <ui5-table-column slot="columns"></ui5-table-column>
                        ` : ''}
    
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
    
                                    ${state.hideOpenTransferProposals === false ? html`
                                        <ui5-table-cell>
                                            <ui5-busy-indicator
                                                size="Small"
                                                .active=${state.votingOnProposals[transferProposal.id]?.adopting}
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

                <ui5-card class="proposals-container">
                    <ui5-card-header title-text="Threshold" subtitle-text="${thresholdSubtitleText}">
                        <div class="card-header-action-container" slot="action">
                            <ui5-button
                                class="create-proposal-button"
                                design="Emphasized"
                                @click=${() => this.store.hideCreateThresholdProposal = false}
                            >
                                Create Proposal
                            </ui5-button>

                            <ui5-busy-indicator
                                size="Small"
                                .active=${state.loadingThresholdProposals}
                            >
                                <ui5-button
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
                            </ui5-busy-indicator>

                        </div>
                    </ui5-card-header>
    
                    <ui5-table
                        class="proposals-table"
                        no-data-text="No ${state.hideOpenThresholdProposals === true ? 'closed' : 'open'} proposals"
                    >
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
    
                        ${state.hideOpenThresholdProposals === false ? html`
                            <ui5-table-column slot="columns" demand-popin></ui5-table-column>
                            <ui5-table-column slot="columns" demand-popin></ui5-table-column>
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
                                `Adopted ${new Date(Number((thresholdProposal.adopted_at[0] ?? 0n) / 1000000n)).toLocaleString()}` : thresholdProposal.rejected === true ?
                                    `Rejected ${new Date(Number((thresholdProposal.rejected_at[0] ?? 0n) / 1000000n)).toLocaleString()}` : 'Open';
    
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
                            <ui5-busy-indicator
                                size="Small"
                                .active=${state.creatingThresholdProposal}
                            >
                                <ui5-button
                                    class="dialog-footer-main-button"
                                    design="Emphasized"
                                    @click=${() => this.handleCreateThresholdProposalClick()}
                                >
                                    Create
                                </ui5-button>
                            </ui5-busy-indicator>

                            <ui5-button @click=${() => this.store.hideCreateThresholdProposal = true}>Cancel</ui5-button>
                        </div>
                    </ui5-dialog>
                ` : ''}
    
                <ui5-card class="proposals-container">
                    <ui5-card-header title-text="Signers">
                        <div class="card-header-action-container" slot="action">
                            <ui5-button
                                class="create-proposal-button"
                                design="Emphasized"
                                @click=${() => this.store.hideCreateSignerProposal = false}
                            >
                                Create Proposal
                            </ui5-button>

                            <ui5-busy-indicator
                                size="Small"
                                .active=${state.loadingSigners}
                            >
                                <ui5-button
                                    class="view-signers-button"
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
                            </ui5-busy-indicator>

                            <ui5-busy-indicator
                                size="Small"
                                .active=${state.loadingSignerProposals}
                            >
                                <ui5-button
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
                            </ui5-busy-indicator>
                        </div>
                    </ui5-card-header>
    
                    <ui5-table
                        ?hidden=${!state.hideSigners}
                        class="proposals-table"
                        no-data-text="No ${state.hideOpenSignerProposals === true ? 'closed' : 'open'} proposals"
                    >
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
                                `Adopted ${new Date(Number((signerProposal.adopted_at[0] ?? 0n) / 1000000n)).toLocaleString()}` : signerProposal.rejected === true ?
                                    `Rejected ${new Date(Number((signerProposal.rejected_at[0] ?? 0n) / 1000000n)).toLocaleString()}` : 'Open';

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
                                <ui5-toggle-button id="input-signer-proposal-remove" design="Negative">Remove signer</ui5-toggle-button>
                            </div>
                        </section>
    
                        <div slot="footer" class="dialog-footer">
                            <div class="dialog-footer-space"></div>
                            <ui5-busy-indicator
                                size="Small"
                                .active=${state.creatingSignerProposal}
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
                            >
                                <ui5-button
                                    design="Emphasized"
                                    class="create-proposal-button"
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

function sortCreatedAtDescending<T extends { created_at: nat64 }>(proposals: T[]): T[] {
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