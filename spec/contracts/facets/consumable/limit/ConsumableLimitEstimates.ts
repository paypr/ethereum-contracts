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

import { buildConsumableLimitInitFunction } from '../../../../../src/contracts/consumables/limit';
import { buildDiamondFacetCut, emptyDiamondInitFunction } from '../../../../../src/contracts/diamonds';
import { EstimateTest } from '../../../../helpers/EstimateHelper';
import {
  deployConsumableLimitConsumableHooks,
  deployConsumableLimitFacet,
  deployConsumableLimitInit,
} from '../../../../helpers/facets/ConsumableLimitFacetHelper';

export const consumableLimitEstimateTests: EstimateTest[] = [
  [
    'ConsumableLimitFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableLimitFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    122101,
  ],
  [
    'ConsumableLimitFacet with init',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableLimitFacet())],
      initFunction: buildConsumableLimitInitFunction(await deployConsumableLimitInit(), {
        limitConsumableHooks: await deployConsumableLimitConsumableHooks(),
      }),
    }),
    194178,
  ],
];
