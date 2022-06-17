import {
    Principal,
    Query
} from 'azle';
import { state } from '../backend';
import { SignerProposal } from '../types';

export function get_signers(): Query<Principal[]> {
    return Object.values(state.signers) as Principal[];
}

export function get_signer_proposals(): Query<SignerProposal[]> {
    return Object.values(state.signer_proposals) as SignerProposal[];
}

export function is_signer(signer: Principal): boolean {
    if (state.signers[signer.toText()]?.toText() === signer.toText()) {
        return true;
    }

    return false;
}

export { propose_signer } from './propose';
export { vote_on_signer_proposal } from './vote';