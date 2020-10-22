/*
 * Copyright (c) 2020 The Paypr Company, LLC
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

import { expectEvent, expectRevert } from '@openzeppelin/test-helpers';
import {
  createConsumable,
  getAllowance,
  getBalance,
  mintConsumable,
  transferFrom,
} from '../../../helpers/ConsumableHelper';
import { createActivity } from '../../../helpers/ActivityHelper';
import { PLAYER1, PLAYER2, HELPER1 } from '../../../helpers/Accounts';
import { disableContract } from '../../../helpers/DisableableHelper';

it('should receive correct consumable from player', async () => {
  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });

  const activity = await createActivity({}, [
    { consumable: consumable1.address, amount: 100 },
    { consumable: consumable2.address, amount: 200 },
  ]);

  await mintConsumable(consumable1, PLAYER1, 1000);
  await mintConsumable(consumable2, PLAYER1, 1000);

  await consumable1.increaseAllowance(activity.address, 100, { from: PLAYER1 });
  await consumable2.increaseAllowance(activity.address, 200, { from: PLAYER1 });

  expect<number>(await getAllowance(consumable1, PLAYER1, activity.address)).toEqual(100);
  expect<number>(await getAllowance(consumable2, PLAYER1, activity.address)).toEqual(200);

  await activity.execute([], { from: PLAYER1 });

  expect<number>(await getBalance(consumable1, activity.address)).toEqual(100);
  expect<number>(await getBalance(consumable2, activity.address)).toEqual(200);

  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(900);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(800);

  expect<number>(await getAllowance(consumable1, PLAYER1, activity.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, PLAYER1, activity.address)).toEqual(0);
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

  await activity.execute([], { from: PLAYER1 });

  expect<number>(await getAllowance(consumable1, activity.address, PLAYER1)).toEqual(100);
  expect<number>(await getAllowance(consumable2, activity.address, PLAYER1)).toEqual(200);
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

  await mintConsumable(consumable1, PLAYER1, 1000);
  await mintConsumable(consumable2, PLAYER1, 1000);

  await consumable1.increaseAllowance(activity.address, 100, { from: PLAYER1 });
  await consumable2.increaseAllowance(activity.address, 200, { from: PLAYER1 });

  await mintConsumable(consumable3, activity.address, 1000);

  await activity.execute([], { from: PLAYER1 });

  expect<number>(await getBalance(consumable1, activity.address)).toEqual(100);
  expect<number>(await getBalance(consumable2, activity.address)).toEqual(200);
  expect<number>(await getBalance(consumable3, activity.address)).toEqual(1000);

  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(900);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(800);
  expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(0);

  expect<number>(await getAllowance(consumable1, PLAYER1, activity.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, PLAYER1, activity.address)).toEqual(0);

  expect<number>(await getAllowance(consumable2, activity.address, PLAYER1)).toEqual(50);
  expect<number>(await getAllowance(consumable3, activity.address, PLAYER1)).toEqual(75);

  await transferFrom(consumable2, activity.address, PLAYER1, 50);
  await transferFrom(consumable3, activity.address, PLAYER1, 75);

  await mintConsumable(consumable1, PLAYER2, 1000);
  await mintConsumable(consumable2, PLAYER2, 1000);

  await consumable1.increaseAllowance(activity.address, 100, { from: PLAYER2 });
  await consumable2.increaseAllowance(activity.address, 200, { from: PLAYER2 });

  await activity.execute([], { from: PLAYER2 });

  expect<number>(await getBalance(consumable1, activity.address)).toEqual(200);
  expect<number>(await getBalance(consumable2, activity.address)).toEqual(350);
  expect<number>(await getBalance(consumable3, activity.address)).toEqual(925);

  expect<number>(await getBalance(consumable1, PLAYER2)).toEqual(900);
  expect<number>(await getBalance(consumable2, PLAYER2)).toEqual(800);
  expect<number>(await getBalance(consumable3, PLAYER2)).toEqual(0);

  expect<number>(await getAllowance(consumable1, PLAYER2, activity.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, PLAYER2, activity.address)).toEqual(0);

  expect<number>(await getAllowance(consumable2, activity.address, PLAYER2)).toEqual(50);
  expect<number>(await getAllowance(consumable3, activity.address, PLAYER2)).toEqual(75);

  await transferFrom(consumable2, activity.address, PLAYER2, 50);
  await transferFrom(consumable3, activity.address, PLAYER2, 75);

  await consumable1.increaseAllowance(activity.address, 60, { from: PLAYER1 });
  await consumable2.increaseAllowance(activity.address, 110, { from: PLAYER1 });

  await consumable1.increaseAllowance(activity.address, 40, { from: PLAYER2 });
  await consumable2.increaseAllowance(activity.address, 90, { from: PLAYER2 });

  await activity.execute([PLAYER2], { from: PLAYER1 });

  expect<number>(await getBalance(consumable1, activity.address)).toEqual(300);
  expect<number>(await getBalance(consumable2, activity.address)).toEqual(500);

  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(840);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(740);

  expect<number>(await getBalance(consumable1, PLAYER2)).toEqual(860);
  expect<number>(await getBalance(consumable2, PLAYER2)).toEqual(760);

  expect<number>(await getAllowance(consumable2, activity.address, PLAYER1)).toEqual(50);
  expect<number>(await getAllowance(consumable3, activity.address, PLAYER1)).toEqual(75);

  await transferFrom(consumable2, activity.address, PLAYER1, 50);
  await transferFrom(consumable3, activity.address, PLAYER1, 75);
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

  await mintConsumable(consumable1, PLAYER1, 1000);
  await mintConsumable(consumable2, PLAYER1, 1000);

  await consumable1.increaseAllowance(activity.address, 100, { from: PLAYER1 });
  await consumable2.increaseAllowance(activity.address, 200, { from: PLAYER1 });

  await mintConsumable(consumable1, HELPER1, 1000);
  await mintConsumable(consumable2, HELPER1, 1000);

  await consumable1.increaseAllowance(activity.address, 100, { from: HELPER1 });
  await consumable2.increaseAllowance(activity.address, 200, { from: HELPER1 });

  await mintConsumable(consumable3, activity.address, 1000);

  await activity.execute([HELPER1], { from: PLAYER1 });

  expect<number>(await getBalance(consumable1, activity.address)).toEqual(200);
  expect<number>(await getBalance(consumable2, activity.address)).toEqual(400);

  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(900);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(800);

  expect<number>(await getBalance(consumable1, HELPER1)).toEqual(900);
  expect<number>(await getBalance(consumable2, HELPER1)).toEqual(800);

  expect<number>(await getAllowance(consumable1, PLAYER1, activity.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, PLAYER1, activity.address)).toEqual(0);

  expect<number>(await getAllowance(consumable1, PLAYER2, activity.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, PLAYER2, activity.address)).toEqual(0);

  expect<number>(await getAllowance(consumable2, activity.address, PLAYER1)).toEqual(50);
  expect<number>(await getAllowance(consumable3, activity.address, PLAYER1)).toEqual(75);
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

  await mintConsumable(consumable1, PLAYER1, 1000);
  await mintConsumable(consumable2, PLAYER1, 1000);

  await consumable1.increaseAllowance(activity.address, 99, { from: PLAYER1 });
  await consumable2.increaseAllowance(activity.address, 199, { from: PLAYER1 });

  await mintConsumable(consumable3, activity.address, 1000);

  await expectRevert(activity.execute([], { from: PLAYER1 }), 'Consumer: Not enough consumable to transfer');

  expect<number>(await getBalance(consumable1, activity.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, activity.address)).toEqual(0);
  expect<number>(await getBalance(consumable3, activity.address)).toEqual(1000);

  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(0);

  expect<number>(await getAllowance(consumable1, PLAYER1, activity.address)).toEqual(99);
  expect<number>(await getAllowance(consumable2, PLAYER1, activity.address)).toEqual(199);

  expect<number>(await getAllowance(consumable2, activity.address, PLAYER1)).toEqual(0);
  expect<number>(await getAllowance(consumable3, activity.address, PLAYER1)).toEqual(0);

  await consumable1.increaseAllowance(activity.address, 1, { from: PLAYER1 });

  await expectRevert(activity.execute([], { from: PLAYER1 }), 'Consumer: Not enough consumable to transfer');

  expect<number>(await getBalance(consumable1, activity.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, activity.address)).toEqual(0);
  expect<number>(await getBalance(consumable3, activity.address)).toEqual(1000);

  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(0);

  expect<number>(await getAllowance(consumable1, PLAYER1, activity.address)).toEqual(100);
  expect<number>(await getAllowance(consumable2, PLAYER1, activity.address)).toEqual(199);

  expect<number>(await getAllowance(consumable2, activity.address, PLAYER1)).toEqual(0);
  expect<number>(await getAllowance(consumable3, activity.address, PLAYER1)).toEqual(0);
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

  await mintConsumable(consumable1, PLAYER1, 1000);
  await mintConsumable(consumable2, PLAYER1, 1000);

  await consumable1.increaseAllowance(activity.address, 100, { from: PLAYER1 });
  await consumable2.increaseAllowance(activity.address, 200, { from: PLAYER1 });

  await mintConsumable(consumable2, activity.address, 299);
  await mintConsumable(consumable3, activity.address, 74);

  await expectRevert(activity.execute([], { from: PLAYER1 }), 'Provider: Not enough consumable to provide');

  expect<number>(await getBalance(consumable1, activity.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, activity.address)).toEqual(299);
  expect<number>(await getBalance(consumable3, activity.address)).toEqual(74);

  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(0);

  expect<number>(await getAllowance(consumable1, PLAYER1, activity.address)).toEqual(100);
  expect<number>(await getAllowance(consumable2, PLAYER1, activity.address)).toEqual(200);

  expect<number>(await getAllowance(consumable2, activity.address, PLAYER1)).toEqual(0);
  expect<number>(await getAllowance(consumable3, activity.address, PLAYER1)).toEqual(0);

  await mintConsumable(consumable2, activity.address, 1);

  await expectRevert(activity.execute([], { from: PLAYER1 }), 'Provider: Not enough consumable to provide');

  expect<number>(await getBalance(consumable1, activity.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, activity.address)).toEqual(300);
  expect<number>(await getBalance(consumable3, activity.address)).toEqual(74);

  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(0);

  expect<number>(await getAllowance(consumable1, PLAYER1, activity.address)).toEqual(100);
  expect<number>(await getAllowance(consumable2, PLAYER1, activity.address)).toEqual(200);

  expect<number>(await getAllowance(consumable2, activity.address, PLAYER1)).toEqual(0);
  expect<number>(await getAllowance(consumable3, activity.address, PLAYER1)).toEqual(0);
});

it('should not execute if disabled', async () => {
  const activity = await createActivity({}, [], []);

  await disableContract(activity);

  await expectRevert(activity.execute([], { from: PLAYER1 }), 'Contract is disabled');
});

it('should emit Executed event', async () => {
  const activity = await createActivity();

  expectEvent(await activity.execute([], { from: PLAYER1 }), 'Executed', { player: PLAYER1 });
  expectEvent(await activity.execute([], { from: PLAYER2 }), 'Executed', { player: PLAYER2 });
});
