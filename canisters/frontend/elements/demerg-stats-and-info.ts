import { nat64 } from 'azle';
import {
    InitialState as DemergAppInitialState,
    State as DemergAppState
} from './demerg-app/state';
import {
    ControllersInfo,
    CycleStatsInfo,
    _SERVICE
} from '../dfx_generated/backend/backend.did';
import { html, render as litRender } from 'lit-html';
import { createObjectStore } from 'reduxular';

import '@ui5/webcomponents/dist/BusyIndicator.js';
import '@ui5/webcomponents/dist/Button.js';
import '@ui5/webcomponents/dist/Card.js';
import '@ui5/webcomponents/dist/CardHeader.js';
import '@ui5/webcomponents/dist/Label.js';
import '@ui5/webcomponents/dist/Table.js';
import '@ui5/webcomponents/dist/TableCell.js';
import '@ui5/webcomponents/dist/TableColumn.js';
import '@ui5/webcomponents/dist/TableRow.js';

type State = {
    backend: DemergAppState['backend'];
    canister_address: {
        loading: boolean;
        value: string;
    };
    canister_principal: {
        loading: boolean;
        value: string;
    };
    controllers_info: ControllersInfo | null;
    cycles_stats_info: CycleStatsInfo | null;
    error_message: string;
    loading_cycles: boolean;
    show_error_dialog: boolean;
};

const InitialState: State = {
    backend: DemergAppInitialState.backend,
    canister_address: {
        loading: true,
        value: ''
    },
    canister_principal: {
        loading: true,
        value: ''
    },
    controllers_info: null,
    cycles_stats_info: null,
    error_message: '',
    loading_cycles: false,
    show_error_dialog: false
};

class DemergStatsAndInfo extends HTMLElement {
    shadow = this.attachShadow({
        mode: 'closed'
    });
    store = createObjectStore(
        InitialState,
        (state: State) => litRender(this.render(state), this.shadow),
        this
    );

    set backend(value: State['backend']) {
        if (this.store.backend === value) {
            return;
        }

        this.store.backend = value;

        if (this.store.backend === null) {
            return;
        }

        this.load_canister_address();
        this.load_canister_principal();
        this.load_controllers_info();
        this.load_cycle_stats();
    }

    async load_canister_address() {
        if (this.store.backend === null) {
            this.store.error_message =
                'You are not authenticated, please refresh.';
            this.store.show_error_dialog = true;

            return;
        }

        const address = await this.store.backend.get_canister_address();

        this.store.canister_address = {
            loading: false,
            value: address
        };
    }

    async load_canister_principal() {
        if (this.store.backend === null) {
            this.store.error_message =
                'You are not authenticated, please refresh.';
            this.store.show_error_dialog = true;

            return;
        }

        const principal = await this.store.backend.get_canister_principal();

        this.store.canister_principal = {
            loading: false,
            value: principal
        };
    }

    async load_controllers_info() {
        if (this.store.backend === null) {
            this.store.error_message =
                'You are not authenticated, please refresh.';
            this.store.show_error_dialog = true;

            return;
        }

        const controllers_info_result =
            await this.store.backend.get_controllers_info();

        if ('ok' in controllers_info_result) {
            this.store.controllers_info = controllers_info_result.ok;
        } else {
            this.handle_error((controllers_info_result as any).err);
        }
    }

    async load_cycle_stats() {
        if (this.store.backend === null) {
            this.store.error_message =
                'You are not authenticated, please refresh.';
            this.store.show_error_dialog = true;

            return;
        }

        await this.snapshot_cycles();
        const cycleStatsInfo = await this.store.backend.get_cycle_stats_info();

        this.store.cycles_stats_info = cycleStatsInfo;
    }

    async snapshot_cycles() {
        if (this.store.backend === null) {
            this.store.error_message =
                'You are not authenticated, please refresh.';
            this.store.show_error_dialog = true;

            return;
        }

        const result = await this.store.backend.snapshot_cycles();

        if (result.hasOwnProperty('err')) {
            this.handle_error((result as any).err);
        }
    }

    handle_error(error: any) {
        console.error(error);

        if (error.message !== undefined) {
            this.store.error_message =
                'There was an error. See the console for more information.';
        } else if (error.startsWith('Rejection code')) {
            this.store.error_message =
                'There was an error. See the console for more information.';
        } else {
            this.store.error_message = error;
        }

        this.store.show_error_dialog = true;
    }

