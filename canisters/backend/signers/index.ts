import {
    Principal,
    Query
} from 'azle';
import { state } from '../backend';
import { SignerProposal } from '../types';

export function getSigners(): Query<Principal[]> {
    return Object.values(state.signers) as Principal[];
}

export function getSignerProposals(): Query<SignerProposal[]> {
    return Object.values(state.signerProposals) as SignerProposal[];
}

export function isSigner(signer: Principal): boolean {
    if (state.signers[signer] === signer) {
        return true;
    }

    return false;
}

export { proposeSigner } from './propose';
export { voteOnSignerProposal } from './vote';