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

import { buildSkillConstrainedActivityInitFunction } from '../../../src/contracts/activities/skillConstrainedActivity';
import { buildDiamondFacetCut } from '../../../src/contracts/diamonds';
import { SkillLevel } from '../../../src/contracts/skills';
import {
  SkillConstrainedActivityHooks__factory,
  SkillConstrainedActivityInit__factory,
} from '../../../types/contracts';
import { INITIALIZER } from '../Accounts';
import { combineExtensibleDiamondOptions, ExtensibleDiamondOptions } from '../DiamondHelper';
import { createActivity } from './ActivityFacetHelper';
import { deploySkillConstrainedFacet } from './SkillConstrainedFacetHelper';

export const createSkillConstrainedActivity = async (
  requiredSkills: SkillLevel[],
  options: ExtensibleDiamondOptions = {},
) =>
  createActivity(
    combineExtensibleDiamondOptions(await buildSkillConstrainedActivityAdditions(requiredSkills), options),
  );

export const buildSkillConstrainedActivityAdditions = async (
  requiredSkills: SkillLevel[],
): Promise<ExtensibleDiamondOptions> => ({
  additionalCuts: [buildDiamondFacetCut(await deploySkillConstrainedFacet())],
  additionalInits: [
    buildSkillConstrainedActivityInitFunction(await deploySkillConstrainedActivityInit(), {
      requiredSkills,
      skillConstrainedActivityHooks: await deploySkillConstrainedActivityHooks(),
    }),
  ],
});

export const deploySkillConstrainedActivityHooks = () =>
  new SkillConstrainedActivityHooks__factory(INITIALIZER).deploy();
export const deploySkillConstrainedActivityInit = () => new SkillConstrainedActivityInit__factory(INITIALIZER).deploy();
