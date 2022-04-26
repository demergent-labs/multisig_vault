import type { Principal } from '@dfinity/principal';
export interface AccountBalanceArgs { 'account' : Array<number> }
export type CanisterStatus = { 'stopped' : null } |
  { 'stopping' : null } |
  { 'running' : null };
export interface CanisterStatusArgs { 'canister_id' : Principal }
export interface CanisterStatusResult {
  'status' : CanisterStatus,
  'memory_size' : bigint,
  'cycles' : bigint,
  'settings' : DefiniteCanisterSettings,
  'module_hash' : [] | [Array<number>],
}
export interface ControllersInfo {
  'frontend' : Array<Principal>,
  'backend' : Array<Principal>,
}
export type ControllersInfoResult = { 'ok' : ControllersInfo } |
  { 'err' : string };
export interface CycleStatsInfo {
  'frontend' : {
    'cycles_remaining' : bigint,
    'cycles_per_day' : bigint,
    'cycles_per_min' : bigint,
    'cycles_per_sec' : bigint,
    'cycles_per_month' : bigint,
    'cycles_per_hour' : bigint,
    'cycles_per_week' : bigint,
    'cycles_per_year' : bigint,
    'cycle_time_remaining' : bigint,
  },
  'backend' : {
    'cycles_remaining' : bigint,
    'cycles_per_day' : bigint,
    'cycles_per_min' : bigint,
    'cycles_per_sec' : bigint,
    'cycles_per_month' : bigint,
    'cycles_per_hour' : bigint,
    'cycles_per_week' : bigint,
    'cycles_per_year' : bigint,
    'cycle_time_remaining' : bigint,
  },
}
export type DefaultResult = { 'ok' : boolean } |
  { 'err' : string };
export interface DefiniteCanisterSettings {
  'freezing_threshold' : bigint,
  'controllers' : Array<Principal>,
  'memory_allocation' : bigint,
  'compute_allocation' : bigint,
}
export interface NameResult { 'name' : string }
export interface SignerProposal {
  'id' : string,
  'remove' : boolean,
  'rejected_at' : [] | [bigint],
  'adopted_at' : [] | [bigint],
  'votes' : Array<Vote>,
  'description' : string,
  'created_at' : bigint,
  'rejected' : boolean,
  'proposer' : Principal,
  'signer' : Principal,
  'adopted' : boolean,
}
export interface ThresholdProposal {
  'id' : string,
  'rejected_at' : [] | [bigint],
  'adopted_at' : [] | [bigint],
  'threshold' : number,
  'votes' : Array<Vote>,
  'description' : string,
  'created_at' : bigint,
  'rejected' : boolean,
  'proposer' : Principal,
  'adopted' : boolean,
}
export interface TimeStamp { 'timestamp_nanos' : bigint }
export interface Tokens { 'e8s' : bigint }
export interface Transfer { 'id' : string, 'to' : Principal, 'amount' : bigint }
export interface TransferArgs {
  'to' : Array<number>,
  'fee' : Tokens,
  'memo' : bigint,
  'from_subaccount' : [] | [Array<number>],
  'created_at_time' : [] | [TimeStamp],
  'amount' : Tokens,
}
export type TransferError = {
    'TxTooOld' : { 'allowed_window_nanos' : bigint }
  } |
  { 'BadFee' : { 'expected_fee' : Tokens } } |
  { 'TxDuplicate' : { 'duplicate_of' : bigint } } |
  { 'TxCreatedInFuture' : null } |
  { 'InsufficientFunds' : { 'balance' : Tokens } };
export interface TransferFee { 'transfer_fee' : Tokens }
export type TransferFeeArg = {};
export interface TransferProposal {
  'id' : string,
  'destination_address' : string,
  'rejected_at' : [] | [bigint],
  'adopted_at' : [] | [bigint],
  'votes' : Array<Vote>,
  'description' : string,
  'created_at' : bigint,
  'rejected' : boolean,
  'proposer' : Principal,
  'amount' : bigint,
  'adopted' : boolean,
}
export type TransferResult = { 'Ok' : bigint } |
  { 'Err' : TransferError };
export type VaultBalanceResult = { 'ok' : bigint } |
  { 'err' : string };
export interface Vote { 'adopt' : boolean, 'voter' : Principal }
export type VoteOnProposalAction = { 'voted' : null } |
  { 'rejected' : null } |
  { 'adopted' : null };
export type VoteOnProposalResult = { 'ok' : VoteOnProposalAction } |
  { 'err' : string };
export interface _SERVICE {
  'get_canister_address' : () => Promise<string>,
  'get_canister_principal' : () => Promise<string>,
  'get_controllers_info' : () => Promise<ControllersInfoResult>,
  'get_cycle_stats_info' : () => Promise<CycleStatsInfo>,
  'get_signer_proposals' : () => Promise<Array<SignerProposal>>,
  'get_signers' : () => Promise<Array<Principal>>,
  'get_threshold' : () => Promise<number>,
  'get_threshold_proposals' : () => Promise<Array<ThresholdProposal>>,
  'get_transfer_proposals' : () => Promise<Array<TransferProposal>>,
  'get_transfers' : () => Promise<Array<Transfer>>,
  'get_vault_balance' : () => Promise<VaultBalanceResult>,
  'propose_signer' : (
      arg_0: string,
      arg_1: Principal,
      arg_2: boolean,
    ) => Promise<DefaultResult>,
  'propose_threshold' : (arg_0: string, arg_1: number) => Promise<
      DefaultResult
    >,
  'propose_transfer' : (arg_0: string, arg_1: string, arg_2: bigint) => Promise<
      DefaultResult
    >,
  'snapshot_cycles' : () => Promise<DefaultResult>,
  'vote_on_signer_proposal' : (arg_0: string, arg_1: boolean) => Promise<
      VoteOnProposalResult
    >,
  'vote_on_threshold_proposal' : (arg_0: string, arg_1: boolean) => Promise<
      VoteOnProposalResult
    >,
  'vote_on_transfer_proposal' : (arg_0: string, arg_1: boolean) => Promise<
      VoteOnProposalResult
    >,
}
