import {
    Query,
    Canister,
    CanisterResult,
    UpdateAsync,
    ic
} from 'azle';

export type NameResult = {
    name: string;
};

export type ICPCanister = Canister<{
    name(): CanisterResult<NameResult>;
}>;