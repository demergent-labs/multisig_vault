import {
    ic,
    ok,
    Principal,
    Update
} from 'azle';
import { state } from '../backend';
import { is_signer } from '../signers';
import {
    State,
    ThresholdProposal,
    Vote,
    VoteMutator,
    VoteOnProposalResult,
    VoteOnThresholdProposalChecksResult
} from '../types';

export function vote_on_threshold_proposal(
    threshold_proposal_id: string,
    adopt: boolean
): Update<VoteOnProposalResult> {
    const caller = ic.caller();

    const checks_result = perform_checks(
        adopt,
        caller,
        threshold_proposal_id,
        state.threshold_proposals,
        state.signers,
        state.transfer_proposals
    );

    if (!ok(checks_result)) {
        return {
            err: checks_result.err
        };
    }

    const threshold_proposal = checks_result.ok;

    const mutator = get_mutator(
        caller,
        adopt,
        state,
        threshold_proposal,
        state.threshold,
        state.signers
    );

    const vote_on_proposal_result = mutator();

    return vote_on_proposal_result;
}

function perform_checks(
    adopt: boolean,
    caller: Principal,
    threshold_proposal_id: string,
    threshold_proposals: State['threshold_proposals'],
    signers: State['signers'],
    transfer_proposals: State['transfer_proposals']
): VoteOnThresholdProposalChecksResult {
    if (is_signer(caller) === false) {
        return {
            err: 'Only signers can vote on proposals'
        };
    }

    const threshold_proposal = threshold_proposals[threshold_proposal_id];

    if (threshold_proposal === undefined) {
        return {
            err: `No threshold proposal found for threshold proposal id ${threshold_proposal_id}`
        };
    }

    if (threshold_proposal.adopted === true) {
        return {
            err: `Threshold proposal ${threshold_proposal_id} already adopted`
        };
    }

    if (threshold_proposal.rejected === true) {
        return {
            err: `Threshold proposal ${threshold_proposal_id} already rejected`
        };
    }

    const already_voted = threshold_proposal.votes.find((vote) => vote.voter === caller) !== undefined;

    if (already_voted === true) {
        return {
            err: `You have already voted on this proposal`
        };
    }

    if (threshold_proposal.threshold === 0) {
        return {
            err: 'Threshold cannot be 0'
        }
    }

    if (threshold_proposal.threshold > Object.keys(signers).length) {
        return {
            err: 'Threshold cannot be greater than number of signers'
        };
    }

    const open_transfer_proposals = Object.values(transfer_proposals).filter((transfer_proposal) => transfer_proposal?.adopted === false && transfer_proposal?.rejected === false);

    if (
        adopt === true &&
        open_transfer_proposals.length > 0
    ) {
        return {
            err: `All transfer proposals must be adopted or rejected before changing the threshold`
        };
    }

    return {
        ok: threshold_proposal
    };
}

function get_mutator(
    caller: Principal,
    adopt: boolean,
    state: State,
    threshold_proposal: ThresholdProposal,
    threshold: State['threshold'],
    signers: State['signers']
): VoteMutator {
    const new_votes: Vote[] = [
        ...threshold_proposal.votes,
        {
            voter: caller,
            adopt
        }
    ];

    const adopt_votes = new_votes.filter((vote) => vote.adopt === true);
    const reject_votes = new_votes.filter((vote) => vote.adopt === false);

    if (adopt_votes.length >= threshold) {
        return () => {
            state.threshold = threshold_proposal.threshold;

            threshold_proposal.votes = new_votes;
            threshold_proposal.adopted = true;
            threshold_proposal.adopted_at = ic.time();
    
            return {
                ok: {
                    adopted: null
                }
            };
        };
    }

    if (reject_votes.length > Object.keys(signers).length - threshold) {
        return () => {
            threshold_proposal.votes = new_votes;
            threshold_proposal.rejected = true;
            threshold_proposal.rejected_at = ic.time();

            return {
                ok: {
                    rejected: null
                }
            };
        };
    }

    return () => {
        threshold_proposal.votes = new_votes;

        return {
            ok: {
                voted: null
            }
        };
    };
}