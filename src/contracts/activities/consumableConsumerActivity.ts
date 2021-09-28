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

import { ConsumableConsumerActivityInit } from '../../../types/contracts';
import { ActivityHooksLike } from '../activities';
import { ConsumableAmount } from '../consumables';
import { DiamondInitFunction } from '../diamonds';

export interface ConsumableConsumerActivityData {
  requiredConsumables: ConsumableAmount[];
  consumableConsumerActivityHooks: ActivityHooksLike;
}

export const buildConsumableConsumerActivityInitFunction = (
  init: ConsumableConsumerActivityInit,
  initData: ConsumableConsumerActivityData,
): DiamondInitFunction => ({
  initAddress: init.address,
  callData: encodeConsumableConsumerActivityInitCallData(init, initData),
});

export const encodeConsumableConsumerActivityInitCallData = (
  init: ConsumableConsumerActivityInit,
  initData: ConsumableConsumerActivityData,
) =>
  init.interface.encodeFunctionData('initialize', [
    {
      requiredConsumables: initData.requiredConsumables,
      consumableConsumerActivityHooks: initData.consumableConsumerActivityHooks.address,
    },
  ]);
