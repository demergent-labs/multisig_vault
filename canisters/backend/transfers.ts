import {
    Query,
    CanisterResult,
    UpdateAsync,
    ic,
    nat64,
    Update,
    Principal
} from 'azle';
import {
    ICP,
    NameResult,
    TransferFee,
    Tokens,
    TransferResult
} from './icp';
import {
    state,
    ICPCanister
} from './backend';
import { isSigner } from './signers';
import {
    TransferProposal,
    DefaultResult,
    VoteOnProposalResult,
    Transfer,
    Vote
} from './types';
import { Management } from 'azle/canisters/management';
import { sha224 } from 'hash.js';
import {
    binaryAddressFromAddress,
    binaryAddressFromPrincipal
} from './address';

export function getTransfers(): Query<Transfer[]> {
    return Object.values(state.transfers) as Transfer[];
}

export function getTransferProposals(): Query<TransferProposal[]> {
    return Object.values(state.transferProposals) as TransferProposal[];
}

export function* proposeTransfer(
    description: string,
    destinationAddress: string,
    amount: nat64
): UpdateAsync<DefaultResult> {
    const caller = ic.caller();

    if (isSigner(caller) === false) {
        return {
            err: 'Only signers can propose a transfer'
        };
    }

    const account_balance_result: CanisterResult<Tokens> = yield ICPCanister.account_balance({
        account: binaryAddressFromPrincipal(ic.id())
    });

    if (account_balance_result.ok === undefined) {
        return {
            err: 'Could not retrieve the canister balance'
        };
    }
    
    const transfer_fee_result: CanisterResult<TransferFee> = yield ICPCanister.transfer_fee({});

    if (transfer_fee_result.ok === undefined) {
        return {
            err: 'Could not retrieve the transfer fee'
        };
    }

    const account_balance = account_balance_result.ok.e8s;
    const transfer_fee = transfer_fee_result.ok.transfer_fee.e8s;

    if (account_balance < (amount + transfer_fee)) {
        return {
            err: 'Insufficient funds'
        };
    }

    const id_result: CanisterResult<string> = yield ic.canisters.Management<Management>('aaaaa-aa').raw_rand();

    if (id_result.ok === undefined) {
        return {
            err: id_result.err
        };
    }

    const id = sha224().update(id_result.ok).digest('hex');

    state.transferProposals[id] = {
        id,
        proposer: caller,
        description,
        destinationAddress,
        amount,
        votes: [],
        adopted: false,
        rejected: false
    };

    return {
        ok: true
    };
}

export function* voteOnTransferProposal(
    transferProposalId: string,
    adopt: boolean
): UpdateAsync<VoteOnProposalResult> {
    const caller = ic.caller();
    
    if (isSigner(caller) === false) {
        return {
            err: 'Only signers can approve a transfer proposal'
        };
    }

    let transferProposal = state.transferProposals[transferProposalId];

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

    const alreadyVoted = transferProposal.votes.find((vote) => vote.voter === caller) !== undefined;

    if (alreadyVoted === true) {
        return {
            err: `You have already voted on this proposal`
        };
    }

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
                err: 'Could not retrieve the transfer fee'
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
            created_at_time: null // TODO what happens if I don't put this?
        });

        if (canister_result.ok === undefined) {
            return {
                err: canister_result.err
            };
        }

        transferProposal.votes = newVotes;
        transferProposal.adopted = true;

        return {
            ok: {
                adopted: null
            }
        };
    }

    if (rejectVotes.length > Object.keys(state.signers).length - state.threshold) {
        transferProposal.votes = newVotes;
        transferProposal.rejected = true;

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