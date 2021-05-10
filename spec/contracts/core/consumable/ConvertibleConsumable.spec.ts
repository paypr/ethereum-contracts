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
import { CONSUMABLE_MINTER, PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import {
  createConsumable,
  createConsumableExchange,
  createConvertibleConsumable,
  mintConsumable,
} from '../../../helpers/ConsumableHelper';
import {
  BASE_CONTRACT_ID,
  CONSUMABLE_ID,
  CONVERTIBLE_CONSUMABLE_ID,
  ERC165_ID,
  TRANSFERRING_ID,
} from '../../../helpers/ContractIds';
import { disableContract } from '../../../helpers/DisableableHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165';

describe('supportsInterface', () => {
  const create = async () => {
    const consumable = await createConsumable();
    return createConvertibleConsumable(consumable.address, {}, '', 1, 1, false);
  };

  shouldSupportInterface('ERC165', create, ERC165_ID);
  shouldSupportInterface('BaseContract', create, BASE_CONTRACT_ID);
  shouldSupportInterface('Consumable', create, CONSUMABLE_ID);
  shouldSupportInterface('ConvertibleConsumable', create, CONVERTIBLE_CONSUMABLE_ID);
  shouldSupportInterface('Transfer', create, TRANSFERRING_ID);
});

describe('exchangeToken', () => {
  it('should return the address of the exchange token', async () => {
    const consumable = await createConsumable({ name: 'Consumable' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable.address,
      { name: 'Convertible' },
      '',
      1,
      1,
      false,
    );

    expect<string>(await convertibleConsumable.exchangeToken()).toEqual(consumable.address);
  });
});

describe('asymmetricalExchangeRate', () => {
  it('should return true when asymmetrical', async () => {
    const consumable = await createConsumable({ name: 'Consumable' });

    const convertibleConsumable1 = await createConvertibleConsumable(
      consumable.address,
      { name: 'Convertible 1' },
      '',
      1,
      2,
      false,
    );

    const convertibleConsumable2 = await createConvertibleConsumable(
      consumable.address,
      { name: 'Convertible 2' },
      '',
      92,
      132,
      false,
    );

    const convertibleConsumable3 = await createConvertibleConsumable(
      consumable.address,
      { name: 'Convertible 3' },
      '',
      1000,
      1001,
      false,
    );

    const convertibleConsumable4 = await createConvertibleConsumable(
      consumable.address,
      { name: 'Convertible 4' },
      '',
      1_000_000,
      1_001_000,
      false,
    );

    const convertibleConsumable5 = await createConvertibleConsumable(
      consumable.address,
      { name: 'Convertible 5' },
      '',
      1,
      1_000_000,
      false,
    );

    expect<boolean>(await convertibleConsumable1.asymmetricalExchangeRate()).toEqual(true);
    expect<boolean>(await convertibleConsumable2.asymmetricalExchangeRate()).toEqual(true);
    expect<boolean>(await convertibleConsumable3.asymmetricalExchangeRate()).toEqual(true);
    expect<boolean>(await convertibleConsumable4.asymmetricalExchangeRate()).toEqual(true);
    expect<boolean>(await convertibleConsumable5.asymmetricalExchangeRate()).toEqual(true);
  });

  it('should return false when not asymmetrical', async () => {
    const consumable = await createConsumable({ name: 'Consumable' });

    const convertibleConsumable1 = await createConvertibleConsumable(
      consumable.address,
      { name: 'Convertible 1' },
      '',
      1,
      1,
      false,
    );

    const convertibleConsumable2 = await createConvertibleConsumable(
      consumable.address,
      { name: 'Convertible 2' },
      '',
      10,
      10,
      false,
    );

    const convertibleConsumable3 = await createConvertibleConsumable(
      consumable.address,
      { name: 'Convertible 3' },
      '',
      1000,
      1000,
      false,
    );

    const convertibleConsumable4 = await createConvertibleConsumable(
      consumable.address,
      { name: 'Convertible 4' },
      '',
      1_000_000,
      1_000_000,
      false,
    );

    expect<boolean>(await convertibleConsumable1.asymmetricalExchangeRate()).toEqual(false);
    expect<boolean>(await convertibleConsumable2.asymmetricalExchangeRate()).toEqual(false);
    expect<boolean>(await convertibleConsumable3.asymmetricalExchangeRate()).toEqual(false);
    expect<boolean>(await convertibleConsumable4.asymmetricalExchangeRate()).toEqual(false);
  });
});

describe('exchangeRate', () => {
  it('should return the exchange rates', async () => {
    const consumable = await createConsumable({ name: 'Consumable' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable.address,
      { name: 'Convertible' },
      '',
      92,
      132,
      false,
    );

    expect<BigNumber>(await convertibleConsumable.purchasePriceExchangeRate()).toEqBN(92);
    expect<BigNumber>(await convertibleConsumable.intrinsicValueExchangeRate()).toEqBN(132);
  });
});

describe('amountExchangeTokenAvailable', () => {
  it('should return the amount available when exchange rate is 1', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });
    const convertibleConsumable = await createConvertibleConsumable(exchange.address, { name: 'Convertible' }, '', 1);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(0);

    await mintConsumable(exchange, convertibleConsumable.address, 10);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(10);

    await mintConsumable(convertibleConsumable, PLAYER1.address, 5);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(5);

    await mintConsumable(convertibleConsumable, PLAYER1.address, 5);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(0);
  });

  it('should return the amount available when exchange rate is large', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });
    const convertibleConsumable = await createConvertibleConsumable(
      exchange.address,
      { name: 'Convertible' },
      '',
      1000,
    );

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(0);

    await mintConsumable(exchange, convertibleConsumable.address, 10);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(10);

    await mintConsumable(convertibleConsumable, PLAYER1.address, 5000);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(5);

    await mintConsumable(convertibleConsumable, PLAYER1.address, 5000);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(0);
  });

  it('should return the amount available when exchange rates are asymmetrical', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });
    const convertibleConsumable = await createConvertibleConsumable(
      exchange.address,
      { name: 'Convertible' },
      '',
      10,
      100,
    );

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(0);

    await mintConsumable(exchange, convertibleConsumable.address, 10);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(10);

    await mintConsumable(convertibleConsumable, PLAYER1.address, 50);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(9);

    await mintConsumable(convertibleConsumable, PLAYER1.address, 50);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(9);

    await mintConsumable(convertibleConsumable, PLAYER1.address, 900);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(0);
  });
});

