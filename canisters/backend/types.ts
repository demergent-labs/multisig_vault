import { Async, blob, Principal, Variant, nat64, nat8, Opt } from 'azle';
import { TransferError } from 'azle/canisters/ledger';

export type State = {
    frontend_cycle_stats: CycleStats;
    backend_cycle_stats: CycleStats;
    signers: {
        [principal: string]: Principal | undefined;
    };
    signer_proposals: {
        [id: string]: SignerProposal | undefined;
    };
    transfers: {
        [id: string]: Transfer | undefined;
    };
    transfer_proposals: {
        [id: string]: TransferProposal | undefined;
    };
    threshold: nat8;
    threshold_proposals: {
        [id: string]: ThresholdProposal | undefined;
    };
};

export type SignerProposal = {
    id: string;
    created_at: nat64;
    proposer: Principal;
    description: string;
    signer: Principal;
    remove: boolean;
    votes: Vote[];
    adopted: boolean;
    adopted_at: Opt<nat64>;
    rejected: boolean;
    rejected_at: Opt<nat64>;
};

export type ThresholdProposal = {
    id: string;
    created_at: nat64;
    proposer: Principal;
    description: string;
    threshold: nat8;
    votes: Vote[];
    adopted: boolean;
    adopted_at: Opt<nat64>;
    rejected: boolean;
    rejected_at: Opt<nat64>;
};

export type TransferProposal = {
    id: string;
    created_at: nat64;
    proposer: Principal;
    description: string;
    destination_address: Address;
    amount: nat64;
    votes: Vote[];
    adopted: boolean;
    adopted_at: Opt<nat64>;
    rejected: boolean;
    rejected_at: Opt<nat64>;
};

export type Address = string;

export type Vote = {
    voter: Principal;
    adopt: boolean;
};

export type DefaultResult = Variant<{
    ok: boolean;
    err: string;
}>;

export type VoteOnProposalResult = Variant<{
    ok: VoteOnProposalAction;
    err: string;
}>;

export type VoteOnTransferProposalResult = Variant<{
    ok: VoteOnProposalAction;
    err: Variant<{
        message: string;
        transfer_error: TransferError;
    }>;
}>;

type VoteOnProposalAction = Variant<{
    voted: null;
    adopted: null;
    rejected: null;
}>;

export type Transfer = {
    id: string;
    to: Principal;
    amount: nat64;
};

export type VaultBalanceResult = Variant<{
    ok: nat64;
    err: string;
}>;

export type VoteOnSignerProposalChecksResult = Variant<{
    ok: SignerProposal;
    err: string;
}>;

export type VoteOnThresholdProposalChecksResult = Variant<{
    ok: ThresholdProposal;
    err: string;
}>;

export type VoteOnTransferProposalChecksResult = Variant<{
    ok: TransferProposal;
    err: string;
}>;

export type ProposeTransferChecksResult = Variant<{
    ok: {
        randomness: blob;
    };
    err: string;
}>;

export type VoteMutator = () => VoteOnProposalResult;
export type TransferVoteMutator = () => Async<VoteOnTransferProposalResult>;

export type DefaultMutator = () => DefaultResult;

export type CycleStats = {
    cycles_remaining: nat64;
    cycle_time_remaining: nat64;
    cycles_per_year: nat64;
    cycles_per_month: nat64;
    cycles_per_week: nat64;
    cycles_per_day: nat64;
    cycles_per_hour: nat64;
    cycles_per_min: nat64;
    cycles_per_sec: nat64;
    cycle_snapshots: CycleSnapshot[];
};

export type CycleSnapshot = {
    cycles_remaining: nat64;
    timestamp: nat64;
};

export type CycleStatsInfo = {
    frontend: {
        cycles_remaining: nat64;
        cycle_time_remaining: nat64;
        cycles_per_year: nat64;
        cycles_per_month: nat64;
        cycles_per_week: nat64;
        cycles_per_day: nat64;
        cycles_per_hour: nat64;
        cycles_per_min: nat64;
        cycles_per_sec: nat64;
    };
    backend: {
        cycles_remaining: nat64;
        cycle_time_remaining: nat64;
        cycles_per_year: nat64;
        cycles_per_month: nat64;
        cycles_per_week: nat64;
        cycles_per_day: nat64;
        cycles_per_hour: nat64;
        cycles_per_min: nat64;
        cycles_per_sec: nat64;
    };
};

export type ControllersInfoResult = Variant<{
    ok: ControllersInfo;
    err: string;
}>;

type ControllersInfo = {
    frontend: Principal[];
    backend: Principal[];
};

export type RandomnessResult = Variant<{
    ok: blob;
    err: string;
}>;
