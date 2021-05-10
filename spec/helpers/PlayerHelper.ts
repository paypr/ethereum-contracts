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
import { Item } from '../../src/contracts/core/activities';
import { ConsumableAmount } from '../../src/contracts/core/consumables';
import { IPlayer, Player__factory } from '../../types/contracts';
import { INITIALIZER, PLAYER_ADMIN, ZERO_ADDRESS } from './Accounts';

export const deployPlayer = (deployer: SignerWithAddress = INITIALIZER) => new Player__factory(deployer).deploy();

export const createPlayer = async (roleDelegateAddress: string = ZERO_ADDRESS) => {
  const player = await deployPlayer();
  await player.connect(PLAYER_ADMIN).initializePlayer(roleDelegateAddress);
  return player;
};

export const executeActivity = async (
  player: IPlayer,
  activityAddress: string,
  useItems: Item[] = [],
  amountsToProvide: ConsumableAmount[] = [],
  amountsToConsume: ConsumableAmount[] = [],
) => player.connect(PLAYER_ADMIN).execute(activityAddress, useItems, amountsToProvide, amountsToConsume);