describe('amountExchangeTokenNeeded', () => {
  it('should return the amount needed when exchange rate is 1', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });
    const convertibleConsumable = await createConvertibleConsumable(exchange.address, { name: 'Convertible' }, '', 1);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(0)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(1)).toEqBN(1);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(100)).toEqBN(100);
  });

  it('should return the amount needed when exchange rate is large', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });
    const convertibleConsumable = await createConvertibleConsumable(
      exchange.address,
      { name: 'Convertible' },
      '',
      1000,
    );

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(0)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(1)).toEqBN(1);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(999)).toEqBN(1);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(1000)).toEqBN(1);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(1001)).toEqBN(2);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(2000)).toEqBN(2);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(10000)).toEqBN(10);
  });

  it('should return the amount needed when exchange rates are asymmetrical', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });
    const convertibleConsumable = await createConvertibleConsumable(
      exchange.address,
      { name: 'Convertible' },
      '',
      10,
      100,
    );

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(0)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(1)).toEqBN(1);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(9)).toEqBN(1);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(10)).toEqBN(1);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(11)).toEqBN(2);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(20)).toEqBN(2);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(100)).toEqBN(10);
  });
});

describe('amountExchangeTokenProvided', () => {
  it('should return the amount provided when exchange rate is 1', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });
    const convertibleConsumable = await createConvertibleConsumable(exchange.address, { name: 'Convertible' }, '', 1);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(0)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(1)).toEqBN(1);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(100)).toEqBN(100);
  });

  it('should return the amount provided when exchange rate is large', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });
    const convertibleConsumable = await createConvertibleConsumable(
      exchange.address,
      { name: 'Convertible' },
      '',
      1000,
    );

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(0)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(1)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(999)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(1000)).toEqBN(1);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(1001)).toEqBN(1);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(2000)).toEqBN(2);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(10000)).toEqBN(10);
  });

  it('should return the amount provided when exchange rates are asymmetrical', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });
    const convertibleConsumable = await createConvertibleConsumable(
      exchange.address,
      { name: 'Convertible' },
      '',
      10,
      100,
    );

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(0)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(1)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(99)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(100)).toEqBN(1);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(101)).toEqBN(1);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(200)).toEqBN(2);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(1000)).toEqBN(10);
  });
});

