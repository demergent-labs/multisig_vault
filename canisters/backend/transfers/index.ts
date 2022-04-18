import { Query } from 'azle';
import { state } from '../backend';
import {
    Transfer,
    TransferProposal
} from '../types';

export function getTransfers(): Query<Transfer[]> {
    return Object.values(state.transfers) as Transfer[];
}

export function getTransferProposals(): Query<TransferProposal[]> {
    return Object.values(state.transferProposals) as TransferProposal[];
}

export { proposeTransfer } from './propose';
export { voteOnTransferProposal } from './vote';