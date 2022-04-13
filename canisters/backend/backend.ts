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
import { binaryAddressFromPrincipal } from './address';

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

export const ICPCanister = ic.canisters.ICP<ICP>('rno2w-sqaaa-aaaaa-aaacq-cai');

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

export function* getVaultBalance(): UpdateAsync<nat64> {
    const result: CanisterResult<Tokens> = yield ICPCanister.account_balance({
        account: binaryAddressFromPrincipal(ic.id())
    });

    // TODO we should probably return a result here
    if (result.ok !== undefined) {
        return result.ok.e8s;
    }
    else {
        return 0n;
    }
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