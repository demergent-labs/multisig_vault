export const idlFactory = ({ IDL }) => {
  const Vote = IDL.Record({ 'adopt' : IDL.Bool, 'voter' : IDL.Principal });
  const SignerProposal = IDL.Record({
    'id' : IDL.Text,
    'remove' : IDL.Bool,
    'rejected_at' : IDL.Opt(IDL.Nat64),
    'adopted_at' : IDL.Opt(IDL.Nat64),
    'votes' : IDL.Vec(Vote),
    'description' : IDL.Text,
    'created_at' : IDL.Nat64,
    'rejected' : IDL.Bool,
    'proposer' : IDL.Principal,
    'signer' : IDL.Principal,
    'adopted' : IDL.Bool,
  });
  const ThresholdProposal = IDL.Record({
    'id' : IDL.Text,
    'rejected_at' : IDL.Opt(IDL.Nat64),
    'adopted_at' : IDL.Opt(IDL.Nat64),
    'threshold' : IDL.Nat8,
    'votes' : IDL.Vec(Vote),
    'description' : IDL.Text,
    'created_at' : IDL.Nat64,
    'rejected' : IDL.Bool,
    'proposer' : IDL.Principal,
    'adopted' : IDL.Bool,
  });
  const TransferProposal = IDL.Record({
    'id' : IDL.Text,
    'rejected_at' : IDL.Opt(IDL.Nat64),
    'adopted_at' : IDL.Opt(IDL.Nat64),
    'votes' : IDL.Vec(Vote),
    'destinationAddress' : IDL.Text,
    'description' : IDL.Text,
    'created_at' : IDL.Nat64,
    'rejected' : IDL.Bool,
    'proposer' : IDL.Principal,
    'amount' : IDL.Nat64,
    'adopted' : IDL.Bool,
  });
  const Transfer = IDL.Record({
    'id' : IDL.Text,
    'to' : IDL.Principal,
    'amount' : IDL.Nat64,
  });
  const VaultBalanceResult = IDL.Variant({
    'ok' : IDL.Nat64,
    'err' : IDL.Text,
  });
  const ControllersInfo = IDL.Record({
    'frontend' : IDL.Vec(IDL.Principal),
    'backend' : IDL.Vec(IDL.Principal),
  });
  const ControllersInfoResult = IDL.Variant({
    'ok' : ControllersInfo,
    'err' : IDL.Text,
  });
  const CycleSnapshot = IDL.Record({
    'cycles_remaining' : IDL.Nat64,
    'timestamp' : IDL.Nat64,
  });
  const CycleStats = IDL.Record({
    'cycles_remaining' : IDL.Nat64,
    'cycles_per_day' : IDL.Nat64,
    'cycles_per_min' : IDL.Nat64,
    'cycles_per_sec' : IDL.Nat64,
    'cycles_per_month' : IDL.Nat64,
    'cycles_per_hour' : IDL.Nat64,
    'cycles_per_week' : IDL.Nat64,
    'cycles_per_year' : IDL.Nat64,
    'cycle_snapshots' : IDL.Vec(CycleSnapshot),
    'cycle_time_remaining' : IDL.Nat64,
  });
  const CycleStatsInfo = IDL.Record({
    'frontend' : CycleStats,
    'backend' : CycleStats,
  });
  const DefaultResult = IDL.Variant({ 'ok' : IDL.Bool, 'err' : IDL.Text });
  const VoteOnProposalAction = IDL.Variant({
    'voted' : IDL.Null,
    'rejected' : IDL.Null,
    'adopted' : IDL.Null,
  });
  const VoteOnProposalResult = IDL.Variant({
    'ok' : VoteOnProposalAction,
    'err' : IDL.Text,
  });
  return IDL.Service({
    'getCanisterAddress' : IDL.Func([], [IDL.Text], ['query']),
    'getCanisterPrincipal' : IDL.Func([], [IDL.Text], ['query']),
    'getSignerProposals' : IDL.Func([], [IDL.Vec(SignerProposal)], ['query']),
    'getSigners' : IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    'getThreshold' : IDL.Func([], [IDL.Nat8], ['query']),
    'getThresholdProposals' : IDL.Func(
        [],
        [IDL.Vec(ThresholdProposal)],
        ['query'],
      ),
    'getTransferProposals' : IDL.Func(
        [],
        [IDL.Vec(TransferProposal)],
        ['query'],
      ),
    'getTransfers' : IDL.Func([], [IDL.Vec(Transfer)], ['query']),
    'getVaultBalance' : IDL.Func([], [VaultBalanceResult], []),
    'get_controllers_info' : IDL.Func([], [ControllersInfoResult], []),
    'get_cycle_stats_info' : IDL.Func([], [CycleStatsInfo], ['query']),
    'proposeSigner' : IDL.Func(
        [IDL.Text, IDL.Principal, IDL.Bool],
        [DefaultResult],
        [],
      ),
    'proposeThreshold' : IDL.Func([IDL.Text, IDL.Nat8], [DefaultResult], []),
    'proposeTransfer' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat64],
        [DefaultResult],
        [],
      ),
    'snapshot_cycles' : IDL.Func([], [DefaultResult], []),
    'voteOnSignerProposal' : IDL.Func(
        [IDL.Text, IDL.Bool],
        [VoteOnProposalResult],
        [],
      ),
    'voteOnThresholdProposal' : IDL.Func(
        [IDL.Text, IDL.Bool],
        [VoteOnProposalResult],
        [],
      ),
    'voteOnTransferProposal' : IDL.Func(
        [IDL.Text, IDL.Bool],
        [VoteOnProposalResult],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return [IDL.Vec(IDL.Principal), IDL.Nat8]; };
