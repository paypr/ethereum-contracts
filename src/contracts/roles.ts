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

import { keccak256, toUtf8Bytes } from 'ethers/lib/utils';
import { toAccessRole } from './access';

export const SUPER_ADMIN_ROLE = toAccessRole(0);
export const ADMIN_ROLE = keccak256(toUtf8Bytes('paypr.Admin'));
export const DELEGATE_ADMIN_ROLE = keccak256(toUtf8Bytes('paypr.DelegateAdmin'));
export const DIAMOND_CUTTER_ROLE = keccak256(toUtf8Bytes('paypr.DiamondCutter'));
export const DISABLER_ROLE = keccak256(toUtf8Bytes('paypr.Disabler'));
export const LIMITER_ROLE = keccak256(toUtf8Bytes('paypr.Limiter'));
export const MINTER_ROLE = keccak256(toUtf8Bytes('paypr.Minter'));
export const OWNER_MANAGER_ROLE = keccak256(toUtf8Bytes('paypr.OwnerManager'));
export const TRANSFER_AGENT_ROLE = keccak256(toUtf8Bytes('paypr.Transfer'));
