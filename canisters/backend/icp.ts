import {
    Query,
    Canister,
    CanisterResult,
    UpdateAsync,
    ic,
    nat8,
    nat64
} from 'azle';

export type NameResult = {
    name: string;
};

type AccountIdentifier = nat8[];

type AccountBalanceArgs = {
    account: AccountIdentifier
};

export type Tokens = {
    e8s: nat64;
};

export type ICP = Canister<{
    name(): CanisterResult<NameResult>;
    account_balance(accountBalanceArgs: AccountBalanceArgs): CanisterResult<Tokens>;
}>;