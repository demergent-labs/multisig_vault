import {
    html,
    render as litRender
} from 'lit-html';
import { createObjectStore } from 'reduxular';
import {
    nat64,
    nat8
} from 'azle';

type State = {};

const InitialState: State = {};

class DemergProposalThreshold extends HTMLElement {
    shadow = this.attachShadow({
        mode: 'closed'
    });
    store = createObjectStore(InitialState, (state: State) => litRender(this.render(state), this.shadow), this);

    render(state: State) {
        return html``;
    }
}

window.customElements.define('demerg-proposal-threshold', DemergProposalThreshold);