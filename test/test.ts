import { run_tests, Test } from 'azle/test';
import { createActor } from '../canisters/frontend/dfx_generated/backend';
import { Principal } from '../canisters/frontend/node_modules/@dfinity/principal';
import { execSync } from 'child_process';

// TODO need to get ICP Ledger and Internet Identity canisters working in GitHub Actions

const backend_canister = createActor('rrkah-fqaaa-aaaaa-aaaaq-cai', {
    agentOptions: {
        host: 'http://127.0.0.1:8000'
    }
});

// TODO when deploying I keep getting timeouts
const SKIP_DEPLOY = process.argv[2] === 'no-setup';

const tests: Test[] = [
    ...get_setup(),
    ...initial_state_tests(),
    ...get_address_from_principal_tests()
];

run_tests(tests);

// TODO test signers
// TODO test threshold
// TODO test ICP transfer
// TODO test attempting to create proposals, failing in every way possible
// TODO test creating a valid proposal
// TODO check state after creation of valid proposal
// TODO test voting in every way possible that is bad
// TODO test voting correctly
// TODO check state after correct vote

function get_setup(): Test[] {
    return [
        {
            // TODO hopefully we can get rid of this: https://forum.dfinity.org/t/generated-declarations-in-node-js-environment-break/12686/16?u=lastmjs
            name: 'waiting for createActor fetchRootKey',
            wait: 5000
        },
        {
            name: 'deploy backend canister',
            prep: async () => {
                execSync(`dfx canister create backend`, {
                    stdio: 'inherit'
                });

                execSync(`dfx canister uninstall-code backend`, {
                    stdio: 'inherit'
                });

                execSync(`dfx build backend`, {
                    stdio: 'inherit'
                });

                execSync(
                    `dfx canister install backend --argument '(vec { principal "'$(dfx identity get-principal)'" }, 1: nat8)' --wasm target/wasm32-unknown-unknown/release/backend.wasm.gz`,
                    {
                        stdio: 'inherit'
                    }
                );
            },
            skip: SKIP_DEPLOY
        },
        {
            name: 'deploy frontend canister',
            prep: async () => {
                execSync(`dfx deploy frontend`, {
                    stdio: 'inherit'
                });
            },
            skip: SKIP_DEPLOY
        },
        {
            name: 'download Internet Identity canister Wasm',
            prep: async () => {
                execSync(`cd canisters/internet_identity && ./install.sh`, {
                    stdio: 'inherit'
                });
            }
        },
        {
            name: 'deploy Internet Identity canister',
            prep: async () => {
                execSync(`dfx deploy internet_identity --argument '(null)'`, {
                    stdio: 'inherit'
                });
            },
            skip: SKIP_DEPLOY
        },
        {
            name: 'download ICP Ledger canister',
            prep: async () => {
                execSync(`cd canisters/icp_ledger && ./install.sh`, {
                    stdio: 'inherit'
                });
            }
        },
        {
            name: 'deploy ICP Ledger canister',
            prep: async () => {
                execSync(
                    `dfx deploy icp_ledger --argument='(record {minting_account = "'$(dfx ledger account-id)'"; initial_values = vec { record { "'$(dfx ledger account-id --of-canister backend)'"; record { e8s=100_000_000_000 } }; }; send_whitelist = vec {}})'`,
                    {
                        stdio: 'inherit'
                    }
                );
            },
            skip: SKIP_DEPLOY
        },
        {
            name: 'set controllers',
            prep: async () => {
                execSync(
                    `dfx canister update-settings --add-controller $(dfx canister id backend) frontend`,
                    {
                        stdio: 'inherit'
                    }
                );

                execSync(
                    `dfx canister update-settings --add-controller $(dfx canister id backend) backend`,
                    {
                        stdio: 'inherit'
                    }
                );
            },
            skip: SKIP_DEPLOY
        }
    ];
}

