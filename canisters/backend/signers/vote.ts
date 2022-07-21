import { ic, ok, Principal, Update } from 'azle';
import { state } from '../backend';
import { is_signer } from './index';
import {
    SignerProposal,
    State,
    Vote,
    VoteMutator,
    VoteOnProposalResult,
    VoteOnSignerProposalChecksResult
} from '../types';

export function vote_on_signer_proposal(
    signer_proposal_id: string,
    adopt: boolean
): Update<VoteOnProposalResult> {
    const caller = ic.caller();

    const checks_result = perform_checks(
        adopt,
        caller,
        signer_proposal_id,
        state.signer_proposals,
        state.signers,
        state.threshold,
        state.transfer_proposals
    );

    if (!ok(checks_result)) {
        return {
            err: checks_result.err
        };
    }

    let signer_proposal = checks_result.ok;

    const mutator = get_mutator(
        caller,
        adopt,
        signer_proposal,
        state.threshold,
        state.signers
    );

    const vote_on_proposal_result = mutator();

    return vote_on_proposal_result;
}

function perform_checks(
    adopt: boolean,
    caller: Principal,
    signer_proposal_id: string,
    signer_proposals: State['signer_proposals'],
    signers: State['signers'],
    threshold: State['threshold'],
    transfer_proposals: State['transfer_proposals']
): VoteOnSignerProposalChecksResult {
    if (is_signer(caller) === false) {
        return {
            err: 'Only signers can vote on proposals'
        };
    }

    const signer_proposal = signer_proposals[signer_proposal_id];

    if (signer_proposal === undefined) {
        return {
            err: `No signer proposal found for signer proposal id ${signer_proposal_id}`
        };
    }

    if (signer_proposal.adopted === true) {
        return {
            err: `Signer proposal ${signer_proposal_id} already adopted`
        };
    }

    if (signer_proposal.rejected === true) {
        return {
            err: `Signer proposal ${signer_proposal_id} already rejected`
        };
    }

    const already_voted =
        signer_proposal.votes.find((vote) => vote.voter === caller) !==
        undefined;

    if (already_voted === true) {
        return {
            err: `You have already voted on this proposal`
        };
    }

    if (
        signer_proposal.remove === true &&
        signers[signer_proposal.signer.toText()] === undefined
    ) {
        return {
            err: `Signer ${signer_proposal.signer} does not exist`
        };
    }

    const open_transfer_proposals = Object.values(transfer_proposals).filter(
        (transfer_proposal) =>
            transfer_proposal?.adopted === false &&
            transfer_proposal?.rejected === false
    );

    if (adopt === true && open_transfer_proposals.length > 0) {
        return {
            err: `All transfer proposals must be adopted or rejected before changing signers`
        };
    }

    if (
        signer_proposal.remove === true &&
        adopt === true &&
        Object.keys(signers).length - 1 < threshold
    ) {
        return {
            err: `The number of signers cannot be less than the current threshold`
        };
    }

    return {
        ok: signer_proposal
    };
}

function get_mutator(
    caller: Principal,
    adopt: boolean,
    signer_proposal: SignerProposal,
    threshold: State['threshold'],
    signers: State['signers']
): VoteMutator {
    const new_votes: Vote[] = [
        ...signer_proposal.votes,
        {
            voter: caller,
            adopt
        }
    ];

    const adopt_votes = new_votes.filter((vote) => vote.adopt === true);
    const reject_votes = new_votes.filter((vote) => vote.adopt === false);

    if (adopt_votes.length >= threshold) {
        return () => {
            if (signer_proposal.remove === true) {
                delete state.signers[signer_proposal.signer.toText()];
            } else {
                state.signers[signer_proposal.signer.toText()] =
                    signer_proposal.signer;
            }

            signer_proposal.votes = new_votes;
            signer_proposal.adopted = true;
            signer_proposal.adopted_at = ic.time();

            return {
                ok: {
                    adopted: null
                }
            };
        };
    }

    if (reject_votes.length > Object.keys(signers).length - threshold) {
        return () => {
            signer_proposal.votes = new_votes;
            signer_proposal.rejected = true;
            signer_proposal.rejected_at = ic.time();

            return {
                ok: {
                    rejected: null
                }
            };
        };
    }

    return () => {
        signer_proposal.votes = new_votes;

        return {
            ok: {
                voted: null
            }
        };
    };
}
