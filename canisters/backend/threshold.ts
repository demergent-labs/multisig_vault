import {
    Query,
    CanisterResult,
    UpdateAsync,
    ic,
    Update,
    nat8
} from 'azle';
import { state } from './backend';
import { isSigner } from './signers';
import {
    ThresholdProposal,
    DefaultResult,
    VoteOnProposalResult,
    Vote
} from './types';
import { Management } from 'azle/canisters/management';
import { sha224 } from 'hash.js';

export function getThreshold(): Query<nat8> {
    return state.threshold;
}

export function getThresholdProposals(): Query<ThresholdProposal[]> {
    return Object.values(state.thresholdProposals) as ThresholdProposal[];
}

export function* proposeThreshold(
    description: string,
    threshold: nat8
): UpdateAsync<DefaultResult> {
    const caller = ic.caller();

    if (isSigner(caller) === false) {
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

    const id = sha224().update(id_result.ok).digest('hex');

    state.thresholdProposals[id] = {
        id,
        proposer: caller,
        description,
        threshold,
        votes: [],
        adopted: false,
        rejected: false
    };

    return {
        ok: true
    };
}

export function voteOnThresholdProposal(
    thresholdProposalId: string,
    adopt: boolean
): Update<VoteOnProposalResult> {
    const caller = ic.caller();

    if (isSigner(caller) === false) {
        return {
            err: 'Only signers can approve a threshold proposal'
        };
    }

    let thresholdProposal = state.thresholdProposals[thresholdProposalId];

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

    const alreadyVoted = thresholdProposal.votes.find((vote) => vote.voter === caller) !== undefined;

    if (alreadyVoted === true) {
        return {
            err: `You have already voted on this proposal`
        };
    }

    const newVotes: Vote[] = [
        ...thresholdProposal.votes,
        {
            voter: caller,
            adopt
        }
    ];

    const adoptVotes = newVotes.filter((vote) => vote.adopt === true);
    const rejectVotes = newVotes.filter((vote) => vote.adopt === false);

    if (adoptVotes.length >= state.threshold) {
        state.threshold = thresholdProposal.threshold;

        thresholdProposal.votes = newVotes;
        thresholdProposal.adopted = true;

        return {
            ok: {
                adopted: null
            }
        };
    }

    if (rejectVotes.length > Object.keys(state.signers).length - state.threshold) {
        thresholdProposal.votes = newVotes;
        thresholdProposal.rejected = true;

        return {
            ok: {
                rejected: null
            }
        };
    }

    thresholdProposal.votes = newVotes;

    return {
        ok: {
            voted: null
        }
    };
}