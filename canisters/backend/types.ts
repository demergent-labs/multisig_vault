import {
    Principal,
    Variant,
    nat64,
    nat8,
    Opt
} from 'azle';

// TODO add the timelock vault
export type State = {
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
    destinationAddress: string; // TODO it would be nice to make this an Address type, just not sure I have that functionality
    amount: nat64;
    votes: Vote[];
    adopted: boolean;
    adopted_at: Opt<nat64>;
    rejected: boolean;
    rejected_at: Opt<nat64>;
};

export type Address = string; // TODO would be nice to support this kind of type alias

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