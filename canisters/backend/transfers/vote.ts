// TODO use a getMutator and State['index'] types

import {
    CanisterResult,
    ic,
    Principal,
    UpdateAsync
} from 'azle';
import {
    binary_address_from_address,
    TransferFee,
    TransferResult
} from 'azle/canisters/icp';
import {
    ICPCanister,
    state
} from '../backend';
import { is_signer } from '../signers';
import {
    Vote,
    VoteOnProposalResult,
    VoteOnTransferProposalChecksResult,
    State
} from '../types';

export function* vote_on_transfer_proposal(
    transfer_proposal_id: string,
    adopt: boolean
): UpdateAsync<VoteOnProposalResult> {
    const caller = ic.caller();
    
    const checks_result = perform_checks(
        caller,
        transfer_proposal_id,
        state.transfer_proposals
    );

    if (checks_result.ok === undefined) {
        return {
            err: checks_result.err
        };
    }

    // TODO once we can do cross-canister calls in nested functions
    // TODO redo this section like the other proposal types, with a getMutator
    let transfer_proposal = checks_result.ok;

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
        const transfer_fee_result: CanisterResult<TransferFee> = yield ICPCanister.transfer_fee({});

        if (transfer_fee_result.ok === undefined) {
            return {
                err: transfer_fee_result.err
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

        if (canister_result.ok === undefined) {
            return {
                err: canister_result.err
            };
        }

        const transfer_result = canister_result.ok;

        if (transfer_result.Ok === undefined) {
            // TODO JSON.stringify would be nicer to return the error, but Boa I believe is panicing
            // TODO I think it is because BigInt isn't being serialized easily, so if you can use that one neat trick toString
            if (transfer_result.Err?.BadFee !== undefined) {
                return {
                    err: 'BadFee'
                };
            }

            if (transfer_result.Err?.InsufficientFunds !== undefined) {
                // TODO fix this one https://github.com/demergent-labs/azle/issues/225
                const balance = (transfer_result.Err.InsufficientFunds as any).e8s;

                return {
                    err: `InsufficientFunds ${balance}`
                };
            }

            if (transfer_result.Err?.TxCreatedInFuture !== undefined) {
                return {
                    err: 'TxCreatedInFuture'
                };
            }

            if (transfer_result.Err?.TxDuplicate !== undefined) {
                return {
                    err: 'TxDuplicate'
                };
            }

            if (transfer_result.Err?.TxTooOld !== undefined) {
                return {
                    err: 'TxTooOld'
                };
            }

            return {
                err: 'This should not happen'
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
    }

    if (reject_votes.length > Object.keys(state.signers).length - state.threshold) {
        transfer_proposal.votes = new_votes;
        transfer_proposal.rejected = true;
        transfer_proposal.rejected_at = ic.time();

        return {
            ok: {
                rejected: null
            }
        };
    }

    transfer_proposal.votes = new_votes;

    return {
        ok: {
            voted: null
        }
    };
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