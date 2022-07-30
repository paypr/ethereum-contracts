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

import {
  buildDiamondFacetCut,
  buildDiamondInitFunction,
  emptyDiamondInitFunction,
} from '../../../../src/contracts/diamonds';
import { EstimateTest, singleFunctionFacetEstimate } from '../../../helpers/EstimateHelper';
import {
  deployDiamondCutFacet,
  deployDiamondInit,
  deployDiamondLoupeFacet,
} from '../../../helpers/facets/DiamondFacetHelper';

export const diamondEstimateTests: EstimateTest[] = [
  [
    'DiamondCutFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployDiamondCutFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    singleFunctionFacetEstimate,
  ],
  [
    'DiamondLoupeFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployDiamondLoupeFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    170597,
  ],
  [
    'DiamondInit',
    async () => ({
      diamondCuts: [],
      initFunction: buildDiamondInitFunction(await deployDiamondInit(), []),
    }),
    5679,
  ],
  [
    'DiamondInit with one init',
    async () => ({
      diamondCuts: [],
      initFunction: buildDiamondInitFunction(await deployDiamondInit(), [
        buildDiamondInitFunction(await deployDiamondInit(), []),
      ]),
    }),
    15006,
  ],
  [
    'DiamondInit with two inits',
    async () => ({
      diamondCuts: [],
      initFunction: buildDiamondInitFunction(await deployDiamondInit(), [
        buildDiamondInitFunction(await deployDiamondInit(), []),
        buildDiamondInitFunction(await deployDiamondInit(), []),
      ]),
    }),
    24282,
  ],
];
