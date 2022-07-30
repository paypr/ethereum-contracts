/*
 * Copyright (c) 2022 The Paypr Company, LLC
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

import { buildConsumableConversionInitFunction } from '../../../../../src/contracts/consumables/conversion';
import { buildDiamondFacetCut, emptyDiamondInitFunction } from '../../../../../src/contracts/diamonds';
import { EstimateTest } from '../../../../helpers/EstimateHelper';
import {
  deployConsumableConversionConsumableHooks,
  deployConsumableConversionFacet,
  deployConsumableConversionInit,
  deployConsumableConversionTransferHooks,
} from '../../../../helpers/facets/ConsumableConversionFacetHelper';
import { createConsumableExchange } from '../../../../helpers/facets/ConsumableExchangeFacetHelper';

export const consumableConversionEstimateTests: EstimateTest[] = [
  [
    'ConsumableConversionFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableConversionFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    313729,
  ],
  [
    'ConsumableConversionFacet with init',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableConversionFacet())],
      initFunction: buildConsumableConversionInitFunction(await deployConsumableConversionInit(), {
        exchangeToken: (await createConsumableExchange()).address,
        conversionConsumableHooks: await deployConsumableConversionConsumableHooks(),
        conversionTransferHooks: await deployConsumableConversionTransferHooks(),
        intrinsicValueExchangeRate: 1,
        purchasePriceExchangeRate: 1,
        registerWithExchange: false,
      }),
    }),
    523196,
  ],
  [
    'ConsumableConversionFacet registering with exchange',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableConversionFacet())],
      initFunction: buildConsumableConversionInitFunction(await deployConsumableConversionInit(), {
        exchangeToken: (await createConsumableExchange()).address,
        conversionConsumableHooks: await deployConsumableConversionConsumableHooks(),
        conversionTransferHooks: await deployConsumableConversionTransferHooks(),
        intrinsicValueExchangeRate: 1,
        purchasePriceExchangeRate: 1,
        registerWithExchange: true,
      }),
    }),
    645282,
  ],
  [
    'ConsumableConversionFacet registering with exchange with asynchronous conversion',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableConversionFacet())],
      initFunction: buildConsumableConversionInitFunction(await deployConsumableConversionInit(), {
        exchangeToken: (await createConsumableExchange()).address,
        conversionConsumableHooks: await deployConsumableConversionConsumableHooks(),
        conversionTransferHooks: await deployConsumableConversionTransferHooks(),
        intrinsicValueExchangeRate: 10,
        purchasePriceExchangeRate: 1,
        registerWithExchange: true,
      }),
    }),
    645294,
  ],
];
