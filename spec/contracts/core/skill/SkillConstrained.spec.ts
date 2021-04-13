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
import { PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { createSkill, createSkillConstrained } from '../../../helpers/SkillHelper';

describe('skillsRequired', () => {
  it('should return empty when no skills required', async () => {
    const constrained = await createSkillConstrained();

    expect<string[]>(await constrained.skillsRequired()).toEqual([]);
  });

  it('should return the skills required', async () => {
    const skill1 = await createSkill({ name: 'Skill 1' });
    const skill2 = await createSkill({ name: 'Skill 2' });

    const constrained = await createSkillConstrained([
      { skill: skill1.address, level: 1 },
      { skill: skill2.address, level: 2 },
    ]);

    expect<string[]>(await constrained.skillsRequired()).toEqual([skill1.address, skill2.address]);
  });
});

describe('isSkillRequired', () => {
  it('should return false when no skills required', async () => {
    const skill1 = await createSkill({ name: 'Skill 1' });
    const skill2 = await createSkill({ name: 'Skill 2' });

    const constrained = await createSkillConstrained();

    expect<boolean>(await constrained.isSkillRequired(skill1.address)).toBe(false);
    expect<boolean>(await constrained.isSkillRequired(skill2.address)).toBe(false);
  });

  it('should return whether or not the skill is required', async () => {
    const skill1 = await createSkill({ name: 'Skill 1' });
    const skill2 = await createSkill({ name: 'Skill 2' });
    const skill3 = await createSkill({ name: 'Skill 3' });

    const constrained = await createSkillConstrained([
      { skill: skill1.address, level: 1 },
      { skill: skill2.address, level: 2 },
    ]);

    expect<boolean>(await constrained.isSkillRequired(skill1.address)).toBe(true);
    expect<boolean>(await constrained.isSkillRequired(skill2.address)).toBe(true);
    expect<boolean>(await constrained.isSkillRequired(skill3.address)).toBe(false);
  });
});

describe('skillLevelRequired', () => {
  it('should return 0 when no skills required', async () => {
    const skill1 = await createSkill({ name: 'Skill 1' });
    const skill2 = await createSkill({ name: 'Skill 2' });

    const constrained = await createSkillConstrained();

    expect<BigNumber>(await constrained.skillLevelRequired(skill1.address)).toEqBN(0);
    expect<BigNumber>(await constrained.skillLevelRequired(skill2.address)).toEqBN(0);
  });

  it('should return 0 when the skill is not required', async () => {
    const skill1 = await createSkill({ name: 'Skill 1' });
    const skill2 = await createSkill({ name: 'Skill 2' });
    const skill3 = await createSkill({ name: 'Skill 3' });
    const skill4 = await createSkill({ name: 'Skill 4' });

    const constrained = await createSkillConstrained([
      { skill: skill1.address, level: 1 },
      { skill: skill2.address, level: 2 },
    ]);

    expect<BigNumber>(await constrained.skillLevelRequired(skill3.address)).toEqBN(0);
    expect<BigNumber>(await constrained.skillLevelRequired(skill4.address)).toEqBN(0);
  });

  it('should return the level when the skill is required', async () => {
    const skill1 = await createSkill({ name: 'Skill 1' });
    const skill2 = await createSkill({ name: 'Skill 2' });

    const constrained = await createSkillConstrained([
      { skill: skill1.address, level: 1 },
      { skill: skill2.address, level: 2 },
    ]);

    expect<BigNumber>(await constrained.skillLevelRequired(skill1.address)).toEqBN(1);
    expect<BigNumber>(await constrained.skillLevelRequired(skill2.address)).toEqBN(2);
  });
});

describe('checkRequiredSkills', () => {
  it('should succeed when no skills required', async () => {
    const skill1 = await createSkill({ name: 'Skill 1' });
    const skill2 = await createSkill({ name: 'Skill 2' });

    const constrained = await createSkillConstrained();

    await constrained.checkRequiredSkills(PLAYER1.address);

    await skill1.connect(PLAYER1).acquireNext([]);

    await constrained.checkRequiredSkills(PLAYER1.address);

    await skill2.connect(PLAYER1).acquireNext([]);

    await constrained.checkRequiredSkills(PLAYER1.address);
  });

  it('should succeed when player has all required skills', async () => {
    const skill1 = await createSkill({ name: 'Skill 1' });
    const skill2 = await createSkill({ name: 'Skill 2' });
    const skill3 = await createSkill({ name: 'Skill 3' });

    const constrained = await createSkillConstrained([
      { skill: skill1.address, level: 1 },
      { skill: skill2.address, level: 2 },
    ]);

    await skill1.connect(PLAYER1).acquireNext([]);
    await skill2.connect(PLAYER1).acquireNext([]);
    await skill2.connect(PLAYER1).acquireNext([]);

    await constrained.checkRequiredSkills(PLAYER1.address);

    await skill1.connect(PLAYER1).acquireNext([]);

    await constrained.checkRequiredSkills(PLAYER1.address);

    await skill2.connect(PLAYER1).acquireNext([]);

    await constrained.checkRequiredSkills(PLAYER1.address);

    await skill3.connect(PLAYER1).acquireNext([]);

    await constrained.checkRequiredSkills(PLAYER1.address);
  });

  it('should revert when player does not have any of the required skills', async () => {
    const skill1 = await createSkill({ name: 'Skill 1' });
    const skill2 = await createSkill({ name: 'Skill 2' });
    const skill3 = await createSkill({ name: 'Skill 3' });

    const constrained = await createSkillConstrained([
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
