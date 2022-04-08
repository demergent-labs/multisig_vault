import {
    Principal,
    nat8,
    Init
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

export {
    getSigners,
    getSignerProposals,
    proposeSigner,
    approveSigner
} from './signers';
export {
    getThreshold
} from './threshold';
export {
    getTransferProposals,
    proposeTransfer,
    approveTransfer
} from './transfers';