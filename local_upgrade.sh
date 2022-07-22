#!/bin/bash

# frontend
dfx deploy frontend

# backend
dfx build backend
dfx canister uninstall-code backend
dfx canister install backend --argument '(vec { principal "rhnmm-ljdqc-nbsnh-plxdq-3bpss-wuxwn-tzs3k-m2h27-qfzju-2mc4l-eae" }, 1: nat8)' --wasm target/wasm32-unknown-unknown/release/backend.wasm.gz