describe('mintByExchange', () => {
  it('should exchange proper amount when the exchange rate is 1', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable1.address,
      { name: 'Convertible' },
      '',
      1,
      1,
      false,
    );

    await mintConsumable(consumable1, PLAYER1.address, 1000);
    await mintConsumable(consumable2, PLAYER1.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 100);

    await convertibleConsumable.connect(PLAYER1).mintByExchange(100);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(100);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 50);

    await convertibleConsumable.connect(PLAYER1).mintByExchange(50);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(850);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(150);
  });

  it('should exchange proper amount when the exchange rate is large', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable1.address,
      { name: 'Convertible' },
      '',
      1000,
      1000,
      false,
    );

    await mintConsumable(consumable1, PLAYER1.address, 1000);
    await mintConsumable(consumable2, PLAYER1.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 100);

    await convertibleConsumable.connect(PLAYER1).mintByExchange(100_000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(100_000);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 50);

    await convertibleConsumable.connect(PLAYER1).mintByExchange(50_000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(850);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(150_000);
  });

  it('should exchange proper amount when the exchange rates are asymmetrical', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable1.address,
      { name: 'Convertible' },
      '',
      10,
      100,
      false,
    );

    await mintConsumable(consumable1, PLAYER1.address, 1000);
    await mintConsumable(consumable2, PLAYER1.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 100);

    await convertibleConsumable.connect(PLAYER1).mintByExchange(1000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(1000);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 50);

    await convertibleConsumable.connect(PLAYER1).mintByExchange(500);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(850);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(1500);
  });

  it('should revert if the sender does not allow the correct exchangeToken balance of the sender when the exchange rate is 1', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable1.address,
      { name: 'Convertible' },
      '',
      1,
      1,
      false,
    );

    await mintConsumable(consumable1, PLAYER1.address, 1000);
    await mintConsumable(consumable2, PLAYER1.address, 1000);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).mintByExchange(100),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(0);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 99);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).mintByExchange(100),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(99);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(0);
  });

  it('should revert if the sender does not allow the correct exchangeToken balance of the sender when the exchange rate is large', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable1.address,
      { name: 'Convertible' },
      '',
      1000,
      1000,
      false,
    );

    await mintConsumable(consumable1, PLAYER1.address, 1000);
    await mintConsumable(consumable2, PLAYER1.address, 1000);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).mintByExchange(100000),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(0);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 99);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).mintByExchange(100000),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(99);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(0);
  });

  it('should revert if the sender does not allow the correct exchangeToken balance of the sender when the exchange rates are asymmetrical', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable1.address,
      { name: 'Convertible' },
      '',
      10,
      100,
      false,
    );

    await mintConsumable(consumable1, PLAYER1.address, 1000);
    await mintConsumable(consumable2, PLAYER1.address, 1000);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).mintByExchange(1000),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(0);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 99);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).mintByExchange(1000),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(99);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(0);
  });

  it('should not exchange if disabled', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable1.address,
      { name: 'Convertible' },
      '',
      1,
      1,
      false,
    );

    await mintConsumable(consumable1, PLAYER1.address, 1000);
    await mintConsumable(consumable2, PLAYER1.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 100);

    await disableContract(convertibleConsumable, CONSUMABLE_MINTER);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).mintByExchange(100),
    ).toBeRevertedWith('Contract is disabled');
  });
});