function initial_state_tests(): Test[] {
    return [
        {
            name: 'check vault balance',
            test: async () => {
                const result = await backend_canister.get_vault_balance();

                return {
                    ok: 'ok' in result && result.ok === 100_000_000_000n
                };
            }
        },
        {
            name: 'check canister principal',
            test: async () => {
                const result = await backend_canister.get_canister_principal();

                return {
                    ok: result.toText() === 'rrkah-fqaaa-aaaaa-aaaaq-cai'
                };
            }
        },
        {
            name: 'check canister address',
            test: async () => {
                const result = await backend_canister.get_canister_address();

                return {
                    ok:
                        result ===
                        '082ecf2e3f647ac600f43f38a68342fba5b8e68b085f02592b77f39808a8d2b5'
                };
            }
        },
        {
            name: 'check controllers info',
            test: async () => {
                const result = await backend_canister.get_controllers_info();

                return {
                    ok:
                        'ok' in result &&
                        result.ok.frontend
                            .map((principal) => principal.toText())
                            .includes('rrkah-fqaaa-aaaaa-aaaaq-cai') &&
                        result.ok.backend
                            .map((principal) => principal.toText())
                            .includes('rrkah-fqaaa-aaaaa-aaaaq-cai')
                };
            }
        },
        {
            name: 'check signers',
            test: async () => {
                const result = await backend_canister.get_signers();
                const signer = execSync('dfx identity get-principal')
                    .toString()
                    .trim();

                return {
                    ok: result.length === 1 && result[0].toText() === signer
                };
            }
        },
        {
            name: 'check signer proposals',
            test: async () => {
                const result = await backend_canister.get_signer_proposals();

                return {
                    ok: result.length === 0
                };
            }
        },
        {
            name: 'check threshold',
            test: async () => {
                const result = await backend_canister.get_threshold();

                return {
                    ok: result === 1
                };
            }
        },
        {
            name: 'check threshold proposals',
            test: async () => {
                const result = await backend_canister.get_threshold_proposals();

                return {
                    ok: result.length === 0
                };
            }
        },
        {
            name: 'check transfers',
            test: async () => {
                const result = await backend_canister.get_transfers();

                return {
                    ok: result.length === 0
                };
            }
        },
        {
            name: 'check transfer proposals',
            test: async () => {
                const result = await backend_canister.get_transfer_proposals();

                return {
                    ok: result.length === 0
                };
            }
        }
    ];
}

