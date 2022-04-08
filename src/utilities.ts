import {
    nat8,
    UpdateAsync,
    ic,
    CanisterResult,
    Async
} from 'azle';
import { Management } from 'azle/canisters/management';
import { sha224 } from 'hash.js';

export function* generateId(): Async<CanisterResult<nat8[]>> {
    const managementCanister = ic.canisters.Management<Management>('aaaaa-aa');

    return yield managementCanister.raw_rand();
}

// TODO consider what we can pull out and put into azle- npm packages
// TODO we probably want to create a Result type, or encourage people to use a Rust result library
// export function* generateId(): Async<CanisterResult<string>> {
//     ic.print(1);

//     const managementCanister = ic.canisters.Management<Management>('aaaaa-aa');

//     ic.print(2);

//     const randomness_result: CanisterResult<nat8[]> = yield managementCanister.raw_rand();

//     ic.print(3);

//     if (randomness_result.ok !== undefined) {
//         const id = sha224().update(randomness_result.ok).digest('hex');
    
//         return {
//             ok: id
//         };
//     }
//     else {
//         return {
//             err: randomness_result.err
//         };
//     }
// }