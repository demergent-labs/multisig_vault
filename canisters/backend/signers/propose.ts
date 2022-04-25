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
import { isSigner } from './index';
import {
    DefaultMutator,
    DefaultResult,
    State
} from '../types';

export function* proposeSigner(
    description: string,
    signer: Principal,
    remove: boolean
): UpdateAsync<DefaultResult> {
    const caller = ic.caller();

    const checks_result = performChecks(
        caller,
        state.signers,
        signer,
        remove
    );

    if (checks_result.ok === undefined) {
        return {
            err: checks_result.err
        };
    }

    const raw_rand_canister_result: CanisterResult<nat8[]> = yield ic.canisters.Management<Management>('aaaaa-aa').raw_rand();

    if (raw_rand_canister_result.ok === undefined) {
        return {
            err: raw_rand_canister_result.err
        };
    }

    const randomness = raw_rand_canister_result.ok;

    const mutator = getMutator(
        caller,
        randomness,
        description,
        signer,
        remove
    );

    const mutator_result = mutator();

    return mutator_result;
}

function performChecks(
    caller: Principal,
    signers: State['signers'],
    signer: Principal,
    remove: boolean
): DefaultResult {
    if (isSigner(caller) === false) {
        return {
            err: 'Only signers can create a proposal'
        };
    }

    if (
        remove === true &&
        signers[signer] === undefined
    ) {
        return {
            err: `Signer ${signer} does not exist`
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
    signer: Principal,
    remove: boolean
): DefaultMutator {
    return () => {
        // TODO should we make it a best practice to always surround mutations in a try catch? We need to ensure we never get into an inconsistent state
        const id = sha224().update(randomness).digest('hex');

        state.signerProposals[id] = {
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