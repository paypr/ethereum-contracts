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
import { INITIALIZER, PLAYER1, PLAYER2, PLAYER3 } from '../../../helpers/Accounts';
import { createBaseContract } from '../../../helpers/BaseContractHelper';
import {
  createConsumable,
  createConsumableConsumer,
  deployConsumableConsumerContract,
  mintConsumable,
} from '../../../helpers/ConsumableHelper';

describe('initializeConsumableConsumer', () => {
  it('should revert if called with non-consumables', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const genericConcept = await createBaseContract({ name: 'Generic Concept' });

    const consumer = await deployConsumableConsumerContract();

    await expect<Promise<ContractTransaction>>(
      consumer.connect(INITIALIZER).initializeConsumableConsumer([
        { consumable: consumable1.address, amount: 50 },
        { consumable: PLAYER1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ]),
    ).toBeRevertedWith('revert');

    await expect<Promise<ContractTransaction>>(
      consumer.connect(INITIALIZER).initializeConsumableConsumer([
        { consumable: consumable1.address, amount: 50 },
        { consumable: genericConcept.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ]),
    ).toBeRevertedWith('Consumer: Consumable must support interface');
  });
});

describe('consumablesRequired', () => {
  it('should return empty when no consumables required', async () => {
    const consumer = await createConsumableConsumer();

    expect<string[]>(await consumer.consumablesRequired()).toEqual([]);
  });

  it('should return the consumables required', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });

    const consumer = await createConsumableConsumer([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ]);

    expect<string[]>(await consumer.consumablesRequired()).toEqual([consumable1.address, consumable2.address]);
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

    const result = await consumer.amountRequired(consumable.address);
    expect<BigNumber>(result).toEqBN(0);
  });

  it('should return 0 when the given consumable is not consumed', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const consumable3 = await createConsumable({ name: 'Consumable 3' });

    const consumer = await createConsumableConsumer([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ]);

    const result = await consumer.amountRequired(consumable3.address);
    expect<BigNumber>(result).toEqBN(0);
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

    const result1 = await consumer.amountRequired(consumable1.address);
    expect<BigNumber>(result1).toEqBN(100);

    const result2 = await consumer.amountRequired(consumable2.address);
    expect<BigNumber>(result2).toEqBN(200);
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

    await mintConsumable(consumable1, PLAYER1.address, 1000);
    await mintConsumable(consumable2, PLAYER1.address, 1000);
    await mintConsumable(consumable3, PLAYER1.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(consumer.address, 100);
    await consumable2.connect(PLAYER1).increaseAllowance(consumer.address, 200);
    await consumable3.connect(PLAYER1).increaseAllowance(consumer.address, 300);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(1000);

    await consumer.consumeConsumables([PLAYER1.address]);

    expect<BigNumber>(await consumable1.balanceOf(consumer.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.balanceOf(consumer.address)).toEqBN(200);
    expect<BigNumber>(await consumable3.balanceOf(consumer.address)).toEqBN(300);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(800);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(700);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, consumer.address)).toEqBN(0);

    await mintConsumable(consumable1, PLAYER2.address, 1000);
    await mintConsumable(consumable2, PLAYER2.address, 1000);
    await mintConsumable(consumable3, PLAYER2.address, 1000);

    await consumable1.connect(PLAYER2).increaseAllowance(consumer.address, 100);
    await consumable2.connect(PLAYER2).increaseAllowance(consumer.address, 200);
    await consumable3.connect(PLAYER2).increaseAllowance(consumer.address, 300);

    await consumer.consumeConsumables([PLAYER2.address]);

    expect<BigNumber>(await consumable1.balanceOf(consumer.address)).toEqBN(200);
    expect<BigNumber>(await consumable2.balanceOf(consumer.address)).toEqBN(400);
    expect<BigNumber>(await consumable3.balanceOf(consumer.address)).toEqBN(600);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER2.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER2.address)).toEqBN(800);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER2.address)).toEqBN(700);

    await consumable1.connect(PLAYER1).increaseAllowance(consumer.address, 100);
    await consumable2.connect(PLAYER1).increaseAllowance(consumer.address, 200);
    await consumable3.connect(PLAYER1).increaseAllowance(consumer.address, 300);

    await consumer.consumeConsumables([PLAYER1.address]);

    expect<BigNumber>(await consumable1.balanceOf(consumer.address)).toEqBN(300);
    expect<BigNumber>(await consumable2.balanceOf(consumer.address)).toEqBN(600);
    expect<BigNumber>(await consumable3.balanceOf(consumer.address)).toEqBN(900);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(800);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(600);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(400);

    await consumable1.connect(PLAYER1).increaseAllowance(consumer.address, 50);
    await consumable2.connect(PLAYER1).increaseAllowance(consumer.address, 100);
    await consumable3.connect(PLAYER1).increaseAllowance(consumer.address, 100);

    await consumable1.connect(PLAYER2).increaseAllowance(consumer.address, 50);
    await consumable2.connect(PLAYER2).increaseAllowance(consumer.address, 100);
    await consumable3.connect(PLAYER2).increaseAllowance(consumer.address, 100);

    await mintConsumable(consumable3, PLAYER3.address, 1000);

    await consumable3.connect(PLAYER3).increaseAllowance(consumer.address, 100);

    await consumer.consumeConsumables([PLAYER1.address, PLAYER2.address, PLAYER3.address]);

    expect<BigNumber>(await consumable1.balanceOf(consumer.address)).toEqBN(400);
    expect<BigNumber>(await consumable2.balanceOf(consumer.address)).toEqBN(800);
    expect<BigNumber>(await consumable3.balanceOf(consumer.address)).toEqBN(1200);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(750);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(500);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(300);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER2.address)).toEqBN(850);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER2.address)).toEqBN(700);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER2.address)).toEqBN(600);

    expect<BigNumber>(await consumable3.balanceOf(PLAYER3.address)).toEqBN(900);
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

    await mintConsumable(consumable1, PLAYER1.address, 1000);
    await mintConsumable(consumable2, PLAYER1.address, 1000);
    await mintConsumable(consumable3, PLAYER1.address, 1000);

    await mintConsumable(consumable1, PLAYER2.address, 1000);
    await mintConsumable(consumable2, PLAYER2.address, 1000);
    await mintConsumable(consumable3, PLAYER2.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(consumer.address, 500);
    await consumable2.connect(PLAYER1).increaseAllowance(consumer.address, 500);
    await consumable3.connect(PLAYER1).increaseAllowance(consumer.address, 500);

    await consumable1.connect(PLAYER2).increaseAllowance(consumer.address, 500);
    await consumable2.connect(PLAYER2).increaseAllowance(consumer.address, 500);
    await consumable3.connect(PLAYER2).increaseAllowance(consumer.address, 500);

    await consumer.consumeConsumables([PLAYER1.address, PLAYER2.address]);

    expect<BigNumber>(await consumable1.balanceOf(consumer.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(consumer.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(consumer.address)).toEqBN(1000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(500);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(500);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(500);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, consumer.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER2.address)).toEqBN(500);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER2.address)).toEqBN(500);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER2.address)).toEqBN(500);

    expect<BigNumber>(await consumable1.allowance(PLAYER2.address, consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER2.address, consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(PLAYER2.address, consumer.address)).toEqBN(0);
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

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(0);

    await expect<Promise<ContractTransaction>>(consumer.consumeConsumables([PLAYER1.address])).toBeRevertedWith(
      'Consumer: Not enough consumable to transfer',
    );

    expect<BigNumber>(await consumable1.balanceOf(consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(consumer.address)).toEqBN(0);

    await mintConsumable(consumable1, PLAYER1.address, 1000);
    await mintConsumable(consumable2, PLAYER1.address, 1000);
    await mintConsumable(consumable3, PLAYER1.address, 1000);

    await mintConsumable(consumable1, PLAYER2.address, 1000);
    await mintConsumable(consumable2, PLAYER2.address, 1000);
    await mintConsumable(consumable3, PLAYER2.address, 1000);

    await expect<Promise<ContractTransaction>>(consumer.consumeConsumables([PLAYER1.address])).toBeRevertedWith(
      'Consumer: Not enough consumable to transfer',
    );

    expect<BigNumber>(await consumable1.balanceOf(consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(consumer.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(1000);

    await consumable1.connect(PLAYER1).increaseAllowance(consumer.address, 99);
    await consumable2.connect(PLAYER1).increaseAllowance(consumer.address, 200);
    await consumable3.connect(PLAYER1).increaseAllowance(consumer.address, 299);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(1000);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, consumer.address)).toEqBN(99);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, consumer.address)).toEqBN(200);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, consumer.address)).toEqBN(299);

    await expect<Promise<ContractTransaction>>(consumer.consumeConsumables([PLAYER1.address])).toBeRevertedWith(
      'Consumer: Not enough consumable to transfer',
    );

    expect<BigNumber>(await consumable1.balanceOf(consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(consumer.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(1000);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, consumer.address)).toEqBN(99);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, consumer.address)).toEqBN(200);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, consumer.address)).toEqBN(299);

    await consumable1.connect(PLAYER2).increaseAllowance(consumer.address, 1);

    await expect<Promise<ContractTransaction>>(
      consumer.consumeConsumables([PLAYER1.address, PLAYER2.address]),
    ).toBeRevertedWith('Consumer: Not enough consumable to transfer');

    expect<BigNumber>(await consumable1.balanceOf(consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(consumer.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(1000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER2.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER2.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER2.address)).toEqBN(1000);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, consumer.address)).toEqBN(99);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, consumer.address)).toEqBN(200);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, consumer.address)).toEqBN(299);

    expect<BigNumber>(await consumable1.allowance(PLAYER2.address, consumer.address)).toEqBN(1);

    await consumable1.connect(PLAYER1).increaseAllowance(consumer.address, 1);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, consumer.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, consumer.address)).toEqBN(200);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, consumer.address)).toEqBN(299);

    await expect<Promise<ContractTransaction>>(consumer.consumeConsumables([PLAYER1.address])).toBeRevertedWith(
      'Consumer: Not enough consumable to transfer',
    );

    expect<BigNumber>(await consumable1.balanceOf(consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(consumer.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(1000);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, consumer.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, consumer.address)).toEqBN(200);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, consumer.address)).toEqBN(299);
  });
});
