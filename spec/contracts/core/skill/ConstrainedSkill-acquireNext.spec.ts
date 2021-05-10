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
import { HELPER1, HELPER2, PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { createConsumable, mintConsumable } from '../../../helpers/ConsumableHelper';
import { createConstrainedSkill, createSkill } from '../../../helpers/SkillHelper';

it('should get the first level when no levels found', async () => {
  const basicSkill1 = await createSkill({ name: 'Basic 1' });
  const basicSkill2 = await createSkill({ name: 'Basic 2' });

  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });

  const constrainedSkill = await createConstrainedSkill(
    { name: 'Constrained' },
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
    [
      { skill: basicSkill1.address, level: 1 },
      { skill: basicSkill2.address, level: 2 },
    ],
  );

  await basicSkill1.connect(PLAYER1).acquireNext([]);
  await basicSkill2.connect(PLAYER1).acquireNext([]);
  await basicSkill2.connect(PLAYER1).acquireNext([]);
  await basicSkill2.connect(PLAYER2).acquireNext([]);

  await mintConsumable(consumable1, PLAYER1.address, 1000);
  await mintConsumable(consumable2, PLAYER1.address, 1000);

  await consumable1.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 100);
  await consumable2.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 200);

  await constrainedSkill.connect(PLAYER1).acquireNext([]);

  expect<BigNumber>(await constrainedSkill.currentLevel(PLAYER1.address)).toEqBN(1);
});

it('should send Acquired event when no levels found', async () => {
  const basicSkill1 = await createSkill({ name: 'Basic 1' });
  const basicSkill2 = await createSkill({ name: 'Basic 2' });

  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });

  const constrainedSkill = await createConstrainedSkill(
    { name: 'Constrained' },
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
    [
      { skill: basicSkill1.address, level: 1 },
      { skill: basicSkill2.address, level: 2 },
    ],
  );

  await basicSkill1.connect(PLAYER1).acquireNext([]);
  await basicSkill2.connect(PLAYER1).acquireNext([]);
  await basicSkill2.connect(PLAYER1).acquireNext([]);
  await basicSkill2.connect(PLAYER2).acquireNext([]);

  await mintConsumable(consumable1, PLAYER1.address, 1000);
  await mintConsumable(consumable2, PLAYER1.address, 1000);

  await consumable1.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 100);
  await consumable2.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 200);

  await expect<ContractTransaction>(
    await constrainedSkill.connect(PLAYER1).acquireNext([]),
  ).toHaveEmittedWith(constrainedSkill, 'Acquired', [PLAYER1.address, '1']);
});

it('should get the first level when no level found for player', async () => {
  const basicSkill1 = await createSkill({ name: 'Basic 1' });
  const basicSkill2 = await createSkill({ name: 'Basic 2' });

  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });

  const constrainedSkill = await createConstrainedSkill(
    { name: 'Constrained' },
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
    [
      { skill: basicSkill1.address, level: 1 },
      { skill: basicSkill2.address, level: 2 },
    ],
  );

  await basicSkill1.connect(PLAYER1).acquireNext([]);
  await basicSkill2.connect(PLAYER1).acquireNext([]);
  await basicSkill2.connect(PLAYER1).acquireNext([]);

  await mintConsumable(consumable1, PLAYER1.address, 1000);
  await mintConsumable(consumable2, PLAYER1.address, 1000);

  await consumable1.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 100);
  await consumable2.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 200);

  await constrainedSkill.connect(PLAYER1).acquireNext([]);

  await basicSkill1.connect(PLAYER2).acquireNext([]);
  await basicSkill2.connect(PLAYER2).acquireNext([]);
  await basicSkill2.connect(PLAYER2).acquireNext([]);

  await mintConsumable(consumable1, PLAYER2.address, 1000);
  await mintConsumable(consumable2, PLAYER2.address, 1000);

  await consumable1.connect(PLAYER2).increaseAllowance(constrainedSkill.address, 100);
  await consumable2.connect(PLAYER2).increaseAllowance(constrainedSkill.address, 200);

  await constrainedSkill.connect(PLAYER2).acquireNext([]);

  expect<BigNumber>(await constrainedSkill.currentLevel(PLAYER2.address)).toEqBN(1);
});

