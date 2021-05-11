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
import { HELPER1, HELPER2, PLAYER1, PLAYER2 } from '../../../../helpers/Accounts';
import { buildConsumableConsumerSkillAdditions } from '../../../../helpers/facets/ConsumableConsumerSkillHelper';
import { asConsumableMint, createConsumable } from '../../../../helpers/facets/ConsumableFacetHelper';
import { asSkill, createSelfAcquiringSkill } from '../../../../helpers/facets/SkillFacetHelper';

describe('acquireNext', () => {
  it('should get the correct level for the player', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();

    const consumableConsumerSkill = await createSelfAcquiringSkill(
      await buildConsumableConsumerSkillAdditions([
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ]),
    );

    await asConsumableMint(consumable1).mint(PLAYER1.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER1.address, 1000);

    await asConsumableMint(consumable1).mint(PLAYER2.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER2.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(consumableConsumerSkill.address, 100);
    await consumable2.connect(PLAYER1).increaseAllowance(consumableConsumerSkill.address, 200);

    await consumableConsumerSkill.connect(PLAYER1).acquireNext([]);

    expect<BigNumber>(await asSkill(consumableConsumerSkill).currentLevel(PLAYER1.address)).toEqBN(1);
    expect<BigNumber>(await asSkill(consumableConsumerSkill).currentLevel(PLAYER2.address)).toEqBN(0);

    await consumable1.connect(PLAYER1).increaseAllowance(consumableConsumerSkill.address, 100);
    await consumable2.connect(PLAYER1).increaseAllowance(consumableConsumerSkill.address, 200);

    await consumableConsumerSkill.connect(PLAYER1).acquireNext([]);

    expect<BigNumber>(await asSkill(consumableConsumerSkill).currentLevel(PLAYER1.address)).toEqBN(2);
    expect<BigNumber>(await asSkill(consumableConsumerSkill).currentLevel(PLAYER2.address)).toEqBN(0);

    await consumable1.connect(PLAYER2).increaseAllowance(consumableConsumerSkill.address, 100);
    await consumable2.connect(PLAYER2).increaseAllowance(consumableConsumerSkill.address, 200);

    await consumableConsumerSkill.connect(PLAYER2).acquireNext([]);

    expect<BigNumber>(await asSkill(consumableConsumerSkill).currentLevel(PLAYER1.address)).toEqBN(2);
    expect<BigNumber>(await asSkill(consumableConsumerSkill).currentLevel(PLAYER2.address)).toEqBN(1);

    await consumable1.connect(PLAYER1).increaseAllowance(consumableConsumerSkill.address, 100);
    await consumable2.connect(PLAYER1).increaseAllowance(consumableConsumerSkill.address, 200);

    await consumableConsumerSkill.connect(PLAYER1).acquireNext([]);

    expect<BigNumber>(await asSkill(consumableConsumerSkill).currentLevel(PLAYER1.address)).toEqBN(3);
    expect<BigNumber>(await asSkill(consumableConsumerSkill).currentLevel(PLAYER2.address)).toEqBN(1);

    await consumable1.connect(PLAYER2).increaseAllowance(consumableConsumerSkill.address, 100);
    await consumable2.connect(PLAYER2).increaseAllowance(consumableConsumerSkill.address, 200);

    await consumableConsumerSkill.connect(PLAYER2).acquireNext([]);

    expect<BigNumber>(await asSkill(consumableConsumerSkill).currentLevel(PLAYER1.address)).toEqBN(3);
    expect<BigNumber>(await asSkill(consumableConsumerSkill).currentLevel(PLAYER2.address)).toEqBN(2);
  });

  it('should get the correct level when helpers used by player', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();

    const consumableConsumerSkill = await createSelfAcquiringSkill(
      await buildConsumableConsumerSkillAdditions([
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ]),
    );

    await asConsumableMint(consumable1).mint(PLAYER1.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER1.address, 1000);

    await asConsumableMint(consumable1).mint(HELPER1.address, 1000);
    await asConsumableMint(consumable2).mint(HELPER1.address, 1000);

    await asConsumableMint(consumable1).mint(HELPER2.address, 1000);
    await asConsumableMint(consumable2).mint(HELPER2.address, 1000);

    await asConsumableMint(consumable1).mint(PLAYER2.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER2.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(consumableConsumerSkill.address, 50);
    await consumable1.connect(HELPER1).increaseAllowance(consumableConsumerSkill.address, 50);
    await consumable2.connect(HELPER1).increaseAllowance(consumableConsumerSkill.address, 100);
    await consumable2.connect(HELPER2).increaseAllowance(consumableConsumerSkill.address, 100);

    await consumableConsumerSkill.connect(PLAYER1).acquireNext([HELPER1.address, HELPER2.address]);

    expect<BigNumber>(await asSkill(consumableConsumerSkill).currentLevel(PLAYER1.address)).toEqBN(1);
    expect<BigNumber>(await asSkill(consumableConsumerSkill).currentLevel(PLAYER2.address)).toEqBN(0);

    await consumable1.connect(PLAYER1).increaseAllowance(consumableConsumerSkill.address, 50);
    await consumable1.connect(HELPER1).increaseAllowance(consumableConsumerSkill.address, 50);
    await consumable2.connect(HELPER1).increaseAllowance(consumableConsumerSkill.address, 100);
    await consumable2.connect(HELPER2).increaseAllowance(consumableConsumerSkill.address, 100);

    await consumableConsumerSkill.connect(PLAYER1).acquireNext([HELPER1.address, HELPER2.address]);

    expect<BigNumber>(await asSkill(consumableConsumerSkill).currentLevel(PLAYER1.address)).toEqBN(2);
    expect<BigNumber>(await asSkill(consumableConsumerSkill).currentLevel(PLAYER2.address)).toEqBN(0);

    await consumable1.connect(PLAYER2).increaseAllowance(consumableConsumerSkill.address, 50);
    await consumable1.connect(HELPER1).increaseAllowance(consumableConsumerSkill.address, 50);
    await consumable2.connect(HELPER1).increaseAllowance(consumableConsumerSkill.address, 100);
    await consumable2.connect(HELPER2).increaseAllowance(consumableConsumerSkill.address, 100);

    await consumableConsumerSkill.connect(PLAYER2).acquireNext([HELPER1.address, HELPER2.address]);

    expect<BigNumber>(await asSkill(consumableConsumerSkill).currentLevel(PLAYER1.address)).toEqBN(2);
    expect<BigNumber>(await asSkill(consumableConsumerSkill).currentLevel(PLAYER2.address)).toEqBN(1);

    await consumable1.connect(PLAYER1).increaseAllowance(consumableConsumerSkill.address, 50);
    await consumable1.connect(HELPER1).increaseAllowance(consumableConsumerSkill.address, 50);
    await consumable2.connect(HELPER1).increaseAllowance(consumableConsumerSkill.address, 100);
    await consumable2.connect(HELPER2).increaseAllowance(consumableConsumerSkill.address, 100);

    await consumableConsumerSkill.connect(PLAYER1).acquireNext([HELPER1.address, HELPER2.address]);

    expect<BigNumber>(await asSkill(consumableConsumerSkill).currentLevel(PLAYER1.address)).toEqBN(3);
    expect<BigNumber>(await asSkill(consumableConsumerSkill).currentLevel(PLAYER2.address)).toEqBN(1);

    await consumable1.connect(PLAYER2).increaseAllowance(consumableConsumerSkill.address, 50);
    await consumable1.connect(HELPER1).increaseAllowance(consumableConsumerSkill.address, 50);
    await consumable2.connect(HELPER1).increaseAllowance(consumableConsumerSkill.address, 100);
    await consumable2.connect(HELPER2).increaseAllowance(consumableConsumerSkill.address, 100);

    await consumableConsumerSkill.connect(PLAYER2).acquireNext([HELPER1.address, HELPER2.address]);

    expect<BigNumber>(await asSkill(consumableConsumerSkill).currentLevel(PLAYER1.address)).toEqBN(3);
    expect<BigNumber>(await asSkill(consumableConsumerSkill).currentLevel(PLAYER2.address)).toEqBN(2);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(850);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(PLAYER2.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER2.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(HELPER1.address)).toEqBN(750);
    expect<BigNumber>(await consumable2.balanceOf(HELPER1.address)).toEqBN(500);
    expect<BigNumber>(await consumable1.balanceOf(HELPER2.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(HELPER2.address)).toEqBN(500);
    expect<BigNumber>(await consumable1.balanceOf(consumableConsumerSkill.address)).toEqBN(500);
    expect<BigNumber>(await consumable2.balanceOf(consumableConsumerSkill.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, consumableConsumerSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, consumableConsumerSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(PLAYER2.address, consumableConsumerSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER2.address, consumableConsumerSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(HELPER1.address, consumableConsumerSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(HELPER1.address, consumableConsumerSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(HELPER2.address, consumableConsumerSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(HELPER2.address, consumableConsumerSkill.address)).toEqBN(0);
  });

  it('should revert when any consumables not provided by player / helpers', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();

    const consumableConsumerSkill = await createSelfAcquiringSkill(
      await buildConsumableConsumerSkillAdditions([
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ]),
    );

    await asConsumableMint(consumable1).mint(PLAYER1.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER1.address, 1000);

    await asConsumableMint(consumable1).mint(HELPER1.address, 1000);
    await asConsumableMint(consumable2).mint(HELPER1.address, 1000);

    await asConsumableMint(consumable1).mint(HELPER2.address, 1000);
    await asConsumableMint(consumable2).mint(HELPER2.address, 1000);

    await asConsumableMint(consumable1).mint(PLAYER2.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER2.address, 1000);

    await consumable1.connect(PLAYER2).increaseAllowance(consumableConsumerSkill.address, 100);
    await consumable2.connect(PLAYER2).increaseAllowance(consumableConsumerSkill.address, 200);

    await consumable1.connect(PLAYER1).increaseAllowance(consumableConsumerSkill.address, 99);
    await consumable2.connect(PLAYER1).increaseAllowance(consumableConsumerSkill.address, 100);

    await expect<Promise<ContractTransaction>>(
      consumableConsumerSkill.connect(PLAYER1).acquireNext([]),
    ).toBeRevertedWith('Not enough consumable to transfer');

    expect<BigNumber>(await asSkill(consumableConsumerSkill).currentLevel(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(HELPER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(HELPER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(HELPER2.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(HELPER2.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(consumableConsumerSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(consumableConsumerSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, consumableConsumerSkill.address)).toEqBN(99);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, consumableConsumerSkill.address)).toEqBN(100);
    expect<BigNumber>(await consumable1.allowance(HELPER1.address, consumableConsumerSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(HELPER1.address, consumableConsumerSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(HELPER2.address, consumableConsumerSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(HELPER2.address, consumableConsumerSkill.address)).toEqBN(0);

    await consumable1.connect(PLAYER1).increaseAllowance(consumableConsumerSkill.address, 1);

    await expect<Promise<ContractTransaction>>(
      consumableConsumerSkill.connect(PLAYER1).acquireNext([HELPER1.address, HELPER2.address]),
    ).toBeRevertedWith('Not enough consumable to transfer');

    expect<BigNumber>(await asSkill(consumableConsumerSkill).currentLevel(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(HELPER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(HELPER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(HELPER2.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(HELPER2.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(consumableConsumerSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(consumableConsumerSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, consumableConsumerSkill.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, consumableConsumerSkill.address)).toEqBN(100);
    expect<BigNumber>(await consumable1.allowance(HELPER1.address, consumableConsumerSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(HELPER1.address, consumableConsumerSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(HELPER2.address, consumableConsumerSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(HELPER2.address, consumableConsumerSkill.address)).toEqBN(0);

    await consumable1.connect(PLAYER1).increaseAllowance(consumableConsumerSkill.address, 100);
    await consumable1.connect(HELPER1).increaseAllowance(consumableConsumerSkill.address, 100);
    await consumable1.connect(HELPER2).increaseAllowance(consumableConsumerSkill.address, 100);

    await expect<Promise<ContractTransaction>>(
      consumableConsumerSkill.connect(PLAYER1).acquireNext([HELPER1.address, HELPER2.address]),
    ).toBeRevertedWith('Not enough consumable to transfer');

    expect<BigNumber>(await asSkill(consumableConsumerSkill).currentLevel(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(HELPER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(HELPER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(HELPER2.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(HELPER2.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(consumableConsumerSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(consumableConsumerSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, consumableConsumerSkill.address)).toEqBN(200);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, consumableConsumerSkill.address)).toEqBN(100);
    expect<BigNumber>(await consumable1.allowance(HELPER1.address, consumableConsumerSkill.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(HELPER1.address, consumableConsumerSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(HELPER2.address, consumableConsumerSkill.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(HELPER2.address, consumableConsumerSkill.address)).toEqBN(0);

    await consumable2.connect(HELPER1).increaseAllowance(consumableConsumerSkill.address, 50);
    await consumable2.connect(HELPER2).increaseAllowance(consumableConsumerSkill.address, 49);

    await expect<Promise<ContractTransaction>>(
      consumableConsumerSkill.connect(PLAYER1).acquireNext([HELPER1.address, HELPER2.address]),
    ).toBeRevertedWith('Not enough consumable to transfer');

    expect<BigNumber>(await asSkill(consumableConsumerSkill).currentLevel(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(HELPER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(HELPER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(HELPER2.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(HELPER2.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(consumableConsumerSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(consumableConsumerSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, consumableConsumerSkill.address)).toEqBN(200);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, consumableConsumerSkill.address)).toEqBN(100);
    expect<BigNumber>(await consumable1.allowance(HELPER1.address, consumableConsumerSkill.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(HELPER1.address, consumableConsumerSkill.address)).toEqBN(50);
    expect<BigNumber>(await consumable1.allowance(HELPER2.address, consumableConsumerSkill.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(HELPER2.address, consumableConsumerSkill.address)).toEqBN(49);
  });
});
