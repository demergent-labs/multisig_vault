import {
    html,
    render as litRender,
    TemplateResult
} from 'lit-html';
import { createObjectStore } from 'reduxular';
import { Vote } from '../../backend/types';
import { Principal } from '@dfinity/principal';

// TODO perhaps allow passing in fields that can be customized from above
type State = {
    mode: 'CREATE' | 'READ' | 'UPDATE' | 'LOADING';
    proposalType: string;
    proposer: Principal;
    description: string;
    votes: Vote[];
    adopted: boolean;
    rejected: boolean;
    proposalId: string;
    proposalValueInputId: string,
    proposalValueInputTemplate: TemplateResult,
    proposalValueTemplate: TemplateResult,
    canisterMethodCreate: (description: string, proposalValue: any) => any;
    canisterMethodAdopt: (proposalId: string) => any;
    canisterMethodReject: (proposalId: string) => any;
};

const InitialState: State = {
    mode: 'LOADING',
    proposalType: '',
    proposer: Principal.fromText('aaaaa-aa'),
    proposalId: '',
    description: '',
    votes: [],
    adopted: false,
    rejected: false,
    proposalValueInputId: '',
    proposalValueInputTemplate: html``,
    proposalValueTemplate: html``,
    canisterMethodCreate: () => {},
    canisterMethodAdopt: () => {},
    canisterMethodReject: () => {}
};

class DemergProposal extends HTMLElement {
    shadow = this.attachShadow({
        mode: 'closed'
    });
    store = createObjectStore(InitialState, (state: State) => litRender(this.render(state), this.shadow), this);

    async clickedCreate(
        description: string,
        proposalValue: any
    ) {
        try {
            await this.store.canisterMethodCreate(
                description,
                proposalValue
            );
        }
        catch(error) {
            console.log(error);
            alert('The proposal could not be created');
        }
    }

    async clickedAdopt() {
        try {
            await this.store.canisterMethodAdopt(this.store.proposalId);
        }
        catch(error) {
            console.log(error);
            alert('The proposal could not be adopted');
        }
    }

    async clickedReject() {
        try {
            console.log('clickedReject');
            await this.store.canisterMethodReject(this.store.proposalId);
            console.log('clickedReject finished');
        }
        catch(error) {
            console.log(error);
            alert('The proposal could not be rejected');
        }
    }

    render(state: State) {
        return html`
            <style>
                :host {
                    width: 100%;
                    height: 100%;
                }
            </style>

            ${state.mode === 'CREATE' ? html`
                <div>
                    Proposal Type: ${state.proposalType}
                </div>

                <br>

                <div>
                    Description: <input id="description-input" type="text">
                </div>

                <br>

                <div>
                    ${state.proposalValueInputTemplate}
                </div>

                <br>

                <div>
                    <button @click=${() => {
                        const descriptionInputvalue = (this.shadow.getElementById('description-input') as HTMLInputElement | null)?.value;
                        const proposalValueInputValue = (this.shadow.getElementById(state.proposalValueInputId) as HTMLInputElement | null)?.value

                        if (
                            descriptionInputvalue === undefined ||
                            proposalValueInputValue === undefined
                        ) {
                            alert('Could not create proposal');
                        }
                        else {
                            this.clickedCreate(
                                descriptionInputvalue,
                                proposalValueInputValue
                            );
                        }
                    }}>
                        Create
                    </button>
                </div>
            ` : ''}

            ${state.mode === 'READ' ? html`
                <div>Proposal Type: ${state.proposalType}</div>

                <br>

                <div>id: ${state.proposalId}</div>

                <br>

                <div>Proposer: ${state.proposer.toString()}</div>

                <br>

                <div>Description: ${state.description}</div>

                <br>

                <div>
                    ${state.proposalValueTemplate}
                </div>

                <br>

                <div>Adopted: ${state.adopted}</div>
                <div>Rejected: ${state.rejected}</div>

                <br>

                <div>Votes</div>

                <br>

                <div>For: ${state.votes.filter((vote) => vote.adopt === true).length}</div>
                <div>Against: ${state.votes.filter((vote) => vote.adopt === false).length}</div>

                <br>

                <div>
                    <button @click=${() => this.clickedAdopt()}>Adopt</button>
                </div>

                <br>

                <div>
                    <button @click=${() => this.clickedReject()}>Reject</button>
                </div>
            ` : ''}

            ${state.mode === 'UPDATE' ? html`
            ` : ''}

            ${state.mode === 'LOADING' ? html`
                <div>Loading...</div>
            ` : ''}
        `;
    }
}

window.customElements.define('demerg-proposal', DemergProposal);