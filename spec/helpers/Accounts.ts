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
import { ethers } from 'hardhat';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export let accounts: SignerWithAddress[] = [];

export let INITIALIZER: SignerWithAddress;
export let CONSUMABLE_MINTER: SignerWithAddress;
export let ARTIFACT_MINTER: SignerWithAddress;
export let PLAYER_ADMIN: SignerWithAddress;
export let PLAYER1: SignerWithAddress;
export let PLAYER2: SignerWithAddress;
export let PLAYER3: SignerWithAddress;
export let HELPER1: SignerWithAddress;
export let HELPER2: SignerWithAddress;

export type OnInitAccountsHandler = (accounts: SignerWithAddress[]) => void | Promise<void>;

const onInitAccountsHandlers: OnInitAccountsHandler[] = [];

export const onInitAccounts = (handler: OnInitAccountsHandler) => {
  onInitAccountsHandlers.push(handler);
};

export const initAccounts = async () => {
  accounts = await ethers.getSigners();

  [
    INITIALIZER,
    CONSUMABLE_MINTER,
    ARTIFACT_MINTER,
    PLAYER_ADMIN,
    PLAYER1,
    PLAYER2,
    PLAYER3,
    HELPER1,
    HELPER2,
  ] = accounts;

  await Promise.all(onInitAccountsHandlers.map(async (handler) => await handler(accounts)));
};
