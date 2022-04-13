import {
    Query,
    Canister,
    CanisterResult,
    UpdateAsync,
    ic,
    nat8,
    nat64,
    Opt,
    Variant
} from 'azle';

export type NameResult = {
    name: string;
};

type AccountIdentifier = nat8[];

type AccountBalanceArgs = {
    account: AccountIdentifier
};

type TransferFeeArg = {};

type Memo = nat64;

type SubAccount = nat8[];

type TimeStamp = {
    timestamp_nanos: nat64;
};

type TransferArgs = {
    memo: Memo;
    amount: Tokens;
    fee: Tokens;
    from_subaccount: Opt<SubAccount>;
    to: AccountIdentifier;
    created_at_time: Opt<TimeStamp>;
};

type BlockIndex = nat64;

type TransferError = Variant<{
    BadFee?: {
        expected_fee: Tokens;
    };
    InsufficientFunds?: {
        balance: Tokens;
    };
    TxTooOld?: {
        allowed_window_nanos: nat64;
    };
    TxCreatedInFuture?: null;
    TxDuplicate?: {
        duplicate_of: BlockIndex;
    };
}>;

export type TransferResult = Variant<{
    Ok?: nat64;
    Err?: TransferError
}>;

export type TransferFee = {
    transfer_fee: Tokens;
};

export type Tokens = {
    e8s: nat64;
};

export type ICP = Canister<{
    name(): CanisterResult<NameResult>;
    account_balance(accountBalanceArgs: AccountBalanceArgs): CanisterResult<Tokens>;
    transfer_fee(transfer_fee_arg: TransferFeeArg): CanisterResult<TransferFee>;
    transfer(transfer_args: TransferArgs): CanisterResult<TransferResult>;
}>;