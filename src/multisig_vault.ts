import {
    Principal,
    nat8,
    Init,
    UpdateAsync,
    nat64
} from 'azle';
import {
    State
} from './types';

export let state: State = {
    signers: {},
    signerProposals: {},
    transferProposals: {},
    thresholdProposals: {},
    threshold: 0
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

export function* getVaultBalance(): UpdateAsync<nat64> {
    // TODO retrieve this canister's balance off of the ledger

    return 0n;
}

export {
    getSigners,
    getSignerProposals,
    proposeSigner,
    approveSignerProposal
} from './signers';
export {
    getThreshold,
    getThresholdProposals,
    proposeThreshold,
    approveThresholdProposal
} from './threshold';
export {
    getTransferProposals,
    proposeTransfer,
    approveTransferProposal
} from './transfers';