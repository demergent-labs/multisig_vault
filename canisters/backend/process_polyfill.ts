import { ic } from 'azle';

const production = ic.id().toText() === 'jiyou-fiaaa-aaaam-aad6q-cai' ? true : false;

export const process = {
    env: {
        ICP_LEDGER_CANISTER_ID: production === true ? 'ryjl3-tyaaa-aaaaa-aaaba-cai' : 'rno2w-sqaaa-aaaaa-aaacq-cai',
        FRONTEND_CANISTER_ID: production === true ? 'jqklt-hiaaa-aaaam-aaeba-cai' : 'r7inp-6aaaa-aaaaa-aaabq-cai'
    }
};