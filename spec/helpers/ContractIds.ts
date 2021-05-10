/*
 * Copyright (c) 2021 The Paypr Company, LLC
 *
 * This file is part of Paypr Ethereum Contracts.
 *
 * Paypr Ethereum Contracts is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Paypr Ethereum Contracts is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Paypr Ethereum Contracts.  If not, see <https://www.gnu.org/licenses/>.
 */

const toByte4 = (value: number) => [(value >> 24) & 0xff, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
const toByte4String = (value: number) => byte4ToString(toByte4(value));
export const byte4ToString = (value: number[]) => `0x${value.map((b) => b.toString(16).padStart(2, '0')).join('')}`;

export type Byte4String = string;

export const ERC165_ID = toByte4String(0x01ffc9a7);
export const ACTIVITY_ID = toByte4String(0x00f62528);
export const ARTIFACT_ID = toByte4String(0xd3abf7f1);
export const CONSUMABLE_ID = toByte4String(0x0d6673db);
export const CONSUMABLE_CONSUMER_ID = toByte4String(0x9342f6af);
export const CONSUMABLE_PROVIDER_ID = toByte4String(0x63d9fe18);
export const CONSUMABLE_EXCHANGE_ID = toByte4String(0x1e34ecc8);
export const CONVERTIBLE_CONSUMABLE_ID = toByte4String(0x1574139e);
export const LIMITED_CONSUMABLE_ID = toByte4String(0x81b8db38);
export const BASE_CONTRACT_ID = toByte4String(0x321f350b);
export const PLAYER_ID = toByte4String(0x9c833abb);
export const ROLE_DELEGATE_ID = toByte4String(0x7cef57ea);
export const SKILL_ID = toByte4String(0xa87617d1);
export const SKILL_CONSTRAINED_ID = toByte4String(0x332b3661);
export const TRANSFERRING_ID = toByte4String(0x6fafa3a8);
