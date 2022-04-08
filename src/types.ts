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
    signer: Principal;
    adopted: boolean;
    approvals: Principal[];
};

export type ThresholdProposal = {
    id: string;
    threshold: nat8;
    adopted: boolean;
    approvals: Principal[];
};

export type TransferProposal = {
    id: string;
    destinationAddress: string; // TODO it would be nice to make this an Address type, just not sure I have that functionality
    amount: nat64;
    adopted: boolean;
    approvals: Principal[];
};

export type ProposeTransferResult = Variant<{
    ok?: boolean;
    err?: string;
}>;

// type Address = string; // TODO would be nice to support this kind of type alias