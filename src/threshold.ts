import {
    Query,
    Canister,
    CanisterResult,
    UpdateAsync,
    ic,
    Principal,
    int8,
    nat64,
    Update,
    Init
} from 'azle';
import { state } from './multisig_vault';

export function getThreshold(): Query<int8> {
    return state.threshold;
}