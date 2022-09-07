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

// import { toByte4String } from './types';

import { BytesLike } from 'ethers';
import { Hexable } from 'ethers/lib/utils';
import { Erc165InterfaceId } from './erc165';
import { toByte4String } from './fixedBytes';

export const toErc165InterfaceId = (value: BytesLike | Hexable | number): Erc165InterfaceId => toByte4String(value);

export const ACCESS_CHECK_INTERFACE_ID = toErc165InterfaceId(0x91d14854);
export const ACCESS_CONTROL_INTERFACE_ID = toErc165InterfaceId(0x4b15dccf);
export const ACTIVITY_INTERFACE_ID = toErc165InterfaceId(0x4cfc28d2);
export const ACTIVITY_EXECUTOR_INTERFACE_ID = toErc165InterfaceId(0xb5b615d7);
export const ARTIFACT_INTERFACE_ID = toErc165InterfaceId(0xd3abf7f1);
export const ARTIFACT_MINTABLE_INTERFACE_ID = toErc165InterfaceId(0x6a627842);
export const CONSUMABLE_CONSUMER_INTERFACE_ID = toErc165InterfaceId(0xd6870369);
export const CONSUMABLE_CONVERSION_INTERFACE_ID = toErc165InterfaceId(0x1574139e);
export const CONSUMABLE_CONVERTIBLE_MINT_INTERFACE_ID = toErc165InterfaceId(0x55c306a0);
export const CONSUMABLE_EXCHANGE_INTERFACE_ID = toErc165InterfaceId(0x1e34ecc8);
export const CONSUMABLE_EXCHANGING_INTERFACE_ID = toErc165InterfaceId(0xffd426ac);
export const CONSUMABLE_LIMIT_INTERFACE_ID = toErc165InterfaceId(0x81b8db38);
export const CONSUMABLE_LIMITER_INTERFACE_ID = toErc165InterfaceId(0x842df353);
export const CONSUMABLE_INTERFACE_ID = toErc165InterfaceId(0x91e04f29);
export const CONSUMABLE_MINT_INTERFACE_ID = toErc165InterfaceId(0xdd0390b5);
export const CONSUMABLE_PROVIDER_INTERFACE_ID = toErc165InterfaceId(0x8b61faf0);
export const CONTRACT_INFO_INTERFACE_ID = toErc165InterfaceId(0x0b6828ac);
export const DELEGATING_ACCESS_INTERFACE_ID = toErc165InterfaceId(0x583cee2d);
export const DIAMOND_CUT_INTERFACE_ID = toErc165InterfaceId(0xd2b1c8f7);
export const DIAMOND_LOUPE_INTERFACE_ID = toErc165InterfaceId(0x48e2b093);
export const DISABLEABLE_INTERFACE_ID = toErc165InterfaceId(0x413daa4f);
export const ERC165_INTERFACE_ID = toErc165InterfaceId(0x01ffc9a7);
export const ERC721_INTERFACE_ID = toErc165InterfaceId(0x80ac58cd);
export const ERC721_BURNABLE_INTERFACE_ID = toErc165InterfaceId(0x42966c68);
export const ERC721_ENUMERABLE_INTERFACE_ID = toErc165InterfaceId(0x780e9d63);
export const ERC721_METADATA_INTERFACE_ID = toErc165InterfaceId(0x5b5e139f);
export const ERC721_MINTABLE_INTERFACE_ID = toErc165InterfaceId(0x40c10f19);
export const ERC721_TOKEN_INFO_INTERFACE_ID = toErc165InterfaceId(0xc87b56dd);
export const SKILL_INTERFACE_ID = toErc165InterfaceId(0xabdd11bd);
export const SKILL_ACQUIRER_INTERFACE_ID = toErc165InterfaceId(0x29352f6c);
export const SKILL_CONSTRAINED_INTERFACE_ID = toErc165InterfaceId(0x530fc73c);
export const SKILL_SELF_ACQUISITION_INTERFACE_ID = toErc165InterfaceId(0x03ab066c);
export const TRANSFERRING_INTERFACE_ID = toErc165InterfaceId(0xa4ef3af0);
