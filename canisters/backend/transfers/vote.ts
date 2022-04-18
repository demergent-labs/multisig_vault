import {
    CanisterResult,
    ic,
    Principal,
    UpdateAsync
} from 'azle';
import {
    binaryAddressFromAddress,
    TransferFee,
    TransferResult
} from 'azle/canisters/icp';
import {
    ICPCanister,
    state
} from '../backend';
import { isSigner } from '../signers';
import {
    Vote,
    VoteOnProposalResult,
    VoteOnTransferProposalChecksResult,
    State
} from '../types';

export function* voteOnTransferProposal(
    transferProposalId: string,
    adopt: boolean
): UpdateAsync<VoteOnProposalResult> {
    const caller = ic.caller();
    
    const checks_result = performChecks(
        caller,
        transferProposalId,
        state.transferProposals
    );

    if (checks_result.ok === undefined) {
        return {
            err: checks_result.err
        };
    }

    // TODO once we can do cross-canister calls in nested functions
    // TODO redo this section like the other proposal types, with a getMutator
    let transferProposal = checks_result.ok;

    const newVotes: Vote[] = [
        ...transferProposal.votes,
        {
            voter: caller,
            adopt
        }
    ];

    const adoptVotes = newVotes.filter((vote) => vote.adopt === true);
    const rejectVotes = newVotes.filter((vote) => vote.adopt === false);

    if (adoptVotes.length >= state.threshold) {
        const transfer_fee_result: CanisterResult<TransferFee> = yield ICPCanister.transfer_fee({});

        if (transfer_fee_result.ok === undefined) {
            return {
                err: transfer_fee_result.err
            };
        }

        const canister_result: CanisterResult<TransferResult> = yield ICPCanister.transfer({
            memo: 0n,
            amount: {
                e8s: transferProposal.amount,
            },
            fee: transfer_fee_result.ok.transfer_fee,
            from_subaccount: null,
            to: binaryAddressFromAddress(transferProposal.destinationAddress),
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

        transferProposal.votes = newVotes;
        transferProposal.adopted = true;
        transferProposal.adopted_at = ic.time();

        return {
            ok: {
                adopted: null
            }
        };
    }

    if (rejectVotes.length > Object.keys(state.signers).length - state.threshold) {
        transferProposal.votes = newVotes;
        transferProposal.rejected = true;
        transferProposal.rejected_at = ic.time();

        return {
            ok: {
                rejected: null
            }
        };
    }

    transferProposal.votes = newVotes;

    return {
        ok: {
            voted: null
        }
    };
}

function performChecks(
    caller: Principal,
    transferProposalId: string,
    transferProposals: State['transferProposals']
): VoteOnTransferProposalChecksResult {
    if (isSigner(caller) === false) {
        return {
            err: 'Only signers can approve a transfer proposal'
        };
    }

    const transferProposal = transferProposals[transferProposalId];

    if (transferProposal === undefined) {
        return {
            err: `No transfer proposal found for transfer proposal id ${transferProposalId}`
        };
    }

    if (transferProposal.adopted === true) {
        return {
            err: `Transfer proposal ${transferProposalId} already adopted`
        };
    }

    if (transferProposal.rejected === true) {
        return {
            err: `Transfer proposal ${transferProposalId} already rejected`
        };
    }

    const alreadyVoted = transferProposal.votes.find((vote) => vote.voter === caller) !== undefined;

    if (alreadyVoted === true) {
        return {
            err: `You have already voted on this proposal`
        };
    }

    return {
        ok: transferProposal
    };
}