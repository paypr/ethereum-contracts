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

import { buildSetProvidedConsumablesFunction } from '../../../../../src/contracts/consumables/provider';
import { buildDiamondFacetCut, emptyDiamondInitFunction } from '../../../../../src/contracts/diamonds';
import { EstimateTest, singleFunctionFacetEstimate } from '../../../../helpers/EstimateHelper';
import { createConsumable } from '../../../../helpers/facets/ConsumableFacetHelper';
import {
  deployConsumableProviderFacet,
  deployConsumableProviderInit,
} from '../../../../helpers/facets/ConsumableProviderFacetHelper';

export const consumableProviderEstimateTests: EstimateTest[] = [
  [
    'ConsumableProviderFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableProviderFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    singleFunctionFacetEstimate,
  ],
  [
    'ConsumableProviderFacet with init',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableProviderFacet())],
      initFunction: buildSetProvidedConsumablesFunction(await deployConsumableProviderInit(), []),
    }),
    106062,
  ],
  [
    'ConsumableProviderFacet with one provided consumable',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableProviderFacet())],
      initFunction: buildSetProvidedConsumablesFunction(await deployConsumableProviderInit(), [
        { consumable: (await createConsumable()).address, amount: 1 },
      ]),
    }),
    183073,
  ],
  [
    'ConsumableProviderFacet with two provided consumables',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableProviderFacet())],
      initFunction: buildSetProvidedConsumablesFunction(await deployConsumableProviderInit(), [
        { consumable: (await createConsumable()).address, amount: 1 },
        { consumable: (await createConsumable()).address, amount: 2 },
      ]),
    }),
    240181,
  ],
];
