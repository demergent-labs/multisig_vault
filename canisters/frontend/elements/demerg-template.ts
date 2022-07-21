import { html, render as litRender } from 'lit-html';
import { createObjectStore } from 'reduxular';

type State = {};

const InitialState: State = {};

class DemergTemplate extends HTMLElement {
    shadow = this.attachShadow({
        mode: 'closed'
    });
    store = createObjectStore(
        InitialState,
        (state: State) => litRender(this.render(state), this.shadow),
        this
    );

    render(state: State) {
        return html``;
    }
}

window.customElements.define('demerg-template', DemergTemplate);
