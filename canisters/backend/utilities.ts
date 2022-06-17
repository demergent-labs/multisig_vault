import {
    Async,
    CanisterResult,
    nat8,
    ok
} from 'azle';
import { ManagementCanister } from 'azle/canisters/management';
import { RandomnessResult } from './types';

export function* get_randomness(): Async<RandomnessResult> {
    const randomness_canister_result: CanisterResult<nat8[]> = yield ManagementCanister.raw_rand();

    if (!ok(randomness_canister_result)) {
        return {
            err: randomness_canister_result.err
        };
    }

    const randomness = randomness_canister_result.ok;

    return {
        ok: randomness
    };
}