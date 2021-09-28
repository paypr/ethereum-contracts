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

import { ConsumableProviderActivityInit } from '../../../types/contracts';
import { ActivityHooksLike } from '../activities';
import { ConsumableAmount } from '../consumables';
import { DiamondInitFunction } from '../diamonds';

export interface ConsumableProviderActivityData {
  providedConsumables: ConsumableAmount[];
  consumableProviderActivityHooks: ActivityHooksLike;
}

export const buildConsumableProviderActivityInitFunction = (
  init: ConsumableProviderActivityInit,
  initData: ConsumableProviderActivityData,
): DiamondInitFunction => ({
  initAddress: init.address,
  callData: encodeConsumableProviderActivityInitCallData(init, initData),
});

export const encodeConsumableProviderActivityInitCallData = (
  init: ConsumableProviderActivityInit,
  initData: ConsumableProviderActivityData,
) =>
  init.interface.encodeFunctionData('initialize', [
    {
      providedConsumables: initData.providedConsumables,
      consumableProviderActivityHooks: initData.consumableProviderActivityHooks.address,
    },
  ]);
