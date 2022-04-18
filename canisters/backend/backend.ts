import {
    Principal,
    nat8,
    Init,
    UpdateAsync,
    nat64,
    Query,
    ic,
    CanisterResult
} from 'azle';
import {
    State
} from './types';
import {
    ICP,
    Tokens
} from './icp';
import {
    binaryAddressFromPrincipal,
    hexAddressFromPrincipal
} from './address';
import { process } from './process_polyfill';

// TODO add a get controllers method and a get cycles method
// TODO it would be cool if the cycles usage could be calculated somehow

export let state: State = {
    signers: {},
    signerProposals: {},
    transfers: {},
    transferProposals: {},
    threshold: 0,
    thresholdProposals: {}
};

export const ICPCanister = ic.canisters.ICP<ICP>(process.env.ICP_LEDGER_CANISTER_ID);

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

export function getProcess(): Query<string> {
    return JSON.stringify(process);
}

export function* getVaultBalance(): UpdateAsync<nat64> {
    const result: CanisterResult<Tokens> = yield ICPCanister.account_balance({
        account: binaryAddressFromPrincipal(ic.id(), 0)
    });

    // TODO we should probably return a result here
    if (result.ok !== undefined) {
        return result.ok.e8s;
    }
    else {
        return 0n;
    }
}

export function getCanisterPrincipal(): Query<string> {
    return ic.id();
}

export function getCanisterAddress(): Query<string> {
    return hexAddressFromPrincipal(ic.id(), 0);
}

export function getAddress(principal: Principal): Query<string> {
    return hexAddressFromPrincipal(principal, 0);
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