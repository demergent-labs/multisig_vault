import {
    Principal,
    Variant,
    nat64,
    nat8
} from 'azle';

// TODO add the timelock vault
export type State = {
    signers: {
        [principal: Principal]: Principal;
    };
    signerProposals: {
        [id: string]: SignerProposal;
    };
    transferProposals: {
        [id: string]: TransferProposal;
    };
    thresholdProposals: {
        [id: string]: ThresholdProposal;
    };
    threshold: nat8;
};

export type SignerProposal = {
    id: string;
    proposer: Principal;
    signer: Principal;
    approvals: Principal[];
    adopted: boolean;
};

export type ThresholdProposal = {
    id: string;
    proposer: Principal;
    threshold: nat8;
    approvals: Principal[];
    adopted: boolean;
};

export type TransferProposal = {
    id: string;
    proposer: Principal;
    destinationAddress: string; // TODO it would be nice to make this an Address type, just not sure I have that functionality
    amount: nat64;
    approvals: Principal[];
    adopted: boolean;
};

// type Address = string; // TODO would be nice to support this kind of type alias

export type DefaultResult = Variant<{
    ok?: boolean;
    err?: string;
}>;

export type ApproveProposalResult = Variant<{
    ok?: ApproveProposalAction
    err?: string;
}>;

type ApproveProposalAction = {
    approved?: null;
    adopted?: null;
};