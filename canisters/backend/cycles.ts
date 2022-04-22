import {
    CanisterResult,
    ic,
    nat64,
    Query,
    UpdateAsync
} from 'azle';
import { CanisterStatusResult } from 'azle/canisters/management';
import {
    ManagementCanister,
    state
} from './backend';
import {
    DECIMALS,
    NANOS_PER_YEAR,
    NANOS_PER_MONTH,
    NANOS_PER_WEEK,
    NANOS_PER_DAY,
    NANOS_PER_HOUR,
    NANOS_PER_MINUTE,
    NANOS_PER_SECOND,
    CYCLE_SNAPSHOTS_LENGTH
} from './constants';
import { process } from './process_polyfill';
import {
    CycleSnapshot,
    CycleStats,
    CycleStatsInfo,
    DefaultResult
} from './types';

export function get_cycle_stats_info(): Query<CycleStatsInfo> {
    return {
        frontend: state.frontend_cycle_stats,
        backend: state.backend_cycle_stats
    };
}

export function* snapshot_cycles(): UpdateAsync<DefaultResult> {
    const canister_result: CanisterResult<CanisterStatusResult> = yield ManagementCanister.canister_status({
        canister_id: process.env.FRONTEND_CANISTER_ID
    });

    if (canister_result.ok === undefined) {
        return {
            err: canister_result.err
        };
    }

    const canisterStatusResult = canister_result.ok;

    const frontend_cycle_stats = calculate_updated_cycle_stats(
        state.frontend_cycle_stats,
        canisterStatusResult.cycles
    );
    const backend_cycle_stats = calculate_updated_cycle_stats(
        state.backend_cycle_stats,
        ic.canisterBalance()
    );

    state.frontend_cycle_stats = frontend_cycle_stats;
    state.backend_cycle_stats = backend_cycle_stats;

    return {
        ok: true
    };
}

function calculate_updated_cycle_stats(
    current_cycle_stats: CycleStats,
    cycles_remaining: nat64
): CycleStats {
    const cycle_snapshots = sort_cycle_snapshots(calculate_cycle_snapshots(
        cycles_remaining,
        current_cycle_stats.cycle_snapshots
    ));
    const cycles_per_nanosecond = calculate_cycles_per_nanosecond(cycle_snapshots);

    const cycle_time_remaining = cycles_per_nanosecond === 0n ? 0n : (cycles_remaining * BigInt(10**DECIMALS)) / cycles_per_nanosecond;

    return {
        cycles_remaining,
        cycle_time_remaining: cycle_time_remaining,
        cycles_per_year: (cycles_per_nanosecond * NANOS_PER_YEAR) / BigInt(10**DECIMALS),
        cycles_per_month: (cycles_per_nanosecond * NANOS_PER_MONTH) / BigInt(10**DECIMALS),
        cycles_per_week: (cycles_per_nanosecond * NANOS_PER_WEEK) / BigInt(10**DECIMALS),
        cycles_per_day: (cycles_per_nanosecond * NANOS_PER_DAY) / BigInt(10**DECIMALS),
        cycles_per_hour: (cycles_per_nanosecond * NANOS_PER_HOUR) / BigInt(10**DECIMALS),
        cycles_per_min: (cycles_per_nanosecond * NANOS_PER_MINUTE) / BigInt(10**DECIMALS),
        cycles_per_sec: (cycles_per_nanosecond * NANOS_PER_SECOND) / BigInt(10**DECIMALS),
        cycle_snapshots
    };
}

function calculate_cycle_snapshots(
    cycles_remaining: nat64,
    current_cycle_snapshots: CycleSnapshot[]
) {
    const cycle_snapshot: CycleSnapshot = {
        cycles_remaining,
        timestamp: ic.time()
    };

    const updated_cycle_snapshots = [
        ...current_cycle_snapshots,
        cycle_snapshot
    ];

    if (updated_cycle_snapshots.length > CYCLE_SNAPSHOTS_LENGTH) {
        return updated_cycle_snapshots.slice(updated_cycle_snapshots.length - CYCLE_SNAPSHOTS_LENGTH);
    }
    else {
        return updated_cycle_snapshots;
    }
}

function sort_cycle_snapshots(cycle_snapshots: CycleSnapshot[]): CycleSnapshot[] {
    const sorted_cycle_snapshots = [...cycle_snapshots].sort((a, b) => {
        if (a.timestamp > b.timestamp) {
            return -1;
        }

        if (a.timestamp < b.timestamp) {
            return 1;
        }

        return 0;
    });

    return sorted_cycle_snapshots;
}

function calculate_cycles_per_nanosecond(cycle_snapshots: CycleSnapshot[]): nat64 {
    const deltas = cycle_snapshots.map((cycle_snapshot, index) => {
        const next_cycle_snapshot = cycle_snapshots[index + 1];

        if (next_cycle_snapshot === undefined) {
            return {
                weight: 0n,
                weighted_value: 0n
            };
        }
        else {
            const cycle_delta = cycle_snapshot.cycles_remaining - next_cycle_snapshot.cycles_remaining;
            const time_delta = cycle_snapshot.timestamp - next_cycle_snapshot.timestamp;

            if (cycle_delta >= 0) {
                return {
                    weight: 0n,
                    weighted_value: 0n
                };
            }

            return {
                weight: time_delta,
                weighted_value: cycle_delta * -1n
            };
        }
    });

    const sum_of_weighted_values = deltas.reduce((result, delta) => {
        return result + delta.weighted_value;
    }, 0n);

    const sum_of_weights = deltas.reduce((result, delta) => {
        return result + delta.weight;
    }, 0n);

    const average = sum_of_weights === 0n ? 0n : (sum_of_weighted_values * BigInt(10**DECIMALS)) / sum_of_weights;

    return average;
}