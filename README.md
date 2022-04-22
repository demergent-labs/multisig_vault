# multisig_vault

TODO explain the exact steps to take to setup the local environment, the order in which you should deploy the local canisters, the commands to do so, and the canister ids you should have after each step

TODO let's add the bash commands to the azle testing script so we can properly test this

Deploy the backend canister with original signers and threshold:

```bash
dfx deploy --argument='(vec { principal "qaxqg-4ymay-xutcp-nnull-fvtqf-5p6d4-mxbja-i6t5s-wz7kb-csadv-qqe" }, 1)' backend
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