import {
    ic,
    nat8,
    ok,
    Principal,
    UpdateAsync
} from 'azle';
import { state } from '../backend';
import { sha224 } from 'hash.js';
import { is_signer } from './index';
import {
    DefaultMutator,
    DefaultResult,
    RandomnessResult,
    State
} from '../types';
import { get_randomness } from '../utilities';

export function* propose_signer(
    description: string,
    signer: Principal,
    remove: boolean
): UpdateAsync<DefaultResult> {
    const caller = ic.caller();

    const checks_result = perform_checks(
        caller,
        state.signers,
        signer,
        remove
    );

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

    const mutator = get_mutator(
        caller,
        randomness,
        description,
        signer,
        remove
    );

    const mutator_result = mutator();

    return mutator_result;
}

function perform_checks(
    caller: Principal,
    signers: State['signers'],
    signer: Principal,
    remove: boolean
): DefaultResult {
    if (is_signer(caller) === false) {
        return {
            err: 'Only signers can create a proposal'
        };
    }

    if (
        remove === true &&
        signers[signer.toText()] === undefined
    ) {
        return {
            err: `Signer ${signer} does not exist`
        };
    }

    return {
        ok: true
    };
}

function get_mutator(
    caller: Principal,
    randomness: nat8[],
    description: string,
    signer: Principal,
    remove: boolean
): DefaultMutator {
    return () => {
        const id = sha224().update(randomness).digest('hex');

        state.signer_proposals[id] = {
            id,
            created_at: ic.time(),
            proposer: caller,
            description,
            signer,
            remove,
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