describe('burnByExchange', () => {
  it('should exchange proper amount when the exchange rate is 1', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable1.address,
      { name: 'Convertible' },
      '',
      1,
      1,
      false,
    );

    await mintConsumable(consumable1, convertibleConsumable.address, 1000);
    await mintConsumable(consumable2, convertibleConsumable.address, 1000);
    await mintConsumable(convertibleConsumable, PLAYER1.address, 1000);

    await convertibleConsumable.connect(PLAYER1).burnByExchange(100);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(900);

    await consumable1.connect(PLAYER1).transferFrom(convertibleConsumable.address, PLAYER1.address, 100);

    await convertibleConsumable.connect(PLAYER1).burnByExchange(50);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(convertibleConsumable.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(50);
    expect<BigNumber>(await consumable2.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(850);
  });

  it('should exchange proper amount when the exchange rate is large', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable1.address,
      { name: 'Convertible' },
      '',
      1000,
      1000,
      false,
    );

    await mintConsumable(consumable1, convertibleConsumable.address, 1000);
    await mintConsumable(consumable2, convertibleConsumable.address, 1000);
    await mintConsumable(convertibleConsumable, PLAYER1.address, 1_000_000);

    await convertibleConsumable.connect(PLAYER1).burnByExchange(100_000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(900_000);

    await consumable1.connect(PLAYER1).transferFrom(convertibleConsumable.address, PLAYER1.address, 100);

    await convertibleConsumable.connect(PLAYER1).burnByExchange(50_000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(convertibleConsumable.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(50);
    expect<BigNumber>(await consumable2.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(850_000);
  });

  it('should exchange proper amount when the exchange rates are asymmetrical', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable1.address,
      { name: 'Convertible' },
      '',
      10,
      100,
      false,
    );

    await mintConsumable(consumable1, convertibleConsumable.address, 1000);
    await mintConsumable(consumable2, convertibleConsumable.address, 1000);
    await mintConsumable(convertibleConsumable, PLAYER1.address, 100_000);

    await convertibleConsumable.connect(PLAYER1).burnByExchange(10_000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(90_000);

    await consumable1.connect(PLAYER1).transferFrom(convertibleConsumable.address, PLAYER1.address, 100);

    await convertibleConsumable.connect(PLAYER1).burnByExchange(5_000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(convertibleConsumable.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(50);
    expect<BigNumber>(await consumable2.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(85_000);
  });

  it('should revert if the sender does not have enough token to burn when the exchange rate is 1', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable1.address,
      { name: 'Convertible' },
      '',
      1,
      1,
      false,
    );

    await mintConsumable(consumable1, convertibleConsumable.address, 1000);
    await mintConsumable(consumable2, convertibleConsumable.address, 1000);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).burnByExchange(100),
    ).toBeRevertedWith('burn amount exceeds balance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(0);

    await mintConsumable(convertibleConsumable, PLAYER1.address, 99);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).burnByExchange(100),
    ).toBeRevertedWith('burn amount exceeds balance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(99);
  });

  it('should revert if the sender does not have enough token to burn when the exchange rate is large', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable1.address,
      { name: 'Convertible' },
      '',
      1000,
      1000,
      false,
    );

    await mintConsumable(consumable1, convertibleConsumable.address, 1_000_000);
    await mintConsumable(consumable2, convertibleConsumable.address, 1_000_000);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).burnByExchange(100_000),
    ).toBeRevertedWith('burn amount exceeds balance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(convertibleConsumable.address)).toEqBN(1_000_000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleConsumable.address)).toEqBN(1_000_000);
    expect<BigNumber>(await consumable1.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(0);

    await mintConsumable(convertibleConsumable, PLAYER1.address, 99_999);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).burnByExchange(100_000),
    ).toBeRevertedWith('burn amount exceeds balance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(convertibleConsumable.address)).toEqBN(1_000_000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleConsumable.address)).toEqBN(1_000_000);
    expect<BigNumber>(await consumable1.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(99_999);
  });

  // tslint:disable-next-line:max-line-length
  it('should revert if the sender does not have enough token to burn when the exchange rates are asymmetrical', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable1.address,
      { name: 'Convertible' },
      '',
      10,
      100,
      false,
    );

    await mintConsumable(consumable1, convertibleConsumable.address, 100_000);
    await mintConsumable(consumable2, convertibleConsumable.address, 100_000);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).burnByExchange(10_000),
    ).toBeRevertedWith('burn amount exceeds balance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(convertibleConsumable.address)).toEqBN(100_000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleConsumable.address)).toEqBN(100_000);
    expect<BigNumber>(await consumable1.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(0);

    await mintConsumable(convertibleConsumable, PLAYER1.address, 9_999);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).burnByExchange(10_000),
    ).toBeRevertedWith('burn amount exceeds balance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(convertibleConsumable.address)).toEqBN(100_000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleConsumable.address)).toEqBN(100_000);
    expect<BigNumber>(await consumable1.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(9_999);
  });

  it('should not exchange if disabled', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable1.address,
      { name: 'Convertible' },
      '',
      1,
      1,
      false,
    );

    await mintConsumable(consumable1, convertibleConsumable.address, 1000);
    await mintConsumable(consumable2, convertibleConsumable.address, 1000);
    await mintConsumable(convertibleConsumable, PLAYER1.address, 1000);

    await disableContract(convertibleConsumable, CONSUMABLE_MINTER);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).burnByExchange(100),
    ).toBeRevertedWith('Contract is disabled');
  });
});

