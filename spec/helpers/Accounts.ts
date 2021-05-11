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

export let accounts: SignerWithAddress[] = [];

export let INITIALIZER: SignerWithAddress;
export let DIAMOND_CUTTER: SignerWithAddress;
export let DISABLER: SignerWithAddress;
export let TRANSFER_AGENT: SignerWithAddress;
export let CONSUMABLE_MINTER: SignerWithAddress;
export let CONSUMABLE_LIMITER: SignerWithAddress;
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
    DISABLER,
    TRANSFER_AGENT,
    DIAMOND_CUTTER,
    CONSUMABLE_LIMITER,
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
