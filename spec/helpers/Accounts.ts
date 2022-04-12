/*
 * Copyright (c) 2022 The Paypr Company, LLC
 *
 * This file is part of Gnossis Chain Contracts.
 *
 * Gnossis Chain Contracts is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Gnossis Chain Contracts is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Paypr Ethereum Contracts.  If not, see <https://www.gnu.org/licenses/>.
 */

import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

export let accounts: SignerWithAddress[] = [];

export let INITIALIZER: SignerWithAddress;

export type OnInitAccountsHandler = (accounts: SignerWithAddress[]) => void | Promise<void>;

const onInitAccountsHandlers: OnInitAccountsHandler[] = [];

export const onInitAccounts = (handler: OnInitAccountsHandler) => {
  onInitAccountsHandlers.push(handler);
};

export const initAccounts = async () => {
  accounts = await ethers.getSigners();

  [INITIALIZER] = accounts;

  await Promise.all(onInitAccountsHandlers.map(async (handler) => await handler(accounts)));
};