describe('transfer', () => {
  it('should mint tokens when needed', async () => {
    const consumable = await createConsumable({ name: 'Consumable' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable.address,
      { name: 'Convertible' },
      '',
      1000,
      1000,
      false,
    );

    await mintConsumable(consumable, PLAYER1.address, 1000);

    await consumable.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 100);

    await convertibleConsumable.connect(PLAYER1).transfer(PLAYER2.address, 100_000);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(900);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable.balanceOf(convertibleConsumable.address)).toEqBN(100);
    expect<BigNumber>(await consumable.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER2.address)).toEqBN(100_000);

    await consumable.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 25);

    await mintConsumable(consumable, convertibleConsumable.address, 25);
    await mintConsumable(convertibleConsumable, PLAYER1.address, 25_000);

    await convertibleConsumable.connect(PLAYER1).transfer(PLAYER2.address, 50_000);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(875);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable.balanceOf(convertibleConsumable.address)).toEqBN(150);
    expect<BigNumber>(await consumable.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER2.address)).toEqBN(150_000);
  });

  it('should not mint tokens when not needed', async () => {
    const consumable = await createConsumable({ name: 'Consumable' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable.address,
      { name: 'Convertible' },
      '',
      1000,
      1000,
      false,
    );

    await mintConsumable(consumable, PLAYER1.address, 1000);

    await mintConsumable(consumable, convertibleConsumable.address, 1000);
    await mintConsumable(convertibleConsumable, PLAYER1.address, 1_000_000);

    await convertibleConsumable.connect(PLAYER1).transfer(PLAYER2.address, 100_000);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(900_000);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER2.address)).toEqBN(100_000);

    await convertibleConsumable.connect(PLAYER1).transfer(PLAYER2.address, 50_000);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(850_000);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER2.address)).toEqBN(150_000);
  });

  it('should revert if there are not enough tokens or exchange tokens', async () => {
    const consumable = await createConsumable({ name: 'Consumable' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable.address,
      { name: 'Convertible' },
      '',
      1000,
      1000,
      false,
    );

    await mintConsumable(consumable, PLAYER1.address, 1000);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).transfer(PLAYER2.address, 100_000),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable.balanceOf(convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER2.address)).toEqBN(0);

    await consumable.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 99);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).transfer(PLAYER2.address, 100_000),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable.balanceOf(convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(99);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER2.address)).toEqBN(0);

    await mintConsumable(consumable, convertibleConsumable.address, 1);
    await mintConsumable(convertibleConsumable, PLAYER1.address, 999);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).transfer(PLAYER2.address, 100_000),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable.balanceOf(convertibleConsumable.address)).toEqBN(1);
    expect<BigNumber>(await consumable.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(99);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(999);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER2.address)).toEqBN(0);
  });
});
