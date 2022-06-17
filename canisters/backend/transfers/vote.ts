import {
    CanisterResult,
    ic,
    ok,
    Principal,
    UpdateAsync
} from 'azle';
import {
    binary_address_from_address,
    TransferFee,
    TransferResult
} from 'azle/canisters/ledger';
import {
    ICPCanister,
    state
} from '../backend';
import { is_signer } from '../signers';
import {
    State,
    TransferProposal,
    TransferVoteMutator,
    Vote,
    VoteOnTransferProposalChecksResult,
    VoteOnTransferProposalResult
} from '../types';

export function* vote_on_transfer_proposal(
    transfer_proposal_id: string,
    adopt: boolean
): UpdateAsync<VoteOnTransferProposalResult> {
    const caller = ic.caller();
    
    const checks_result = perform_checks(
        caller,
        transfer_proposal_id,
        state.transfer_proposals
    );

    if (!ok(checks_result)) {
        return {
            err: {
                message: checks_result.err
            }
        };
    }

    let transfer_proposal = checks_result.ok;

    const mutator = get_mutator(
        caller,
        adopt,
        state,
        transfer_proposal
    );

    const vote_on_proposal_result: VoteOnTransferProposalResult = yield mutator();

    return vote_on_proposal_result;
}

function perform_checks(
    caller: Principal,
    transfer_proposal_id: string,
    transfer_proposals: State['transfer_proposals']
): VoteOnTransferProposalChecksResult {
    if (is_signer(caller) === false) {
        return {
            err: 'Only signers can vote on proposals'
        };
    }

    const transfer_proposal = transfer_proposals[transfer_proposal_id];

    if (transfer_proposal === undefined) {
        return {
            err: `No transfer proposal found for transfer proposal id ${transfer_proposal_id}`
        };
    }

    if (transfer_proposal.adopted === true) {
        return {
            err: `Transfer proposal ${transfer_proposal_id} already adopted`
        };
    }

    if (transfer_proposal.rejected === true) {
        return {
            err: `Transfer proposal ${transfer_proposal_id} already rejected`
        };
    }

    const already_voted = transfer_proposal.votes.find((vote) => vote.voter === caller) !== undefined;

    if (already_voted === true) {
        return {
            err: `You have already voted on this proposal`
        };
    }

    return {
        ok: transfer_proposal
    };
}

function get_mutator(
    caller: Principal,
    adopt: boolean,
    state: State,
    transfer_proposal: TransferProposal
): TransferVoteMutator {
    const new_votes: Vote[] = [
        ...transfer_proposal.votes,
        {
            voter: caller,
            adopt
        }
    ];

    const adopt_votes = new_votes.filter((vote) => vote.adopt === true);
    const reject_votes = new_votes.filter((vote) => vote.adopt === false);

    if (adopt_votes.length >= state.threshold) {
        return function* () {
            const transfer_fee_result: CanisterResult<TransferFee> = yield ICPCanister.transfer_fee({});
    
            if (!ok(transfer_fee_result)) {
                return {
                    err: {
                        message: transfer_fee_result.err
                    }
                };
            }
    
            const canister_result: CanisterResult<TransferResult> = yield ICPCanister.transfer({
                memo: 0n,
                amount: {
                    e8s: transfer_proposal.amount,
                },
                fee: transfer_fee_result.ok.transfer_fee,
                from_subaccount: null,
                to: binary_address_from_address(transfer_proposal.destination_address),
                created_at_time: null
            });
    
            if (!ok(canister_result)) {
                return {
                    err: {
                        message: canister_result.err
                    }
                };
            }
    
            const transfer_result = canister_result.ok;
    
            if (transfer_result.Err !== undefined) {
                return {
                    err: {
                        transfer_error: transfer_result.Err
                    }
                };
            }
    
            transfer_proposal.votes = new_votes;
            transfer_proposal.adopted = true;
            transfer_proposal.adopted_at = ic.time();
    
            return {
                ok: {
                    adopted: null
                }
            };
        };
    }

    if (reject_votes.length > Object.keys(state.signers).length - state.threshold) {
        transfer_proposal.votes = new_votes;
        transfer_proposal.rejected = true;
        transfer_proposal.rejected_at = ic.time();

        return function* () {
            return {
                ok: {
                    rejected: null
                }
            };
        };
    }

    transfer_proposal.votes = new_votes;

    return function* () {
        return {
            ok: {
                voted: null
            }
        };
    };
}