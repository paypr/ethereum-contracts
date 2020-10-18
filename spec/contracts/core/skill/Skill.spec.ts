/*
 * Copyright (c) 2020 The Paypr Company
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

import { BN, expectEvent, expectRevert } from '@openzeppelin/test-helpers';
import { PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { toNumberAsync } from '../../../helpers/ContractHelper';
import { BASE_CONTRACT_ID, ERC165_ID, SKILL_ID, TRANSFERRING_ID } from '../../../helpers/ContractIds';
import { disableContract } from '../../../helpers/DisableableHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165';
import { createSkill } from '../../../helpers/SkillHelper';

describe('supportsInterface', () => {
  shouldSupportInterface('ERC165', createSkill, ERC165_ID);
  shouldSupportInterface('BaseContract', createSkill, BASE_CONTRACT_ID);
  shouldSupportInterface('Skill', createSkill, SKILL_ID);
  shouldSupportInterface('Transfer', createSkill, TRANSFERRING_ID);
});

describe('currentLevel', () => {
  it('should get 0 when no levels found', async () => {
    const skill = await createSkill();

    const currentLevel = await toNumberAsync(skill.currentLevel(PLAYER1));
    expect<number>(currentLevel).toEqual(0);
  });

  it('should get 0 when player has no levels', async () => {
    const skill = await createSkill();

    await skill.acquireNext([], { from: PLAYER2 });

    const currentLevel = await toNumberAsync(skill.currentLevel(PLAYER1));
    expect<number>(currentLevel).toEqual(0);
  });

  it('should get correct level when player has level', async () => {
    const skill = await createSkill();

    await skill.acquireNext([], { from: PLAYER1 });
    await skill.acquireNext([], { from: PLAYER1 });
    await skill.acquireNext([], { from: PLAYER2 });

    const currentLevel1 = await toNumberAsync(skill.currentLevel(PLAYER1));
    expect<number>(currentLevel1).toEqual(2);

    const currentLevel2 = await toNumberAsync(skill.currentLevel(PLAYER2));
    expect<number>(currentLevel2).toEqual(1);
  });
});

describe('myCurrentLevel', () => {
  it('should get 0 when no levels found', async () => {
    const skill = await createSkill();

    const currentLevel = await toNumberAsync(skill.myCurrentLevel({ from: PLAYER1 }));
    expect<number>(currentLevel).toEqual(0);
  });

  it('should get 0 when player has no levels', async () => {
    const skill = await createSkill();

    await skill.acquireNext([], { from: PLAYER2 });

    const currentLevel1 = await toNumberAsync(skill.myCurrentLevel({ from: PLAYER1 }));
    expect<number>(currentLevel1).toEqual(0);
  });

  it('should get correct level when player has level', async () => {
    const skill = await createSkill();

    await skill.acquireNext([], { from: PLAYER1 });
    await skill.acquireNext([], { from: PLAYER1 });
    await skill.acquireNext([], { from: PLAYER2 });

    const currentLevel1 = await toNumberAsync(skill.myCurrentLevel({ from: PLAYER1 }));
    expect<number>(currentLevel1).toEqual(2);

    const currentLevel2 = await toNumberAsync(skill.myCurrentLevel({ from: PLAYER2 }));
    expect<number>(currentLevel2).toEqual(1);
  });
});

describe('acquireNext', () => {
  it('should get the first level when no levels found', async () => {
    const skill = await createSkill();

    await skill.acquireNext([], { from: PLAYER1 });

    const currentLevel = await toNumberAsync(skill.currentLevel(PLAYER1));
    expect<number>(currentLevel).toEqual(1);
  });

  it('should send Acquired event when no levels found', async () => {
    const skill = await createSkill();

    const receipt = await skill.acquireNext([], { from: PLAYER1 });

    expectEvent(receipt, 'Acquired', { player: PLAYER1, level: new BN(1) });
  });

  it('should get the first level when no level found for player', async () => {
    const skill = await createSkill();

    await skill.acquireNext([], { from: PLAYER2 });
    await skill.acquireNext([], { from: PLAYER1 });

    const currentLevel = await toNumberAsync(skill.currentLevel(PLAYER1));
    expect<number>(currentLevel).toEqual(1);
  });

  it('should get the next level when level found for player', async () => {
    const skill = await createSkill();

    await skill.acquireNext([], { from: PLAYER1 });
    await skill.acquireNext([], { from: PLAYER1 });
    await skill.acquireNext([], { from: PLAYER2 });
    await skill.acquireNext([], { from: PLAYER1 });
    await skill.acquireNext([], { from: PLAYER2 });

    const currentLevel1 = await toNumberAsync(skill.currentLevel(PLAYER1));
    expect<number>(currentLevel1).toEqual(3);

    const currentLevel2 = await toNumberAsync(skill.currentLevel(PLAYER2));
    expect<number>(currentLevel2).toEqual(2);
  });

  it('should send Acquired event for advanced level', async () => {
    const skill = await createSkill();

    await skill.acquireNext([], { from: PLAYER1 });
    await skill.acquireNext([], { from: PLAYER1 });
    await skill.acquireNext([], { from: PLAYER2 });
    const receipt = await skill.acquireNext([], { from: PLAYER1 });

    expectEvent(receipt, 'Acquired', { player: PLAYER1, level: new BN(3) });
  });

  it('should not acquire skill if disabled', async () => {
    const skill = await createSkill();

    await disableContract(skill);

    await expectRevert(skill.acquireNext([], { from: PLAYER1 }), 'Contract is disabled');
  });
});
