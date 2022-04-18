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
        caller,
        signerProposalId,
        state.signerProposals
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

function performChecks(
    caller: Principal,
    signerProposalId: string,
    signerProposals: State['signerProposals']
): VoteOnSignerProposalChecksResult {
    if (isSigner(caller) === false) {
        return {
            err: 'Only signers can approve a signer proposal'
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
            state.signers[signerProposal.signer] = signerProposal.signer;
    
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