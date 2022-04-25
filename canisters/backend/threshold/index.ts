import {
    nat8,
    Query
} from 'azle';
import { state } from '../backend';
import { ThresholdProposal } from '../types';

export function get_threshold(): Query<nat8> {
    return state.threshold;
}

export function get_threshold_proposals(): Query<ThresholdProposal[]> {
    return Object.values(state.threshold_proposals) as ThresholdProposal[];
}

export { propose_threshold } from './propose';
export { vote_on_threshold_proposal } from './vote';