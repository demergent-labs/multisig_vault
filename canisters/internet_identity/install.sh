#!/bin/bash

FILE=./internet_identity_test.wasm
if test -f "$FILE"; then
    echo "./internet_identity_test.wasm exists"
else
    echo "./internet_identity_test.wasm doesn't exist, downloading"
    curl -o internet_identity_test.wasm -sSL https://github.com/dfinity/internet-identity/releases/latest/download/internet_identity_test.wasm
fi