    render(state: State) {
        const canister_address_text =
            state.canister_address.loading === true
                ? 'Loading...'
                : state.canister_address.value;

        const frontend_cycles_remaining =
            state.cycles_stats_info === null
                ? 'Loading...'
                : separate_cycles(
                      state.cycles_stats_info.frontend.cycles_remaining
                  );
        const frontend_cycle_time_remaining =
            state.cycles_stats_info === null
                ? 'Loading...'
                : nanoseconds_to_time_remaining_string(
                      state.cycles_stats_info.frontend.cycle_time_remaining
                  );
        const frontend_cycles_per_year =
            state.cycles_stats_info === null
                ? 'Loading...'
                : separate_cycles(
                      state.cycles_stats_info.frontend.cycles_per_year
                  );
        const frontend_cycles_per_month =
            state.cycles_stats_info === null
                ? 'Loading...'
                : separate_cycles(
                      state.cycles_stats_info.frontend.cycles_per_month
                  );
        const frontend_cycles_per_week =
            state.cycles_stats_info === null
                ? 'Loading...'
                : separate_cycles(
                      state.cycles_stats_info.frontend.cycles_per_week
                  );
        const frontend_cycles_per_day =
            state.cycles_stats_info === null
                ? 'Loading...'
                : separate_cycles(
                      state.cycles_stats_info.frontend.cycles_per_day
                  );
        const frontend_cycles_per_hour =
            state.cycles_stats_info === null
                ? 'Loading...'
                : separate_cycles(
                      state.cycles_stats_info.frontend.cycles_per_hour
                  );
        const frontend_cycles_per_min =
            state.cycles_stats_info === null
                ? 'Loading...'
                : separate_cycles(
                      state.cycles_stats_info.frontend.cycles_per_min
                  );
        const frontend_cycles_per_sec =
            state.cycles_stats_info === null
                ? 'Loading...'
                : separate_cycles(
                      state.cycles_stats_info.frontend.cycles_per_sec
                  );

        const backend_cycles_remaining =
            state.cycles_stats_info === null
                ? 'Loading...'
                : separate_cycles(
                      state.cycles_stats_info.backend.cycles_remaining
                  );
        const backend_cycle_time_remaining =
            state.cycles_stats_info === null
                ? 'Loading...'
                : nanoseconds_to_time_remaining_string(
                      state.cycles_stats_info.backend.cycle_time_remaining
                  );
        const backend_cycles_per_year =
            state.cycles_stats_info === null
                ? 'Loading...'
                : separate_cycles(
                      state.cycles_stats_info.backend.cycles_per_year
                  );
        const backend_cycles_per_month =
            state.cycles_stats_info === null
                ? 'Loading...'
                : separate_cycles(
                      state.cycles_stats_info.backend.cycles_per_month
                  );
        const backend_cycles_per_week =
            state.cycles_stats_info === null
                ? 'Loading...'
                : separate_cycles(
                      state.cycles_stats_info.backend.cycles_per_week
                  );
        const backend_cycles_per_day =
            state.cycles_stats_info === null
                ? 'Loading...'
                : separate_cycles(
                      state.cycles_stats_info.backend.cycles_per_day
                  );
        const backend_cycles_per_hour =
            state.cycles_stats_info === null
                ? 'Loading...'
                : separate_cycles(
                      state.cycles_stats_info.backend.cycles_per_hour
                  );
        const backend_cycles_per_min =
            state.cycles_stats_info === null
                ? 'Loading...'
                : separate_cycles(
                      state.cycles_stats_info.backend.cycles_per_min
                  );
        const backend_cycles_per_sec =
            state.cycles_stats_info === null
                ? 'Loading...'
                : separate_cycles(
                      state.cycles_stats_info.backend.cycles_per_sec
                  );

        return html`
            <link
                rel="stylesheet"
                href="/index.css"
            />

            <ui5-card>
                <ui5-card-header title-text="Stats and Info">
                    <div
                        class="card-header-action-container"
                        slot="action"
                    >
                        <ui5-busy-indicator
                            size="Small"
                            .active=${state.loading_cycles}
                            delay="0"
                        >
                            <ui5-button
                                design="Emphasized"
                                class="table-main-button"
                                @click=${async () => {
                                    this.store.loading_cycles = true;
                                    await this.load_cycle_stats();
                                    this.store.loading_cycles = false;
                                }}
                            >
                                Recalculate
                            </ui5-button>
                        </ui5-busy-indicator>
                    </div>
                </ui5-card-header>

                <ui5-table class="proposals-table">
                    <ui5-table-column
                        slot="columns"
                        demand-popin
                    >
                        <ui5-label>Canister Name</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column
                        slot="columns"
                        demand-popin
                    >
                        <ui5-label>Principal</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column
                        slot="columns"
                        demand-popin
                    >
                        <ui5-label>Cycles Remaining</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column
                        slot="columns"
                        demand-popin
                    >
                        <ui5-label>Cycle Time Remaining</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column
                        slot="columns"
                        demand-popin
                    >
                        <ui5-label>Cycles/year</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column
                        slot="columns"
                        demand-popin
                    >
                        <ui5-label>Cycles/month</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column
                        slot="columns"
                        demand-popin
                    >
                        <ui5-label>Cycles/week</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column
                        slot="columns"
                        demand-popin
                    >
                        <ui5-label>Cycles/day</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column
                        slot="columns"
                        demand-popin
                    >
                        <ui5-label>Cycles/hour</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column
                        slot="columns"
                        demand-popin
                    >
                        <ui5-label>Cycles/min</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column
                        slot="columns"
                        demand-popin
                    >
                        <ui5-label>Cycles/sec</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column
                        slot="columns"
                        demand-popin
                    >
                        <ui5-label>ICP Address</ui5-label>
                    </ui5-table-column>

                    <ui5-table-column
                        slot="columns"
                        demand-popin
                    >
                        <ui5-label>Controllers</ui5-label>
                    </ui5-table-column>

                    <ui5-table-row>
                        <ui5-table-cell>
                            <ui5-label>frontend</ui5-label>
                        </ui5-table-cell>

                        <ui5-table-cell>
                            <ui5-label
                                >${window.process.env
                                    .FRONTEND_CANISTER_ID}</ui5-label
                            >
                        </ui5-table-cell>

                        <ui5-table-cell>
                            <ui5-label>${frontend_cycles_remaining}</ui5-label>
                        </ui5-table-cell>

                        <ui5-table-cell>
                            <ui5-label
                                >${frontend_cycle_time_remaining}</ui5-label
                            >
                        </ui5-table-cell>

                        <ui5-table-cell>
                            <ui5-label>${frontend_cycles_per_year}</ui5-label>
                        </ui5-table-cell>

                        <ui5-table-cell>
                            <ui5-label>${frontend_cycles_per_month}</ui5-label>
                        </ui5-table-cell>

                        <ui5-table-cell>
                            <ui5-label>${frontend_cycles_per_week}</ui5-label>
                        </ui5-table-cell>

                        <ui5-table-cell>
                            <ui5-label>${frontend_cycles_per_day}</ui5-label>
                        </ui5-table-cell>

                        <ui5-table-cell>
                            <ui5-label>${frontend_cycles_per_hour}</ui5-label>
                        </ui5-table-cell>

                        <ui5-table-cell>
                            <ui5-label>${frontend_cycles_per_min}</ui5-label>
                        </ui5-table-cell>

                        <ui5-table-cell>
                            <ui5-label>${frontend_cycles_per_sec}</ui5-label>
                        </ui5-table-cell>

                        <ui5-table-cell>
                            <ui5-label>N/A</ui5-label>
                        </ui5-table-cell>

                        <ui5-table-cell>
                            <ui5-label
                                >${state.controllers_info === null
                                    ? 'Loading...'
                                    : state.controllers_info.frontend.length ===
                                      0
                                    ? 'None'
                                    : state.controllers_info.frontend.join(
                                          ' / '
                                      )}</ui5-label
                            >
                        </ui5-table-cell>
                    </ui5-table-row>

                    <ui5-table-row>
                        <ui5-table-cell>
                            <ui5-label>backend</ui5-label>
                        </ui5-table-cell>

                        <ui5-table-cell>
                            <ui5-label
                                >${window.process.env
                                    .BACKEND_CANISTER_ID}</ui5-label
                            >
                        </ui5-table-cell>

                        <ui5-table-cell>
                            <ui5-label>${backend_cycles_remaining}</ui5-label>
                        </ui5-table-cell>

                        <ui5-table-cell>
                            <ui5-label
                                >${backend_cycle_time_remaining}</ui5-label
                            >
                        </ui5-table-cell>

                        <ui5-table-cell>
                            <ui5-label>${backend_cycles_per_year}</ui5-label>
                        </ui5-table-cell>

                        <ui5-table-cell>
                            <ui5-label>${backend_cycles_per_month}</ui5-label>
                        </ui5-table-cell>

                        <ui5-table-cell>
                            <ui5-label>${backend_cycles_per_week}</ui5-label>
                        </ui5-table-cell>

                        <ui5-table-cell>
                            <ui5-label>${backend_cycles_per_day}</ui5-label>
                        </ui5-table-cell>

                        <ui5-table-cell>
                            <ui5-label>${backend_cycles_per_hour}</ui5-label>
                        </ui5-table-cell>

                        <ui5-table-cell>
                            <ui5-label>${backend_cycles_per_min}</ui5-label>
                        </ui5-table-cell>

                        <ui5-table-cell>
                            <ui5-label>${backend_cycles_per_sec}</ui5-label>
                        </ui5-table-cell>

                        <ui5-table-cell>
                            <ui5-label>${canister_address_text}</ui5-label>
                        </ui5-table-cell>

                        <ui5-table-cell>
                            <ui5-label
                                >${state.controllers_info === null
                                    ? 'Loading...'
                                    : state.controllers_info.backend.length ===
                                      0
                                    ? 'None'
                                    : state.controllers_info.backend.join(
                                          ' / '
                                      )}</ui5-label
                            >
                        </ui5-table-cell>
                    </ui5-table-row>
                </ui5-table>
            </ui5-card>
        `;
    }
}

