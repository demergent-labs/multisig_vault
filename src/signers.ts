import {
    Query,
    CanisterResult,
    UpdateAsync,
    ic,
    Principal,
    Update
} from 'azle';
import { Management } from 'azle/canisters/management';
import { sha224 } from 'hash.js';
import { state } from './multisig_vault';
import {
    ApproveProposalResult,
    DefaultResult,
    SignerProposal
} from './types';

export function getSigners(): Query<Principal[]> {
    return Object.values(state.signers);
}

export function getSignerProposals(): Query<SignerProposal[]> {
    return Object.values(state.signerProposals);
}

export function* proposeSigner(signer: Principal): UpdateAsync<DefaultResult> {
    if (isSigner(ic.caller()) === false) {
        return {
            err: 'Only signers can propose a signer'
        };
    }

    const id_result: CanisterResult<string> = yield ic.canisters.Management<Management>('aaaaa-aa').raw_rand();

    if (id_result.ok === undefined) {
        return {
            err: id_result.err
        };
    }

    state.signerProposals[id_result.ok] = {
        id: sha224().update(id_result.ok).digest('hex'),
        proposer: ic.caller(),
        signer,
        approvals: [],
        adopted: false
    };

    return {
        ok: true
    };
}

export function approveSignerProposal(signerProposalId: string): Update<ApproveProposalResult> {
    if (isSigner(ic.caller()) === false) {
        return {
            err: 'Only signers can approve a signer proposal'
        };
    }

    const signerProposal: SignerProposal | undefined = state.signerProposals[signerProposalId];

    if (signerProposal === undefined) {
        return {
            err: `No signer proposal found for signer proposal id ${signerProposalId}`
        };
    }

    if (signerProposal.adopted === true) {
        return {
            err: `Signer proposal ${signerProposalId} already adopted`
        };
    }

    const newApprovals: Principal[] = [
        ...signerProposal.approvals,
        ic.caller()
    ];


    state.signerProposals[signerProposalId].approvals = newApprovals;

    if (newApprovals.length < state.threshold) {
        return {
            ok: {
                approved: null
            }
        };
    }

    state.signers[signerProposal.signer] = signerProposal.signer;

    state.signerProposals[signerProposalId].adopted = true;

    return {
        ok: {
            adopted: null
        }
    };
}

export function isSigner(signer: Principal): boolean {
    if (state.signers[signer] === signer) {
        return true;
    }

    return false;
}