import { run_tests, Test } from 'azle/test';
import { execSync } from 'child_process';
import { createActor } from '../canisters/frontend/dfx_generated/backend';

// TODO need to get ICP Ledger and Internet Identity canisters working in GitHub Actions

const backend_canister = createActor('rrkah-fqaaa-aaaaa-aaaaq-cai', {
    agentOptions: {
        host: 'http://127.0.0.1:8000'
    }
});

const tests: Test[] = [
    {
        name: 'deploy backend canister',
        prep: async () => {
            execSync(`dfx canister create backend`, {
                stdio: 'inherit'
            });

            execSync(`dfx build backend`, {
                stdio: 'inherit'
            });

            // execSync(
            //     `dfx canister install backend --argument '(vec { principal "'$(dfx identity get-principal)'" }, 1: nat8)' --wasm target/wasm32-unknown-unknown/release/backend.wasm.gz`,
            //     {
            //         stdio: 'inherit'
            //     }
            // );
        }
    }
    // {
    //     name: 'deploy frontend canister',
    //     prep: async () => {
    //         execSync(`dfx deploy frontend`, {
    //             stdio: 'inherit'
    //         });
    //     }
    // },
    // {
    //     name: 'deploy Internet Identity canister',
    //     prep: async () => {
    //         execSync(`dfx deploy internet_identity --argument '(null)'`, {
    //             stdio: 'inherit'
    //         });
    //     }
    // },
    // {
    //     name: 'deploy ICP Ledger canister',
    //     prep: async () => {
    //         execSync(`dfx deploy icp_ledger --argument='(record {minting_account = "'$(dfx ledger account-id)'"; initial_values = vec { record { "'$(dfx ledger account-id --of-canister backend)'"; record { e8s=100_000_000_000 } }; }; send_whitelist = vec {}})'`, {
    //             stdio: 'inherit'
    //         });
    //     }
    // },
    // {
    //     name: 'set controllers',
    //     prep: async () => {
    //         execSync(`dfx canister update-settings --add-controller $(dfx canister id backend) frontend`, {
    //             stdio: 'inherit'
    //         });

    //         execSync(`dfx canister update-settings --add-controller $(dfx canister id backend) backend`, {
    //             stdio: 'inherit'
    //         });
    //     }
    // },
    // {
    //     name: 'check vault balance',
    //     test: async () => {
    //         const result = await backend_canister.get_vault_balance();

    //         console.log('result', result);

    //         return {
    //             ok: 'ok' in result && result.ok === 100_000_000_000n
    //         };
    //     }
    // }
];

run_tests(tests);

// TODO get the initial state of everything, call all methods with initial values
// TODO test some of the utility methods more, like the principal to address conversions
// TODO test signers
// TODO test threshold
// TODO test ICP transfer
// TODO test attempting to create proposals, failing in every way possible
// TODO test creating a valid proposal
// TODO check state after creation of valid proposal
// TODO test voting in every way possible that is bad
// TODO test voting correctly
// TODO check state after correct vote
