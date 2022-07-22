import { Test } from 'azle/test';
import { backend_canister } from '../test';
import { Principal } from '@dfinity/principal';
import { createActor } from '../../canisters/frontend/dfx_generated/backend';
import { Ed25519KeyIdentity } from '@dfinity/identity';

export function get_propose_signer_valid_tests(): Test[] {
    return [];
}

export function get_propose_signer_invalid_tests(): Test[] {
    return [
        {
            name: 'non-signer attempting to create a signer proposal',
            test: async () => {
                const result = await backend_canister.propose_signer(
                    'propose rrkah-fqaaa-aaaaa-aaaaq-cai',
                    Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai'),
                    false
                );

                return {
                    ok: 'err' in result && result.err === 'Only signers can create a proposal'
                };
            }
        },
        // {
        //     name: 'attempt to remove non-signer',
        //     test: async () => {
        //         // TODO to get this to work I might have to do this: https://forum.dfinity.org/t/using-dfinity-agent-in-node-js/6169/50
        //         const identityJSONString = require('fs').readFileSync('/home/lastmjs/.config/dfx/identity/demergent-labs-lastmjs-0/identity.pem');
        //         const identity = Ed25519KeyIdentity.fromSecretKey(identityJSONString);

        //         const backend_canister_authenticated = createActor('rrkah-fqaaa-aaaaa-aaaaq-cai', {
        //             agentOptions: {
        //                 host: 'http://127.0.0.1:8000',
        //                 identity
        //             }
        //         });

        //         const result = await backend_canister_authenticated.propose_signer(
        //             'propose rrkah-fqaaa-aaaaa-aaaaq-cai',
        //             Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai'),
        //             true
        //         );

        //         console.log('result', result);

        //         return {
        //             ok: 'err' in result && result.err === 'Signer rrkah-fqaaa-aaaaa-aaaaq-cai does not exist'
        //         };
        //     }
        // }
    ];
}