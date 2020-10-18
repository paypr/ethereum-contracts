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

import { expectEvent, expectRevert } from '@openzeppelin/test-helpers';
import {
  burnConsumable,
  createConsumableExchange,
  createConvertibleConsumable,
  getAllowance,
  getBalance,
  mintConsumable,
  transferFrom,
} from '../../../helpers/ConsumableHelper';
import { createSkillConstrainedExchangingActivity } from '../../../helpers/ActivityHelper';
import { HELPER1, PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { acquireNextSkillLevel, createSkill } from '../../../helpers/SkillHelper';

it('should receive correct consumable from player', async () => {
  const exchange = await createConsumableExchange();

  const consumable1 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' }, '', 100);
  const consumable2 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' }, '', 50);

  const activity = await createSkillConstrainedExchangingActivity(
    exchange.address,
    {},
    [],
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
  );

  await mintConsumable(exchange, consumable1.address, 1000);
  await mintConsumable(exchange, consumable2.address, 1000);

  await mintConsumable(consumable1, PLAYER1, 1000);
  await mintConsumable(consumable2, PLAYER1, 1000);

  await consumable1.increaseAllowance(activity.address, 100, { from: PLAYER1 });
  await consumable2.increaseAllowance(activity.address, 200, { from: PLAYER1 });

  expect<number>(await getAllowance(consumable1, PLAYER1, activity.address)).toEqual(100);
  expect<number>(await getAllowance(consumable2, PLAYER1, activity.address)).toEqual(200);

  await activity.execute([], { from: PLAYER1 });

  expect<number>(await getBalance(consumable1, activity.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, activity.address)).toEqual(0);
  expect<number>(await getBalance(exchange, activity.address)).toEqual(5);

  expect<number>(await getBalance(exchange, consumable1.address)).toEqual(999);
  expect<number>(await getBalance(exchange, consumable2.address)).toEqual(996);

  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(900);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(800);

  expect<number>(await getAllowance(consumable1, PLAYER1, activity.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, PLAYER1, activity.address)).toEqual(0);
});

it('should send and receive correct consumables from/to player', async () => {
  const exchange = await createConsumableExchange();

  const consumable1 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' }, '', 100);
  const consumable2 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' }, '', 50);
  const consumable3 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 3' }, '', 25);

  const activity = await createSkillConstrainedExchangingActivity(
    exchange.address,
    {},
    [],
    [
      { consumable: consumable1.address, amount: 100 }, // 1
      { consumable: consumable2.address, amount: 200 }, // 4
    ],
    [
      { consumable: consumable2.address, amount: 50 }, // 1
      { consumable: consumable3.address, amount: 75 }, // 3
    ],
  );

  await mintConsumable(exchange, consumable1.address, 1000);
  await mintConsumable(exchange, consumable2.address, 1000);

  await mintConsumable(consumable1, PLAYER1, 1000);
  await mintConsumable(consumable2, PLAYER1, 1000);

  await consumable1.increaseAllowance(activity.address, 100, { from: PLAYER1 });
  await consumable2.increaseAllowance(activity.address, 200, { from: PLAYER1 });

  await activity.execute([], { from: PLAYER1 });

  expect<number>(await getBalance(consumable1, activity.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, activity.address)).toEqual(50);
  expect<number>(await getBalance(consumable3, activity.address)).toEqual(75);
  expect<number>(await getBalance(exchange, activity.address)).toEqual(1);

  expect<number>(await getBalance(exchange, consumable1.address)).toEqual(999);
  expect<number>(await getBalance(exchange, consumable2.address)).toEqual(997);
  expect<number>(await getBalance(exchange, consumable3.address)).toEqual(3);

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

  expect<number>(await getBalance(consumable1, activity.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, activity.address)).toEqual(50);
  expect<number>(await getBalance(consumable3, activity.address)).toEqual(75);
  expect<number>(await getBalance(exchange, activity.address)).toEqual(2);

  expect<number>(await getBalance(exchange, consumable1.address)).toEqual(998);
  expect<number>(await getBalance(exchange, consumable2.address)).toEqual(994);
  expect<number>(await getBalance(exchange, consumable3.address)).toEqual(6);

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

  expect<number>(await getBalance(consumable1, activity.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, activity.address)).toEqual(50);
  expect<number>(await getBalance(consumable3, activity.address)).toEqual(75);
  expect<number>(await getBalance(exchange, activity.address)).toEqual(3);

  expect<number>(await getBalance(exchange, consumable1.address)).toEqual(997);
  expect<number>(await getBalance(exchange, consumable2.address)).toEqual(991);
  expect<number>(await getBalance(exchange, consumable3.address)).toEqual(9);

  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(840);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(740);
  expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(75);

  expect<number>(await getBalance(consumable1, PLAYER2)).toEqual(860);
  expect<number>(await getBalance(consumable2, PLAYER2)).toEqual(760);
  expect<number>(await getBalance(consumable3, PLAYER2)).toEqual(75);

  expect<number>(await getAllowance(consumable1, PLAYER1, activity.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, PLAYER1, activity.address)).toEqual(0);

  expect<number>(await getAllowance(consumable1, PLAYER2, activity.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, PLAYER2, activity.address)).toEqual(0);

  expect<number>(await getAllowance(consumable2, activity.address, PLAYER1)).toEqual(50);
  expect<number>(await getAllowance(consumable3, activity.address, PLAYER1)).toEqual(75);

  expect<number>(await getAllowance(consumable2, activity.address, PLAYER2)).toEqual(0);
  expect<number>(await getAllowance(consumable3, activity.address, PLAYER2)).toEqual(0);

  await transferFrom(consumable2, activity.address, PLAYER1, 50);
  await transferFrom(consumable3, activity.address, PLAYER1, 75);
});

it('should send and receive correct consumables from/to player with asymmetric exchange rates', async () => {
  const exchange = await createConsumableExchange();

  const consumable1 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' }, '', 10, 100);
  const consumable2 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' }, '', 50);
  const consumable3 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 3' }, '', 25, 250);

  const activity = await createSkillConstrainedExchangingActivity(
    exchange.address,
    {},
    [],
    [
      { consumable: consumable1.address, amount: 100 }, // 1
      { consumable: consumable2.address, amount: 200 }, // 4
    ],
    [
      { consumable: consumable2.address, amount: 50 }, // 1
      { consumable: consumable3.address, amount: 75 }, // 3
    ],
  );

  await mintConsumable(exchange, consumable1.address, 1000);
  await mintConsumable(exchange, consumable2.address, 1000);

  await mintConsumable(consumable1, PLAYER1, 1000);
  await mintConsumable(consumable2, PLAYER1, 1000);

  await consumable1.increaseAllowance(activity.address, 100, { from: PLAYER1 });
  await consumable2.increaseAllowance(activity.address, 200, { from: PLAYER1 });

  await activity.execute([], { from: PLAYER1 });

  expect<number>(await getBalance(consumable1, activity.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, activity.address)).toEqual(50);
  expect<number>(await getBalance(consumable3, activity.address)).toEqual(75);
  expect<number>(await getBalance(exchange, activity.address)).toEqual(1);

  expect<number>(await getBalance(exchange, consumable1.address)).toEqual(999);
  expect<number>(await getBalance(exchange, consumable2.address)).toEqual(997);
  expect<number>(await getBalance(exchange, consumable3.address)).toEqual(3);

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

  expect<number>(await getBalance(consumable1, activity.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, activity.address)).toEqual(50);
  expect<number>(await getBalance(consumable3, activity.address)).toEqual(75);
  expect<number>(await getBalance(exchange, activity.address)).toEqual(2);

  expect<number>(await getBalance(exchange, consumable1.address)).toEqual(998);
  expect<number>(await getBalance(exchange, consumable2.address)).toEqual(994);
  expect<number>(await getBalance(exchange, consumable3.address)).toEqual(6);

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

  expect<number>(await getBalance(consumable1, activity.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, activity.address)).toEqual(50);
  expect<number>(await getBalance(consumable3, activity.address)).toEqual(75);
  expect<number>(await getBalance(exchange, activity.address)).toEqual(3);

  expect<number>(await getBalance(exchange, consumable1.address)).toEqual(997);
  expect<number>(await getBalance(exchange, consumable2.address)).toEqual(991);
  expect<number>(await getBalance(exchange, consumable3.address)).toEqual(9);

  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(840);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(740);
  expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(75);

  expect<number>(await getBalance(consumable1, PLAYER2)).toEqual(860);
  expect<number>(await getBalance(consumable2, PLAYER2)).toEqual(760);
  expect<number>(await getBalance(consumable3, PLAYER2)).toEqual(75);

  expect<number>(await getAllowance(consumable1, PLAYER1, activity.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, PLAYER1, activity.address)).toEqual(0);

  expect<number>(await getAllowance(consumable1, PLAYER2, activity.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, PLAYER2, activity.address)).toEqual(0);

  expect<number>(await getAllowance(consumable2, activity.address, PLAYER1)).toEqual(50);
  expect<number>(await getAllowance(consumable3, activity.address, PLAYER1)).toEqual(75);

  expect<number>(await getAllowance(consumable2, activity.address, PLAYER2)).toEqual(0);
  expect<number>(await getAllowance(consumable3, activity.address, PLAYER2)).toEqual(0);

  await transferFrom(consumable2, activity.address, PLAYER1, 50);
  await transferFrom(consumable3, activity.address, PLAYER1, 75);
});

it('should receive all consumables from player and helpers', async () => {
  const exchange = await createConsumableExchange();

  const consumable1 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' }, '', 30);
  const consumable2 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' }, '', 50);
  const consumable3 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 3' }, '', 60);

  const activity = await createSkillConstrainedExchangingActivity(
    exchange.address,
    {},
    [],
    [
      { consumable: consumable1.address, amount: 100 }, // 3
      { consumable: consumable2.address, amount: 200 }, // 4
    ],
    [
      { consumable: consumable2.address, amount: 50 }, // 1
      { consumable: consumable3.address, amount: 75 }, // 2
    ],
  );

  await mintConsumable(exchange, consumable1.address, 1000);
  await mintConsumable(exchange, consumable2.address, 1000);

  await mintConsumable(consumable1, PLAYER1, 1000);
  await mintConsumable(consumable2, PLAYER1, 1000);

  await consumable1.increaseAllowance(activity.address, 100, { from: PLAYER1 });
  await consumable2.increaseAllowance(activity.address, 200, { from: PLAYER1 });

  await mintConsumable(consumable1, HELPER1, 1000);
  await mintConsumable(consumable2, HELPER1, 1000);

  await consumable1.increaseAllowance(activity.address, 100, { from: HELPER1 });
  await consumable2.increaseAllowance(activity.address, 200, { from: HELPER1 });

  await activity.execute([HELPER1], { from: PLAYER1 });

  expect<number>(await getBalance(consumable1, activity.address)).toEqual(20);
  expect<number>(await getBalance(consumable2, activity.address)).toEqual(50);
  expect<number>(await getBalance(consumable3, activity.address)).toEqual(120);
  expect<number>(await getBalance(exchange, activity.address)).toEqual(11);

  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(900);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(800);
  expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(0);

  expect<number>(await getBalance(consumable1, HELPER1)).toEqual(900);
  expect<number>(await getBalance(consumable2, HELPER1)).toEqual(800);
  expect<number>(await getBalance(consumable3, HELPER1)).toEqual(0);

  expect<number>(await getAllowance(consumable1, PLAYER1, activity.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, PLAYER1, activity.address)).toEqual(0);

  expect<number>(await getAllowance(consumable1, PLAYER2, activity.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, PLAYER2, activity.address)).toEqual(0);

  expect<number>(await getAllowance(consumable2, activity.address, PLAYER1)).toEqual(50);
  expect<number>(await getAllowance(consumable3, activity.address, PLAYER1)).toEqual(75);

  await transferFrom(consumable2, activity.address, PLAYER1, 50);
  await transferFrom(consumable3, activity.address, PLAYER1, 75);
});

it('should not send any consumables to player if any requirements are not met', async () => {
  const exchange = await createConsumableExchange();

  const consumable1 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' });
  const consumable2 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' });
  const consumable3 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 3' });

  const activity = await createSkillConstrainedExchangingActivity(
    exchange.address,
    {},
    [],
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
    [
      { consumable: consumable2.address, amount: 50 },
      { consumable: consumable3.address, amount: 75 },
    ],
  );

  await mintConsumable(exchange, consumable1.address, 1000);
  await mintConsumable(consumable1, PLAYER1, 1000);

  await mintConsumable(exchange, consumable2.address, 1000);
  await mintConsumable(consumable2, PLAYER1, 1000);

  await consumable1.increaseAllowance(activity.address, 99, { from: PLAYER1 });
  await consumable2.increaseAllowance(activity.address, 199, { from: PLAYER1 });

  await mintConsumable(exchange, consumable3.address, 1000);
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

it('should not send any consumables to player if not enough of exchange to convert', async () => {
  const exchange = await createConsumableExchange();

  const consumable1 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' }, '', 50);
  const consumable2 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' }, '', 100);
  const consumable3 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 3' }, '', 75);

  const activity = await createSkillConstrainedExchangingActivity(
    exchange.address,
    {},
    [],
    [
      { consumable: consumable1.address, amount: 100 }, // 2
      { consumable: consumable2.address, amount: 200 }, // 2
    ],
    [
      { consumable: consumable2.address, amount: 300 }, // 3
      { consumable: consumable3.address, amount: 75 }, // 1
    ],
  );

  await mintConsumable(exchange, consumable1.address, 20);
  await mintConsumable(consumable1, PLAYER1, 1000);

  await mintConsumable(exchange, consumable2.address, 10);
  await mintConsumable(consumable2, PLAYER1, 1000);

  await consumable1.increaseAllowance(activity.address, 100, { from: PLAYER1 });
  await consumable2.increaseAllowance(activity.address, 200, { from: PLAYER1 });

  await burnConsumable(exchange, consumable1.address, 19);
  await burnConsumable(exchange, consumable2.address, 9);

  await expectRevert(activity.execute([], { from: PLAYER1 }), 'transfer amount exceeds balance');

  expect<number>(await getBalance(consumable1, activity.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, activity.address)).toEqual(0);
  expect<number>(await getBalance(consumable3, activity.address)).toEqual(0);
  expect<number>(await getBalance(exchange, activity.address)).toEqual(0);

  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(0);

  expect<number>(await getAllowance(consumable1, PLAYER1, activity.address)).toEqual(100);
  expect<number>(await getAllowance(consumable2, PLAYER1, activity.address)).toEqual(200);

  expect<number>(await getAllowance(consumable2, activity.address, PLAYER1)).toEqual(0);
  expect<number>(await getAllowance(consumable3, activity.address, PLAYER1)).toEqual(0);

  await mintConsumable(exchange, consumable1.address, 1);

  await expectRevert(activity.execute([], { from: PLAYER1 }), 'not enough left to cover exchange');

  expect<number>(await getBalance(consumable1, activity.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, activity.address)).toEqual(0);
  expect<number>(await getBalance(consumable3, activity.address)).toEqual(0);
  expect<number>(await getBalance(exchange, activity.address)).toEqual(0);

  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(0);

  expect<number>(await getAllowance(consumable1, PLAYER1, activity.address)).toEqual(100);
  expect<number>(await getAllowance(consumable2, PLAYER1, activity.address)).toEqual(200);

  expect<number>(await getAllowance(consumable2, activity.address, PLAYER1)).toEqual(0);
  expect<number>(await getAllowance(consumable3, activity.address, PLAYER1)).toEqual(0);
});

it('should not send any consumables to player if the player does not have the required skills', async () => {
  const exchange = await createConsumableExchange();

  const skill1 = await createSkill({ name: 'Skill 1' });
  const skill2 = await createSkill({ name: 'Skill 2' });

  const consumable1 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' }, '', 50);
  const consumable2 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' }, '', 100);
  const consumable3 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 3' }, '', 75);

  const activity = await createSkillConstrainedExchangingActivity(
    exchange.address,
    {},
    [
      { skill: skill1.address, level: 1 },
      { skill: skill2.address, level: 2 },
    ],
    [
      { consumable: consumable1.address, amount: 100 }, // 2
      { consumable: consumable2.address, amount: 200 }, // 2
    ],
    [
      { consumable: consumable2.address, amount: 300 }, // 3
      { consumable: consumable3.address, amount: 75 }, // 1
    ],
  );

  await mintConsumable(exchange, consumable1.address, 1000);
  await mintConsumable(consumable1, PLAYER1, 1000);

  await mintConsumable(exchange, consumable2.address, 1000);
  await mintConsumable(consumable2, PLAYER1, 1000);

  await consumable1.increaseAllowance(activity.address, 100, { from: PLAYER1 });
  await consumable2.increaseAllowance(activity.address, 200, { from: PLAYER1 });

  await expectRevert(activity.execute([], { from: PLAYER1 }), 'missing required skill');

  expect<number>(await getBalance(consumable1, activity.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, activity.address)).toEqual(0);
  expect<number>(await getBalance(consumable3, activity.address)).toEqual(0);
  expect<number>(await getBalance(exchange, activity.address)).toEqual(0);

  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(0);

  expect<number>(await getAllowance(consumable1, PLAYER1, activity.address)).toEqual(100);
  expect<number>(await getAllowance(consumable2, PLAYER1, activity.address)).toEqual(200);

  expect<number>(await getAllowance(consumable2, activity.address, PLAYER1)).toEqual(0);
  expect<number>(await getAllowance(consumable3, activity.address, PLAYER1)).toEqual(0);

  await acquireNextSkillLevel(skill1, PLAYER1);

  await expectRevert(activity.execute([], { from: PLAYER1 }), 'missing required skill');

  expect<number>(await getBalance(consumable1, activity.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, activity.address)).toEqual(0);
  expect<number>(await getBalance(consumable3, activity.address)).toEqual(0);
  expect<number>(await getBalance(exchange, activity.address)).toEqual(0);

  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(0);

  expect<number>(await getAllowance(consumable1, PLAYER1, activity.address)).toEqual(100);
  expect<number>(await getAllowance(consumable2, PLAYER1, activity.address)).toEqual(200);

  expect<number>(await getAllowance(consumable2, activity.address, PLAYER1)).toEqual(0);
  expect<number>(await getAllowance(consumable3, activity.address, PLAYER1)).toEqual(0);

  await acquireNextSkillLevel(skill2, PLAYER1);

  await expectRevert(activity.execute([], { from: PLAYER1 }), 'missing required skill');

  expect<number>(await getBalance(consumable1, activity.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, activity.address)).toEqual(0);
  expect<number>(await getBalance(consumable3, activity.address)).toEqual(0);
  expect<number>(await getBalance(exchange, activity.address)).toEqual(0);

  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(0);

  expect<number>(await getAllowance(consumable1, PLAYER1, activity.address)).toEqual(100);
  expect<number>(await getAllowance(consumable2, PLAYER1, activity.address)).toEqual(200);

  expect<number>(await getAllowance(consumable2, activity.address, PLAYER1)).toEqual(0);
  expect<number>(await getAllowance(consumable3, activity.address, PLAYER1)).toEqual(0);

  await acquireNextSkillLevel(skill1, PLAYER1);

  await expectRevert(activity.execute([], { from: PLAYER1 }), 'missing required skill');

  expect<number>(await getBalance(consumable1, activity.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, activity.address)).toEqual(0);
  expect<number>(await getBalance(consumable3, activity.address)).toEqual(0);
  expect<number>(await getBalance(exchange, activity.address)).toEqual(0);

  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(0);

  expect<number>(await getAllowance(consumable1, PLAYER1, activity.address)).toEqual(100);
  expect<number>(await getAllowance(consumable2, PLAYER1, activity.address)).toEqual(200);

  expect<number>(await getAllowance(consumable2, activity.address, PLAYER1)).toEqual(0);
  expect<number>(await getAllowance(consumable3, activity.address, PLAYER1)).toEqual(0);
});

it('should emit Executed event', async () => {
  const exchange = await createConsumableExchange();

  const activity = await createSkillConstrainedExchangingActivity(exchange.address);

  expectEvent(await activity.execute([], { from: PLAYER1 }), 'Executed', { player: PLAYER1 });
  expectEvent(await activity.execute([], { from: PLAYER2 }), 'Executed', { player: PLAYER2 });
});
