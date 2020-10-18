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

import { expectRevert } from '@openzeppelin/test-helpers';
import { ConsumableAmount } from '../../../../src/contracts/core/consumables';
import {
  ConsumableProviderContract,
  createConsumable,
  createConsumableProvider,
  getAllowance,
  getBalance,
  mintConsumable,
} from '../../../helpers/ConsumableHelper';
import { CONSUMABLE_MINTER, INITIALIZER, PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { toNumberAsync } from '../../../helpers/ContractHelper';
import { createBaseContract } from '../../../helpers/BaseContractHelper';

describe('initializeConsumableProvider', () => {
  it('should revert if called with non-consumables', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const genericConcept = await createBaseContract({ name: 'Generic Concept' });

    const provider = await ConsumableProviderContract.new();

    await expectRevert(
      provider.initializeConsumableProvider(
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
      provider.initializeConsumableProvider(
        [
          { consumable: consumable1.address, amount: 50 },
          { consumable: genericConcept.address, amount: 100 },
          { consumable: consumable2.address, amount: 200 },
        ],
        {
          from: INITIALIZER,
        },
      ),
      'Provider: Consumable must support interface',
    );
  });
});

describe('consumablesProvided', () => {
  it('should return empty when no consumables provided', async () => {
    const provider = await createConsumableProvider();

    expect<ConsumableAmount[]>(await provider.consumablesProvided()).toEqual([]);
  });

  it('should return the consumables provided', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });

    const provider = await createConsumableProvider([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ]);

    expect<ConsumableAmount[]>(await provider.consumablesProvided()).toEqual([
      consumable1.address,
      consumable2.address,
    ]);
  });
});

describe('isProvided', () => {
  it('should return false when there are no consumables provided', async () => {
    const consumable = await createConsumable({ name: 'Consumable' });

    const provider = await createConsumableProvider();

    const result = await provider.isProvided(consumable.address);
    expect<boolean>(result).toBe(false);
  });

  it('should return false when the given consumable is not provided', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const consumable3 = await createConsumable({ name: 'Consumable 3' });

    const provider = await createConsumableProvider([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ]);

    const result = await provider.isProvided(consumable3.address);
    expect<boolean>(result).toBe(false);
  });

  it('should return true when the given consumable is provided', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });

    const provider = await createConsumableProvider([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ]);

    const result1 = await provider.isProvided(consumable1.address);
    expect<boolean>(result1).toBe(true);

    const result2 = await provider.isProvided(consumable2.address);
    expect<boolean>(result2).toBe(true);
  });
});

describe('amountProvided', () => {
  it('should return 0 when there are no consumables provided', async () => {
    const consumable = await createConsumable({ name: 'Consumable' });

    const provider = await createConsumableProvider();

    const result = await toNumberAsync(provider.amountProvided(consumable.address));
    expect<number>(result).toEqual(0);
  });

  it('should return 0 when the given consumable is not provided', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const consumable3 = await createConsumable({ name: 'Consumable 3' });

    const provider = await createConsumableProvider([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ]);

    const result = await toNumberAsync(provider.amountProvided(consumable3.address));
    expect<number>(result).toEqual(0);
  });

  it('should return the amount when the given consumable is provided', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const consumable3 = await createConsumable({ name: 'Consumable 3' });

    const provider = await createConsumableProvider([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
      { consumable: consumable3.address, amount: 300 },
    ]);

    const result1 = await toNumberAsync(provider.amountProvided(consumable1.address));
    expect<number>(result1).toEqual(100);

    const result2 = await toNumberAsync(provider.amountProvided(consumable2.address));
    expect<number>(result2).toEqual(200);
  });
});