it('should get the next level when level found for player', async () => {
  const basicSkill1 = await createSkill({ name: 'Basic 1' });
  const basicSkill2 = await createSkill({ name: 'Basic 2' });

  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });

  const constrainedSkill = await createConstrainedSkill(
    { name: 'Constrained' },
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
    [
      { skill: basicSkill1.address, level: 1 },
      { skill: basicSkill2.address, level: 2 },
    ],
  );

  await basicSkill1.connect(PLAYER1).acquireNext([]);
  await basicSkill2.connect(PLAYER1).acquireNext([]);
  await basicSkill2.connect(PLAYER1).acquireNext([]);

  await mintConsumable(consumable1, PLAYER1.address, 1000);
  await mintConsumable(consumable2, PLAYER1.address, 1000);

  await basicSkill1.connect(PLAYER2).acquireNext([]);
  await basicSkill2.connect(PLAYER2).acquireNext([]);
  await basicSkill2.connect(PLAYER2).acquireNext([]);

  await mintConsumable(consumable1, PLAYER2.address, 1000);
  await mintConsumable(consumable2, PLAYER2.address, 1000);

  await consumable1.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 100);
  await consumable2.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 200);

  await constrainedSkill.connect(PLAYER1).acquireNext([]);

  await consumable1.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 100);
  await consumable2.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 200);

  await constrainedSkill.connect(PLAYER1).acquireNext([]);

  await consumable1.connect(PLAYER2).increaseAllowance(constrainedSkill.address, 100);
  await consumable2.connect(PLAYER2).increaseAllowance(constrainedSkill.address, 200);

  await constrainedSkill.connect(PLAYER2).acquireNext([]);

  await consumable1.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 100);
  await consumable2.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 200);

  await constrainedSkill.connect(PLAYER1).acquireNext([]);

  await consumable1.connect(PLAYER2).increaseAllowance(constrainedSkill.address, 100);
  await consumable2.connect(PLAYER2).increaseAllowance(constrainedSkill.address, 200);

  await constrainedSkill.connect(PLAYER2).acquireNext([]);

  expect<BigNumber>(await constrainedSkill.currentLevel(PLAYER1.address)).toEqBN(3);
  expect<BigNumber>(await constrainedSkill.currentLevel(PLAYER2.address)).toEqBN(2);
});

