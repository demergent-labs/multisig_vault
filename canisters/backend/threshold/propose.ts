import {
    CanisterResult,
    ic,
    nat8,
    Principal,
    UpdateAsync
} from 'azle';
import { Management } from 'azle/canisters/management';
import { state } from '../backend';
import { sha224 } from 'hash.js';
import { isSigner } from '../signers';
import {
    DefaultMutator,
    DefaultResult,
    State
} from '../types';

export function* proposeThreshold(
    description: string,
    threshold: nat8
): UpdateAsync<DefaultResult> {
    const caller = ic.caller();

    const checks_result = performChecks(
        caller,
        threshold,
        state.signers
    );

    if (checks_result.ok === undefined) {
        return {
            err: checks_result.err
        };
    }

    const randomness_canister_result: CanisterResult<nat8[]> = yield ic.canisters.Management<Management>('aaaaa-aa').raw_rand();

    if (randomness_canister_result.ok === undefined) {
        return {
            err: randomness_canister_result.err
        };
    }

    const randomness = randomness_canister_result.ok;

    const mutator = getMutator(
        caller,
        randomness,
        description,
        threshold
    );

    const mutator_result = mutator();

    return mutator_result;
}

function performChecks(
    caller: Principal,
    threshold: nat8,
    signers: State['signers']
): DefaultResult {
    if (isSigner(caller) === false) {
        return {
            err: 'Only signers can create a proposal'
        };
    }

    if (threshold === 0) {
        return {
            err: 'Threshold cannot be 0'
        }
    }

    if (threshold > Object.keys(signers).length) {
        return {
            err: 'Threshold cannot be greater than number of signers'
        };
    }

    return {
        ok: true
    };
}

function getMutator(
    caller: Principal,
    randomness: nat8[],
    description: string,
    threshold: nat8
): DefaultMutator {
    return () => {
        const id = sha224().update(randomness).digest('hex');

        state.thresholdProposals[id] = {
            id,
            created_at: ic.time(),
            proposer: caller,
            description,
            threshold,
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