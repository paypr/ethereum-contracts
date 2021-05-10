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
import { HELPER1, PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { createActivity } from '../../../helpers/ActivityHelper';
import { createConsumable, mintConsumable } from '../../../helpers/ConsumableHelper';
import { disableContract } from '../../../helpers/DisableableHelper';

it('should receive correct consumable from player', async () => {
  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });

  const activity = await createActivity({}, [
    { consumable: consumable1.address, amount: 100 },
    { consumable: consumable2.address, amount: 200 },
  ]);

  await mintConsumable(consumable1, PLAYER1.address, 1000);
  await mintConsumable(consumable2, PLAYER1.address, 1000);

  await consumable1.connect(PLAYER1).increaseAllowance(activity.address, 100);
  await consumable2.connect(PLAYER1).increaseAllowance(activity.address, 200);

  expect<BigNumber>(await consumable1.allowance(PLAYER1.address, activity.address)).toEqBN(100);
  expect<BigNumber>(await consumable2.allowance(PLAYER1.address, activity.address)).toEqBN(200);

  await activity.connect(PLAYER1).execute([]);

  expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(100);
  expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(200);

  expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(900);
  expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(800);

  expect<BigNumber>(await consumable1.allowance(PLAYER1.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(PLAYER1.address, activity.address)).toEqBN(0);
});

it('should provide correct consumable to player', async () => {
  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });

  const activity = await createActivity(
    {},
    [],
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
  );

  await mintConsumable(consumable1, activity.address, 1000);
  await mintConsumable(consumable2, activity.address, 1000);

  await activity.connect(PLAYER1).execute([]);

  expect<BigNumber>(await consumable1.allowance(activity.address, PLAYER1.address)).toEqBN(100);
  expect<BigNumber>(await consumable2.allowance(activity.address, PLAYER1.address)).toEqBN(200);
});

