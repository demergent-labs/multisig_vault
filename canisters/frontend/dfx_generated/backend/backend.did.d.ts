import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface AccountBalanceArgs {
    account: Array<number>;
}
export interface Archive {
    canister_id: Principal;
}
export interface Archives {
    archives: Array<Archive>;
}
export interface Block {
    transaction: Transaction;
    timestamp: TimeStamp;
    parent_hash: [] | [Array<number>];
}
export interface BlockRange {
    blocks: Array<Block>;
}
export interface CanisterSettings {
    freezing_threshold: [] | [bigint];
    controllers: [] | [Array<Principal>];
    memory_allocation: [] | [bigint];
    compute_allocation: [] | [bigint];
}
export type CanisterStatus =
    | { stopped: null }
    | { stopping: null }
    | { running: null };
export interface CanisterStatusArgs {
    canister_id: Principal;
}
export interface CanisterStatusResult {
    status: CanisterStatus;
    memory_size: bigint;
    cycles: bigint;
    settings: DefiniteCanisterSettings;
    module_hash: [] | [Array<number>];
}
export interface ControllersInfo {
    frontend: Array<Principal>;
    backend: Array<Principal>;
}
export type ControllersInfoResult = { ok: ControllersInfo } | { err: string };
export interface CreateCanisterArgs {
    settings: [] | [CanisterSettings];
}
export interface CreateCanisterResult {
    canister_id: Principal;
}
export interface CycleStatsInfo {
    frontend: {
        cycles_remaining: bigint;
        cycles_per_day: bigint;
        cycles_per_min: bigint;
        cycles_per_sec: bigint;
        cycles_per_month: bigint;
        cycles_per_hour: bigint;
        cycles_per_week: bigint;
        cycles_per_year: bigint;
        cycle_time_remaining: bigint;
    };
    backend: {
        cycles_remaining: bigint;
        cycles_per_day: bigint;
        cycles_per_min: bigint;
        cycles_per_sec: bigint;
        cycles_per_month: bigint;
        cycles_per_hour: bigint;
        cycles_per_week: bigint;
        cycles_per_year: bigint;
        cycle_time_remaining: bigint;
    };
}
export interface DecimalsResult {
    decimals: number;
}
export type DefaultResult = { ok: boolean } | { err: string };
export interface DefiniteCanisterSettings {
    freezing_threshold: bigint;
    controllers: Array<Principal>;
    memory_allocation: bigint;
    compute_allocation: bigint;
}
export interface DeleteCanisterArgs {
    canister_id: Principal;
}
export interface DepositCyclesArgs {
    canister_id: Principal;
}
export interface GetBlocksArgs {
    start: bigint;
    length: bigint;
}
export interface InstallCodeArgs {
    arg: Array<number>;
    wasm_module: Array<number>;
    mode: InstallCodeMode;
    canister_id: Principal;
}
export type InstallCodeMode =
    | { reinstall: null }
    | { upgrade: null }
    | { install: null };
export interface NameResult {
    name: string;
}
export type Operation =
    | {
          Burn: { from: Array<number>; amount: Tokens };
      }
    | { Mint: { to: Array<number>; amount: Tokens } }
    | {
          Transfer: {
              to: Array<number>;
              fee: Tokens;
              from: Array<number>;
              amount: Tokens;
          };
      };
export interface ProvisionalCreateCanisterWithCyclesArgs {
    settings: [] | [CanisterSettings];
    amount: [] | [bigint];
}
export interface ProvisionalCreateCanisterWithCyclesResult {
    canister_id: Principal;
}
export interface ProvisionalTopUpCanisterArgs {
    canister_id: Principal;
    amount: bigint;
}
export type QueryArchiveError =
    | {
          BadFirstBlockIndex: {
              requested_index: bigint;
              first_valid_index: bigint;
          };
      }
    | { Other: { error_message: string; error_code: bigint } };
export type QueryArchiveFn = ActorMethod<[GetBlocksArgs], QueryArchiveResult>;
export type QueryArchiveResult =
    | { Ok: BlockRange }
    | { Err: QueryArchiveError };
