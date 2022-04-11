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