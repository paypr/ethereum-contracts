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

import { SkillLevel } from '../../../../../src/contracts/skills';
import { createSkillConstrainedActivity } from '../../../../helpers/facets/SkillConstrainedActivityHelper';
import { asSkillConstrained } from '../../../../helpers/facets/SkillConstrainedFacetHelper';
import { createSkill, toSkillLevel } from '../../../../helpers/facets/SkillFacetHelper';

describe('initialize', () => {
  it('should set required skills', async () => {
    const skill1 = await createSkill();
    const skill2 = await createSkill();

    const activity = await createSkillConstrainedActivity([
      { skill: skill1.address, level: 1 },
      { skill: skill2.address, level: 2 },
    ]);

    expect<SkillLevel[]>((await asSkillConstrained(activity).requiredSkills()).map(toSkillLevel)).toEqual([
      { skill: skill1.address, level: 1 },
      { skill: skill2.address, level: 2 },
    ]);
  });
});
