const production = window.location.hostname.endsWith('ic0.app') ? true : false;

window.process = {
    env: {
        BACKEND_CANISTER_ID: production === true ? 'jiyou-fiaaa-aaaam-aad6q-cai' : 'rrkah-fqaaa-aaaaa-aaaaq-cai',
        FRONTEND_CANISTER_ID: production === true ? 'jqklt-hiaaa-aaaam-aaeba-cai' : 'r7inp-6aaaa-aaaaa-aaabq-cai',
        // II_PROVIDER_URL: production === true ? 'https://3y5ko-7qaaa-aaaal-aaaaq-cai.ic0.app/authenticate/?applicationName=multisig_vault' : 'http://rkp4c-7iaaa-aaaaa-aaaca-cai.localhost:8000'
        II_PROVIDER_URL: production === true ? 'https://identity.ic0.app' : 'http://rkp4c-7iaaa-aaaaa-aaaca-cai.localhost:8000'
    }
};