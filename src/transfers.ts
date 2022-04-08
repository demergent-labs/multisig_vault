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
    Init,
    nat8,
    Variant
} from 'azle';
import {
    ICPCanister,
    NameResult
} from './icp';
import { state } from './multisig_vault';
import { isSigner } from './signers';
import {
    TransferProposal,
    ProposeTransferResult
} from './types';
import { generateId } from './utilities';
import { Management } from 'azle/canisters/management';
import { sha224 } from 'hash.js';

export function getTransferProposals(): Query<TransferProposal[]> {
    return Object.values(state.transferProposals);
}

type Res = Variant<{
    ok?: nat8[];
    err?: string;
}>;

export function* proposeTransfer(
    destinationAddress: string,
    amount: nat64
): UpdateAsync<ProposeTransferResult> {
    // if (isSigner(ic.caller()) === false) {
    //     return {
    //         err: 'Only signers can propose a transfer'
    //     };
    // }

    const id_result: CanisterResult<string> = yield generateId().next().value;

    if (id_result.ok !== undefined) {
        state.transferProposals[id_result.ok] = {
            id: sha224().update(id_result.ok).digest('hex'),
            destinationAddress,
            amount,
            adopted: false,
            approvals: []
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

export function approveTransfer(transferId: string): Update<void> {
    if (isSigner(ic.caller()) === false) {
        ic.trap('Only a signer can approve a transfer');
    }

    const transferProposal: TransferProposal = state.transferProposals[transferId];

    if (transferProposal === undefined) {
        ic.trap(`No transfer proposal found for transfer id: ${transferId}`);
    }

    // TODO check to make sure the approval hasn't already been done
    state.transferProposals[transferId] = {
        ...transferProposal,
        approvals: [
            ...transferProposal.approvals,
            ic.caller()
        ]
    }

    if (state.transferProposals[transferId].approvals.length >= state.threshold) {
        // TODO execute transfer
        // TODO remove transfer request

        // TODO consider if we should do things mutably or immutably
        delete state.transferProposals[transferId];
    }
}

// let icpCanister = ic.canisters.ICPCanister<ICPCanister>('ryjl3-tyaaa-aaaaa-aaaba-cai');

// export function* name(): UpdateAsync<string> {
//     const result: CanisterResult<NameResult> = yield icpCanister.name();

//     if (result.ok !== undefined) {
//         return result.ok.name;
//     }
//     else {
//         return 'The name could not be found';
//     }
// }