import {
    Query,
    Canister,
    CanisterResult,
    UpdateAsync,
    ic,
    Principal,
    int8,
    nat64,
    Update,
    Init
} from 'azle';
import {
    ICPCanister,
    NameResult
} from './icp';
import { state } from './multisig_vault';
import { SignerProposal } from './types';

export function getSigners(): Query<Principal[]> {
    return Object.values(state.signers);
}

export function getSignerProposals(): Query<SignerProposal[]> {
    return Object.values(state.signerProposals);
}

export function proposeSigner(signer: Principal): Update<void> {
    if (isSigner(ic.caller()) === false) {
        ic.trap('Only a signer can propose a signer');
    }

    // TODO attack vector if the proposals get too big, have a limit
    state.signerProposals[signer] = {
        signer,
        adopted: false,
        approvals: []
    };
}

// TODO probably do not use arrays and make sure to think about memory leak attack vectors
export function approveSigner(signer: Principal): Update<boolean> {
    if (isSigner(ic.caller()) === false) {
        return false;
    }

    const signerProposal: SignerProposal = state.signerProposals[signer];

    if (signerProposal !== undefined) {
        state.signerProposals[signer] = {
            ...signerProposal,
            approvals: [
                ...signerProposal.approvals,
                ic.caller()
            ]
        };

        if (state.signerProposals[signer].approvals.length === state.threshold) {
            state.signers[signerProposal.signer] = signerProposal.signer;
        }

        return true;
    }
    else {
        return false;
    }
}

export function isSigner(signer: Principal): boolean {
    if (state.signers[signer] === signer) {
        return true;
    }

    return false;
}