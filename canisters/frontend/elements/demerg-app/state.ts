import {
    ActorSubclass,
    Identity
} from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { _SERVICE } from '../../dfx_generated/backend/backend.did';

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
