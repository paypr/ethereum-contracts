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

import { ConsumableExchangingInit } from '../../../types/contracts';
import { DiamondInitFunction } from '../diamonds';

export type ConsumableExchangingData = ConsumableExchangingInit.ConsumableExchangingDataStruct;

export const buildConsumableExchangingInitFunction = (
  init: ConsumableExchangingInit,
  initData: ConsumableExchangingData,
): DiamondInitFunction => ({
  initAddress: init.address,
  callData: encodeConsumableExchangingInitCallData(init, initData),
});

export const encodeConsumableExchangingInitCallData = (
  init: ConsumableExchangingInit,
  initData: ConsumableExchangingData,
) =>
  init.interface.encodeFunctionData('initialize', [
    {
      exchange: initData.exchange,
      requiredConsumables: initData.requiredConsumables,
      providedConsumables: initData.providedConsumables,
    },
  ]);
