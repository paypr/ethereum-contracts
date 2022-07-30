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

import { buildDiamondFacetCut, emptyDiamondInitFunction } from '../../../../src/contracts/diamonds';
import { buildSkillConstrainedSkillInitFunction } from '../../../../src/contracts/skills/skillConstrainedSkill';
import { EstimateTest } from '../../../helpers/EstimateHelper';
import {
  deploySkillConstrainedSkillHooks,
  deploySkillConstrainedSkillInit,
} from '../../../helpers/facets/SkillConstrainedSkillHelper';
import { createSkill, deploySkillFacet } from '../../../helpers/facets/SkillFacetHelper';

export const skillEstimateTests: EstimateTest[] = [
  [
    'SkillFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deploySkillFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    122101,
  ],
  [
    'SkillFacet with skill constrained hooks',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deploySkillFacet())],
      initFunction: buildSkillConstrainedSkillInitFunction(await deploySkillConstrainedSkillInit(), {
        requiredSkills: [],
        skillConstrainedSkillHooks: await deploySkillConstrainedSkillHooks(),
      }),
    }),
    198809,
  ],
  [
    'SkillFacet with one required skill',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deploySkillFacet())],
      initFunction: buildSkillConstrainedSkillInitFunction(await deploySkillConstrainedSkillInit(), {
        requiredSkills: [{ skill: (await createSkill()).address, level: 1 }],
        skillConstrainedSkillHooks: await deploySkillConstrainedSkillHooks(),
      }),
    }),
    275849,
  ],
  [
    'SkillFacet with two required skills',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deploySkillFacet())],
      initFunction: buildSkillConstrainedSkillInitFunction(await deploySkillConstrainedSkillInit(), {
        requiredSkills: [
          { skill: (await createSkill()).address, level: 1 },
          { skill: (await createSkill()).address, level: 2 },
        ],
        skillConstrainedSkillHooks: await deploySkillConstrainedSkillHooks(),
      }),
    }),
    332986,
  ],
];
