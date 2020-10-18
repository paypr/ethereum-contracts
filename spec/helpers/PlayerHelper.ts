/*
 * Copyright (c) 2020 The Paypr Company
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

import { Item } from '../../src/contracts/core/activities';
import { ConsumableAmount } from '../../src/contracts/core/consumables';
import { PLAYER_ADMIN, ZERO_ADDRESS } from './Accounts';
import { getContract } from './ContractHelper';

export const PlayerContract = getContract('Player');

export const createPlayer = async (roleDelegateAddress: string = ZERO_ADDRESS) => {
  const player = await PlayerContract.new();
  player.initializePlayer(roleDelegateAddress, { from: PLAYER_ADMIN });
  return player;
};

export const executeActivity = async (
  player: any,
  activityAddress: string,
  useItems: Item[] = [],
  amountsToProvide: ConsumableAmount[] = [],
  amountsToConsume: ConsumableAmount[] = [],
) => player.execute(activityAddress, useItems, amountsToProvide, amountsToConsume, { from: PLAYER_ADMIN });
