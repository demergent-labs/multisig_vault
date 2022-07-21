import { blob, ic, ok, nat8, Principal, UpdateAsync } from 'azle';
import { state } from '../backend';
import { sha224 } from 'hash.js';
import { is_signer } from '../signers';
import {
    DefaultMutator,
    DefaultResult,
    RandomnessResult,
    State
} from '../types';
import { get_randomness } from '../utilities';

export function* propose_threshold(
    description: string,
    threshold: nat8
): UpdateAsync<DefaultResult> {
    const caller = ic.caller();

    const checks_result = perform_checks(caller, threshold, state.signers);

    if (!ok(checks_result)) {
        return {
            err: checks_result.err
        };
    }

    const randomness_result: RandomnessResult = yield get_randomness();

    if (!ok(randomness_result)) {
        return {
            err: randomness_result.err
        };
    }

    const randomness = randomness_result.ok;

    const mutator = get_mutator(caller, randomness, description, threshold);

    const mutator_result = mutator();

    return mutator_result;
}

function perform_checks(
    caller: Principal,
    threshold: nat8,
    signers: State['signers']
): DefaultResult {
    if (is_signer(caller) === false) {
        return {
            err: 'Only signers can create a proposal'
        };
    }

    if (threshold === 0) {
        return {
            err: 'Threshold cannot be 0'
        };
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

function get_mutator(
    caller: Principal,
    randomness: blob,
    description: string,
    threshold: nat8
): DefaultMutator {
    return () => {
        const id = sha224().update(Array.from(randomness)).digest('hex');

        state.threshold_proposals[id] = {
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
