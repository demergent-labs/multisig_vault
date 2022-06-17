# multisig_vault

TODO explain the exact steps to take to setup the local environment, the order in which you should deploy the local canisters, the commands to do so, and the canister ids you should have after each step

TODO let's add the bash commands to the azle testing script so we can properly test this

Deploy the backend canister with original signers and threshold:

## Local Deployment

Deploy backend:

```bash
dfx deploy --argument='(vec { principal "qaxqg-4ymay-xutcp-nnull-fvtqf-5p6d4-mxbja-i6t5s-wz7kb-csadv-qqe" }, 1)' backend
```

Deploy frontend:

```bash
dfx deploy frontend
```

Deploy ICP ledger:

* Current dfx identity ledger account-id, found with `dfx ledger account-id`: ebe2cd28c5b8d36e5e261ad24430dec1d426556b565c1b526626f59eceaf9abd
* backend canister account-id, found with `dfx ledger account-id --of-canister backend`: 082ecf2e3f647ac600f43f38a68342fba5b8e68b085f02592b77f39808a8d2b5

```bash
dfx deploy icp_ledger --argument '(record {minting_account = "ebe2cd28c5b8d36e5e261ad24430dec1d426556b565c1b526626f59eceaf9abd"; initial_values = vec { record { "082ecf2e3f647ac600f43f38a68342fba5b8e68b085f02592b77f39808a8d2b5"; record { e8s=100_000_000_000 } }; }; send_whitelist = vec {}})'
```

Add backend canister as controller to frontend canister:

```bash
dfx canister --network ic update-settings --add-controller jiyou-fiaaa-aaaam-aad6q-cai frontend
```

Add backend canister as controller to backend canister

```bash
dfx canister --network ic update-settings --add-controller jiyou-fiaaa-aaaam-aad6q-cai backend
```

## IC Deployment

### backend

```bash
# If this is not your initial deploy, you should ensure the state is wiped before deploying
dfx canister --network ic uninstall-code backend

# 3orhv-wbdl3-eilra-onpum-ik54m-f6y66-qzh4z-sjpqz-ao3bz-nsmz2-lae is the principal of the II/NFID that you want to have initial control
dfx deploy --network ic --argument='(vec { principal "3orhv-wbdl3-eilra-onpum-ik54m-f6y66-qzh4z-sjpqz-ao3bz-nsmz2-lae" }, 1)' backend

dfx deploy --network ic frontend

# Add backend canister as controller to frontend canister
# jiyou-fiaaa-aaaam-aad6q-cai is the canister id of the backend canister
dfx canister --network ic update-settings --add-controller $(dfx canister id backend) frontend

# Add backend canister as controller to backend canister
dfx canister --network ic update-settings --add-controller $(dfx canister id backend) backend

# When you are ready for the vault to be autonomous, remove all other controllers
# TODO not yet sure what this command is
```