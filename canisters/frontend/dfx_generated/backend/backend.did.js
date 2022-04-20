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
    'getCanisterCycles' : IDL.Func([], [IDL.Nat64], ['query']),
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
