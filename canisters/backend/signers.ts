import {
    Query,
    CanisterResult,
    UpdateAsync,
    ic,
    Principal,
    Update
} from 'azle';
import { Management } from 'azle/canisters/management';
import { sha224 } from 'hash.js';
import { state } from './backend';
import {
    VoteOnProposalResult,
    DefaultResult,
    SignerProposal,
    Vote
} from './types';

export function getSigners(): Query<Principal[]> {
    return Object.values(state.signers) as Principal[];
}

export function getSignerProposals(): Query<SignerProposal[]> {
    return Object.values(state.signerProposals) as SignerProposal[];
}

export function* proposeSigner(
    description: string,
    signer: Principal
): UpdateAsync<DefaultResult> {
    const caller = ic.caller();

    if (isSigner(caller) === false) {
        return {
            err: 'Only signers can propose a signer'
        };
    }

    const id_result: CanisterResult<string> = yield ic.canisters.Management<Management>('aaaaa-aa').raw_rand();

    if (id_result.ok === undefined) {
        return {
            err: id_result.err
        };
    }

    const id = sha224().update(id_result.ok).digest('hex');

    state.signerProposals[id] = {
        id,
        proposer: caller,
        description,
        signer,
        votes: [],
        adopted: false,
        rejected: false
    };

    return {
        ok: true
    };
}

export function voteOnSignerProposal(
    signerProposalId: string,
    adopt: boolean
): Update<VoteOnProposalResult> {
    const caller = ic.caller();
    
    if (isSigner(caller) === false) {
        return {
            err: 'Only signers can approve a signer proposal'
        };
    }

    let signerProposal = state.signerProposals[signerProposalId];

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

    const alreadyVoted = signerProposal.votes.find((vote) => vote.voter === caller) !== undefined;

    if (alreadyVoted === true) {
        return {
            err: `You have already voted on this proposal`
        };
    }

    const newVotes: Vote[] = [
        ...signerProposal.votes,
        {
            voter: caller,
            adopt
        }
    ];

    signerProposal.votes = newVotes;

    const adoptVotes = newVotes.filter((vote) => vote.adopt === true);
    const rejectVotes = newVotes.filter((vote) => vote.adopt === false);

    if (adoptVotes.length >= state.threshold) {
        state.signers[signerProposal.signer] = signerProposal.signer;
        signerProposal.adopted = true;

        return {
            ok: {
                adopted: null
            }
        };
    }

    if (rejectVotes.length > Object.keys(state.signers).length - state.threshold) {
        signerProposal.rejected = true;

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

export function isSigner(signer: Principal): boolean {
    if (state.signers[signer] === signer) {
        return true;
    }

    return false;
}