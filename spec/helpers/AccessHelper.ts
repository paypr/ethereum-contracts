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

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { onInitAccounts } from './Accounts';

export let SUPER_ADMIN: SignerWithAddress;
export let ADMIN: SignerWithAddress;
export let MINTER: SignerWithAddress;
export let TRANSFER_AGENT: SignerWithAddress;
export let OTHER1: SignerWithAddress;
export let OTHER2: SignerWithAddress;

onInitAccounts((accounts) => {
  [SUPER_ADMIN, ADMIN, MINTER, TRANSFER_AGENT, OTHER1, OTHER2] = accounts;
});
