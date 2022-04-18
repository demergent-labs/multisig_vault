import {
    CanisterResult,
    ic,
    nat8,
    nat64,
    Principal,
    UpdateAsync
} from 'azle';
import {
    binaryAddressFromPrincipal,
    Tokens,
    TransferFee
} from 'azle/canisters/icp';
import { Management } from 'azle/canisters/management';
import {
    state,
    ICPCanister
} from '../backend';
import { sha224 } from 'hash.js';
import { isSigner } from '../signers';
import {
    Address,
    DefaultMutator,
    DefaultResult,
    ProposeTransferChecksResult
} from '../types';

export function* proposeTransfer(
    description: string,
    destinationAddress: string,
    amount: nat64
): UpdateAsync<DefaultResult> {
    const caller = ic.caller();

    // TODO because we perform the cross-canister calls before the checks, a non-signer could DoS with many cross-canister calls
    const account_balance_result: CanisterResult<Tokens> = yield ICPCanister.account_balance({
        account: binaryAddressFromPrincipal(ic.id(), 0)
    });
    const transfer_fee_result: CanisterResult<TransferFee> = yield ICPCanister.transfer_fee({});
    const randomness_canister_result: CanisterResult<nat8[]> = yield ic.canisters.Management<Management>('aaaaa-aa').raw_rand();

    const checks_result = performChecks(
        caller,
        amount,
        account_balance_result,
        transfer_fee_result,
        randomness_canister_result
    );

    if (checks_result.ok === undefined) {
        return {
            err: checks_result.err
        };
    }

    const randomness = checks_result.ok.randomness;

    const mutator = getMutator(
        caller,
        randomness,
        description,
        destinationAddress,
        amount
    );

    const mutator_result = mutator();

    return mutator_result;
}

function performChecks(
    caller: Principal,
    amount: nat64,
    account_balance_result: CanisterResult<Tokens>,
    transfer_fee_result: CanisterResult<TransferFee>,
    randomness_canister_result: CanisterResult<nat8[]>
): ProposeTransferChecksResult {
    if (isSigner(caller) === false) {
        return {
            err: 'Only signers can propose a transfer'
        };
    }

    if (account_balance_result.ok === undefined) {
        return {
            err: account_balance_result.err
        };
    }

    if (transfer_fee_result.ok === undefined) {
        return {
            err: transfer_fee_result.err
        };
    }

    if (randomness_canister_result.ok === undefined) {
        return {
            err: randomness_canister_result.err
        };
    }

    const account_balance = account_balance_result.ok.e8s;
    const transfer_fee = transfer_fee_result.ok.transfer_fee.e8s;

    if (account_balance < (amount + transfer_fee)) {
        return {
            err: 'Insufficient funds'
        };
    }

    const randomness = randomness_canister_result.ok;

    return {
        ok: {
            randomness
        }
    };
}

function getMutator(
    caller: Principal,
    randomness: nat8[],
    description: string,
    destinationAddress: Address,
    amount: nat64
): DefaultMutator {
    return () => {
        // TODO should we make it a best practice to always surround mutations in a try catch? We need to ensure we never get into an inconsistent state
        const id = sha224().update(randomness).digest('hex');

        state.transferProposals[id] = {
            id,
            created_at: ic.time(),
            proposer: caller,
            description,
            destinationAddress,
            amount,
            votes: [],
            adopted: false,
            adopted_at: null,
            rejected: false,
            rejected_at: null
        };
    
        return {
            ok: true
        };
    };
}