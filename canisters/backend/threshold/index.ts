import {
    nat8,
    Query
} from 'azle';
import { state } from '../backend';
import { ThresholdProposal } from '../types';

export function getThreshold(): Query<nat8> {
    return state.threshold;
}

export function getThresholdProposals(): Query<ThresholdProposal[]> {
    return Object.values(state.thresholdProposals) as ThresholdProposal[];
}

export { proposeThreshold } from './propose';
export { voteOnThresholdProposal } from './vote';