describe('canProvideMultiple', () => {
  it('should return true if there are no consumables provided', async () => {
    const provider = await createConsumableProvider();

    const result1 = await provider.canProvideMultiple(0);
    expect<boolean>(result1).toBe(true);

    const result2 = await provider.canProvideMultiple(1);
    expect<boolean>(result2).toBe(true);

    const result3 = await provider.canProvideMultiple(100);
    expect<boolean>(result3).toBe(true);
  });

  it('should return true if passed 0', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const consumable3 = await createConsumable({ name: 'Consumable 3' });

    const provider = await createConsumableProvider([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
      { consumable: consumable3.address, amount: 300 },
    ]);

    expect<number>(await getBalance(consumable1, provider.address)).toEqual(0);
    expect<number>(await getBalance(consumable2, provider.address)).toEqual(0);
    expect<number>(await getBalance(consumable3, provider.address)).toEqual(0);

    const result1 = await provider.canProvideMultiple(0);
    expect<boolean>(result1).toBe(true);

    await consumable1.mint(provider.address, 100, { from: CONSUMABLE_MINTER });
    await consumable2.mint(provider.address, 200, { from: CONSUMABLE_MINTER });
    await consumable3.mint(provider.address, 300, { from: CONSUMABLE_MINTER });

    expect<number>(await getBalance(consumable1, provider.address)).toEqual(100);
    expect<number>(await getBalance(consumable2, provider.address)).toEqual(200);
    expect<number>(await getBalance(consumable3, provider.address)).toEqual(300);

    const result2 = await provider.canProvideMultiple(0);
    expect<boolean>(result2).toBe(true);

    await consumable1.mint(provider.address, 100, { from: CONSUMABLE_MINTER });
    await consumable2.mint(provider.address, 200, { from: CONSUMABLE_MINTER });
    await consumable3.mint(provider.address, 300, { from: CONSUMABLE_MINTER });

    expect<number>(await getBalance(consumable1, provider.address)).toEqual(200);
    expect<number>(await getBalance(consumable2, provider.address)).toEqual(400);
    expect<number>(await getBalance(consumable3, provider.address)).toEqual(600);

    const result3 = await provider.canProvideMultiple(0);
    expect<boolean>(result3).toBe(true);
  });

  it('should return true when there are exactly enough consumables available', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const consumable3 = await createConsumable({ name: 'Consumable 3' });

    const provider = await createConsumableProvider([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
      { consumable: consumable3.address, amount: 300 },
    ]);

    await consumable1.mint(provider.address, 100, { from: CONSUMABLE_MINTER });
    await consumable2.mint(provider.address, 200, { from: CONSUMABLE_MINTER });
    await consumable3.mint(provider.address, 300, { from: CONSUMABLE_MINTER });

    expect<number>(await getBalance(consumable1, provider.address)).toEqual(100);
    expect<number>(await getBalance(consumable2, provider.address)).toEqual(200);
    expect<number>(await getBalance(consumable3, provider.address)).toEqual(300);

    const result1 = await provider.canProvideMultiple(1);
    expect<boolean>(result1).toBe(true);

    await consumable1.mint(provider.address, 100, { from: CONSUMABLE_MINTER });
    await consumable2.mint(provider.address, 200, { from: CONSUMABLE_MINTER });
    await consumable3.mint(provider.address, 300, { from: CONSUMABLE_MINTER });

    expect<number>(await getBalance(consumable1, provider.address)).toEqual(200);
    expect<number>(await getBalance(consumable2, provider.address)).toEqual(400);
    expect<number>(await getBalance(consumable3, provider.address)).toEqual(600);

    const result2 = await provider.canProvideMultiple(2);
    expect<boolean>(result2).toBe(true);

    await consumable1.mint(provider.address, 1000, { from: CONSUMABLE_MINTER });
    await consumable2.mint(provider.address, 2000, { from: CONSUMABLE_MINTER });
    await consumable3.mint(provider.address, 3000, { from: CONSUMABLE_MINTER });

    expect<number>(await getBalance(consumable1, provider.address)).toEqual(1200);
    expect<number>(await getBalance(consumable2, provider.address)).toEqual(2400);
    expect<number>(await getBalance(consumable3, provider.address)).toEqual(3600);

    const result3 = await provider.canProvideMultiple(12);
    expect<boolean>(result3).toBe(true);
  });

  it('should return true when there are more than enough consumables available', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const consumable3 = await createConsumable({ name: 'Consumable 3' });

    const provider = await createConsumableProvider([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
      { consumable: consumable3.address, amount: 300 },
    ]);

    await consumable1.mint(provider.address, 101, { from: CONSUMABLE_MINTER });
    await consumable2.mint(provider.address, 201, { from: CONSUMABLE_MINTER });
    await consumable3.mint(provider.address, 301, { from: CONSUMABLE_MINTER });

    expect<number>(await getBalance(consumable1, provider.address)).toEqual(101);
    expect<number>(await getBalance(consumable2, provider.address)).toEqual(201);
    expect<number>(await getBalance(consumable3, provider.address)).toEqual(301);

    const result1 = await provider.canProvideMultiple(1);
    expect<boolean>(result1).toBe(true);

    await consumable1.mint(provider.address, 200, { from: CONSUMABLE_MINTER });
    await consumable2.mint(provider.address, 400, { from: CONSUMABLE_MINTER });
    await consumable3.mint(provider.address, 600, { from: CONSUMABLE_MINTER });

    expect<number>(await getBalance(consumable1, provider.address)).toEqual(301);
    expect<number>(await getBalance(consumable2, provider.address)).toEqual(601);
    expect<number>(await getBalance(consumable3, provider.address)).toEqual(901);

    const result2 = await provider.canProvideMultiple(2);
    expect<boolean>(result2).toBe(true);

    await consumable1.mint(provider.address, 1000, { from: CONSUMABLE_MINTER });
    await consumable2.mint(provider.address, 2000, { from: CONSUMABLE_MINTER });
    await consumable3.mint(provider.address, 3000, { from: CONSUMABLE_MINTER });

    expect<number>(await getBalance(consumable1, provider.address)).toEqual(1301);
    expect<number>(await getBalance(consumable2, provider.address)).toEqual(2601);
    expect<number>(await getBalance(consumable3, provider.address)).toEqual(3901);

    const result3 = await provider.canProvideMultiple(10);
    expect<boolean>(result3).toBe(true);

    await consumable1.mint(provider.address, 10000, { from: CONSUMABLE_MINTER });
    await consumable2.mint(provider.address, 20000, { from: CONSUMABLE_MINTER });
    await consumable3.mint(provider.address, 30000, { from: CONSUMABLE_MINTER });

    expect<number>(await getBalance(consumable1, provider.address)).toEqual(11301);
    expect<number>(await getBalance(consumable2, provider.address)).toEqual(22601);
    expect<number>(await getBalance(consumable3, provider.address)).toEqual(33901);

    const result4 = await provider.canProvideMultiple(10);
    expect<boolean>(result4).toBe(true);
  });

  it('should return false when there are no consumables available', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const consumable3 = await createConsumable({ name: 'Consumable 3' });

    const provider = await createConsumableProvider([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
      { consumable: consumable3.address, amount: 300 },
    ]);

    expect<number>(await getBalance(consumable1, provider.address)).toEqual(0);
    expect<number>(await getBalance(consumable2, provider.address)).toEqual(0);
    expect<number>(await getBalance(consumable3, provider.address)).toEqual(0);

    const result1 = await provider.canProvideMultiple(1);
    expect<boolean>(result1).toBe(false);

    const result2 = await provider.canProvideMultiple(2);
    expect<boolean>(result2).toBe(false);

    const result3 = await provider.canProvideMultiple(12);
    expect<boolean>(result3).toBe(false);
  });

  it('should return false when there are not enough consumables available', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const consumable3 = await createConsumable({ name: 'Consumable 3' });

    const provider = await createConsumableProvider([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
      { consumable: consumable3.address, amount: 300 },
    ]);

    await consumable1.mint(provider.address, 1, { from: CONSUMABLE_MINTER });
    await consumable2.mint(provider.address, 1, { from: CONSUMABLE_MINTER });
    await consumable3.mint(provider.address, 1, { from: CONSUMABLE_MINTER });

    expect<number>(await getBalance(consumable1, provider.address)).toEqual(1);
    expect<number>(await getBalance(consumable2, provider.address)).toEqual(1);
    expect<number>(await getBalance(consumable3, provider.address)).toEqual(1);

    const result1 = await provider.canProvideMultiple(1);
    expect<boolean>(result1).toBe(false);

    await consumable1.mint(provider.address, 98, { from: CONSUMABLE_MINTER });
    await consumable2.mint(provider.address, 198, { from: CONSUMABLE_MINTER });
    await consumable3.mint(provider.address, 298, { from: CONSUMABLE_MINTER });

    expect<number>(await getBalance(consumable1, provider.address)).toEqual(99);
    expect<number>(await getBalance(consumable2, provider.address)).toEqual(199);
    expect<number>(await getBalance(consumable3, provider.address)).toEqual(299);

    const result2 = await provider.canProvideMultiple(1);
    expect<boolean>(result2).toBe(false);

    await consumable1.mint(provider.address, 100, { from: CONSUMABLE_MINTER });
    await consumable2.mint(provider.address, 200, { from: CONSUMABLE_MINTER });
    await consumable3.mint(provider.address, 300, { from: CONSUMABLE_MINTER });

    expect<number>(await getBalance(consumable1, provider.address)).toEqual(199);
    expect<number>(await getBalance(consumable2, provider.address)).toEqual(399);
    expect<number>(await getBalance(consumable3, provider.address)).toEqual(599);

    const result3 = await provider.canProvideMultiple(2);
    expect<boolean>(result3).toBe(false);

    await consumable1.mint(provider.address, 1000, { from: CONSUMABLE_MINTER });
    await consumable2.mint(provider.address, 2000, { from: CONSUMABLE_MINTER });
    await consumable3.mint(provider.address, 3000, { from: CONSUMABLE_MINTER });

    expect<number>(await getBalance(consumable1, provider.address)).toEqual(1199);
    expect<number>(await getBalance(consumable2, provider.address)).toEqual(2399);
    expect<number>(await getBalance(consumable3, provider.address)).toEqual(3599);

    const result4 = await provider.canProvideMultiple(12);
    expect<boolean>(result4).toBe(false);

    await consumable1.mint(provider.address, 1, { from: CONSUMABLE_MINTER });
    await consumable3.mint(provider.address, 1, { from: CONSUMABLE_MINTER });

    expect<number>(await getBalance(consumable1, provider.address)).toEqual(1200);
    expect<number>(await getBalance(consumable2, provider.address)).toEqual(2399);
    expect<number>(await getBalance(consumable3, provider.address)).toEqual(3600);

    const result5 = await provider.canProvideMultiple(12);
    expect<boolean>(result5).toBe(false);
  });
});