function get_address_from_principal_tests(): Test[] {
    return [
        {
            name: 'get_address_from_principal rrkah-fqaaa-aaaaa-aaaaq-cai',
            test: async () => {
                const result =
                    await backend_canister.get_address_from_principal(
                        Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai')
                    );
                const address = execSync(
                    `dfx ledger account-id --of-principal rrkah-fqaaa-aaaaa-aaaaq-cai`
                )
                    .toString()
                    .trim();

                return {
                    ok: result === address
                };
            }
        },
        {
            name: 'get_address_from_principal ryjl3-tyaaa-aaaaa-aaaba-cai',
            test: async () => {
                const result =
                    await backend_canister.get_address_from_principal(
                        Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai')
                    );
                const address = execSync(
                    `dfx ledger account-id --of-principal ryjl3-tyaaa-aaaaa-aaaba-cai`
                )
                    .toString()
                    .trim();

                return {
                    ok: result === address
                };
            }
        },
        {
            name: 'get_address_from_principal rno2w-sqaaa-aaaaa-aaacq-cai',
            test: async () => {
                const result =
                    await backend_canister.get_address_from_principal(
                        Principal.fromText('rno2w-sqaaa-aaaaa-aaacq-cai')
                    );
                const address = execSync(
                    `dfx ledger account-id --of-principal rno2w-sqaaa-aaaaa-aaacq-cai`
                )
                    .toString()
                    .trim();

                return {
                    ok: result === address
                };
            }
        },
        {
            name: 'get_address_from_principal rkp4c-7iaaa-aaaaa-aaaca-cai',
            test: async () => {
                const result =
                    await backend_canister.get_address_from_principal(
                        Principal.fromText('rkp4c-7iaaa-aaaaa-aaaca-cai')
                    );
                const address = execSync(
                    `dfx ledger account-id --of-principal rkp4c-7iaaa-aaaaa-aaaca-cai`
                )
                    .toString()
                    .trim();

                return {
                    ok: result === address
                };
            }
        },
        {
            name: 'get_address_from_principal r7inp-6aaaa-aaaaa-aaabq-cai',
            test: async () => {
                const result =
                    await backend_canister.get_address_from_principal(
                        Principal.fromText('r7inp-6aaaa-aaaaa-aaabq-cai')
                    );
                const address = execSync(
                    `dfx ledger account-id --of-principal r7inp-6aaaa-aaaaa-aaabq-cai`
                )
                    .toString()
                    .trim();

                return {
                    ok: result === address
                };
            }
        },
        {
            name: 'get_address_from_principal rwlgt-iiaaa-aaaaa-aaaaa-cai',
            test: async () => {
                const result =
                    await backend_canister.get_address_from_principal(
                        Principal.fromText('rwlgt-iiaaa-aaaaa-aaaaa-cai')
                    );
                const address = execSync(
                    `dfx ledger account-id --of-principal rwlgt-iiaaa-aaaaa-aaaaa-cai`
                )
                    .toString()
                    .trim();

                return {
                    ok: result === address
                };
            }
        },
        {
            name: 'get_address_from_principal 3zjeh-xtbtx-mwebn-37a43-7nbck-qgquk-xtrny-42ujn-gzaxw-ncbzw-kqe',
            test: async () => {
                const result =
                    await backend_canister.get_address_from_principal(
                        Principal.fromText(
                            '3zjeh-xtbtx-mwebn-37a43-7nbck-qgquk-xtrny-42ujn-gzaxw-ncbzw-kqe'
                        )
                    );
                const address = execSync(
                    `dfx ledger account-id --of-principal 3zjeh-xtbtx-mwebn-37a43-7nbck-qgquk-xtrny-42ujn-gzaxw-ncbzw-kqe`
                )
                    .toString()
                    .trim();

                return {
                    ok: result === address
                };
            }
        },
        {
            name: 'get_address_from_principal o2ivq-5dsz3-nba5d-pwbk2-hdd3i-vybeq-qfz35-rqg27-lyesf-xghzc-3ae',
            test: async () => {
                const result =
                    await backend_canister.get_address_from_principal(
                        Principal.fromText(
                            'o2ivq-5dsz3-nba5d-pwbk2-hdd3i-vybeq-qfz35-rqg27-lyesf-xghzc-3ae'
                        )
                    );
                const address = execSync(
                    `dfx ledger account-id --of-principal o2ivq-5dsz3-nba5d-pwbk2-hdd3i-vybeq-qfz35-rqg27-lyesf-xghzc-3ae`
                )
                    .toString()
                    .trim();

                return {
                    ok: result === address
                };
            }
        },
        {
            name: 'get_address_from_principal cb53b-qsf7f-isr4v-tco56-pu475-66ehq-cfkko-doax3-xrnjh-pdo57-zae',
            test: async () => {
                const result =
                    await backend_canister.get_address_from_principal(
                        Principal.fromText(
                            'cb53b-qsf7f-isr4v-tco56-pu475-66ehq-cfkko-doax3-xrnjh-pdo57-zae'
                        )
                    );
                const address = execSync(
                    `dfx ledger account-id --of-principal cb53b-qsf7f-isr4v-tco56-pu475-66ehq-cfkko-doax3-xrnjh-pdo57-zae`
                )
                    .toString()
                    .trim();

                return {
                    ok: result === address
                };
            }
        },
        {
            name: 'get_address_from_principal fhzp2-mb4kr-hm4io-32js7-oketg-gdi73-4pqb4-6jyxp-ajbhd-tuiwt-bqe',
            test: async () => {
                const result =
                    await backend_canister.get_address_from_principal(
                        Principal.fromText(
                            'fhzp2-mb4kr-hm4io-32js7-oketg-gdi73-4pqb4-6jyxp-ajbhd-tuiwt-bqe'
                        )
                    );
                const address = execSync(
                    `dfx ledger account-id --of-principal fhzp2-mb4kr-hm4io-32js7-oketg-gdi73-4pqb4-6jyxp-ajbhd-tuiwt-bqe`
                )
                    .toString()
                    .trim();

                return {
                    ok: result === address
                };
            }
        }
    ];
}
