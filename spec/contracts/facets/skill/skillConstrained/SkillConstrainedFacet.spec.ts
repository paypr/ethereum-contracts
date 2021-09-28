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

import { buildDiamondFacetCut } from '../../../../../src/contracts/diamonds';
import { SkillLevel, SkillLevelBN } from '../../../../../src/contracts/skills';
import { SKILL_CONSTRAINED_INTERFACE_ID } from '../../../../../src/contracts/erc165InterfaceIds';
import { PLAYER1, PLAYER2 } from '../../../../helpers/Accounts';
import { deployDiamond } from '../../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../../helpers/ERC165Helper';
import { asErc165, deployErc165Facet } from '../../../../helpers/facets/ERC165FacetHelper';
import {
  createSkillConstrained,
  createTestSkillConstrained,
  deploySkillConstrainedFacet,
} from '../../../../helpers/facets/SkillConstrainedFacetHelper';
import {
  createSelfAcquiringSkill,
  createSkill,
  createTestSkill,
  toSkillLevel,
} from '../../../../helpers/facets/SkillFacetHelper';

describe('supportsInterface', () => {
  const createDiamondForErc165 = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deploySkillConstrainedFacet()),
      ]),
    );

  shouldSupportInterface('SkillConstrained', createDiamondForErc165, SKILL_CONSTRAINED_INTERFACE_ID);
});

describe('requiredSkills', () => {
  it('should return empty when no skills required', async () => {
    const constrained = await createSkillConstrained([]);

    expect<SkillLevelBN[]>(await constrained.requiredSkills()).toEqual([]);
  });

  it('should return the skills required', async () => {
    const skill1 = await createSkill();
    const skill2 = await createSkill();

    const constrained = await createSkillConstrained([
      { skill: skill1.address, level: 1 },
      { skill: skill2.address, level: 2 },
    ]);

    expect<SkillLevel[]>((await constrained.requiredSkills()).map(toSkillLevel)).toEqual([
      { skill: skill1.address, level: 1 },
      { skill: skill2.address, level: 2 },
    ]);
  });
});

describe('checkRequiredSkills', () => {
  it('should succeed when no skills required', async () => {
    const skill1 = await createTestSkill();
    const skill2 = await createTestSkill();

    const constrained = await createTestSkillConstrained([]);

    await constrained.checkRequiredSkills(PLAYER1.address);

    await skill1.connect(PLAYER1).acquire(2);

    await constrained.checkRequiredSkills(PLAYER1.address);

    await skill2.connect(PLAYER1).acquire(3);

    await constrained.checkRequiredSkills(PLAYER1.address);
  });

  it('should succeed when player has all required skills', async () => {
    const skill1 = await createTestSkill();
    const skill2 = await createTestSkill();
    const skill3 = await createTestSkill();

    const constrained = await createTestSkillConstrained([
      { skill: skill1.address, level: 1 },
      { skill: skill2.address, level: 2 },
    ]);

    await skill1.connect(PLAYER1).acquire(1);
    await skill2.connect(PLAYER1).acquire(2);

    await constrained.checkRequiredSkills(PLAYER1.address);

    await skill1.connect(PLAYER1).acquireNext();

    await constrained.checkRequiredSkills(PLAYER1.address);

    await skill2.connect(PLAYER1).acquireNext();

    await constrained.checkRequiredSkills(PLAYER1.address);

    await skill3.connect(PLAYER1).acquireNext();

    await constrained.checkRequiredSkills(PLAYER1.address);
  });

  it('should revert when player does not have any of the required skills', async () => {
    const skill1 = await createSelfAcquiringSkill();
    const skill2 = await createSelfAcquiringSkill();
    const skill3 = await createSelfAcquiringSkill();

    const constrained = await createTestSkillConstrained([
      { skill: skill1.address, level: 1 },
      { skill: skill2.address, level: 2 },
    ]);

    await expect<Promise<void>>(constrained.checkRequiredSkills(PLAYER1.address)).toBeRevertedWith(
      'SkillConstrained: missing required skill',
    );

    await skill1.connect(PLAYER1).acquireNext([]);

    await expect<Promise<void>>(constrained.checkRequiredSkills(PLAYER1.address)).toBeRevertedWith(
      'SkillConstrained: missing required skill',
    );

    await skill2.connect(PLAYER1).acquireNext([]);

    await expect<Promise<void>>(constrained.checkRequiredSkills(PLAYER1.address)).toBeRevertedWith(
      'SkillConstrained: missing required skill',
    );

    await skill1.connect(PLAYER1).acquireNext([]);

    await expect<Promise<void>>(constrained.checkRequiredSkills(PLAYER1.address)).toBeRevertedWith(
      'SkillConstrained: missing required skill',
    );

    await skill2.connect(PLAYER1).acquireNext([]);

    await skill2.connect(PLAYER2).acquireNext([]);
    await skill2.connect(PLAYER2).acquireNext([]);

    await expect<Promise<void>>(constrained.checkRequiredSkills(PLAYER2.address)).toBeRevertedWith(
      'SkillConstrained: missing required skill',
    );

    await skill2.connect(PLAYER2).acquireNext([]);

    await expect<Promise<void>>(constrained.checkRequiredSkills(PLAYER2.address)).toBeRevertedWith(
      'SkillConstrained: missing required skill',
    );

    await skill3.connect(PLAYER2).acquireNext([]);

    await expect<Promise<void>>(constrained.checkRequiredSkills(PLAYER2.address)).toBeRevertedWith(
      'SkillConstrained: missing required skill',
    );
  });
});
