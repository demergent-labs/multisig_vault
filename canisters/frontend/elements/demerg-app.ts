import {
    html,
    render as litRender
} from 'lit-html';
import { createObjectStore } from 'reduxular';
import {
    nat64,
    nat8
} from 'azle';
import { createActor } from '../canisters/backend';
import {
    ThresholdProposal,
    SignerProposal
} from '../canisters/backend/backend.did';
import { Principal } from '@dfinity/principal';
import { AuthClient } from '@dfinity/auth-client';
import { Identity } from '@dfinity/agent';
import './demerg-proposal';

type State = {
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
    hideCreateSignerProposal: boolean;
    hideOpenSignerProposals: boolean;
    hideOpenThresholdProposals: boolean;
};

const InitialState: State = {
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
    hideCreateSignerProposal: true,
    hideOpenSignerProposals: false,
    hideOpenThresholdProposals: false
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
            this.store.balance = {
                loading: false,
                value: balance
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
    }

    render(state: State) {
        return html`
            <style>
                .proposal-container {
                    border: solid 1px black;
                }
            </style>

            <div>My principal: ${state.identity === null ? 'Loading...' : state.identity.getPrincipal().toString()}</div>
            
            <br>

            <div>Canister balance: ${state.balance.loading === true ? 'Loading...' : state.balance.value}</div>
            
            <br>
            
            <div>Threshold: ${state.threshold.loading === true ? 'Loading...' : state.threshold.value}</div>
            
            <br>

            <div>
                <button @click=${() => this.store.hideOpenThresholdProposals = false}>
                    Open Proposals
                </button>
                <button @click=${() => this.store.hideOpenThresholdProposals = true}>
                    Closed Proposals
                </button>
            </div>

            <br>
            
            <div>Threshold Proposals</div>

            <br>
            
            <div>
                <button @click=${() => this.store.hideCreateThresholdProposal = !this.store.hideCreateThresholdProposal}>Create Threshold Proposal</button>
            </div>

            <div>
                <demerg-proposal
                    ?hidden=${state.hideCreateThresholdProposal}
                    .mode=${'CREATE'}
                    .proposalType=${'Threshold'}
                    .proposalValueInputId=${'threshold-input'}
                    .proposalValueInputTemplate=${html`Threshold: <input id="threshold-input" type="number">`}
                    .canisterMethodCreate=${async (description: string, threshold: string) => {
                        const backend = createActor(
                            window.process.env.BACKEND_CANISTER_ID as any,
                            {
                                agentOptions: {
                                    identity: this.store.identity as any
                                }
                            }
                        );
    
                        // TODO we might need a way to allow the developer to pass in a function that extracts the value from the input
                        const result = await backend.proposeThreshold(description, parseInt(threshold));
    
                        if (result.hasOwnProperty('ok')) {
                            this.store.hideCreateThresholdProposal = true;
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
                ${state.thresholdProposals.map((thresholdProposal) => {
                    const open = thresholdProposal.adopted === false && thresholdProposal.rejected === false;
                    const hidden = (open && state.hideOpenThresholdProposals === true) || (!open && state.hideOpenThresholdProposals === false);

                    return html`
                        <div
                            ?hidden=${hidden}
                            class="proposal-container"
                        >
                            <demerg-proposal
                                .mode=${'READ'}
                                .proposalType=${'Threshold'}
                                .proposer=${thresholdProposal.proposer}
                                .description=${thresholdProposal.description}
                                .votes=${thresholdProposal.votes}
                                .adopted=${thresholdProposal.adopted}
                                .rejected=${thresholdProposal.rejected}
                                .proposalId=${thresholdProposal.id}
                                .proposalValueTemplate=${html`<div>New Threshold: ${thresholdProposal.threshold}</div>`}
                                .canisterMethodAdopt=${async () => {
                                    const backend = createActor(
                                        window.process.env.BACKEND_CANISTER_ID as any,
                                        {
                                            agentOptions: {
                                                identity: this.store.identity as any
                                            }
                                        }
                                    );

                                    const result = await backend.voteOnThresholdProposal(thresholdProposal.id, true);

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

                                    const result = await backend.voteOnThresholdProposal(thresholdProposal.id, false);

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

            <br>

            <div>Signers</div>

            <br>

            <div>
                ${state.signers.loading === true ? 'Loading...' : state.signers.value.map((signer) => {
                    return html`<div>${signer.toString()}</div>`;
                })}
            </div>

            <br>

            <div>Signer Proposals</div>

            <br>

            <div>
                <button @click=${() => this.store.hideOpenSignerProposals = false}>
                    Open Proposals
                </button>
                <button @click=${() => this.store.hideOpenSignerProposals = true}>
                    Closed Proposals
                </button>
            </div>

            <br>

            <div>
                <button @click=${() => this.store.hideCreateSignerProposal = !this.store.hideCreateSignerProposal}>
                    Create Signer Proposal
                </button>
            </div>

            <br>
            
            <div>
                <demerg-proposal
                    ?hidden=${state.hideCreateSignerProposal}
                    .mode=${'CREATE'}
                    .proposalType=${'Signer'}
                    .proposalValueInputId=${'signer-input'}
                    .proposalValueInputTemplate=${html`Signer: <input id="signer-input" type="text">`}
                    .canisterMethodCreate=${async (description: string, signer: string) => {
                        const backend = createActor(
                            window.process.env.BACKEND_CANISTER_ID as any,
                            {
                                agentOptions: {
                                    identity: this.store.identity as any
                                }
                            }
                        );
    
                        // TODO we might need a way to allow the developer to pass in a function that extracts the value from the input
                        const result = await backend.proposeSigner(description, Principal.fromText(signer));
    
                        if (result.hasOwnProperty('ok')) {
                            this.store.hideCreateSignerProposal = true;
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
                ${state.signerProposals.map((signerProposal) => {
                    const open = signerProposal.adopted === false && signerProposal.rejected === false;
                    const hidden = (open && state.hideOpenSignerProposals === true) || (!open && state.hideOpenSignerProposals === false);
                    
                    return html`
                        <div
                            ?hidden=${hidden}
                            class="proposal-container"
                        >
                            <demerg-proposal
                                .mode=${'READ'}
                                .proposalType=${'Signer'}
                                .proposer=${signerProposal.proposer}
                                .description=${signerProposal.description}
                                .votes=${signerProposal.votes}
                                .adopted=${signerProposal.adopted}
                                .rejected=${signerProposal.rejected}
                                .proposalId=${signerProposal.id}
                                .proposalValueTemplate=${html`<div>New Signer: ${signerProposal.signer}</div>`}
                                .canisterMethodAdopt=${async () => {
                                    const backend = createActor(
                                        window.process.env.BACKEND_CANISTER_ID as any,
                                        {
                                            agentOptions: {
                                                identity: this.store.identity as any
                                            }
                                        }
                                    );

                                    const result = await backend.voteOnSignerProposal(signerProposal.id, true);

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

                                    const result = await backend.voteOnSignerProposal(signerProposal.id, false);

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