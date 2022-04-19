import {
    ic,
    Principal,
    Update
} from 'azle';
import { state } from '../backend';
import {
    State,
    ThresholdProposal,
    Vote,
    VoteMutator,
    VoteOnProposalResult,
    VoteOnThresholdProposalChecksResult
} from '../types';

export function voteOnThresholdProposal(
    thresholdProposalId: string,
    adopt: boolean
): Update<VoteOnProposalResult> {
    const caller = ic.caller();

    const checks_result = performChecks(
        caller,
        thresholdProposalId,
        state.thresholdProposals,
        state.signers
    );

    if (checks_result.ok === undefined) {
        return {
            err: checks_result.err
        };
    }

    const thresholdProposal = checks_result.ok;

    const mutator = getMutator(
        caller,
        adopt,
        state,
        thresholdProposal
    );

    const vote_on_proposal_result = mutator();

    return vote_on_proposal_result;
}

function performChecks(
    caller: Principal,
    thresholdProposalId: string,
    thresholdProposals: State['thresholdProposals'],
    signers: State['signers']
): VoteOnThresholdProposalChecksResult {
    const thresholdProposal = thresholdProposals[thresholdProposalId];

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

    if (thresholdProposal.rejected === true) {
        return {
            err: `Threshold proposal ${thresholdProposalId} already rejected`
        };
    }

    const alreadyVoted = thresholdProposal.votes.find((vote) => vote.voter === caller) !== undefined;

    if (alreadyVoted === true) {
        return {
            err: `You have already voted on this proposal`
        };
    }

    if (thresholdProposal.threshold === 0) {
        return {
            err: 'Threshold cannot be 0'
        }
    }

    if (thresholdProposal.threshold > Object.keys(signers).length) {
        return {
            err: 'Threshold cannot be greater than number of signers'
        };
    }

    return {
        ok: thresholdProposal
    };
}

function getMutator(
    caller: Principal,
    adopt: boolean,
    state: State,
    thresholdProposal: ThresholdProposal
): VoteMutator {
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
        return () => {
            state.threshold = thresholdProposal.threshold;

            thresholdProposal.votes = newVotes;
            thresholdProposal.adopted = true;
            thresholdProposal.adopted_at = ic.time();
    
            return {
                ok: {
                    adopted: null
                }
            };
        };
    }

    if (rejectVotes.length > Object.keys(state.signers).length - state.threshold) {
        return () => {
            thresholdProposal.votes = newVotes;
            thresholdProposal.rejected = true;
            thresholdProposal.rejected_at = ic.time();

            return {
                ok: {
                    rejected: null
                }
            };
        };
    }

    return () => {
        thresholdProposal.votes = newVotes;

        return {
            ok: {
                voted: null
            }
        };
    };
}