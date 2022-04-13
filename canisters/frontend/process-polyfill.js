const production = window.location.hostname.endsWith('ic0.app') ? true : false;

// TODO II_PROVIDER_URL is where we will set the new NFID provider
window.process = {
    env: {
        BACKEND_CANISTER_ID: production === true ? 'jiyou-fiaaa-aaaam-aad6q-cai' : 'rrkah-fqaaa-aaaaa-aaaaq-cai',
        II_PROVIDER_URL: production === true ? 'https://identity.ic0.app' : 'http://rkp4c-7iaaa-aaaaa-aaaca-cai.localhost:8000',
        ICP_LEDGER_CANISTER_ID: production === true ? 'ryjl3-tyaaa-aaaaa-aaaba-cai' : 'rno2w-sqaaa-aaaaa-aaacq-cai'
    }
};