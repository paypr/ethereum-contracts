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

import { ContractTransaction } from 'ethers';
import { ZERO_ADDRESS } from '../../../../../src/contracts/accounts';
import { buildDiamondFacetCut } from '../../../../../src/contracts/diamonds';
import { buildSetRequiredSkillsFunction } from '../../../../../src/contracts/skills/skillConstrained';
import { PLAYER1 } from '../../../../helpers/Accounts';
import { createDiamond } from '../../../../helpers/DiamondHelper';
import { createContractInfo } from '../../../../helpers/facets/ContractInfoFacetHelper';
import { asDiamondCut } from '../../../../helpers/facets/DiamondFacetHelper';
import {
  createSkillConstrained,
  deploySkillConstrainedFacet,
  deploySkillConstrainedInit,
  deployTestSkillConstrainedFacet,
} from '../../../../helpers/facets/SkillConstrainedFacetHelper';
import { createSkill } from '../../../../helpers/facets/SkillFacetHelper';

describe('setRequiredSkills', () => {
  it('should succeed if called with no required skills', async () => {
    await createSkillConstrained([]);
  });

  it('should succeed if called with one required skill', async () => {
    const skill = await createSkill();

    await createSkillConstrained([{ skill: skill.address, level: 10 }]);
  });

  it('should succeed if called with multiple required skills', async () => {
    const skill1 = await createSkill();
    const skill2 = await createSkill();
    const skill3 = await createSkill();

    await createSkillConstrained([
      { skill: skill1.address, level: 1 },
      { skill: skill2.address, level: 2 },
      { skill: skill3.address, level: 3 },
    ]);
  });

  it('should revert if called with 0 level', async () => {
    const skill1 = await createSkill();
    const skill2 = await createSkill();

    const constrainedDiamond = asDiamondCut(await createDiamond());

    const constrainedFacet = await deploySkillConstrainedFacet();
    const testConstrainedFacet = await deployTestSkillConstrainedFacet();
    const constrainedInit = await deploySkillConstrainedInit();

    const diamondCuts = [buildDiamondFacetCut(constrainedFacet), buildDiamondFacetCut(testConstrainedFacet)];

    await expect<Promise<ContractTransaction>>(
      constrainedDiamond.diamondCut(
        diamondCuts,

        buildSetRequiredSkillsFunction(constrainedInit, [
          { skill: skill1.address, level: 100 },
          { skill: skill2.address, level: 0 },
        ]),
      ),
    ).toBeRevertedWith('required skill level is invalid');
  });

  it('should revert if called with non-skills', async () => {
    const skill1 = await createSkill();
    const skill2 = await createSkill();
    const genericConcept = await createContractInfo();

    const constrainedDiamond = asDiamondCut(await createDiamond());

    const constrainedFacet = await deploySkillConstrainedFacet();
    const testConstrainedFacet = await deployTestSkillConstrainedFacet();
    const constrainedInit = await deploySkillConstrainedInit();

    const diamondCuts = [buildDiamondFacetCut(constrainedFacet), buildDiamondFacetCut(testConstrainedFacet)];

    await expect<Promise<ContractTransaction>>(
      constrainedDiamond.diamondCut(
        diamondCuts,

        buildSetRequiredSkillsFunction(constrainedInit, [
          { skill: skill1.address, level: 50 },
          { skill: ZERO_ADDRESS, level: 100 },
          { skill: skill2.address, level: 200 },
        ]),
      ),
    ).toBeRevertedWith('required skill is zero address');

    await expect<Promise<ContractTransaction>>(
      constrainedDiamond.diamondCut(
        diamondCuts,

        buildSetRequiredSkillsFunction(constrainedInit, [
          { skill: skill1.address, level: 50 },
          { skill: PLAYER1.address, level: 100 },
          { skill: skill2.address, level: 200 },
        ]),
      ),
    ).toBeReverted();

    await expect<Promise<ContractTransaction>>(
      constrainedDiamond.diamondCut(
        diamondCuts,

        buildSetRequiredSkillsFunction(constrainedInit, [
          { skill: skill1.address, level: 50 },
          { skill: genericConcept.address, level: 100 },
          { skill: skill2.address, level: 200 },
        ]),
      ),
    ).toBeRevertedWith('Skill must support interface');
  });
});
