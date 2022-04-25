// TODO once everything is componentized, figure out how general we want to make everything

import {
    html,
    render as litRender
} from 'lit-html';
import { createObjectStore } from 'reduxular';
import { nat64 } from 'azle';
import { createActor } from '../dfx_generated/backend';
import { ActorSubclass } from '@dfinity/agent';
import { _SERVICE } from '../dfx_generated/backend/backend.did';
import { Principal } from '@dfinity/principal';
import { AuthClient } from '@dfinity/auth-client';
import { Identity } from '@dfinity/agent';

import './demerg-signers';
import './demerg-stats-and-info';
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

export type SignersChangedEvent = {
    detail: State['signers'];
};

export type State = {
    backend: ActorSubclass<_SERVICE> | null;
    identity: Identity | null;
    signers: {
        loading: boolean;
        value: Principal[];
    };
};

export const InitialState: State = {
    backend: null,
    identity: null,
    signers: {
        loading: true,
        value: []
    }
};

class DemergApp extends HTMLElement {
    shadow = this.attachShadow({
        mode: 'closed'
    });
    store = createObjectStore(InitialState, (state: State) => litRender(this.render(state), this.shadow), this);
    
    connectedCallback() {
        this.authenticate();
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

                <div class="proposals-container">
                    <demerg-signers
                        .backend=${state.backend}
                        .signers=${state.signers}
                        @signers-changed=${(e: SignersChangedEvent) => this.store.signers = e.detail}
                    ></demerg-signers>
                </div>

                <div class="proposals-container">
                    <demerg-stats-and-info
                        .backend=${state.backend}
                    ></demerg-stats-and-info>
                </div>
            </div>
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