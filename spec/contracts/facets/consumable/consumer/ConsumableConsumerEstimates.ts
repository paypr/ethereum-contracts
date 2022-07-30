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

import { buildSetRequiredConsumablesFunction } from '../../../../../src/contracts/consumables/consumer';
import { buildDiamondFacetCut, emptyDiamondInitFunction } from '../../../../../src/contracts/diamonds';
import { EstimateTest, singleFunctionFacetEstimate } from '../../../../helpers/EstimateHelper';
import {
  deployConsumableConsumerFacet,
  deployConsumableConsumerInit,
} from '../../../../helpers/facets/ConsumableConsumerFacetHelper';
import { createConsumable } from '../../../../helpers/facets/ConsumableFacetHelper';

export const consumableConsumerEstimateTests: EstimateTest[] = [
  [
    'ConsumableConsumerFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableConsumerFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    singleFunctionFacetEstimate,
  ],
  [
    'ConsumableConsumerFacet with init',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableConsumerFacet())],
      initFunction: buildSetRequiredConsumablesFunction(await deployConsumableConsumerInit(), []),
    }),
    106062,
  ],
  [
    'ConsumableConsumerFacet with one required consumable',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableConsumerFacet())],
      initFunction: buildSetRequiredConsumablesFunction(await deployConsumableConsumerInit(), [
        { consumable: (await createConsumable()).address, amount: 1 },
      ]),
    }),
    183073,
  ],
  [
    'ConsumableConsumerFacet with two required consumables',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableConsumerFacet())],
      initFunction: buildSetRequiredConsumablesFunction(await deployConsumableConsumerInit(), [
        { consumable: (await createConsumable()).address, amount: 1 },
        { consumable: (await createConsumable()).address, amount: 2 },
      ]),
    }),
    240181,
  ],
];
