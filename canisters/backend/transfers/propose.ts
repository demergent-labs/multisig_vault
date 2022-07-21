import {
    Async,
    blob,
    CanisterResult,
    ic,
    ok,
    nat64,
    Principal,
    UpdateAsync
} from 'azle';
import {
    binary_address_from_principal,
    Tokens,
    TransferFee
} from 'azle/canisters/ledger';
import { ManagementCanister } from 'azle/canisters/management';
import { state, ICPCanister } from '../backend';
import { sha224 } from 'hash.js';
import { is_signer } from '../signers';
import {
    Address,
    DefaultMutator,
    DefaultResult,
    ProposeTransferChecksResult
} from '../types';

export function* propose_transfer(
    description: string,
    destination_address: string,
    amount: nat64
): UpdateAsync<DefaultResult> {
    const caller = ic.caller();

    const checks_result: ProposeTransferChecksResult = yield perform_checks(
        caller,
        amount
    );

    if (!ok(checks_result)) {
        return {
            err: checks_result.err
        };
    }

    const randomness = checks_result.ok.randomness;

    const mutator = get_mutator(
        caller,
        randomness,
        description,
        destination_address,
        amount
    );

    const mutator_result = mutator();

    return mutator_result;
}

function* perform_checks(
    caller: Principal,
    amount: nat64
): Async<ProposeTransferChecksResult> {
    if (is_signer(caller) === false) {
        return {
            err: 'Only signers can create a proposal'
        };
    }

    const account_balance_result: CanisterResult<Tokens> =
        yield ICPCanister.account_balance({
            account: binary_address_from_principal(ic.id(), 0)
        });

    if (account_balance_result.ok === undefined) {
        return {
            err: account_balance_result.err
        };
    }

    const transfer_fee_result: CanisterResult<TransferFee> =
        yield ICPCanister.transfer_fee({});

    if (transfer_fee_result.ok === undefined) {
        return {
            err: transfer_fee_result.err
        };
    }

    const account_balance = account_balance_result.ok.e8s;
    const transfer_fee = transfer_fee_result.ok.transfer_fee.e8s;

    if (account_balance < amount + transfer_fee) {
        return {
            err: 'Insufficient funds'
        };
    }

    const randomness_canister_result: CanisterResult<blob> =
        yield ManagementCanister.raw_rand();

    if (randomness_canister_result.ok === undefined) {
        return {
            err: randomness_canister_result.err
        };
    }

    const randomness = randomness_canister_result.ok;

    return {
        ok: {
            randomness
        }
    };
}

function get_mutator(
    caller: Principal,
    randomness: blob,
    description: string,
    destination_address: Address,
    amount: nat64
): DefaultMutator {
    return () => {
        const id = sha224().update(Array.from(randomness)).digest('hex');

        state.transfer_proposals[id] = {
            id,
            created_at: ic.time(),
            proposer: caller,
            description,
            destination_address,
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
