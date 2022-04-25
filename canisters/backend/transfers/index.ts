import { Query } from 'azle';
import { state } from '../backend';
import {
    Transfer,
    TransferProposal
} from '../types';

export function get_transfers(): Query<Transfer[]> {
    return Object.values(state.transfers) as Transfer[];
}

export function get_transfer_proposals(): Query<TransferProposal[]> {
    return Object.values(state.transfer_proposals) as TransferProposal[];
}

export { propose_transfer } from './propose';
export { vote_on_transfer_proposal } from './vote';