describe('provideConsumables', () => {
  it('should allow the right amount of consumables to the receiver', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const consumable3 = await createConsumable({ name: 'Consumable 3' });

    const provider = await createConsumableProvider([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
      { consumable: consumable3.address, amount: 300 },
    ]);

    await mintConsumable(consumable1, provider.address, 1000);
    await mintConsumable(consumable2, provider.address, 1000);
    await mintConsumable(consumable3, provider.address, 1000);

    expect<number>(await getBalance(consumable1, provider.address)).toEqual(1000);
    expect<number>(await getBalance(consumable2, provider.address)).toEqual(1000);
    expect<number>(await getBalance(consumable3, provider.address)).toEqual(1000);

    await provider.provideConsumables(PLAYER1);

    expect<number>(await getAllowance(consumable1, provider.address, PLAYER1)).toEqual(100);
    expect<number>(await getAllowance(consumable2, provider.address, PLAYER1)).toEqual(200);
    expect<number>(await getAllowance(consumable3, provider.address, PLAYER1)).toEqual(300);

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(0);

    expect<number>(await getBalance(consumable1, provider.address)).toEqual(1000);
    expect<number>(await getBalance(consumable2, provider.address)).toEqual(1000);
    expect<number>(await getBalance(consumable3, provider.address)).toEqual(1000);

    await provider.provideConsumables(PLAYER2);

    expect<number>(await getAllowance(consumable1, provider.address, PLAYER1)).toEqual(100);
    expect<number>(await getAllowance(consumable2, provider.address, PLAYER1)).toEqual(200);
    expect<number>(await getAllowance(consumable3, provider.address, PLAYER1)).toEqual(300);

    expect<number>(await getAllowance(consumable1, provider.address, PLAYER2)).toEqual(100);
    expect<number>(await getAllowance(consumable2, provider.address, PLAYER2)).toEqual(200);
    expect<number>(await getAllowance(consumable3, provider.address, PLAYER2)).toEqual(300);

    expect<number>(await getBalance(consumable1, PLAYER2)).toEqual(0);
    expect<number>(await getBalance(consumable2, PLAYER2)).toEqual(0);
    expect<number>(await getBalance(consumable3, PLAYER2)).toEqual(0);

    expect<number>(await getBalance(consumable1, provider.address)).toEqual(1000);
    expect<number>(await getBalance(consumable2, provider.address)).toEqual(1000);
    expect<number>(await getBalance(consumable3, provider.address)).toEqual(1000);

    await provider.provideConsumables(PLAYER1);

    expect<number>(await getAllowance(consumable1, provider.address, PLAYER1)).toEqual(200);
    expect<number>(await getAllowance(consumable2, provider.address, PLAYER1)).toEqual(400);
    expect<number>(await getAllowance(consumable3, provider.address, PLAYER1)).toEqual(600);

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(0);

    expect<number>(await getBalance(consumable1, provider.address)).toEqual(1000);
    expect<number>(await getBalance(consumable2, provider.address)).toEqual(1000);
    expect<number>(await getBalance(consumable3, provider.address)).toEqual(1000);
  });

  it('should not allow any consumables to the receiver when there is not enough of all', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const consumable3 = await createConsumable({ name: 'Consumable 3' });

    const provider = await createConsumableProvider([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
      { consumable: consumable3.address, amount: 300 },
    ]);

    expect<number>(await getBalance(consumable1, provider.address)).toEqual(0);
    expect<number>(await getBalance(consumable2, provider.address)).toEqual(0);
    expect<number>(await getBalance(consumable3, provider.address)).toEqual(0);

    await expectRevert(provider.provideConsumables(PLAYER1), 'Provider: Not enough consumable to provide');

    expect<number>(await getAllowance(consumable1, provider.address, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable2, provider.address, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable3, provider.address, PLAYER1)).toEqual(0);

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(0);

    await mintConsumable(consumable1, provider.address, 99);
    await mintConsumable(consumable2, provider.address, 200);
    await mintConsumable(consumable3, provider.address, 299);

    expect<number>(await getBalance(consumable1, provider.address)).toEqual(99);
    expect<number>(await getBalance(consumable2, provider.address)).toEqual(200);
    expect<number>(await getBalance(consumable3, provider.address)).toEqual(299);

    await expectRevert(provider.provideConsumables(PLAYER1), 'Provider: Not enough consumable to provide');

    expect<number>(await getAllowance(consumable1, provider.address, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable2, provider.address, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable3, provider.address, PLAYER1)).toEqual(0);

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(0);

    expect<number>(await getBalance(consumable1, provider.address)).toEqual(99);
    expect<number>(await getBalance(consumable2, provider.address)).toEqual(200);
    expect<number>(await getBalance(consumable3, provider.address)).toEqual(299);

    await mintConsumable(consumable1, provider.address, 1);

    expect<number>(await getBalance(consumable1, provider.address)).toEqual(100);
    expect<number>(await getBalance(consumable2, provider.address)).toEqual(200);
    expect<number>(await getBalance(consumable3, provider.address)).toEqual(299);

    await expectRevert(provider.provideConsumables(PLAYER1), 'Provider: Not enough consumable to provide');

    expect<number>(await getAllowance(consumable1, provider.address, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable2, provider.address, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable3, provider.address, PLAYER1)).toEqual(0);

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable3, PLAYER1)).toEqual(0);

    expect<number>(await getBalance(consumable1, provider.address)).toEqual(100);
    expect<number>(await getBalance(consumable2, provider.address)).toEqual(200);
    expect<number>(await getBalance(consumable3, provider.address)).toEqual(299);
  });
});