it('should send and receive correct consumables from/to player', async () => {
  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });
  const consumable3 = await createConsumable({ name: 'Consumable 3' });

  const activity = await createActivity(
    {},
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
    [
      { consumable: consumable2.address, amount: 50 },
      { consumable: consumable3.address, amount: 75 },
    ],
  );

  await mintConsumable(consumable1, PLAYER1.address, 1000);
  await mintConsumable(consumable2, PLAYER1.address, 1000);

  await consumable1.connect(PLAYER1).increaseAllowance(activity.address, 100);
  await consumable2.connect(PLAYER1).increaseAllowance(activity.address, 200);

  await mintConsumable(consumable3, activity.address, 1000);

  await activity.connect(PLAYER1).execute([]);

  expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(100);
  expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(200);
  expect<BigNumber>(await consumable3.balanceOf(activity.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(900);
  expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(800);
  expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.allowance(PLAYER1.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(PLAYER1.address, activity.address)).toEqBN(0);

  expect<BigNumber>(await consumable2.allowance(activity.address, PLAYER1.address)).toEqBN(50);
  expect<BigNumber>(await consumable3.allowance(activity.address, PLAYER1.address)).toEqBN(75);

  await consumable2.connect(PLAYER1).transferFrom(activity.address, PLAYER1.address, 50);
  await consumable3.connect(PLAYER1).transferFrom(activity.address, PLAYER1.address, 75);

  await mintConsumable(consumable1, PLAYER2.address, 1000);
  await mintConsumable(consumable2, PLAYER2.address, 1000);

  await consumable1.connect(PLAYER2).increaseAllowance(activity.address, 100);
  await consumable2.connect(PLAYER2).increaseAllowance(activity.address, 200);

  await activity.connect(PLAYER2).execute([]);

  expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(200);
  expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(350);
  expect<BigNumber>(await consumable3.balanceOf(activity.address)).toEqBN(925);

  expect<BigNumber>(await consumable1.balanceOf(PLAYER2.address)).toEqBN(900);
  expect<BigNumber>(await consumable2.balanceOf(PLAYER2.address)).toEqBN(800);
  expect<BigNumber>(await consumable3.balanceOf(PLAYER2.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.allowance(PLAYER2.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(PLAYER2.address, activity.address)).toEqBN(0);

  expect<BigNumber>(await consumable2.allowance(activity.address, PLAYER2.address)).toEqBN(50);
  expect<BigNumber>(await consumable3.allowance(activity.address, PLAYER2.address)).toEqBN(75);

  await consumable2.connect(PLAYER2).transferFrom(activity.address, PLAYER2.address, 50);
  await consumable3.connect(PLAYER2).transferFrom(activity.address, PLAYER2.address, 75);

  await consumable1.connect(PLAYER1).increaseAllowance(activity.address, 60);
  await consumable2.connect(PLAYER1).increaseAllowance(activity.address, 110);

  await consumable1.connect(PLAYER2).increaseAllowance(activity.address, 40);
  await consumable2.connect(PLAYER2).increaseAllowance(activity.address, 90);

  await activity.connect(PLAYER1).execute([PLAYER2.address]);

  expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(300);
  expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(500);

  expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(840);
  expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(740);

  expect<BigNumber>(await consumable1.balanceOf(PLAYER2.address)).toEqBN(860);
  expect<BigNumber>(await consumable2.balanceOf(PLAYER2.address)).toEqBN(760);

  expect<BigNumber>(await consumable2.allowance(activity.address, PLAYER1.address)).toEqBN(50);
  expect<BigNumber>(await consumable3.allowance(activity.address, PLAYER1.address)).toEqBN(75);

  await consumable2.connect(PLAYER1).transferFrom(activity.address, PLAYER1.address, 50);
  await consumable3.connect(PLAYER1).transferFrom(activity.address, PLAYER1.address, 75);
});

it('should receive all consumables from player and helpers', async () => {
  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });
  const consumable3 = await createConsumable({ name: 'Consumable 3' });

  const activity = await createActivity(
    {},
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
    [
      { consumable: consumable2.address, amount: 50 },
      { consumable: consumable3.address, amount: 75 },
    ],
  );

  await mintConsumable(consumable1, PLAYER1.address, 1000);
  await mintConsumable(consumable2, PLAYER1.address, 1000);

  await consumable1.connect(PLAYER1).increaseAllowance(activity.address, 100);
  await consumable2.connect(PLAYER1).increaseAllowance(activity.address, 200);

  await mintConsumable(consumable1, HELPER1.address, 1000);
  await mintConsumable(consumable2, HELPER1.address, 1000);

  await consumable1.connect(HELPER1).increaseAllowance(activity.address, 100);
  await consumable2.connect(HELPER1).increaseAllowance(activity.address, 200);

  await mintConsumable(consumable3, activity.address, 1000);

  await activity.connect(PLAYER1).execute([HELPER1.address]);

  expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(200);
  expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(400);

  expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(900);
  expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(800);

  expect<BigNumber>(await consumable1.balanceOf(HELPER1.address)).toEqBN(900);
  expect<BigNumber>(await consumable2.balanceOf(HELPER1.address)).toEqBN(800);

  expect<BigNumber>(await consumable1.allowance(PLAYER1.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(PLAYER1.address, activity.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.allowance(PLAYER2.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(PLAYER2.address, activity.address)).toEqBN(0);

  expect<BigNumber>(await consumable2.allowance(activity.address, PLAYER1.address)).toEqBN(50);
  expect<BigNumber>(await consumable3.allowance(activity.address, PLAYER1.address)).toEqBN(75);
});

it('should not send any consumables to player if any requirements are not met', async () => {
  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });
  const consumable3 = await createConsumable({ name: 'Consumable 3' });

  const activity = await createActivity(
    {},
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
    [
      { consumable: consumable2.address, amount: 50 },
      { consumable: consumable3.address, amount: 75 },
    ],
  );

  await mintConsumable(consumable1, PLAYER1.address, 1000);
  await mintConsumable(consumable2, PLAYER1.address, 1000);

  await consumable1.connect(PLAYER1).increaseAllowance(activity.address, 99);
  await consumable2.connect(PLAYER1).increaseAllowance(activity.address, 199);

  await mintConsumable(consumable3, activity.address, 1000);

  await expect<Promise<ContractTransaction>>(activity.connect(PLAYER1).execute([])).toBeRevertedWith(
    'Consumer: Not enough consumable to transfer',
  );

  expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable3.balanceOf(activity.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.allowance(PLAYER1.address, activity.address)).toEqBN(99);
  expect<BigNumber>(await consumable2.allowance(PLAYER1.address, activity.address)).toEqBN(199);

  expect<BigNumber>(await consumable2.allowance(activity.address, PLAYER1.address)).toEqBN(0);
  expect<BigNumber>(await consumable3.allowance(activity.address, PLAYER1.address)).toEqBN(0);

  await consumable1.connect(PLAYER1).increaseAllowance(activity.address, 1);

  await expect<Promise<ContractTransaction>>(activity.connect(PLAYER1).execute([])).toBeRevertedWith(
    'Consumer: Not enough consumable to transfer',
  );

  expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable3.balanceOf(activity.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.allowance(PLAYER1.address, activity.address)).toEqBN(100);
  expect<BigNumber>(await consumable2.allowance(PLAYER1.address, activity.address)).toEqBN(199);

  expect<BigNumber>(await consumable2.allowance(activity.address, PLAYER1.address)).toEqBN(0);
  expect<BigNumber>(await consumable3.allowance(activity.address, PLAYER1.address)).toEqBN(0);
});

it('should not send any consumables to player if not enough of any consumable to provide', async () => {
  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });
  const consumable3 = await createConsumable({ name: 'Consumable 3' });

  const activity = await createActivity(
    {},
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
    [
      { consumable: consumable2.address, amount: 300 },
      { consumable: consumable3.address, amount: 75 },
    ],
  );

  await mintConsumable(consumable1, PLAYER1.address, 1000);
  await mintConsumable(consumable2, PLAYER1.address, 1000);

  await consumable1.connect(PLAYER1).increaseAllowance(activity.address, 100);
  await consumable2.connect(PLAYER1).increaseAllowance(activity.address, 200);

  await mintConsumable(consumable2, activity.address, 299);
  await mintConsumable(consumable3, activity.address, 74);

  await expect<Promise<ContractTransaction>>(activity.connect(PLAYER1).execute([])).toBeRevertedWith(
    'Provider: Not enough consumable to provide',
  );

  expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(299);
  expect<BigNumber>(await consumable3.balanceOf(activity.address)).toEqBN(74);

  expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.allowance(PLAYER1.address, activity.address)).toEqBN(100);
  expect<BigNumber>(await consumable2.allowance(PLAYER1.address, activity.address)).toEqBN(200);

  expect<BigNumber>(await consumable2.allowance(activity.address, PLAYER1.address)).toEqBN(0);
  expect<BigNumber>(await consumable3.allowance(activity.address, PLAYER1.address)).toEqBN(0);

  await mintConsumable(consumable2, activity.address, 1);

  await expect<Promise<ContractTransaction>>(activity.connect(PLAYER1).execute([])).toBeRevertedWith(
    'Provider: Not enough consumable to provide',
  );

  expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(300);
  expect<BigNumber>(await consumable3.balanceOf(activity.address)).toEqBN(74);

  expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.allowance(PLAYER1.address, activity.address)).toEqBN(100);
  expect<BigNumber>(await consumable2.allowance(PLAYER1.address, activity.address)).toEqBN(200);

  expect<BigNumber>(await consumable2.allowance(activity.address, PLAYER1.address)).toEqBN(0);
  expect<BigNumber>(await consumable3.allowance(activity.address, PLAYER1.address)).toEqBN(0);
});

it('should not execute if disabled', async () => {
  const activity = await createActivity({}, [], []);

  await disableContract(activity);

  await expect<Promise<ContractTransaction>>(activity.connect(PLAYER1).execute([])).toBeRevertedWith(
    'Contract is disabled',
  );
});

it('should emit Executed event', async () => {
  const activity = await createActivity();

  await expect<ContractTransaction>(await activity.connect(PLAYER1).execute([])).toHaveEmittedWith(
    activity,
    'Executed',
    [PLAYER1.address],
  );
  await expect<ContractTransaction>(await activity.connect(PLAYER2).execute([])).toHaveEmittedWith(
    activity,
    'Executed',
    [PLAYER2.address],
  );
});
