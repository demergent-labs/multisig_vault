import type { Principal } from '@dfinity/principal';
export interface AccountBalanceArgs { 'account' : AccountIdentifier }
export type AccountIdentifier = Array<number>;
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
  'votes' : Array<Vote>,
  'description' : string,
  'rejected' : boolean,
  'proposer' : Principal,
  'signer' : Principal,
  'adopted' : boolean,
}
export interface ThresholdProposal {
  'id' : string,
  'threshold' : number,
  'votes' : Array<Vote>,
  'description' : string,
  'rejected' : boolean,
  'proposer' : Principal,
  'adopted' : boolean,
}
export interface Tokens { 'e8s' : bigint }
export interface Transfer { 'id' : string, 'to' : Principal, 'amount' : bigint }
export interface TransferProposal {
  'id' : string,
  'votes' : Array<Vote>,
  'destinationAddress' : string,
  'rejected' : boolean,
  'proposer' : Principal,
  'amount' : bigint,
  'adopted' : boolean,
}
export interface Vote { 'adopt' : boolean, 'voter' : Principal }
export type VoteOnProposalAction = { 'voted' : null } |
  { 'rejected' : null } |
  { 'adopted' : null };
export type VoteOnProposalResult = { 'ok' : VoteOnProposalAction } |
  { 'err' : string };
export interface _SERVICE {
  'getSignerProposals' : () => Promise<Array<SignerProposal>>,
  'getSigners' : () => Promise<Array<Principal>>,
  'getThreshold' : () => Promise<number>,
  'getThresholdProposals' : () => Promise<Array<ThresholdProposal>>,
  'getTransferProposals' : () => Promise<Array<TransferProposal>>,
  'getTransfers' : () => Promise<Array<Transfer>>,
  'getVaultBalance' : () => Promise<bigint>,
  'proposeSigner' : (arg_0: string, arg_1: Principal) => Promise<DefaultResult>,
  'proposeThreshold' : (arg_0: string, arg_1: number) => Promise<DefaultResult>,
  'proposeTransfer' : (arg_0: string, arg_1: bigint) => Promise<DefaultResult>,
  'voteOnSignerProposal' : (arg_0: string, arg_1: boolean) => Promise<
      VoteOnProposalResult
    >,
  'voteOnThresholdProposal' : (arg_0: string, arg_1: boolean) => Promise<
      VoteOnProposalResult
    >,
  'voteOnTransferProposal' : (arg_0: string, arg_1: boolean) => Promise<
      VoteOnProposalResult
    >,
}