export interface QueryBlocksResponse {
    certificate: [] | [Array<number>];
    blocks: Array<Block>;
    chain_length: bigint;
    first_block_index: bigint;
    archived_blocks: Array<{
        callback: QueryArchiveFn;
        start: bigint;
        length: bigint;
    }>;
}
export interface SignerProposal {
    id: string;
    remove: boolean;
    rejected_at: [] | [bigint];
    adopted_at: [] | [bigint];
    votes: Array<Vote>;
    description: string;
    created_at: bigint;
    rejected: boolean;
    proposer: Principal;
    signer: Principal;
    adopted: boolean;
}
export interface StartCanisterArgs {
    canister_id: Principal;
}
export interface StopCanisterArgs {
    canister_id: Principal;
}
export interface SymbolResult {
    symbol: string;
}
export interface ThresholdProposal {
    id: string;
    rejected_at: [] | [bigint];
    adopted_at: [] | [bigint];
    threshold: number;
    votes: Array<Vote>;
    description: string;
    created_at: bigint;
    rejected: boolean;
    proposer: Principal;
    adopted: boolean;
}
export interface TimeStamp {
    timestamp_nanos: bigint;
}
export interface Tokens {
    e8s: bigint;
}
export interface Transaction {
    memo: bigint;
    operation: [] | [Operation];
    created_at_time: TimeStamp;
}
export interface Transfer {
    id: string;
    to: Principal;
    amount: bigint;
}
export interface TransferArgs {
    to: Array<number>;
    fee: Tokens;
    memo: bigint;
    from_subaccount: [] | [Array<number>];
    created_at_time: [] | [TimeStamp];
    amount: Tokens;
}
export type TransferError =
    | {
          TxTooOld: { allowed_window_nanos: bigint };
      }
    | { BadFee: { expected_fee: Tokens } }
    | { TxDuplicate: { duplicate_of: bigint } }
    | { TxCreatedInFuture: null }
    | { InsufficientFunds: { balance: Tokens } };
export interface TransferFee {
    transfer_fee: Tokens;
}
export type TransferFeeArg = {};
export interface TransferProposal {
    id: string;
    destination_address: string;
    rejected_at: [] | [bigint];
    adopted_at: [] | [bigint];
    votes: Array<Vote>;
    description: string;
    created_at: bigint;
    rejected: boolean;
    proposer: Principal;
    amount: bigint;
    adopted: boolean;
}
export type TransferResult = { Ok: bigint } | { Err: TransferError };
export interface UninstallCodeArgs {
    canister_id: Principal;
}
export interface UpdateSettingsArgs {
    canister_id: Principal;
    settings: CanisterSettings;
}
export type VaultBalanceResult = { ok: bigint } | { err: string };
export interface Vote {
    adopt: boolean;
    voter: Principal;
}
export type VoteOnProposalAction =
    | { voted: null }
    | { rejected: null }
    | { adopted: null };
export type VoteOnProposalResult =
    | { ok: VoteOnProposalAction }
    | { err: string };
export type VoteOnTransferProposalResult =
    | { ok: VoteOnProposalAction }
    | { err: { transfer_error: TransferError } | { message: string } };
export interface _SERVICE {
    get_address_from_principal: ActorMethod<[Principal], string>;
    get_canister_address: ActorMethod<[], string>;
    get_canister_principal: ActorMethod<[], Principal>;
    get_controllers_info: ActorMethod<[], ControllersInfoResult>;
    get_cycle_stats_info: ActorMethod<[], CycleStatsInfo>;
    get_signer_proposals: ActorMethod<[], Array<SignerProposal>>;
    get_signers: ActorMethod<[], Array<Principal>>;
    get_threshold: ActorMethod<[], number>;
    get_threshold_proposals: ActorMethod<[], Array<ThresholdProposal>>;
    get_transfer_proposals: ActorMethod<[], Array<TransferProposal>>;
    get_transfers: ActorMethod<[], Array<Transfer>>;
    get_vault_balance: ActorMethod<[], VaultBalanceResult>;
    propose_signer: ActorMethod<[string, Principal, boolean], DefaultResult>;
    propose_threshold: ActorMethod<[string, number], DefaultResult>;
    propose_transfer: ActorMethod<[string, string, bigint], DefaultResult>;
    snapshot_cycles: ActorMethod<[], DefaultResult>;
    vote_on_signer_proposal: ActorMethod<
        [string, boolean],
        VoteOnProposalResult
    >;
    vote_on_threshold_proposal: ActorMethod<
        [string, boolean],
        VoteOnProposalResult
    >;
    vote_on_transfer_proposal: ActorMethod<
        [string, boolean],
        VoteOnTransferProposalResult
    >;
}
