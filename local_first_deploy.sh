# backend canister
dfx canister create backend
dfx build backend
dfx canister install backend --argument '(vec { principal "'$(dfx identity get-principal)'" }, 1: nat8)' --wasm target/wasm32-unknown-unknown/release/backend.wasm.gz

# frontend canister
dfx deploy frontend

# Internet Identity caniser
dfx deploy --argument='(null)' internet_identity

# ICP Ledger canister
dfx deploy icp_ledger --argument='(record {minting_account = "'$(dfx ledger account-id)'"; initial_values = vec { record { "'$(dfx ledger account-id --of-canister backend)'"; record { e8s=100_000_000_000 } }; }; send_whitelist = vec {}})'

# set controllers
dfx canister update-settings --add-controller $(dfx canister id backend) frontend
dfx canister update-settings --add-controller $(dfx canister id backend) backend