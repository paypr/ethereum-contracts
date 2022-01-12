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

import { ConsumableExchangeInit, IConsumableExchange } from '../../../types/contracts';
import { IConsumableExchange as IConsumableExchangeNamespace } from '../../../types/contracts/ConsumableExchangeFacet';
import { LikeInterface } from '../interfaces';
import { ConsumableHooksLike, ERC20Like } from '../consumables';
import { DiamondInitFunction } from '../diamonds';

export interface ExchangeRate {
  purchasePrice: number;
  intrinsicValue: number;
}

export type ExchangeRateBN = IConsumableExchangeNamespace.ExchangeRateStructOutput;

export type ConsumableExchangeLike = LikeInterface<ERC20Like> | LikeInterface<IConsumableExchange>;

export interface ConsumableExchangeInitData {
  exchangeConsumableHooks: ConsumableHooksLike;
}

export const buildConsumableExchangeInitFunction = (
  consumableExchangeInit: ConsumableExchangeInit,
  exchangeInitData: ConsumableExchangeInitData,
): DiamondInitFunction => ({
  initAddress: consumableExchangeInit.address,
  callData: encodeConsumableExchangeInitCallData(consumableExchangeInit, exchangeInitData),
});

export const encodeConsumableExchangeInitCallData = (
  consumableExchangeInit: ConsumableExchangeInit,
  exchangeInitData: ConsumableExchangeInitData,
) =>
  consumableExchangeInit.interface.encodeFunctionData('initialize', [
    {
      exchangeConsumableHooks: exchangeInitData.exchangeConsumableHooks.address,
    },
  ]);
