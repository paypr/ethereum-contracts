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
import { BASE_CONTRACT_ID, ERC165_ID, SKILL_CONSTRAINED_ID, SKILL_ID } from '../../../helpers/ContractIds';
import { PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { shouldSupportInterface } from '../../../helpers/ERC165';
import { createConstrainedSkill } from '../../../helpers/SkillHelper';

describe('supportsInterface', () => {
  shouldSupportInterface('ERC165', createConstrainedSkill, ERC165_ID);
  shouldSupportInterface('BaseContract', createConstrainedSkill, BASE_CONTRACT_ID);
  shouldSupportInterface('Skill', createConstrainedSkill, SKILL_ID);
  shouldSupportInterface('SkillConstrained', createConstrainedSkill, SKILL_CONSTRAINED_ID);
});

describe('currentLevel', () => {
  it('should get 0 when no levels found', async () => {
    const skill = await createConstrainedSkill();

    const currentLevel = await skill.currentLevel(PLAYER1.address);
    expect<BigNumber>(currentLevel).toEqBN(0);
  });

  it('should get 0 when player has no levels', async () => {
    const skill = await createConstrainedSkill();

    await skill.connect(PLAYER2).acquireNext([]);

    const currentLevel = await skill.currentLevel(PLAYER1.address);
    expect<BigNumber>(currentLevel).toEqBN(0);
  });

  it('should get correct level when player has level', async () => {
    const skill = await createConstrainedSkill();

    await skill.connect(PLAYER1).acquireNext([]);
    await skill.connect(PLAYER1).acquireNext([]);
    await skill.connect(PLAYER2).acquireNext([]);

    const currentLevel1 = await skill.currentLevel(PLAYER1.address);
    expect<BigNumber>(currentLevel1).toEqBN(2);

    const currentLevel2 = await skill.currentLevel(PLAYER2.address);
    expect<BigNumber>(currentLevel2).toEqBN(1);
  });
});

describe('myCurrentLevel', () => {
  it('should get 0 when no levels found', async () => {
    const skill = await createConstrainedSkill();

    const currentLevel = await skill.connect(PLAYER1).myCurrentLevel();
    expect<BigNumber>(currentLevel).toEqBN(0);
  });

  it('should get 0 when player has no levels', async () => {
    const skill = await createConstrainedSkill();

    await skill.connect(PLAYER2).acquireNext([]);

    const currentLevel1 = await skill.connect(PLAYER1).myCurrentLevel();
    expect<BigNumber>(currentLevel1).toEqBN(0);
  });

  it('should get correct level when player has level', async () => {
    const skill = await createConstrainedSkill();

    await skill.connect(PLAYER1).acquireNext([]);
    await skill.connect(PLAYER1).acquireNext([]);
    await skill.connect(PLAYER2).acquireNext([]);

    const currentLevel1 = await skill.connect(PLAYER1).myCurrentLevel();
    expect<BigNumber>(currentLevel1).toEqBN(2);

    const currentLevel2 = await skill.connect(PLAYER2).myCurrentLevel();
    expect<BigNumber>(currentLevel2).toEqBN(1);
  });
});
