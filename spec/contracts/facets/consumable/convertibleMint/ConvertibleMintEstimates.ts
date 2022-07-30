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

import { buildConsumableConvertibleMintSetCombinationsFunction } from '../../../../../src/contracts/consumables/convertibleMint';
import { buildDiamondFacetCut, emptyDiamondInitFunction } from '../../../../../src/contracts/diamonds';
import { EstimateTest } from '../../../../helpers/EstimateHelper';
import {
  deployConsumableConvertibleMintConsumableFacet,
  deployConsumableConvertibleMintInit,
} from '../../../../helpers/facets/ConsumableConvertibleMintFacetHelper';
import { createConsumable } from '../../../../helpers/facets/ConsumableFacetHelper';

export const convertibleMintEstimateTests: EstimateTest[] = [
  [
    'ConsumableConvertibleMintConsumable',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableConvertibleMintConsumableFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    170609,
  ],
  [
    'ConsumableConvertibleMintConsumable with one combination',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableConvertibleMintConsumableFacet())],
      initFunction: buildConsumableConvertibleMintSetCombinationsFunction(await deployConsumableConvertibleMintInit(), [
        {
          requiredConsumables: [{ consumable: (await createConsumable()).address, amount: 1 }],
          amountProvided: 1,
        },
      ]),
    }),
    291936,
  ],
  [
    'ConsumableConvertibleMintConsumable with two combinations',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableConvertibleMintConsumableFacet())],
      initFunction: buildConsumableConvertibleMintSetCombinationsFunction(await deployConsumableConvertibleMintInit(), [
        {
          requiredConsumables: [{ consumable: (await createConsumable()).address, amount: 1 }],
          amountProvided: 1,
        },
        {
          requiredConsumables: [
            { consumable: (await createConsumable()).address, amount: 2 },
            { consumable: (await createConsumable()).address, amount: 3 },
          ],
          amountProvided: 4,
        },
      ]),
    }),
    431276,
  ],
];
