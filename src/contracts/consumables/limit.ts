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

import { ConsumableLimitInit } from '../../../types/contracts';
import { ConsumableHooksLike } from '../consumables';
import { DiamondInitFunction } from '../diamonds';

export interface ConsumableLimitInitData {
  limitConsumableHooks: ConsumableHooksLike;
}

export const buildConsumableLimitInitFunction = (
  consumableLimitInit: ConsumableLimitInit,
  limitInitData: ConsumableLimitInitData,
): DiamondInitFunction => ({
  initAddress: consumableLimitInit.address,
  callData: encodeConsumableLimitInitCallData(consumableLimitInit, limitInitData),
});

export const encodeConsumableLimitInitCallData = (
  consumableLimitInit: ConsumableLimitInit,
  limitInitData: ConsumableLimitInitData,
) =>
  consumableLimitInit.interface.encodeFunctionData('initialize', [
    {
      limitConsumableHooks: limitInitData.limitConsumableHooks.address,
    },
  ]);
