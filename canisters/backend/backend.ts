import {
    CanisterResult,
    ic,
    Init,
    nat8,
    Principal,
    Query,
    UpdateAsync
} from 'azle';
import {
    binaryAddressFromPrincipal,
    hexAddressFromPrincipal,
    ICP,
    Tokens
} from 'azle/canisters/icp';
import {
    CanisterStatusResult,
    Management
} from 'azle/canisters/management';
import { process } from './process_polyfill';
import {
    ControllersInfoResult,
    State,
    VaultBalanceResult
} from './types';

export const ICPCanister = ic.canisters.ICP<ICP>(process.env.ICP_LEDGER_CANISTER_ID);
export const ManagementCanister = ic.canisters.Management<Management>('aaaaa-aa');

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
    signerProposals: {},
    threshold: 0,
    thresholdProposals: {},
    transfers: {},
    transferProposals: {}
};

export function init(
    signers: Principal[],
    threshold: nat8
): Init {
    state.signers = signers.reduce((result, signer) => {
        return {
            ...result,
            [signer]: signer
        };
    }, {});

    state.threshold = threshold;
}

export function* getVaultBalance(): UpdateAsync<VaultBalanceResult> {
    const account_balance_canister_result: CanisterResult<Tokens> = yield ICPCanister.account_balance({
        account: binaryAddressFromPrincipal(ic.id(), 0)
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

export function getCanisterPrincipal(): Query<string> {
    return ic.id();
}

export function getCanisterAddress(): Query<string> {
    return hexAddressFromPrincipal(ic.id(), 0);
}

export function* get_controllers_info(): UpdateAsync<ControllersInfoResult> {
    const frontend_canister_result: CanisterResult<CanisterStatusResult> = yield ManagementCanister.canister_status({
        canister_id: process.env.FRONTEND_CANISTER_ID
    });

    if (frontend_canister_result.ok === undefined) {
        return {
            err: frontend_canister_result.err
        };
    }

    const frontend_canister_status_result = frontend_canister_result.ok;

    const backend_canister_result: CanisterResult<CanisterStatusResult> = yield ManagementCanister.canister_status({
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

export {
    get_cycle_stats_info,
    snapshot_cycles
} from './cycles';
export {
    getSigners,
    getSignerProposals,
    proposeSigner,
    voteOnSignerProposal
} from './signers';
export {
    getThreshold,
    getThresholdProposals,
    proposeThreshold,
    voteOnThresholdProposal
} from './threshold';
export {
    getTransfers,
    getTransferProposals,
    proposeTransfer,
    voteOnTransferProposal
} from './transfers';