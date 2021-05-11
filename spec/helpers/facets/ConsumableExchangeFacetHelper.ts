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

import { Contract, Signer } from 'ethers';
import { ConsumableHooksLike } from '../../../src/contracts/consumables';
import {
  buildConsumableExchangeInitFunction,
  ExchangeRate,
  ExchangeRateBN,
} from '../../../src/contracts/consumables/exchange';
import { buildDiamondFacetCut } from '../../../src/contracts/core/diamonds';
import {
  ConsumableExchangeConsumableHooks__factory,
  ConsumableExchangeFacet,
  ConsumableExchangeFacet__factory,
  ConsumableExchangeInit,
  ConsumableExchangeInit__factory,
  IConsumableExchange__factory,
} from '../../../types/contracts';
import { INITIALIZER } from '../Accounts';
import { combineExtensibleDiamondOptions, ExtensibleDiamondOptions } from '../DiamondHelper';
import { createConsumable } from './ConsumableFacetHelper';

export const asConsumableExchange = (contract: Contract, signer: Signer = INITIALIZER) =>
  IConsumableExchange__factory.connect(contract.address, signer);

export interface CreateExchangeConsumableOptions extends ExtensibleDiamondOptions {
  exchangeFacet?: ConsumableExchangeFacet;
  exchangeInit?: ConsumableExchangeInit;
  exchangeConsumableHooks?: ConsumableHooksLike;
}

export const createConsumableExchange = async (options: CreateExchangeConsumableOptions = {}) => {
  const exchangeFacet = options.exchangeFacet || (await deployConsumableExchangeFacet());
  const exchangeConsumableHooks = options.exchangeConsumableHooks || (await deployConsumableExchangeHooks());
  const exchangeInit = options.exchangeInit || (await deployConsumableExchangeInit());

  return asConsumableExchange(
    await createConsumable(
      combineExtensibleDiamondOptions(
        {
          additionalCuts: [buildDiamondFacetCut(exchangeFacet)],
          additionalInits: [buildConsumableExchangeInitFunction(exchangeInit, { exchangeConsumableHooks })],
        },
        options,
      ),
    ),
  );
};

export const deployConsumableExchangeFacet = () => new ConsumableExchangeFacet__factory(INITIALIZER).deploy();
export const deployConsumableExchangeHooks = () => new ConsumableExchangeConsumableHooks__factory(INITIALIZER).deploy();
export const deployConsumableExchangeInit = () => new ConsumableExchangeInit__factory(INITIALIZER).deploy();

export const toExchangeRateAsync = async (
  exchangeRatePromise: Promise<ExchangeRateBN> | ExchangeRateBN,
): Promise<ExchangeRate> => {
  const { purchasePrice, intrinsicValue } = await exchangeRatePromise;
  return { purchasePrice: purchasePrice.toNumber(), intrinsicValue: intrinsicValue.toNumber() };
};