it('should get the next level when helpers used by player', async () => {
  const basicSkill1 = await createSkill({ name: 'Basic 1' });
  const basicSkill2 = await createSkill({ name: 'Basic 2' });

  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });

  const constrainedSkill = await createConstrainedSkill(
    { name: 'Constrained' },
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
    [
      { skill: basicSkill1.address, level: 1 },
      { skill: basicSkill2.address, level: 2 },
    ],
  );

  await basicSkill1.connect(PLAYER1).acquireNext([]);
  await basicSkill2.connect(PLAYER1).acquireNext([]);
  await basicSkill2.connect(PLAYER1).acquireNext([]);

  await mintConsumable(consumable1, PLAYER1.address, 1000);
  await mintConsumable(consumable2, PLAYER1.address, 1000);

  await mintConsumable(consumable1, HELPER1.address, 1000);
  await mintConsumable(consumable2, HELPER1.address, 1000);

  await mintConsumable(consumable1, HELPER2.address, 1000);
  await mintConsumable(consumable2, HELPER2.address, 1000);

  await basicSkill1.connect(PLAYER2).acquireNext([]);
  await basicSkill2.connect(PLAYER2).acquireNext([]);
  await basicSkill2.connect(PLAYER2).acquireNext([]);

  await mintConsumable(consumable1, PLAYER2.address, 1000);
  await mintConsumable(consumable2, PLAYER2.address, 1000);

  await consumable1.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 50);
  await consumable1.connect(HELPER1).increaseAllowance(constrainedSkill.address, 50);
  await consumable2.connect(HELPER1).increaseAllowance(constrainedSkill.address, 100);
  await consumable2.connect(HELPER2).increaseAllowance(constrainedSkill.address, 100);

  await constrainedSkill.connect(PLAYER1).acquireNext([HELPER1.address, HELPER2.address]);

  await consumable1.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 50);
  await consumable1.connect(HELPER1).increaseAllowance(constrainedSkill.address, 50);
  await consumable2.connect(HELPER1).increaseAllowance(constrainedSkill.address, 100);
  await consumable2.connect(HELPER2).increaseAllowance(constrainedSkill.address, 100);

  await constrainedSkill.connect(PLAYER1).acquireNext([HELPER1.address, HELPER2.address]);

  await consumable1.connect(PLAYER2).increaseAllowance(constrainedSkill.address, 50);
  await consumable1.connect(HELPER1).increaseAllowance(constrainedSkill.address, 50);
  await consumable2.connect(HELPER1).increaseAllowance(constrainedSkill.address, 100);
  await consumable2.connect(HELPER2).increaseAllowance(constrainedSkill.address, 100);

  await constrainedSkill.connect(PLAYER2).acquireNext([HELPER1.address, HELPER2.address]);

  await consumable1.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 50);
  await consumable1.connect(HELPER1).increaseAllowance(constrainedSkill.address, 50);
  await consumable2.connect(HELPER1).increaseAllowance(constrainedSkill.address, 100);
  await consumable2.connect(HELPER2).increaseAllowance(constrainedSkill.address, 100);

  await constrainedSkill.connect(PLAYER1).acquireNext([HELPER1.address, HELPER2.address]);

  await consumable1.connect(PLAYER2).increaseAllowance(constrainedSkill.address, 50);
  await consumable1.connect(HELPER1).increaseAllowance(constrainedSkill.address, 50);
  await consumable2.connect(HELPER1).increaseAllowance(constrainedSkill.address, 100);
  await consumable2.connect(HELPER2).increaseAllowance(constrainedSkill.address, 100);

  await constrainedSkill.connect(PLAYER2).acquireNext([HELPER1.address, HELPER2.address]);

  expect<BigNumber>(await constrainedSkill.currentLevel(PLAYER1.address)).toEqBN(3);
  expect<BigNumber>(await constrainedSkill.currentLevel(PLAYER2.address)).toEqBN(2);

  expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(850);
  expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.balanceOf(PLAYER2.address)).toEqBN(900);
  expect<BigNumber>(await consumable2.balanceOf(PLAYER2.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.balanceOf(HELPER1.address)).toEqBN(750);
  expect<BigNumber>(await consumable2.balanceOf(HELPER1.address)).toEqBN(500);
  expect<BigNumber>(await consumable1.balanceOf(HELPER2.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(HELPER2.address)).toEqBN(500);
  expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(500);
  expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.allowance(PLAYER1.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(PLAYER1.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.allowance(PLAYER2.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(PLAYER2.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.allowance(HELPER1.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(HELPER1.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.allowance(HELPER2.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(HELPER2.address, constrainedSkill.address)).toEqBN(0);
});

it('should send Acquired event for advanced level', async () => {
  const basicSkill1 = await createSkill({ name: 'Basic 1' });
  const basicSkill2 = await createSkill({ name: 'Basic 2' });

  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });

  const constrainedSkill = await createConstrainedSkill(
    { name: 'Constrained' },
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
    [
      { skill: basicSkill1.address, level: 1 },
      { skill: basicSkill2.address, level: 2 },
    ],
  );

  await basicSkill1.connect(PLAYER1).acquireNext([]);
  await basicSkill2.connect(PLAYER1).acquireNext([]);
  await basicSkill2.connect(PLAYER1).acquireNext([]);

  await basicSkill1.connect(PLAYER2).acquireNext([]);
  await basicSkill2.connect(PLAYER2).acquireNext([]);
  await basicSkill2.connect(PLAYER2).acquireNext([]);

  await mintConsumable(consumable1, PLAYER1.address, 1000);
  await mintConsumable(consumable2, PLAYER1.address, 1000);

  await mintConsumable(consumable1, PLAYER2.address, 1000);
  await mintConsumable(consumable2, PLAYER2.address, 1000);

  await consumable1.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 100);
  await consumable2.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 200);

  await constrainedSkill.connect(PLAYER1).acquireNext([]);

  await consumable1.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 100);
  await consumable2.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 200);

  await constrainedSkill.connect(PLAYER1).acquireNext([]);

  await consumable1.connect(PLAYER2).increaseAllowance(constrainedSkill.address, 100);
  await consumable2.connect(PLAYER2).increaseAllowance(constrainedSkill.address, 200);

  await constrainedSkill.connect(PLAYER2).acquireNext([]);

  await consumable1.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 100);
  await consumable2.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 200);

  await expect<ContractTransaction>(
    await constrainedSkill.connect(PLAYER1).acquireNext([]),
  ).toHaveEmittedWith(constrainedSkill, 'Acquired', [PLAYER1.address, '3']);
});

