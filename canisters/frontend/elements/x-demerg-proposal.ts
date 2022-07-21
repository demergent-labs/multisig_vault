// import {
//     html,
//     render as litRender,
//     TemplateResult
// } from 'lit-html';
// import { createObjectStore } from 'reduxular';
// import { Vote } from '../../backend/types';
// import { Principal } from '@dfinity/principal';
// import { nat64 } from 'azle';

// // TODO we should just create a Proposal type that has all of these fields
// // TODO perhaps allow passing in fields that can be customized from above
// type State = {
//     mode: 'CREATE' | 'READ' | 'UPDATE' | 'LOADING';
//     loadingCreate: boolean;
//     loadingAdopt: boolean;
//     loadingReject: boolean;
//     proposalType: string;
//     created_at: nat64;
//     adopted_at: nat64;
//     rejected_at: nat64;
//     proposer: Principal;
//     description: string;
//     votes: Vote[];
//     adopted: boolean;
//     rejected: boolean;
//     proposalId: string;
//     proposalValueInputId: string,
//     proposalValueInputTemplate: TemplateResult,
//     proposalValueTemplate: TemplateResult,
//     proposalValueInputRetriever: (element: DemergProposal) => any;
//     canisterMethodCreate: (description: string, proposalValue: any) => any;
//     canisterMethodAdopt: (proposalId: string) => any;
//     canisterMethodReject: (proposalId: string) => any;
// };

// const InitialState: State = {
//     mode: 'LOADING',
//     loadingCreate: false,
//     loadingAdopt: false,
//     loadingReject: false,
//     created_at: 0n,
//     adopted_at: 0n,
//     rejected_at: 0n,
//     proposalType: '',
//     proposer: Principal.fromText('aaaaa-aa'),
//     proposalId: '',
//     description: '',
//     votes: [],
//     adopted: false,
//     rejected: false,
//     proposalValueInputId: '',
//     proposalValueInputTemplate: html``,
//     proposalValueTemplate: html``,
//     proposalValueInputRetriever: () => {},
//     canisterMethodCreate: () => {},
//     canisterMethodAdopt: () => {},
//     canisterMethodReject: () => {}
// };

// export class DemergProposal extends HTMLElement {
//     shadow = this.attachShadow({
//         mode: 'closed'
//     });
//     store = createObjectStore(InitialState, (state: State) => litRender(this.render(state), this.shadow), this);

//     async clickedCreate(
//         description: string,
//         proposalValue: any
//     ) {
//         this.store.loadingCreate = true;

//         try {

//             await this.store.canisterMethodCreate(
//                 description,
//                 proposalValue
//             );
//         }
//         catch(error) {
//             console.log(error);
//             alert('The proposal could not be created');
//         }

//         this.store.loadingCreate = false;
//     }

//     async clickedAdopt() {
//         this.store.loadingAdopt = true;

//         try {
//             await this.store.canisterMethodAdopt(this.store.proposalId);
//         }
//         catch(error) {
//             console.log(error);
//             alert('The proposal could not be adopted');
//         }

//         this.store.loadingAdopt = false;
//     }

//     async clickedReject() {
//         this.store.loadingReject = true;

//         try {
//             console.log('clickedReject');
//             await this.store.canisterMethodReject(this.store.proposalId);
//             console.log('clickedReject finished');
//         }
//         catch(error) {
//             console.log(error);
//             alert('The proposal could not be rejected');
//         }

//         this.store.loadingReject = false;
//     }

//     render(state: State) {
//         return html`
//             <style>
//                 :host {
//                     width: 100%;
//                     height: 100%;
//                 }
//             </style>

//             ${state.mode === 'CREATE' ? html`
//                 <div>
//                     Proposal Type: ${state.proposalType}
//                 </div>

//                 <br>

//                 <div>
//                     Description: <input id="description-input" type="text">
//                 </div>

//                 <br>

//                 <div>
//                     ${state.proposalValueInputTemplate}
//                 </div>

//                 <br>

//                 <div>
//                     <button @click=${() => {
//                         const descriptionInputvalue = (this.shadow.getElementById('description-input') as HTMLInputElement | null)?.value;
//                         const proposalValueInputValue = this.store.proposalValueInputRetriever(this);

//                         if (
//                             descriptionInputvalue === undefined ||
//                             proposalValueInputValue === undefined
//                         ) {
//                             alert('Could not create proposal');
//                         }
//                         else {
//                             this.clickedCreate(
//                                 descriptionInputvalue,
//                                 proposalValueInputValue
//                             );
//                         }
//                     }}>
//                         ${state.loadingCreate === true ? 'Loading...' : 'Create'}
//                     </button>
//                 </div>
//             ` : ''}

//             ${state.mode === 'READ' ? html`
//                 <div>Proposal Type: ${state.proposalType}</div>

//                 <br>

//                 <div>Created: ${new Date(Number(state.created_at / 1000000n)).toLocaleString()}</div>

//                 <br>

//                 <div>id: ${state.proposalId}</div>

//                 <br>

//                 <div>Proposer: ${state.proposer.toString()}</div>

//                 <br>

//                 <div>Description: ${state.description}</div>

//                 <br>

//                 <div>
//                     ${state.proposalValueTemplate}
//                 </div>

//                 <br>

//                 <div>Adopted: ${state.adopted === true ? new Date(Number(state.adopted_at / 1000000n)).toLocaleString() : state.adopted}</div>
//                 <div>Rejected: ${state.rejected === true ? new Date(Number(state.rejected_at / 1000000n)).toLocaleString() : state.rejected}</div>

//                 <br>

//                 <div>Votes</div>

//                 <br>

//                 <div>For: ${state.votes.filter((vote) => vote.adopt === true).length}</div>
//                 <div>Against: ${state.votes.filter((vote) => vote.adopt === false).length}</div>

//                 <br>

//                 <div>
//                     <button @click=${() => this.clickedAdopt()}>
//                         ${state.loadingAdopt === true ? 'Loading...' : 'Adopt'}
//                     </button>
//                 </div>

//                 <br>

//                 <div>
//                     <button @click=${() => this.clickedReject()}>
//                         ${state.loadingReject === true ? 'Loading...' : 'Reject'}
//                     </button>
//                 </div>
//             ` : ''}

//             ${state.mode === 'UPDATE' ? html`
//             ` : ''}

//             ${state.mode === 'LOADING' ? html`
//                 <div>Loading...</div>
//             ` : ''}
//         `;
//     }
// }

// window.customElements.define('demerg-proposal', DemergProposal);
