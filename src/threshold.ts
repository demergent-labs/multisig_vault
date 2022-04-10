import {
    Query,
    CanisterResult,
    UpdateAsync,
    ic,
    Update,
    nat8,
    Principal
} from 'azle';
import { state } from './multisig_vault';
import { isSigner } from './signers';
import {
    ThresholdProposal,
    DefaultResult,
    ApproveProposalResult
} from './types';
import { Management } from 'azle/canisters/management';
import { sha224 } from 'hash.js';

export function getThreshold(): Query<nat8> {
    return state.threshold;
}

export function getThresholdProposals(): Query<ThresholdProposal[]> {
    return Object.values(state.thresholdProposals);
}

export function* proposeThreshold(threshold: nat8): UpdateAsync<DefaultResult> {
    if (isSigner(ic.caller()) === false) {
        return {
            err: 'Only signers can propose a threshold'
        };
    }

    const id_result: CanisterResult<string> = yield ic.canisters.Management<Management>('aaaaa-aa').raw_rand();

    if (id_result.ok === undefined) {
        return {
            err: id_result.err
        };
    }

    state.thresholdProposals[id_result.ok] = {
        id: sha224().update(id_result.ok).digest('hex'),
        proposer: ic.caller(),
        threshold,
        approvals: [],
        adopted: false
    };

    return {
        ok: true
    };
}

export function approveThresholdProposal(thresholdProposalId: string): Update<ApproveProposalResult> {
    if (isSigner(ic.caller()) === false) {
        return {
            err: 'Only signers can approve a threshold proposal'
        };
    }

    const thresholdProposal: ThresholdProposal | undefined = state.thresholdProposals[thresholdProposalId];

    if (thresholdProposal === undefined) {
        return {
            err: `No threshold proposal found for threshold proposal id ${thresholdProposalId}`
        };
    }

    if (thresholdProposal.adopted === true) {
        return {
            err: `Threshold proposal ${thresholdProposalId} already adopted`
        };
    }

    const newApprovals: Principal[] = [
        ...thresholdProposal.approvals,
        ic.caller()
    ];

    state.thresholdProposals[thresholdProposalId].approvals = newApprovals;

    if (newApprovals.length < state.threshold) {
        return {
            ok: {
                approved: null
            }
        };
    }

    state.threshold = thresholdProposal.threshold;

    state.thresholdProposals[thresholdProposalId].adopted = true;

    return {
        ok: {
            adopted: null
        }
    };
}