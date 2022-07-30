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

import { buildDiamondFacetCut, emptyDiamondInitFunction } from '../../../../../src/contracts/diamonds';
import { buildSetRequiredSkillsFunction } from '../../../../../src/contracts/skills/skillConstrained';
import { EstimateTest, singleFunctionFacetEstimate } from '../../../../helpers/EstimateHelper';
import {
  deploySkillConstrainedFacet,
  deploySkillConstrainedInit,
} from '../../../../helpers/facets/SkillConstrainedFacetHelper';
import { createSkill } from '../../../../helpers/facets/SkillFacetHelper';

export const skillConstrainedEstimateTests: EstimateTest[] = [
  [
    'SkillConstrainedFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deploySkillConstrainedFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    singleFunctionFacetEstimate,
  ],
  [
    'SkillConstrainedFacet with init',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deploySkillConstrainedFacet())],
      initFunction: buildSetRequiredSkillsFunction(await deploySkillConstrainedInit(), []),
    }),
    106062,
  ],
  [
    'SkillConstrainedFacet with one required skill',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deploySkillConstrainedFacet())],
      initFunction: buildSetRequiredSkillsFunction(await deploySkillConstrainedInit(), [
        { skill: (await createSkill()).address, level: 1 },
      ]),
    }),
    183073,
  ],
  [
    'SkillConstrainedFacet with two required skills',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deploySkillConstrainedFacet())],
      initFunction: buildSetRequiredSkillsFunction(await deploySkillConstrainedInit(), [
        { skill: (await createSkill()).address, level: 1 },
        { skill: (await createSkill()).address, level: 2 },
      ]),
    }),
    240181,
  ],
];
