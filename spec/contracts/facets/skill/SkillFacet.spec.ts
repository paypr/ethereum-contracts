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

import { BigNumber } from 'ethers';
import { buildDiamondFacetCut } from '../../../../src/contracts/core/diamonds';
import { SKILL_INTERFACE_ID } from '../../../../src/contracts/erc165InterfaceIds';
import { PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { deployDiamond } from '../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165Helper';
import { asErc165, deployErc165Facet } from '../../../helpers/facets/ERC165FacetHelper';
import {
  asSkill,
  asTestSkill,
  createSkill,
  createTestSkill,
  deploySkillFacet,
} from '../../../helpers/facets/SkillFacetHelper';

describe('supportsInterface', () => {
  const createDiamondForErc165 = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deploySkillFacet()),
      ]),
    );

  shouldSupportInterface('Skill', createDiamondForErc165, SKILL_INTERFACE_ID);
});

describe('currentLevel', () => {
  it('should get 0 when no levels found', async () => {
    const skill = await createSkill();

    expect<BigNumber>(await skill.currentLevel(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await skill.currentLevel(PLAYER2.address)).toEqBN(0);
  });

  it('should get 0 when player has no levels', async () => {
    const testSkill = await createTestSkill();
    const skill = asSkill(testSkill);

    await testSkill.connect(PLAYER2).acquire(2);

    expect<BigNumber>(await skill.currentLevel(PLAYER1.address)).toEqBN(0);
  });

  it('should get correct level when player has level', async () => {
    const testSkill = await createTestSkill();
    const skill = asSkill(testSkill);

    await testSkill.connect(PLAYER1).acquire(2);

    expect<BigNumber>(await skill.currentLevel(PLAYER1.address)).toEqBN(2);
    expect<BigNumber>(await skill.currentLevel(PLAYER2.address)).toEqBN(0);

    await testSkill.connect(PLAYER2).acquire(5);

    expect<BigNumber>(await skill.currentLevel(PLAYER1.address)).toEqBN(2);
    expect<BigNumber>(await skill.currentLevel(PLAYER2.address)).toEqBN(5);
  });
});

describe('myCurrentLevel', () => {
  it('should get 0 when no levels found', async () => {
    const skill = await createSkill();

    expect<BigNumber>(await skill.connect(PLAYER1).myCurrentLevel()).toEqBN(0);
    expect<BigNumber>(await skill.connect(PLAYER2).myCurrentLevel()).toEqBN(0);
  });

  it('should get 0 when player has no levels', async () => {
    const testSkill = await createTestSkill();
    const skill = asSkill(testSkill);

    await testSkill.connect(PLAYER2).acquire(2);

    expect<BigNumber>(await skill.connect(PLAYER1).myCurrentLevel()).toEqBN(0);
  });

  it('should get correct level when player has level', async () => {
    const testSkill = await createTestSkill();
    const skill = asSkill(testSkill);

    await asTestSkill(testSkill, PLAYER1).acquire(2);

    expect<BigNumber>(await skill.connect(PLAYER1).myCurrentLevel()).toEqBN(2);
    expect<BigNumber>(await skill.connect(PLAYER2).myCurrentLevel()).toEqBN(0);

    await asTestSkill(testSkill, PLAYER2).acquire(5);

    expect<BigNumber>(await skill.connect(PLAYER1).myCurrentLevel()).toEqBN(2);
    expect<BigNumber>(await skill.connect(PLAYER2).myCurrentLevel()).toEqBN(5);
  });
});
