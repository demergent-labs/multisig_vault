import {
    Principal,
    Variant,
    nat64,
    nat8,
    Opt
} from 'azle';

export type State = {
    frontend_cycle_stats: CycleStats;
    backend_cycle_stats: CycleStats;
    signers: {
        [principal: Principal]: Principal | undefined;
    };
    signerProposals: {
        [id: string]: SignerProposal | undefined;
    };
    transfers: {
        [id: string]: Transfer | undefined;
    };
    transferProposals: {
        [id: string]: TransferProposal | undefined;
    };
    threshold: nat8;
    thresholdProposals: {
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
    destinationAddress: Address;
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
    ok?: boolean;
    err?: string;
}>;

export type VoteOnProposalResult = Variant<{
    ok?: VoteOnProposalAction
    err?: string;
}>;

type VoteOnProposalAction = Variant<{
    voted?: null;
    adopted?: null;
    rejected?: null;
}>;

export type Transfer = {
    id: string;
    to: Principal;
    amount: nat64;
};

export type VaultBalanceResult = Variant<{
    ok?: nat64;
    err?: string;
}>;

export type VoteOnSignerProposalChecksResult = {
    ok?: SignerProposal;
    err?: string;
};

export type VoteOnThresholdProposalChecksResult = {
    ok?: ThresholdProposal;
    err?: string;
};

export type VoteOnTransferProposalChecksResult = {
    ok?: TransferProposal;
    err?: string;
};

export type ProposeTransferChecksResult = Variant<{
    ok?: {
        randomness: nat8[];
    };
    err?: string;
}>;

export type VoteMutator = () => VoteOnProposalResult;

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
    ok?: ControllersInfo;
    err?: string;
}>;

type ControllersInfo = {
    frontend: Principal[];
    backend: Principal[];
};