import {
    ic,
    Principal,
    Update
} from 'azle';
import { state } from '../backend';
import { isSigner } from '../signers';
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
        adopt,
        caller,
        thresholdProposalId,
        state.thresholdProposals,
        state.signers,
        state.transferProposals
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
        thresholdProposal,
        state.threshold,
        state.signers
    );

    const vote_on_proposal_result = mutator();

    return vote_on_proposal_result;
}

function performChecks(
    adopt: boolean,
    caller: Principal,
    thresholdProposalId: string,
    thresholdProposals: State['thresholdProposals'],
    signers: State['signers'],
    transferProposals: State['transferProposals']
): VoteOnThresholdProposalChecksResult {
    if (isSigner(caller) === false) {
        return {
            err: 'Only signers can vote on proposals'
        };
    }

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

    const open_transfer_proposals = Object.values(transferProposals).filter((transfer_proposal) => transfer_proposal?.adopted === false && transfer_proposal?.rejected === false);

    if (
        adopt === true &&
        open_transfer_proposals.length > 0
    ) {
        return {
            err: `All transfer proposals must be adopted or rejected before changing the threshold`
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
    thresholdProposal: ThresholdProposal,
    threshold: State['threshold'],
    signers: State['signers']
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

    if (adoptVotes.length >= threshold) {
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

    if (rejectVotes.length > Object.keys(signers).length - threshold) {
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