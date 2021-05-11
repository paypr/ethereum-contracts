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

import { buildDiamondFacetCut } from '../../../src/contracts/core/diamonds';
import { SkillLevel } from '../../../src/contracts/skills';
import { buildSkillConstrainedSkillInitFunction } from '../../../src/contracts/skills/skillConstrainedSkill';
import { SkillConstrainedSkillHooks__factory, SkillConstrainedSkillInit__factory } from '../../../types/contracts';
import { INITIALIZER } from '../Accounts';
import { combineExtensibleDiamondOptions, ExtensibleDiamondOptions } from '../DiamondHelper';
import { deploySkillConstrainedFacet } from './SkillConstrainedFacetHelper';
import { createSkill } from './SkillFacetHelper';

export const createSkillConstrainedSkill = async (
  requiredSkills: SkillLevel[],
  options: ExtensibleDiamondOptions = {},
) => createSkill(combineExtensibleDiamondOptions(await buildSkillConstrainedSkillAdditions(requiredSkills), options));

export const buildSkillConstrainedSkillAdditions = async (
  requiredSkills: SkillLevel[],
): Promise<ExtensibleDiamondOptions> => ({
  additionalCuts: [buildDiamondFacetCut(await deploySkillConstrainedFacet())],
  additionalInits: [
    buildSkillConstrainedSkillInitFunction(await deploySkillConstrainedSkillInit(), {
      requiredSkills,
      skillConstrainedSkillHooks: await deploySkillConstrainedSkillHooks(),
    }),
  ],
});

export const deploySkillConstrainedSkillHooks = () => new SkillConstrainedSkillHooks__factory(INITIALIZER).deploy();
export const deploySkillConstrainedSkillInit = () => new SkillConstrainedSkillInit__factory(INITIALIZER).deploy();