window.customElements.define('demerg-stats-and-info', DemergStatsAndInfo);

function separate_cycles(cycles: string | number | bigint) {
    return cycles
        .toString()
        .split('')
        .reverse()
        .reduce((result, char, index) => {
            return `${result}${
                index !== 0 && index % 3 === 0 ? '_' : ''
            }${char}`;
        }, '')
        .split('')
        .reverse()
        .join('');
}

function nanoseconds_to_time_remaining_string(nanoseconds: nat64): string {
    const NANOS_PER_SECOND = 1_000_000_000n;
    const NANOS_PER_MINUTE = 60n * NANOS_PER_SECOND;
    const NANOS_PER_HOUR = 60n * NANOS_PER_MINUTE;
    const NANOS_PER_DAY = 24n * NANOS_PER_HOUR;
    const NANOS_PER_WEEK = 7n * NANOS_PER_DAY;
    const NANOS_PER_MONTH = 4n * NANOS_PER_WEEK;
    const NANOS_PER_YEAR = 12n * NANOS_PER_MONTH;

    const total_years = nanoseconds / NANOS_PER_YEAR;
    const total_months = nanoseconds / NANOS_PER_MONTH;
    const total_weeks = nanoseconds / NANOS_PER_WEEK;
    const total_days = nanoseconds / NANOS_PER_DAY;
    const total_hours = nanoseconds / NANOS_PER_HOUR;
    const total_minutes = nanoseconds / NANOS_PER_MINUTE;
    const total_seconds = nanoseconds / NANOS_PER_SECOND;

    const remaining_years = total_years;
    const remaining_months =
        total_years === 0n
            ? total_months
            : (nanoseconds % NANOS_PER_YEAR) / NANOS_PER_MONTH;
    const remaining_weeks =
        total_months === 0n
            ? total_weeks
            : (nanoseconds % NANOS_PER_MONTH) / NANOS_PER_WEEK;
    const remaining_days =
        total_weeks === 0n
            ? total_days
            : (nanoseconds % NANOS_PER_WEEK) / NANOS_PER_DAY;
    const remaining_hours =
        total_days === 0n
            ? total_hours
            : (nanoseconds % NANOS_PER_DAY) / NANOS_PER_HOUR;
    const remaining_minutes =
        total_hours === 0n
            ? total_minutes
            : (nanoseconds % NANOS_PER_HOUR) / NANOS_PER_MINUTE;
    const remaining_seconds =
        total_minutes === 0n
            ? total_seconds
            : (nanoseconds % NANOS_PER_MINUTE) / NANOS_PER_SECOND;

    const years_string =
        remaining_years === 0n
            ? []
            : [
                  `${remaining_years} ${
                      remaining_years === 1n ? 'year' : 'years'
                  }`
              ];
    const months_string =
        remaining_months === 0n
            ? []
            : [
                  `${remaining_months} ${
                      remaining_months === 1n ? 'month' : 'months'
                  }`
              ];
    const weeks_string =
        remaining_weeks === 0n
            ? []
            : [
                  `${remaining_weeks} ${
                      remaining_weeks === 1n ? 'week' : 'weeks'
                  }`
              ];
    const days_string =
        remaining_days === 0n
            ? []
            : [`${remaining_days} ${remaining_days === 1n ? 'day' : 'days'}`];
    const hours_string =
        remaining_hours === 0n
            ? []
            : [
                  `${remaining_hours} ${
                      remaining_hours === 1n ? 'hour' : 'hours'
                  }`
              ];
    const minutes_string =
        remaining_minutes === 0n
            ? []
            : [
                  `${remaining_minutes} ${
                      remaining_minutes === 1n ? 'minute' : 'minutes'
                  }`
              ];
    const seconds_string =
        remaining_seconds === 0n
            ? []
            : [
                  `${remaining_seconds} ${
                      remaining_seconds === 1n ? 'second' : 'seconds'
                  }`
              ];

    return [
        ...years_string,
        ...months_string,
        ...weeks_string,
        ...days_string,
        ...hours_string,
        ...minutes_string,
        ...seconds_string
    ].join(', ');
}
