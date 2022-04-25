import {
    ic,
    Principal,
    Update
} from 'azle';
import { state } from '../backend';
import { isSigner } from './index';
import {
    SignerProposal,
    State,
    Vote,
    VoteMutator,
    VoteOnProposalResult,
    VoteOnSignerProposalChecksResult
} from '../types';

export function voteOnSignerProposal(
    signerProposalId: string,
    adopt: boolean
): Update<VoteOnProposalResult> {
    const caller = ic.caller();
        
    const checks_result = performChecks(
        adopt,
        caller,
        signerProposalId,
        state.signerProposals,
        state.signers,
        state.threshold,
        state.transferProposals
    );

    if (checks_result.ok === undefined) {
        return {
            err: checks_result.err
        };
    }

    let signerProposal = checks_result.ok;

    const mutator = getMutator(
        caller,
        adopt,
        state,
        signerProposal
    );

    const vote_on_proposal_result = mutator();

    return vote_on_proposal_result;
}

// TODO make sure that we use index types on State wherever possible
function performChecks(
    adopt: boolean,
    caller: Principal,
    signerProposalId: string,
    signerProposals: State['signerProposals'],
    signers: State['signers'],
    threshold: State['threshold'],
    transferProposals: State['transferProposals']
): VoteOnSignerProposalChecksResult {
    if (isSigner(caller) === false) {
        return {
            err: 'Only signers can vote on proposals'
        };
    }

    const signerProposal = signerProposals[signerProposalId];

    if (signerProposal === undefined) {
        return {
            err: `No signer proposal found for signer proposal id ${signerProposalId}`
        };
    }

    if (signerProposal.adopted === true) {
        return {
            err: `Signer proposal ${signerProposalId} already adopted`
        };
    }

    if (signerProposal.rejected === true) {
        return {
            err: `Signer proposal ${signerProposalId} already rejected`
        };
    }

    const alreadyVoted = signerProposal.votes.find((vote) => vote.voter === caller) !== undefined;

    if (alreadyVoted === true) {
        return {
            err: `You have already voted on this proposal`
        };
    }

    if (
        signerProposal.remove === true &&
        signers[signerProposal.signer] === undefined
    ) {
        return {
            err: `Signer ${signerProposal.signer} does not exist`
        };
    }

    const open_transfer_proposals = Object.values(transferProposals).filter((transfer_proposal) => transfer_proposal?.adopted === false && transfer_proposal?.rejected === false);

    if (
        adopt === true &&
        open_transfer_proposals.length > 0
    ) {
        return {
            err: `All transfer proposals must be adopted or rejected before changing signers`
        };
    }

    if (
        signerProposal.remove === true &&
        Object.keys(signers).length - 1 < threshold
    ) {
        return {
            err: `The number of signers cannot be less than the current threshold`
        };
    }

    return {
        ok: signerProposal
    };
}

function getMutator(
    caller: Principal,
    adopt: boolean,
    state: State,
    signerProposal: SignerProposal
): VoteMutator {
    const newVotes: Vote[] = [
        ...signerProposal.votes,
        {
            voter: caller,
            adopt
        }
    ];

    const adoptVotes = newVotes.filter((vote) => vote.adopt === true);
    const rejectVotes = newVotes.filter((vote) => vote.adopt === false);

    if (adoptVotes.length >= state.threshold) {
        return () => {
            if (signerProposal.remove === true) {
                delete state.signers[signerProposal.signer];
            }
            else {
                state.signers[signerProposal.signer] = signerProposal.signer;
            }
    
            signerProposal.votes = newVotes;
            signerProposal.adopted = true;
            signerProposal.adopted_at = ic.time();
            
            return {
                ok: {
                    adopted: null
                }
            };
        }
    }

    if (rejectVotes.length > Object.keys(state.signers).length - state.threshold) {        
        return () => {
            signerProposal.votes = newVotes;
            signerProposal.rejected = true;
            signerProposal.rejected_at = ic.time();

            return {
                ok: {
                    rejected: null
                }
            };
        };
    }

    return () => {
        signerProposal.votes = newVotes;

        return {
            ok: {
                voted: null
            }
        };
    }
}