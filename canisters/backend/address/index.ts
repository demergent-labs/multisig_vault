// TODO add proper licensing and create proper npm package so we do not have to reimplement this all of the time
// TODO also once Azle is on the version of boa with class support, we should be able to use @dfinity/principal I would hope
// TODO maybe just make an azle-principal package

import { Principal } from 'azle';
import { Address } from '../types';
import { sha224 } from 'hash.js';
import { crc32 } from './crc32';
import { decode } from './decode';

export function hexAddressFromPrincipal(principal: Principal): Address {
    return addressFromPrincipal(principal);
}

export function binaryAddressFromPrincipal(principal: Principal): number[] {
  const address = addressFromPrincipal(principal);;
  return address.match(/.{1,2}/g)?.map((x) => parseInt(x, 16)) ?? [];
}

export function binaryAddressFromAddress(address: Address): number[] {
    return address.match(/.{1,2}/g)?.map((x) => parseInt(x, 16)) ?? [];
}

// https://github.com/Toniq-Labs/extendable-token/blob/86eabb7336ea259876be9be830fb69b03046ea14/motoko/util/AccountIdentifier.mo
// addressFromPrincipal probably licensed as a derivative work with the following license
// MIT License

// Copyright (c) 2022 Toniq Labs

// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
function addressFromPrincipal(principal: Principal): Address {
    const decodedPrincipalUint8Array = decodePrincipalFromText(principal);
    const decodedPrincipalText = [...decodedPrincipalUint8Array].map(x => String.fromCharCode(x)).join('');
    
    const subaccountZero = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0].map(x => String.fromCharCode(x)).join('');
    
    const finalString = `\x0Aaccount-id${decodedPrincipalText}${subaccountZero}`;
    
    const hash: string = sha224().update(finalString).digest('hex');
    const crc = crc32(new Uint8Array(hash.match(/.{1,2}/g)?.map(x => parseInt(x, 16)) ?? []));
    
    const address: Address = crc + hash;

    return address;
}

function decodePrincipalFromText(text: string): Uint8Array {
    const canisterIdNoDash = text.toLowerCase().replace(/-/g, '');

    let arr = decode(canisterIdNoDash);
    arr = arr.slice(4, arr.length);

    return arr;
}