it('should revert when any dependent skill level not found for player', async () => {
  const basicSkill1 = await createSkill({ name: 'Basic 1' });
  const basicSkill2 = await createSkill({ name: 'Basic 2' });

  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });

  const constrainedSkill = await createConstrainedSkill(
    { name: 'Constrained' },
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
    [
      { skill: basicSkill1.address, level: 1 },
      { skill: basicSkill2.address, level: 2 },
    ],
  );

  await mintConsumable(consumable1, PLAYER1.address, 1000);
  await mintConsumable(consumable2, PLAYER1.address, 1000);

  await consumable1.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 100);
  await consumable2.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 200);

  await basicSkill1.connect(PLAYER2).acquireNext([]);
  await basicSkill2.connect(PLAYER2).acquireNext([]);
  await basicSkill2.connect(PLAYER2).acquireNext([]);

  await mintConsumable(consumable1, PLAYER2.address, 1000);
  await mintConsumable(consumable2, PLAYER2.address, 1000);

  await consumable1.connect(PLAYER2).increaseAllowance(constrainedSkill.address, 100);
  await consumable2.connect(PLAYER2).increaseAllowance(constrainedSkill.address, 200);

  await expect<Promise<ContractTransaction>>(constrainedSkill.connect(PLAYER1).acquireNext([])).toBeRevertedWith(
    'missing required skill',
  );

  expect<BigNumber>(await constrainedSkill.currentLevel(PLAYER1.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.allowance(PLAYER1.address, constrainedSkill.address)).toEqBN(100);
  expect<BigNumber>(await consumable2.allowance(PLAYER1.address, constrainedSkill.address)).toEqBN(200);

  await basicSkill2.connect(PLAYER1).acquireNext([]);

  await expect<Promise<ContractTransaction>>(constrainedSkill.connect(PLAYER1).acquireNext([])).toBeRevertedWith(
    'missing required skill',
  );

  expect<BigNumber>(await constrainedSkill.currentLevel(PLAYER1.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.allowance(PLAYER1.address, constrainedSkill.address)).toEqBN(100);
  expect<BigNumber>(await consumable2.allowance(PLAYER1.address, constrainedSkill.address)).toEqBN(200);

  await basicSkill1.connect(PLAYER1).acquireNext([]);

  await expect<Promise<ContractTransaction>>(constrainedSkill.connect(PLAYER1).acquireNext([])).toBeRevertedWith(
    'missing required skill',
  );

  expect<BigNumber>(await constrainedSkill.currentLevel(PLAYER1.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.allowance(PLAYER1.address, constrainedSkill.address)).toEqBN(100);
  expect<BigNumber>(await consumable2.allowance(PLAYER1.address, constrainedSkill.address)).toEqBN(200);

  await basicSkill1.connect(PLAYER1).acquireNext([]);

  await expect<Promise<ContractTransaction>>(constrainedSkill.connect(PLAYER1).acquireNext([])).toBeRevertedWith(
    'missing required skill',
  );

  expect<BigNumber>(await constrainedSkill.currentLevel(PLAYER1.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.allowance(PLAYER1.address, constrainedSkill.address)).toEqBN(100);
  expect<BigNumber>(await consumable2.allowance(PLAYER1.address, constrainedSkill.address)).toEqBN(200);
});

it('should revert when any consumables not provided by player / helpers', async () => {
  const basicSkill1 = await createSkill({ name: 'Basic 1' });
  const basicSkill2 = await createSkill({ name: 'Basic 2' });

  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });

  const constrainedSkill = await createConstrainedSkill(
    { name: 'Constrained' },
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
    [
      { skill: basicSkill1.address, level: 1 },
      { skill: basicSkill2.address, level: 2 },
    ],
  );

  await basicSkill1.connect(PLAYER1).acquireNext([]);
  await basicSkill2.connect(PLAYER1).acquireNext([]);
  await basicSkill2.connect(PLAYER1).acquireNext([]);

  await mintConsumable(consumable1, PLAYER1.address, 1000);
  await mintConsumable(consumable2, PLAYER1.address, 1000);

  await mintConsumable(consumable1, HELPER1.address, 1000);
  await mintConsumable(consumable2, HELPER1.address, 1000);

  await mintConsumable(consumable1, HELPER2.address, 1000);
  await mintConsumable(consumable2, HELPER2.address, 1000);

  await basicSkill1.connect(PLAYER2).acquireNext([]);
  await basicSkill2.connect(PLAYER2).acquireNext([]);
  await basicSkill2.connect(PLAYER2).acquireNext([]);

  await mintConsumable(consumable1, PLAYER2.address, 1000);
  await mintConsumable(consumable2, PLAYER2.address, 1000);

  await consumable1.connect(PLAYER2).increaseAllowance(constrainedSkill.address, 100);
  await consumable2.connect(PLAYER2).increaseAllowance(constrainedSkill.address, 200);

  await consumable1.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 99);
  await consumable2.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 100);

  await expect<Promise<ContractTransaction>>(constrainedSkill.connect(PLAYER1).acquireNext([])).toBeRevertedWith(
    'Not enough consumable to transfer',
  );

  expect<BigNumber>(await constrainedSkill.currentLevel(PLAYER1.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.balanceOf(HELPER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(HELPER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.balanceOf(HELPER2.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(HELPER2.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.allowance(PLAYER1.address, constrainedSkill.address)).toEqBN(99);
  expect<BigNumber>(await consumable2.allowance(PLAYER1.address, constrainedSkill.address)).toEqBN(100);
  expect<BigNumber>(await consumable1.allowance(HELPER1.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(HELPER1.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.allowance(HELPER2.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(HELPER2.address, constrainedSkill.address)).toEqBN(0);

  await consumable1.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 1);

  await expect<Promise<ContractTransaction>>(
    constrainedSkill.connect(PLAYER1).acquireNext([HELPER1.address, HELPER2.address]),
  ).toBeRevertedWith('Not enough consumable to transfer');

  expect<BigNumber>(await constrainedSkill.currentLevel(PLAYER1.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.balanceOf(HELPER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(HELPER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.balanceOf(HELPER2.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(HELPER2.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.allowance(PLAYER1.address, constrainedSkill.address)).toEqBN(100);
  expect<BigNumber>(await consumable2.allowance(PLAYER1.address, constrainedSkill.address)).toEqBN(100);
  expect<BigNumber>(await consumable1.allowance(HELPER1.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(HELPER1.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.allowance(HELPER2.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(HELPER2.address, constrainedSkill.address)).toEqBN(0);

  await consumable1.connect(PLAYER1).increaseAllowance(constrainedSkill.address, 100);
  await consumable1.connect(HELPER1).increaseAllowance(constrainedSkill.address, 100);
  await consumable1.connect(HELPER2).increaseAllowance(constrainedSkill.address, 100);

  await expect<Promise<ContractTransaction>>(
    constrainedSkill.connect(PLAYER1).acquireNext([HELPER1.address, HELPER2.address]),
  ).toBeRevertedWith('Not enough consumable to transfer');

  expect<BigNumber>(await constrainedSkill.currentLevel(PLAYER1.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.balanceOf(HELPER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(HELPER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.balanceOf(HELPER2.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(HELPER2.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.allowance(PLAYER1.address, constrainedSkill.address)).toEqBN(200);
  expect<BigNumber>(await consumable2.allowance(PLAYER1.address, constrainedSkill.address)).toEqBN(100);
  expect<BigNumber>(await consumable1.allowance(HELPER1.address, constrainedSkill.address)).toEqBN(100);
  expect<BigNumber>(await consumable2.allowance(HELPER1.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.allowance(HELPER2.address, constrainedSkill.address)).toEqBN(100);
  expect<BigNumber>(await consumable2.allowance(HELPER2.address, constrainedSkill.address)).toEqBN(0);

  await consumable2.connect(HELPER1).increaseAllowance(constrainedSkill.address, 50);
  await consumable2.connect(HELPER2).increaseAllowance(constrainedSkill.address, 49);

  await expect<Promise<ContractTransaction>>(
    constrainedSkill.connect(PLAYER1).acquireNext([HELPER1.address, HELPER2.address]),
  ).toBeRevertedWith('Not enough consumable to transfer');

  expect<BigNumber>(await constrainedSkill.currentLevel(PLAYER1.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.balanceOf(HELPER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(HELPER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.balanceOf(HELPER2.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(HELPER2.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.allowance(PLAYER1.address, constrainedSkill.address)).toEqBN(200);
  expect<BigNumber>(await consumable2.allowance(PLAYER1.address, constrainedSkill.address)).toEqBN(100);
  expect<BigNumber>(await consumable1.allowance(HELPER1.address, constrainedSkill.address)).toEqBN(100);
  expect<BigNumber>(await consumable2.allowance(HELPER1.address, constrainedSkill.address)).toEqBN(50);
  expect<BigNumber>(await consumable1.allowance(HELPER2.address, constrainedSkill.address)).toEqBN(100);
  expect<BigNumber>(await consumable2.allowance(HELPER2.address, constrainedSkill.address)).toEqBN(49);
});
