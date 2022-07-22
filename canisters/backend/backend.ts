import {
    CanisterResult,
    ic,
    Init,
    nat8,
    Principal,
    Query,
    Update
} from 'azle';
import {
    binary_address_from_principal,
    hex_address_from_principal,
    Ledger,
    Tokens
} from 'azle/canisters/ledger';
import {
    CanisterStatusResult,
    ManagementCanister
} from 'azle/canisters/management';
import { process } from './process_polyfill';
import { ControllersInfoResult, State, VaultBalanceResult } from './types';

export const ICPCanister = ic.canisters.Ledger<Ledger>(
    Principal.fromText(process.env.ICP_LEDGER_CANISTER_ID)
);

export let state: State = {
    frontend_cycle_stats: {
        cycles_remaining: 0n,
        cycle_time_remaining: 0n,
        cycles_per_year: 0n,
        cycles_per_month: 0n,
        cycles_per_week: 0n,
        cycles_per_day: 0n,
        cycles_per_hour: 0n,
        cycles_per_min: 0n,
        cycles_per_sec: 0n,
        cycle_snapshots: []
    },
    backend_cycle_stats: {
        cycles_remaining: 0n,
        cycle_time_remaining: 0n,
        cycles_per_year: 0n,
        cycles_per_month: 0n,
        cycles_per_week: 0n,
        cycles_per_day: 0n,
        cycles_per_hour: 0n,
        cycles_per_min: 0n,
        cycles_per_sec: 0n,
        cycle_snapshots: []
    },
    signers: {},
    signer_proposals: {},
    threshold: 0,
    threshold_proposals: {},
    transfers: {},
    transfer_proposals: {}
};

export function init(signers: Principal[], threshold: nat8): Init {
    state.signers = signers.reduce((result, signer) => {
        return {
            ...result,
            [signer.toText()]: signer
        };
    }, {});

    state.threshold = threshold;
}

export function* get_vault_balance(): Update<VaultBalanceResult> {
    const account_balance_canister_result: CanisterResult<Tokens> =
        yield ICPCanister.account_balance({
            account: binary_address_from_principal(ic.id(), 0)
        });

    if (account_balance_canister_result.ok === undefined) {
        return {
            err: account_balance_canister_result.err
        };
    }

    return {
        ok: account_balance_canister_result.ok.e8s
    };
}

export function get_canister_principal(): Query<Principal> {
    return ic.id();
}

export function get_canister_address(): Query<string> {
    return hex_address_from_principal(ic.id(), 0);
}

export function get_address_from_principal(
    principal: Principal
): Query<string> {
    return hex_address_from_principal(principal, 0);
}

export function* get_controllers_info(): Update<ControllersInfoResult> {
    const frontend_canister_result: CanisterResult<CanisterStatusResult> =
        yield ManagementCanister.canister_status({
            canister_id: Principal.fromText(process.env.FRONTEND_CANISTER_ID)
        });

    if (frontend_canister_result.ok === undefined) {
        return {
            err: frontend_canister_result.err
        };
    }

    const frontend_canister_status_result = frontend_canister_result.ok;

    const backend_canister_result: CanisterResult<CanisterStatusResult> =
        yield ManagementCanister.canister_status({
            canister_id: ic.id()
        });

    if (backend_canister_result.ok === undefined) {
        return {
            err: backend_canister_result.err
        };
    }

    const backend_canister_status_result = backend_canister_result.ok;

    return {
        ok: {
            frontend: frontend_canister_status_result.settings.controllers,
            backend: backend_canister_status_result.settings.controllers
        }
    };
}

export { get_cycle_stats_info, snapshot_cycles } from './cycles';
export {
    get_signers,
    get_signer_proposals,
    propose_signer,
    vote_on_signer_proposal
} from './signers';
export {
    get_threshold,
    get_threshold_proposals,
    propose_threshold,
    vote_on_threshold_proposal
} from './threshold';
export {
    get_transfers,
    get_transfer_proposals,
    propose_transfer,
    vote_on_transfer_proposal
} from './transfers';
