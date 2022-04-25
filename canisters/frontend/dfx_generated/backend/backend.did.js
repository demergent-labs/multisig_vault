export const idlFactory = ({ IDL }) => {
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
  const CycleStatsInfo = IDL.Record({
    'frontend' : IDL.Record({
      'cycles_remaining' : IDL.Nat64,
      'cycles_per_day' : IDL.Nat64,
      'cycles_per_min' : IDL.Nat64,
      'cycles_per_sec' : IDL.Nat64,
      'cycles_per_month' : IDL.Nat64,
      'cycles_per_hour' : IDL.Nat64,
      'cycles_per_week' : IDL.Nat64,
      'cycles_per_year' : IDL.Nat64,
      'cycle_time_remaining' : IDL.Nat64,
    }),
    'backend' : IDL.Record({
      'cycles_remaining' : IDL.Nat64,
      'cycles_per_day' : IDL.Nat64,
      'cycles_per_min' : IDL.Nat64,
      'cycles_per_sec' : IDL.Nat64,
      'cycles_per_month' : IDL.Nat64,
      'cycles_per_hour' : IDL.Nat64,
      'cycles_per_week' : IDL.Nat64,
      'cycles_per_year' : IDL.Nat64,
      'cycle_time_remaining' : IDL.Nat64,
    }),
  });
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
    'destination_address' : IDL.Text,
    'rejected_at' : IDL.Opt(IDL.Nat64),
    'adopted_at' : IDL.Opt(IDL.Nat64),
    'votes' : IDL.Vec(Vote),
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
    'getVaultBalance' : IDL.Func([], [VaultBalanceResult], []),
    'get_canister_address' : IDL.Func([], [IDL.Text], ['query']),
    'get_canister_principal' : IDL.Func([], [IDL.Text], ['query']),
    'get_controllers_info' : IDL.Func([], [ControllersInfoResult], []),
    'get_cycle_stats_info' : IDL.Func([], [CycleStatsInfo], ['query']),
    'get_signer_proposals' : IDL.Func([], [IDL.Vec(SignerProposal)], ['query']),
    'get_signers' : IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    'get_threshold' : IDL.Func([], [IDL.Nat8], ['query']),
    'get_threshold_proposals' : IDL.Func(
        [],
        [IDL.Vec(ThresholdProposal)],
        ['query'],
      ),
    'get_transfer_proposals' : IDL.Func(
        [],
        [IDL.Vec(TransferProposal)],
        ['query'],
      ),
    'get_transfers' : IDL.Func([], [IDL.Vec(Transfer)], ['query']),
    'propose_signer' : IDL.Func(
        [IDL.Text, IDL.Principal, IDL.Bool],
        [DefaultResult],
        [],
      ),
    'propose_threshold' : IDL.Func([IDL.Text, IDL.Nat8], [DefaultResult], []),
    'propose_transfer' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat64],
        [DefaultResult],
        [],
      ),
    'snapshot_cycles' : IDL.Func([], [DefaultResult], []),
    'vote_on_signer_proposal' : IDL.Func(
        [IDL.Text, IDL.Bool],
        [VoteOnProposalResult],
        [],
      ),
    'vote_on_threshold_proposal' : IDL.Func(
        [IDL.Text, IDL.Bool],
        [VoteOnProposalResult],
        [],
      ),
    'vote_on_transfer_proposal' : IDL.Func(
        [IDL.Text, IDL.Bool],
        [VoteOnProposalResult],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return [IDL.Vec(IDL.Principal), IDL.Nat8]; };
