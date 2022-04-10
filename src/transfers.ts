import {
    Query,
    CanisterResult,
    UpdateAsync,
    ic,
    nat64,
    Update,
    Principal
} from 'azle';
import {
    ICPCanister,
    NameResult
} from './icp';
import { state } from './multisig_vault';
import { isSigner } from './signers';
import {
    TransferProposal,
    DefaultResult,
    ApproveProposalResult
} from './types';
import { Management } from 'azle/canisters/management';
import { sha224 } from 'hash.js';

export function getTransferProposals(): Query<TransferProposal[]> {
    return Object.values(state.transferProposals);
}

// TODO should we check to make sure that we have a sufficient balance? That would be cool
export function* proposeTransfer(
    destinationAddress: string,
    amount: nat64
): UpdateAsync<DefaultResult> {
    if (isSigner(ic.caller()) === false) {
        return {
            err: 'Only signers can propose a transfer'
        };
    }

    // TODO check that there is enough ICP in the vault to initiate this transfer

    const id_result: CanisterResult<string> = yield ic.canisters.Management<Management>('aaaaa-aa').raw_rand();

    if (id_result.ok !== undefined) {
        state.transferProposals[id_result.ok] = {
            id: sha224().update(id_result.ok).digest('hex'),
            proposer: ic.caller(),
            destinationAddress,
            amount,
            approvals: [],
            adopted: false
        };

        return {
            ok: true
        };
    }
    else {
        return {
            err: id_result.err
        };
    }
}

export function approveTransferProposal(transferProposalId: string): Update<ApproveProposalResult> {
    if (isSigner(ic.caller()) === false) {
        return {
            err: 'Only signers can approve a transfer proposal'
        };
    }

    const transferProposal: TransferProposal | undefined = state.transferProposals[transferProposalId];

    if (transferProposal === undefined) {
        return {
            err: `No transfer proposal found for transfer proposal id ${transferProposalId}`
        };
    }

    if (transferProposal.adopted === true) {
        return {
            err: `Transfer proposal ${transferProposalId} already adopted`
        };
    }

    const newApprovals: Principal[] = [
        ...transferProposal.approvals,
        ic.caller()
    ];

    state.transferProposals[transferProposalId].approvals = newApprovals;

    if (newApprovals.length < state.threshold) {
        return {
            ok: {
                approved: null
            }
        };
    }

    // TODO execute transfer on the ICP ledger

    state.transferProposals[transferProposalId].adopted = true;

    return {
        ok: {
            adopted: null
        }
    };
}