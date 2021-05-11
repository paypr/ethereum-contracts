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

import { BigNumberish, Contract, Signer } from 'ethers';
import { ConsumableHooksLike } from '../../../src/contracts/consumables';
import { buildConsumableConversionInitFunction } from '../../../src/contracts/consumables/conversion';
import { ConsumableExchangeLike } from '../../../src/contracts/consumables/exchange';
import { buildDiamondFacetCut } from '../../../src/contracts/core/diamonds';
import { TransferHooksLike } from '../../../src/contracts/transfer';
import {
  ConsumableConversionFacet,
  ConsumableConversionFacet__factory,
  ConsumableConversionConsumableHooks__factory,
  ConsumableConversionInit,
  ConsumableConversionInit__factory,
  IConsumableConversion__factory,
  ConsumableConversionTransferHooks__factory,
} from '../../../types/contracts';
import { INITIALIZER } from '../Accounts';
import { combineExtensibleDiamondOptions, ExtensibleDiamondOptions } from '../DiamondHelper';
import { createConsumable } from './ConsumableFacetHelper';

export const asConsumableConversion = (contract: Contract, signer: Signer = INITIALIZER) =>
  IConsumableConversion__factory.connect(contract.address, signer);

export interface CreateConvertibleConsumableOptions extends ExtensibleDiamondOptions {
  intrinsicValueExchangeRate?: BigNumberish;
  purchasePriceExchangeRate?: BigNumberish;
  conversionFacet?: ConsumableConversionFacet;
  conversionInit?: ConsumableConversionInit;
  conversionConsumableHooks?: ConsumableHooksLike;
  conversionTransferHooks?: TransferHooksLike;
  registerWithExchange?: boolean;
}

export const createConvertibleConsumable = async (
  exchangeToken: ConsumableExchangeLike,
  options: CreateConvertibleConsumableOptions = {},
) => {
  const intrinsicValueExchangeRate =
    options.intrinsicValueExchangeRate !== undefined ? options.intrinsicValueExchangeRate : 1;
  const purchasePriceExchangeRate =
    options.purchasePriceExchangeRate !== undefined ? options.purchasePriceExchangeRate : intrinsicValueExchangeRate;
  const conversionFacet = options.conversionFacet || (await deployConsumableConversionFacet());
  const conversionInit = options.conversionInit || (await deployConsumableConversionInit());
  const conversionConsumableHooks =
    options.conversionConsumableHooks || (await deployConsumableConversionConsumableHooks());
  const conversionTransferHooks = options.conversionTransferHooks || (await deployConsumableConversionTransferHooks());
  return asConsumableConversion(
    await createConsumable(
      combineExtensibleDiamondOptions(
        {
          additionalCuts: [buildDiamondFacetCut(conversionFacet)],
          additionalInits: [
            buildConsumableConversionInitFunction(conversionInit, {
              exchangeToken,
              intrinsicValueExchangeRate,
              purchasePriceExchangeRate,
              conversionConsumableHooks,
              conversionTransferHooks,
              registerWithExchange: options.registerWithExchange,
            }),
          ],
        },
        options,
      ),
    ),
  );
};

export const deployConsumableConversionFacet = () => new ConsumableConversionFacet__factory(INITIALIZER).deploy();
export const deployConsumableConversionConsumableHooks = () =>
  new ConsumableConversionConsumableHooks__factory(INITIALIZER).deploy();
export const deployConsumableConversionTransferHooks = () =>
  new ConsumableConversionTransferHooks__factory(INITIALIZER).deploy();
export const deployConsumableConversionInit = () => new ConsumableConversionInit__factory(INITIALIZER).deploy();
