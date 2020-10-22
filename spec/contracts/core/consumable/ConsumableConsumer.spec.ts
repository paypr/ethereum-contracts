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

import { expectRevert } from '@openzeppelin/test-helpers';
import { ConsumableAmount } from '../../../../src/contracts/core/consumables';
import {
  ConsumableConsumerContract,
  createConsumable,
  createConsumableConsumer,
  getAllowance,
  getBalance,
} from '../../../helpers/ConsumableHelper';
import { toNumberAsync } from '../../../helpers/ContractHelper';
import { CONSUMABLE_MINTER, INITIALIZER, PLAYER1, PLAYER2, PLAYER3 } from '../../../helpers/Accounts';
import { createBaseContract } from '../../../helpers/BaseContractHelper';

describe('initializeConsumableConsumer', () => {
  it('should revert if called with non-consumables', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const genericConcept = await createBaseContract({ name: 'Generic Concept' });

    const consumer = await ConsumableConsumerContract.new();

    await expectRevert(
      consumer.initializeConsumableConsumer(
        [
          { consumable: consumable1.address, amount: 50 },
          { consumable: PLAYER1, amount: 100 },
          { consumable: consumable2.address, amount: 200 },
        ],
        {
          from: INITIALIZER,
        },
      ),
      'revert',
    );

    await expectRevert(
      consumer.initializeConsumableConsumer(
        [
          { consumable: consumable1.address, amount: 50 },
          { consumable: genericConcept.address, amount: 100 },
          { consumable: consumable2.address, amount: 200 },
        ],
        {
          from: INITIALIZER,
        },
      ),
      'Consumer: Consumable must support interface',
    );
  });
});

describe('consumablesRequired', () => {
  it('should return empty when no consumables required', async () => {
    const consumer = await createConsumableConsumer();

    expect<ConsumableAmount[]>(await consumer.consumablesRequired()).toEqual([]);
  });

  it('should return the consumables required', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });

    const consumer = await createConsumableConsumer([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ]);

    expect<ConsumableAmount[]>(await consumer.consumablesRequired()).toEqual([
      consumable1.address,
      consumable2.address,
    ]);
  });
});

describe('isRequired', () => {
  it('should return false when there are no consumables consumed', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });

    const consumer = await createConsumableConsumer();

    expect<boolean>(await consumer.isRequired(consumable1.address)).toBe(false);
    expect<boolean>(await consumer.isRequired(consumable2.address)).toBe(false);
  });

  it('should return false when the given consumable is not consumed', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const consumable3 = await createConsumable({ name: 'Consumable 3' });

    const consumer = await createConsumableConsumer([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ]);

    const result = await consumer.isRequired(consumable3.address);
    expect<boolean>(result).toBe(false);
  });

  it('should return true when the given consumable is consumed', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });

    const consumer = await createConsumableConsumer([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ]);

    const result1 = await consumer.isRequired(consumable1.address);
    expect<boolean>(result1).toBe(true);

    const result2 = await consumer.isRequired(consumable2.address);
    expect<boolean>(result2).toBe(true);
  });
});

describe('amountRequired', () => {
  it('should return 0 when there are no consumables consumed', async () => {
    const consumable = await createConsumable({ name: 'Consumable' });

    const consumer = await createConsumableConsumer();

    const result = await toNumberAsync(consumer.amountRequired(consumable.address));
    expect<number>(result).toEqual(0);
  });

  it('should return 0 when the given consumable is not consumed', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const consumable3 = await createConsumable({ name: 'Consumable 3' });

    const consumer = await createConsumableConsumer([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ]);

    const result = await toNumberAsync(consumer.amountRequired(consumable3.address));
    expect<number>(result).toEqual(0);
  });

  it('should return the amount when the given consumable is consumed', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const consumable3 = await createConsumable({ name: 'Consumable 3' });

    const consumer = await createConsumableConsumer([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
      { consumable: consumable3.address, amount: 300 },
    ]);

    const result1 = await toNumberAsync(consumer.amountRequired(consumable1.address));
    expect<number>(result1).toEqual(100);

    const result2 = await toNumberAsync(consumer.amountRequired(consumable2.address));
    expect<number>(result2).toEqual(200);
  });
});

