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

import { BigNumber, ContractTransaction } from 'ethers';
import { PLAYER1 } from '../../../../helpers/Accounts';
import { asConsumableMint, createConsumable } from '../../../../helpers/facets/ConsumableFacetHelper';
import { buildConsumableProviderActivityAdditions } from '../../../../helpers/facets/ConsumableProviderActivityHelper';
import { createSkillConstrainedActivity } from '../../../../helpers/facets/SkillConstrainedActivityHelper';
import { createTestSkill } from '../../../../helpers/facets/SkillFacetHelper';

describe('execute', () => {
  it('should execute when no skills required', async () => {
    const activity = await createSkillConstrainedActivity([]);

    await activity.connect(PLAYER1).execute([]);

    expect<BigNumber>(await activity.executed(PLAYER1.address)).toEqBN(1);
  });

  it('should execute when player has all skills required', async () => {
    const skill1 = await createTestSkill();
    const skill2 = await createTestSkill();

    const activity = await createSkillConstrainedActivity([
      { skill: skill1.address, level: 1 },
      { skill: skill2.address, level: 2 },
    ]);

    await skill1.connect(PLAYER1).acquire(1);
    await skill2.connect(PLAYER1).acquire(2);

    await activity.connect(PLAYER1).execute([]);

    expect<BigNumber>(await activity.executed(PLAYER1.address)).toEqBN(1);

    await skill1.connect(PLAYER1).acquire(2);
    await skill1.connect(PLAYER1).acquire(3);

    await activity.connect(PLAYER1).execute([]);

    expect<BigNumber>(await activity.executed(PLAYER1.address)).toEqBN(2);
  });

  it('should revert if player does not have the required skills', async () => {
    const skill1 = await createTestSkill();
    const skill2 = await createTestSkill();

    const activity = await createSkillConstrainedActivity([
      { skill: skill1.address, level: 1 },
      { skill: skill2.address, level: 2 },
    ]);

    await expect<Promise<ContractTransaction>>(activity.connect(PLAYER1).execute([])).toBeRevertedWith(
      'missing required skill',
    );

    expect<BigNumber>(await activity.executed(PLAYER1.address)).toEqBN(0);

    await skill1.connect(PLAYER1).acquire(1);

    await expect<Promise<ContractTransaction>>(activity.connect(PLAYER1).execute([])).toBeRevertedWith(
      'missing required skill',
    );

    expect<BigNumber>(await activity.executed(PLAYER1.address)).toEqBN(0);

    await skill1.connect(PLAYER1).acquire(2);
    await skill2.connect(PLAYER1).acquire(1);

    await expect<Promise<ContractTransaction>>(activity.connect(PLAYER1).execute([])).toBeRevertedWith(
      'missing required skill',
    );

    expect<BigNumber>(await activity.executed(PLAYER1.address)).toEqBN(0);
  });

  it('should not send consumable when player does not have the required skills', async () => {
    const skill1 = await createTestSkill();
    const skill2 = await createTestSkill();

    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();

    const activity = await createSkillConstrainedActivity(
      [
        { skill: skill1.address, level: 1 },
        { skill: skill2.address, level: 2 },
      ],
      await buildConsumableProviderActivityAdditions([
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ]),
    );

    await asConsumableMint(consumable1).mint(activity.address, 1000);
    await asConsumableMint(consumable2).mint(activity.address, 1000);

    await expect<Promise<ContractTransaction>>(activity.connect(PLAYER1).execute([])).toBeRevertedWith(
      'missing required skill',
    );

    expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(1000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);

    await skill1.connect(PLAYER1).acquire(1);

    await expect<Promise<ContractTransaction>>(activity.connect(PLAYER1).execute([])).toBeRevertedWith(
      'missing required skill',
    );

    expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(1000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);

    await skill1.connect(PLAYER1).acquire(2);
    await skill2.connect(PLAYER1).acquire(1);

    await expect<Promise<ContractTransaction>>(activity.connect(PLAYER1).execute([])).toBeRevertedWith(
      'missing required skill',
    );

    expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(1000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
  });
});
