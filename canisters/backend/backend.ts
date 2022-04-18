import {
    CanisterResult,
    ic,
    Init,
    nat8,
    nat64,
    Principal,
    Query,
    UpdateAsync
} from 'azle';
import {
    binaryAddressFromPrincipal,
    hexAddressFromPrincipal,
    ICP,
    Tokens
} from 'azle/canisters/icp';
import { process } from './process_polyfill';
import {
    State,
    VaultBalanceResult
} from './types';

export const ICPCanister = ic.canisters.ICP<ICP>(process.env.ICP_LEDGER_CANISTER_ID);

export let state: State = {
    signers: {},
    signerProposals: {},
    threshold: 0,
    thresholdProposals: {},
    transfers: {},
    transferProposals: {}
};

export function init(
    signers: Principal[],
    threshold: nat8
): Init {
    state.signers = signers.reduce((result, signer) => {
        return {
            ...result,
            [signer]: signer
        };
    }, {});

    state.threshold = threshold;
}

export function* getVaultBalance(): UpdateAsync<VaultBalanceResult> {
    const account_balance_canister_result: CanisterResult<Tokens> = yield ICPCanister.account_balance({
        account: binaryAddressFromPrincipal(ic.id(), 0)
    });

    if (account_balance_canister_result.ok === undefined) {
        return {
            err: account_balance_canister_result.err
        };
    }

    return {
        ok: account_balance_canister_result.ok.e8s
    };
}

export function getCanisterPrincipal(): Query<string> {
    return ic.id();
}

export function getCanisterAddress(): Query<string> {
    return hexAddressFromPrincipal(ic.id(), 0);
}

export function getCanisterCycles(): Query<nat64> {
    return ic.canisterBalance();
}

export {
    getSigners,
    getSignerProposals,
    proposeSigner,
    voteOnSignerProposal
} from './signers';
export {
    getThreshold,
    getThresholdProposals,
    proposeThreshold,
    voteOnThresholdProposal
} from './threshold';
export {
    getTransfers,
    getTransferProposals,
    proposeTransfer,
    voteOnTransferProposal
} from './transfers';