describe('consumeConsumables', () => {
  it('should transfer the right amount consumables from the providers', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const consumable3 = await createConsumable({ name: 'Consumable 3' });

    const consumer = await createConsumableConsumer([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
      { consumable: consumable3.address, amount: 300 },
    ]);

    await consumable1.mint(PLAYER1, 1000, { from: CONSUMABLE_MINTER });
    await consumable2.mint(PLAYER1, 1000, { from: CONSUMABLE_MINTER });
    await consumable3.mint(PLAYER1, 1000, { from: CONSUMABLE_MINTER });

    await consumable1.increaseAllowance(consumer.address, 100, { from: PLAYER1 });
    await consumable2.increaseAllowance(consumer.address, 200, { from: PLAYER1 });
    await consumable3.increaseAllowance(consumer.address, 300, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
    expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(1000);

    await consumer.consumeConsumables([PLAYER1]);

    expect<number>(await getBalance(consumable1, consumer.address)).toEqual(100);
    expect<number>(await getBalance(consumable2, consumer.address)).toEqual(200);
    expect<number>(await getBalance(consumable3, consumer.address)).toEqual(300);

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(900);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(800);
    expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(700);

    expect<number>(await getAllowance(consumable1, PLAYER1, consumer.address)).toEqual(0);
    expect<number>(await getAllowance(consumable2, PLAYER1, consumer.address)).toEqual(0);
    expect<number>(await getAllowance(consumable3, PLAYER1, consumer.address)).toEqual(0);

    await consumable1.mint(PLAYER2, 1000, { from: CONSUMABLE_MINTER });
    await consumable2.mint(PLAYER2, 1000, { from: CONSUMABLE_MINTER });
    await consumable3.mint(PLAYER2, 1000, { from: CONSUMABLE_MINTER });

    await consumable1.increaseAllowance(consumer.address, 100, { from: PLAYER2 });
    await consumable2.increaseAllowance(consumer.address, 200, { from: PLAYER2 });
    await consumable3.increaseAllowance(consumer.address, 300, { from: PLAYER2 });

    await consumer.consumeConsumables([PLAYER2]);

    expect<number>(await getBalance(consumable1, consumer.address)).toEqual(200);
    expect<number>(await getBalance(consumable2, consumer.address)).toEqual(400);
    expect<number>(await getBalance(consumable3, consumer.address)).toEqual(600);

    expect<number>(await getBalance(consumable1, PLAYER2)).toEqual(900);
    expect<number>(await getBalance(consumable2, PLAYER2)).toEqual(800);
    expect<number>(await getBalance(consumable3, PLAYER2)).toEqual(700);

    await consumable1.increaseAllowance(consumer.address, 100, { from: PLAYER1 });
    await consumable2.increaseAllowance(consumer.address, 200, { from: PLAYER1 });
    await consumable3.increaseAllowance(consumer.address, 300, { from: PLAYER1 });

    await consumer.consumeConsumables([PLAYER1]);

    expect<number>(await getBalance(consumable1, consumer.address)).toEqual(300);
    expect<number>(await getBalance(consumable2, consumer.address)).toEqual(600);
    expect<number>(await getBalance(consumable3, consumer.address)).toEqual(900);

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(800);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(600);
    expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(400);

    await consumable1.increaseAllowance(consumer.address, 50, { from: PLAYER1 });
    await consumable2.increaseAllowance(consumer.address, 100, { from: PLAYER1 });
    await consumable3.increaseAllowance(consumer.address, 100, { from: PLAYER1 });

    await consumable1.increaseAllowance(consumer.address, 50, { from: PLAYER2 });
    await consumable2.increaseAllowance(consumer.address, 100, { from: PLAYER2 });
    await consumable3.increaseAllowance(consumer.address, 100, { from: PLAYER2 });

    await consumable3.mint(PLAYER3, 1000, { from: CONSUMABLE_MINTER });

    await consumable3.increaseAllowance(consumer.address, 100, { from: PLAYER3 });

    await consumer.consumeConsumables([PLAYER1, PLAYER2, PLAYER3]);

    expect<number>(await getBalance(consumable1, consumer.address)).toEqual(400);
    expect<number>(await getBalance(consumable2, consumer.address)).toEqual(800);
    expect<number>(await getBalance(consumable3, consumer.address)).toEqual(1200);

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(750);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(500);
    expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(300);

    expect<number>(await getBalance(consumable1, PLAYER2)).toEqual(850);
    expect<number>(await getBalance(consumable2, PLAYER2)).toEqual(700);
    expect<number>(await getBalance(consumable3, PLAYER2)).toEqual(600);

    expect<number>(await getBalance(consumable3, PLAYER3)).toEqual(900);
  });

  it('should transfer as much as the providers are willing to give', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const consumable3 = await createConsumable({ name: 'Consumable 3' });

    const consumer = await createConsumableConsumer([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
      { consumable: consumable3.address, amount: 300 },
    ]);

    await consumable1.mint(PLAYER1, 1000, { from: CONSUMABLE_MINTER });
    await consumable2.mint(PLAYER1, 1000, { from: CONSUMABLE_MINTER });
    await consumable3.mint(PLAYER1, 1000, { from: CONSUMABLE_MINTER });

    await consumable1.mint(PLAYER2, 1000, { from: CONSUMABLE_MINTER });
    await consumable2.mint(PLAYER2, 1000, { from: CONSUMABLE_MINTER });
    await consumable3.mint(PLAYER2, 1000, { from: CONSUMABLE_MINTER });

    await consumable1.increaseAllowance(consumer.address, 500, { from: PLAYER1 });
    await consumable2.increaseAllowance(consumer.address, 500, { from: PLAYER1 });
    await consumable3.increaseAllowance(consumer.address, 500, { from: PLAYER1 });

    await consumable1.increaseAllowance(consumer.address, 500, { from: PLAYER2 });
    await consumable2.increaseAllowance(consumer.address, 500, { from: PLAYER2 });
    await consumable3.increaseAllowance(consumer.address, 500, { from: PLAYER2 });

    await consumer.consumeConsumables([PLAYER1, PLAYER2]);

    expect<number>(await getBalance(consumable1, consumer.address)).toEqual(1000);
    expect<number>(await getBalance(consumable2, consumer.address)).toEqual(1000);
    expect<number>(await getBalance(consumable3, consumer.address)).toEqual(1000);

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(500);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(500);
    expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(500);

    expect<number>(await getAllowance(consumable1, PLAYER1, consumer.address)).toEqual(0);
    expect<number>(await getAllowance(consumable2, PLAYER1, consumer.address)).toEqual(0);
    expect<number>(await getAllowance(consumable3, PLAYER1, consumer.address)).toEqual(0);

    expect<number>(await getBalance(consumable1, PLAYER2)).toEqual(500);
    expect<number>(await getBalance(consumable2, PLAYER2)).toEqual(500);
    expect<number>(await getBalance(consumable3, PLAYER2)).toEqual(500);

    expect<number>(await getAllowance(consumable1, PLAYER2, consumer.address)).toEqual(0);
    expect<number>(await getAllowance(consumable2, PLAYER2, consumer.address)).toEqual(0);
    expect<number>(await getAllowance(consumable3, PLAYER2, consumer.address)).toEqual(0);
  });

  it('should not transfer consumables to the receiver when there is not enough of all', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const consumable3 = await createConsumable({ name: 'Consumable 3' });

    const consumer = await createConsumableConsumer([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
      { consumable: consumable3.address, amount: 300 },
    ]);

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(0);

    await expectRevert(consumer.consumeConsumables([PLAYER1]), 'Consumer: Not enough consumable to transfer');

    expect<number>(await getBalance(consumable1, consumer.address)).toEqual(0);
    expect<number>(await getBalance(consumable2, consumer.address)).toEqual(0);
    expect<number>(await getBalance(consumable3, consumer.address)).toEqual(0);

    await consumable1.mint(PLAYER1, 1000, { from: CONSUMABLE_MINTER });
    await consumable2.mint(PLAYER1, 1000, { from: CONSUMABLE_MINTER });
    await consumable3.mint(PLAYER1, 1000, { from: CONSUMABLE_MINTER });

    await consumable1.mint(PLAYER2, 1000, { from: CONSUMABLE_MINTER });
    await consumable2.mint(PLAYER2, 1000, { from: CONSUMABLE_MINTER });
    await consumable3.mint(PLAYER2, 1000, { from: CONSUMABLE_MINTER });

    await expectRevert(consumer.consumeConsumables([PLAYER1]), 'Consumer: Not enough consumable to transfer');

    expect<number>(await getBalance(consumable1, consumer.address)).toEqual(0);
    expect<number>(await getBalance(consumable2, consumer.address)).toEqual(0);
    expect<number>(await getBalance(consumable3, consumer.address)).toEqual(0);

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
    expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(1000);

    await consumable1.increaseAllowance(consumer.address, 99, { from: PLAYER1 });
    await consumable2.increaseAllowance(consumer.address, 200, { from: PLAYER1 });
    await consumable3.increaseAllowance(consumer.address, 299, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
    expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(1000);

    expect<number>(await getAllowance(consumable1, PLAYER1, consumer.address)).toEqual(99);
    expect<number>(await getAllowance(consumable2, PLAYER1, consumer.address)).toEqual(200);
    expect<number>(await getAllowance(consumable3, PLAYER1, consumer.address)).toEqual(299);

    await expectRevert(consumer.consumeConsumables([PLAYER1]), 'Consumer: Not enough consumable to transfer');

    expect<number>(await getBalance(consumable1, consumer.address)).toEqual(0);
    expect<number>(await getBalance(consumable2, consumer.address)).toEqual(0);
    expect<number>(await getBalance(consumable3, consumer.address)).toEqual(0);

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
    expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(1000);

    expect<number>(await getAllowance(consumable1, PLAYER1, consumer.address)).toEqual(99);
    expect<number>(await getAllowance(consumable2, PLAYER1, consumer.address)).toEqual(200);
    expect<number>(await getAllowance(consumable3, PLAYER1, consumer.address)).toEqual(299);

    await consumable1.increaseAllowance(consumer.address, 1, { from: PLAYER2 });

    await expectRevert(consumer.consumeConsumables([PLAYER1, PLAYER2]), 'Consumer: Not enough consumable to transfer');

    expect<number>(await getBalance(consumable1, consumer.address)).toEqual(0);
    expect<number>(await getBalance(consumable2, consumer.address)).toEqual(0);
    expect<number>(await getBalance(consumable3, consumer.address)).toEqual(0);

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
    expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(1000);

    expect<number>(await getBalance(consumable1, PLAYER2)).toEqual(1000);
    expect<number>(await getBalance(consumable2, PLAYER2)).toEqual(1000);
    expect<number>(await getBalance(consumable3, PLAYER2)).toEqual(1000);

    expect<number>(await getAllowance(consumable1, PLAYER1, consumer.address)).toEqual(99);
    expect<number>(await getAllowance(consumable2, PLAYER1, consumer.address)).toEqual(200);
    expect<number>(await getAllowance(consumable3, PLAYER1, consumer.address)).toEqual(299);

    expect<number>(await getAllowance(consumable1, PLAYER2, consumer.address)).toEqual(1);

    await consumable1.increaseAllowance(consumer.address, 1, { from: PLAYER1 });

    expect<number>(await getAllowance(consumable1, PLAYER1, consumer.address)).toEqual(100);
    expect<number>(await getAllowance(consumable2, PLAYER1, consumer.address)).toEqual(200);
    expect<number>(await getAllowance(consumable3, PLAYER1, consumer.address)).toEqual(299);

    await expectRevert(consumer.consumeConsumables([PLAYER1]), 'Consumer: Not enough consumable to transfer');

    expect<number>(await getBalance(consumable1, consumer.address)).toEqual(0);
    expect<number>(await getBalance(consumable2, consumer.address)).toEqual(0);
    expect<number>(await getBalance(consumable3, consumer.address)).toEqual(0);

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
    expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(1000);

    expect<number>(await getAllowance(consumable1, PLAYER1, consumer.address)).toEqual(100);
    expect<number>(await getAllowance(consumable2, PLAYER1, consumer.address)).toEqual(200);
    expect<number>(await getAllowance(consumable3, PLAYER1, consumer.address)).toEqual(299);
  });
});
