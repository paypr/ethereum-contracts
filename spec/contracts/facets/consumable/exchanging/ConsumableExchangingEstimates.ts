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

import { buildConsumableExchangingInitFunction } from '../../../../../src/contracts/consumables/exchanging';
import { buildDiamondFacetCut, emptyDiamondInitFunction } from '../../../../../src/contracts/diamonds';
import { EstimateTest } from '../../../../helpers/EstimateHelper';
import { createConvertibleConsumable } from '../../../../helpers/facets/ConsumableConversionFacetHelper';
import { createConsumableExchange } from '../../../../helpers/facets/ConsumableExchangeFacetHelper';
import {
  deployConsumableExchangingFacet,
  deployConsumableExchangingInit,
} from '../../../../helpers/facets/ConsumableExchangingFacetHelper';

export const consumableExchangingEstimateTests: EstimateTest[] = [
  [
    'ConsumableExchangingFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableExchangingFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    122089,
  ],
  [
    'ConsumableExchangingFacet with init',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableExchangingFacet())],
      initFunction: buildConsumableExchangingInitFunction(await deployConsumableExchangingInit(), {
        exchange: (await createConsumableExchange()).address,
        requiredConsumables: [],
        providedConsumables: [],
      }),
    }),
    172066,
  ],
  [
    'ConsumableExchangingFacet with one required consumable and one provided consumable',
    async () => {
      const exchange = await createConsumableExchange();
      return {
        diamondCuts: [buildDiamondFacetCut(await deployConsumableExchangingFacet())],
        initFunction: buildConsumableExchangingInitFunction(await deployConsumableExchangingInit(), {
          exchange: exchange.address,
          requiredConsumables: [
            {
              consumable: (await createConvertibleConsumable(exchange, { registerWithExchange: true })).address,
              amount: 1,
            },
          ],
          providedConsumables: [
            {
              consumable: (await createConvertibleConsumable(exchange, { registerWithExchange: true })).address,
              amount: 1,
            },
          ],
        }),
      };
    },
    350157,
  ],
  [
    'ConsumableExchangingFacet with two required consumables and two provided consumables',
    async () => {
      const exchange = await createConsumableExchange();
      return {
        diamondCuts: [buildDiamondFacetCut(await deployConsumableExchangingFacet())],
        initFunction: buildConsumableExchangingInitFunction(await deployConsumableExchangingInit(), {
          exchange: exchange.address,
          requiredConsumables: [
            {
              consumable: (await createConvertibleConsumable(exchange, { registerWithExchange: true })).address,
              amount: 1,
            },
            {
              consumable: (await createConvertibleConsumable(exchange, { registerWithExchange: true })).address,
              amount: 2,
            },
          ],
          providedConsumables: [
            {
              consumable: (await createConvertibleConsumable(exchange, { registerWithExchange: true })).address,
              amount: 1,
            },
            {
              consumable: (await createConvertibleConsumable(exchange, { registerWithExchange: true })).address,
              amount: 2,
            },
          ],
        }),
      };
    },
    481927,
  ],
];
