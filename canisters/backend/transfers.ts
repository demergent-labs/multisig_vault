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
import { state } from './backend';
import { isSigner } from './signers';
import {
    TransferProposal,
    DefaultResult,
    VoteOnProposalResult,
    Transfer,
    Vote
} from './types';
import { Management } from 'azle/canisters/management';
import { sha224 } from 'hash.js';

export function getTransfers(): Query<Transfer[]> {
    return Object.values(state.transfers) as Transfer[];
}

export function getTransferProposals(): Query<TransferProposal[]> {
    return Object.values(state.transferProposals) as TransferProposal[];
}

// TODO should we check to make sure that we have a sufficient balance? That would be cool
export function* proposeTransfer(
    destinationAddress: string,
    amount: nat64
): UpdateAsync<DefaultResult> {
    const caller = ic.caller();

    if (isSigner(caller) === false) {
        return {
            err: 'Only signers can propose a transfer'
        };
    }

    // TODO check that there is enough ICP in the vault to initiate this transfer

    const id_result: CanisterResult<string> = yield ic.canisters.Management<Management>('aaaaa-aa').raw_rand();

    if (id_result.ok === undefined) {
        return {
            err: id_result.err
        };
    }

    const id = sha224().update(id_result.ok).digest('hex');

    state.transferProposals[id] = {
        id,
        proposer: caller,
        destinationAddress,
        amount,
        votes: [],
        adopted: false,
        rejected: false
    };

    return {
        ok: true
    };
}

export function voteOnTransferProposal(
    transferProposalId: string,
    adopt: boolean
): Update<VoteOnProposalResult> {
    const caller = ic.caller();
    
    if (isSigner(caller) === false) {
        return {
            err: 'Only signers can approve a transfer proposal'
        };
    }

    let transferProposal = state.transferProposals[transferProposalId];

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

    const alreadyVoted = transferProposal.votes.find((vote) => vote.voter === caller) !== undefined;

    if (alreadyVoted === true) {
        return {
            err: `You have already voted on this proposal`
        };
    }

    const newVotes: Vote[] = [
        ...transferProposal.votes,
        {
            voter: caller,
            adopt
        }
    ];

    transferProposal.votes = newVotes;

    const adoptVotes = transferProposal.votes.filter((vote) => vote.adopt === true);
    const rejectVotes = transferProposal.votes.filter((vote) => vote.adopt === false);

    if (adoptVotes.length >= state.threshold) {
        // TODO execute the ICP transfer

        transferProposal.adopted = true;

        return {
            ok: {
                adopted: null
            }
        };
    }

    if (rejectVotes.length > Object.keys(state.signers).length - state.threshold) {
        transferProposal.rejected = true;

        return {
            ok: {
                rejected: null
            }
        };
    }

    return {
        ok: {
            voted: null
        }
    };
}