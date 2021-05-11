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

import { BigNumberish } from 'ethers';
import { ConsumableConversionInit } from '../../../types/contracts';
import { ConsumableHooksLike } from '../consumables';
import { DiamondInitFunction } from '../core/diamonds';
import { TransferHooksLike } from '../transfer';
import { ConsumableExchangeLike } from './exchange';

export interface ConsumableConversionInitData {
  exchangeToken: ConsumableExchangeLike;
  intrinsicValueExchangeRate: BigNumberish;
  purchasePriceExchangeRate: BigNumberish;
  conversionConsumableHooks: ConsumableHooksLike;
  conversionTransferHooks: TransferHooksLike;
  registerWithExchange?: boolean;
}

export const buildConsumableConversionInitFunction = (
  consumableConversionInit: ConsumableConversionInit,
  conversionInitData: ConsumableConversionInitData,
): DiamondInitFunction => ({
  initAddress: consumableConversionInit.address,
  callData: encodeConsumableConversionInitCallData(consumableConversionInit, conversionInitData),
});

export const encodeConsumableConversionInitCallData = (
  consumableConversionInit: ConsumableConversionInit,
  conversionInitData: ConsumableConversionInitData,
) =>
  consumableConversionInit.interface.encodeFunctionData('initialize', [
    {
      exchangeToken: conversionInitData.exchangeToken.address,
      intrinsicValueExchangeRate: conversionInitData.intrinsicValueExchangeRate,
      purchasePriceExchangeRate: conversionInitData.purchasePriceExchangeRate,
      conversionConsumableHooks: conversionInitData.conversionConsumableHooks.address,
      conversionTransferHooks: conversionInitData.conversionTransferHooks.address,
      registerWithExchange: conversionInitData.registerWithExchange || false,
    },
  ]);
