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
import { ExchangeRate } from '../../../../src/contracts/core/consumables';
import { CONSUMABLE_MINTER, PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import {
  createConsumable,
  createConsumableExchange,
  createConvertibleConsumable,
  mintConsumable,
  toExchangeRateAsync,
} from '../../../helpers/ConsumableHelper';
import {
  BASE_CONTRACT_ID,
  CONSUMABLE_EXCHANGE_ID,
  CONSUMABLE_ID,
  ERC165_ID,
  TRANSFERRING_ID,
} from '../../../helpers/ContractIds';
import { disableContract } from '../../../helpers/DisableableHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165';
import { shouldTransferItem, shouldTransferToken } from '../../../helpers/TransferringHelper';

describe('supportsInterface', () => {
  shouldSupportInterface('ERC165', createConsumableExchange, ERC165_ID);
  shouldSupportInterface('BaseContract', createConsumableExchange, BASE_CONTRACT_ID);
  shouldSupportInterface('Consumable', createConsumableExchange, CONSUMABLE_ID);
  shouldSupportInterface('ConsumableExchange', createConsumableExchange, CONSUMABLE_EXCHANGE_ID);
  shouldSupportInterface('Transfer', createConsumableExchange, TRANSFERRING_ID);
});

describe('totalConvertibles', () => {
  it('should return all convertibles that are registered', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    expect<BigNumber>(await exchange.totalConvertibles()).toEqBN(0);

    await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' });
    expect<BigNumber>(await exchange.totalConvertibles()).toEqBN(1);

    await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' }, '', 1, 1, false);
    expect<BigNumber>(await exchange.totalConvertibles()).toEqBN(1);

    await createConvertibleConsumable(exchange.address, { name: 'Consumable 3' });
    expect<BigNumber>(await exchange.totalConvertibles()).toEqBN(2);
  });
});

describe('convertibleAt', () => {
  it('should return the convertible at the proper index', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable1 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' });
    expect<string>(await exchange.convertibleAt(0)).toEqual(consumable1.address);

    await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' }, '', 1, 1, false);
    expect<string>(await exchange.convertibleAt(0)).toEqual(consumable1.address);

    const consumable3 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 3' });
    expect<string>(await exchange.convertibleAt(0)).toEqual(consumable1.address);
    expect<string>(await exchange.convertibleAt(1)).toEqual(consumable3.address);
  });

  it('should revert for index out of bounds', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' });
    await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' }, '', 1, 1, false);
    await createConvertibleConsumable(exchange.address, { name: 'Consumable 3' });

    await expect<Promise<string>>(exchange.convertibleAt(2)).toBeRevertedWith('index out of bounds');
    await expect<Promise<string>>(exchange.convertibleAt(10)).toBeRevertedWith('index out of bounds');
    await expect<Promise<string>>(exchange.convertibleAt(-1)).toBeRevertedWith('value out-of-bounds');
  });
});

describe('isConvertible', () => {
  it('should return false if not registered', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });

    expect<boolean>(await exchange.isConvertible(consumable1.address)).toBe(false);
    expect<boolean>(await exchange.isConvertible(consumable2.address)).toBe(false);
  });

  it('should return true if registered', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable1 = await createConsumable({ name: 'Consumable 1' });

    const consumable2 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' }, '', 1000);

    expect<boolean>(await exchange.isConvertible(consumable1.address)).toBe(false);
    expect<boolean>(await exchange.isConvertible(consumable2.address)).toBe(true);

    const consumable3 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 3' }, '', 1000);

    expect<boolean>(await exchange.isConvertible(consumable1.address)).toBe(false);
    expect<boolean>(await exchange.isConvertible(consumable2.address)).toBe(true);
    expect<boolean>(await exchange.isConvertible(consumable3.address)).toBe(true);
  });
});

describe('exchangeRateOf', () => {
  it('should return 0 if not set', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });

    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable1.address))).toEqual({
      purchasePrice: 0,
      intrinsicValue: 0,
    });
    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable2.address))).toEqual({
      purchasePrice: 0,
      intrinsicValue: 0,
    });
  });

  it('should return the exchange rate of the token', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable1 = await createConsumable({ name: 'Consumable 1' });

    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable1.address))).toEqual({
      purchasePrice: 0,
      intrinsicValue: 0,
    });

    const consumable2 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' }, '', 1000, 2000);

    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable1.address))).toEqual({
      purchasePrice: 0,
      intrinsicValue: 0,
    });
    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable2.address))).toEqual({
      purchasePrice: 1000,
      intrinsicValue: 2000,
    });

    const consumable3 = await createConvertibleConsumable(
      exchange.address,
      { name: 'Consumable 3' },
      '',
      1_000_000,
      2_000_000,
    );

    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable1.address))).toEqual({
      purchasePrice: 0,
      intrinsicValue: 0,
    });
    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable2.address))).toEqual({
      purchasePrice: 1000,
      intrinsicValue: 2000,
    });
    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable3.address))).toEqual({
      purchasePrice: 1_000_000,
      intrinsicValue: 2_000_000,
    });
  });
});

describe('registerToken', () => {
  it('should set the exchange rate for a new token', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable1 = await createConvertibleConsumable(
      exchange.address,
      { name: 'Consumable 1' },
      '',
      1000,
      2000,
      false,
    );

    const consumable2 = await createConvertibleConsumable(
      exchange.address,
      { name: 'Consumable 2' },
      '',
      1_000_000,
      2_000_000,
      false,
    );

    await consumable1.connect(CONSUMABLE_MINTER).registerWithExchange();

    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable1.address))).toEqual({
      purchasePrice: 1000,
      intrinsicValue: 2000,
    });
    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable2.address))).toEqual({
      purchasePrice: 0,
      intrinsicValue: 0,
    });

    await consumable2.connect(CONSUMABLE_MINTER).registerWithExchange();

    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable1.address))).toEqual({
      purchasePrice: 1000,
      intrinsicValue: 2000,
    });
    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable2.address))).toEqual({
      purchasePrice: 1_000_000,
      intrinsicValue: 2_000_000,
    });
  });

  it('should emit ExchangeRateChanged event', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable1 = await createConvertibleConsumable(
      exchange.address,
      { name: 'Consumable 1' },
      '',
      1000,
      2000,
      false,
    );

    const consumable2 = await createConvertibleConsumable(
      exchange.address,
      { name: 'Consumable 2' },
      '',
      1_000_000,
      2_000_000,
      false,
    );

    await expect<ContractTransaction>(
      await consumable1.connect(CONSUMABLE_MINTER).registerWithExchange(),
    ).toHaveEmittedWith(exchange, 'ExchangeRateChanged', [consumable1.address, '1000', '2000']);

    await expect<ContractTransaction>(
      await consumable2.connect(CONSUMABLE_MINTER).registerWithExchange(),
    ).toHaveEmittedWith(exchange, 'ExchangeRateChanged', [consumable2.address, '1000000', '2000000']);
  });

  it('should revert if exchange rate is 0', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    await expect<Promise<ContractTransaction>>(exchange.connect(PLAYER1).registerToken(0, 1)).toBeRevertedWith(
      'must register with a purchase price exchange rate',
    );
    await expect<Promise<ContractTransaction>>(exchange.connect(PLAYER1).registerToken(1, 0)).toBeRevertedWith(
      'must register with an intrinsic value exchange rate',
    );
  });

  it('should revert if the token is already registered', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable1 = await createConvertibleConsumable(
      exchange.address,
      { name: 'Consumable 1' },
      '',
      1000,
      1000,
      false,
    );

    await consumable1.connect(CONSUMABLE_MINTER).registerWithExchange();
    await expect<Promise<ContractTransaction>>(
      consumable1.connect(CONSUMABLE_MINTER).registerWithExchange(),
    ).toBeRevertedWith('cannot register already registered token');
  });

  it('should not register if disabled', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable = await createConvertibleConsumable(
      exchange.address,
      { name: 'Consumable' },
      '',
      1000,
      1000,
      false,
    );

    await disableContract(exchange, CONSUMABLE_MINTER);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(CONSUMABLE_MINTER).registerWithExchange(),
    ).toBeRevertedWith('Contract is disabled');
  });
});

describe('exchangeTo', () => {
  it('should exchange the token at the exchange rate', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable1 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' }, '', 1000, 2000);
    const consumable2 = await createConvertibleConsumable(
      exchange.address,
      { name: 'Consumable 2' },
      '',
      1_000_000,
      2_000_000,
    );

    await mintConsumable(exchange, PLAYER1.address, 1000);
    await exchange.connect(PLAYER1).exchangeTo(consumable1.address, 2);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(exchange.address, PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await consumable2.allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(998);
    expect<BigNumber>(await exchange.balanceOf(consumable1.address)).toEqBN(2);
    expect<BigNumber>(await exchange.balanceOf(consumable2.address)).toEqBN(0);

    await consumable1.connect(PLAYER1).transferFrom(exchange.address, PLAYER1.address, 2000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(2000);

    await exchange.connect(PLAYER1).exchangeTo(consumable2.address, 50);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(exchange.address, PLAYER1.address)).toEqBN(50_000_000);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(948);
    expect<BigNumber>(await exchange.balanceOf(consumable1.address)).toEqBN(2);
    expect<BigNumber>(await exchange.balanceOf(consumable2.address)).toEqBN(50);

    await consumable2.connect(PLAYER1).transferFrom(exchange.address, PLAYER1.address, 50_000_000);

    await exchange.connect(PLAYER1).exchangeTo(consumable1.address, 100);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(50_000_000);
    expect<BigNumber>(await consumable1.allowance(exchange.address, PLAYER1.address)).toEqBN(100_000);
    expect<BigNumber>(await consumable2.allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(848);
    expect<BigNumber>(await exchange.balanceOf(consumable1.address)).toEqBN(102);
    expect<BigNumber>(await exchange.balanceOf(consumable2.address)).toEqBN(50);

    await consumable1.connect(PLAYER1).transferFrom(exchange.address, PLAYER1.address, 100_000);
  });

  it('should revert if the caller does not have enough of the exchange token', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable1 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' }, '', 1000, 2000);
    const consumable2 = await createConvertibleConsumable(
      exchange.address,
      { name: 'Consumable 2' },
      '',
      1_000_000,
      2_000_000,
    );

    await expect<Promise<ContractTransaction>>(
      exchange.connect(PLAYER1).exchangeTo(consumable1.address, 100),
    ).toBeRevertedWith('transfer amount exceeds balance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await exchange.balanceOf(consumable1.address)).toEqBN(0);
    expect<BigNumber>(await exchange.balanceOf(consumable2.address)).toEqBN(0);

    await mintConsumable(exchange, PLAYER1.address, 99);

    await expect<Promise<ContractTransaction>>(
      exchange.connect(PLAYER1).exchangeTo(consumable1.address, 100),
    ).toBeRevertedWith('transfer amount exceeds balance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(99);
    expect<BigNumber>(await exchange.balanceOf(consumable1.address)).toEqBN(0);
    expect<BigNumber>(await exchange.balanceOf(consumable2.address)).toEqBN(0);

    await mintConsumable(exchange, PLAYER2.address, 1000);

    await expect<Promise<ContractTransaction>>(
      exchange.connect(PLAYER1).exchangeTo(consumable1.address, 100),
    ).toBeRevertedWith('transfer amount exceeds balance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(99);
    expect<BigNumber>(await exchange.balanceOf(consumable1.address)).toEqBN(0);
    expect<BigNumber>(await exchange.balanceOf(consumable2.address)).toEqBN(0);
  });

  it.skip('should revert if the token contract does not send enough tokens', async () => {
    // todo: need a test consumable that doesn't send enough tokens
  });

  it('should not exchange the token if disabled', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable = await createConvertibleConsumable(exchange.address, { name: 'Consumable' }, '', 1000);

    await mintConsumable(exchange, PLAYER1.address, 1000);

    await disableContract(exchange, CONSUMABLE_MINTER);

    await expect<Promise<ContractTransaction>>(
      exchange.connect(PLAYER1).exchangeTo(consumable.address, 100),
    ).toBeRevertedWith('Contract is disabled');
  });
});

describe('exchangeFrom', () => {
  it('should exchange the token at the exchange rate', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable1 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' }, '', 100, 1000);
    const consumable2 = await createConvertibleConsumable(
      exchange.address,
      { name: 'Consumable 2' },
      '',
      1000,
      1_000_000,
    );

    await mintConsumable(exchange, consumable1.address, 10_000);
    await mintConsumable(consumable1, PLAYER1.address, 1_000_000);

    await mintConsumable(exchange, consumable2.address, 1_000_000);
    await mintConsumable(consumable2, PLAYER1.address, 1_000_000_000);

    await consumable1.connect(PLAYER1).increaseAllowance(exchange.address, 100_000);

    await exchange.connect(PLAYER1).exchangeFrom(consumable1.address, 100_000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(900_000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1_000_000_000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, exchange.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, exchange.address)).toEqBN(0);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await exchange.balanceOf(consumable1.address)).toEqBN(9900);
    expect<BigNumber>(await exchange.balanceOf(consumable2.address)).toEqBN(1_000_000);

    await consumable2.connect(PLAYER1).increaseAllowance(exchange.address, 200_000_000);

    await exchange.connect(PLAYER1).exchangeFrom(consumable2.address, 200_000_000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(900_000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(800_000_000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, exchange.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, exchange.address)).toEqBN(0);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(300);
    expect<BigNumber>(await exchange.balanceOf(consumable1.address)).toEqBN(9900);
    expect<BigNumber>(await exchange.balanceOf(consumable2.address)).toEqBN(999_800);

    await consumable1.connect(PLAYER1).increaseAllowance(exchange.address, 1500);

    await exchange.connect(PLAYER1).exchangeFrom(consumable1.address, 1500);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(898_500);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(800_000_000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, exchange.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, exchange.address)).toEqBN(0);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(301);
    expect<BigNumber>(await exchange.balanceOf(consumable1.address)).toEqBN(9899);
    expect<BigNumber>(await exchange.balanceOf(consumable2.address)).toEqBN(999_800);
  });

  it('should revert if the caller has not provided enough tokens', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable1 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' }, '', 1000);
    const consumable2 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' }, '', 1_000_000);

    await mintConsumable(exchange, consumable1.address, 1000);
    await mintConsumable(consumable1, PLAYER1.address, 1_000_000);

    await mintConsumable(exchange, consumable2.address, 1000);
    await mintConsumable(consumable2, PLAYER1.address, 1_000_000_000);

    await expect<Promise<ContractTransaction>>(
      exchange.connect(PLAYER1).exchangeFrom(consumable1.address, 100_000),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1_000_000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1_000_000_000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, exchange.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, exchange.address)).toEqBN(0);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await exchange.balanceOf(consumable1.address)).toEqBN(1000);
    expect<BigNumber>(await exchange.balanceOf(consumable2.address)).toEqBN(1000);

    await consumable1.connect(PLAYER1).increaseAllowance(exchange.address, 99_999);

    await expect<Promise<ContractTransaction>>(
      exchange.connect(PLAYER1).exchangeFrom(consumable1.address, 100_000),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1_000_000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1_000_000_000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, exchange.address)).toEqBN(99_999);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, exchange.address)).toEqBN(0);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await exchange.balanceOf(consumable1.address)).toEqBN(1000);
    expect<BigNumber>(await exchange.balanceOf(consumable2.address)).toEqBN(1000);

    await consumable2.connect(PLAYER1).increaseAllowance(exchange.address, 1_000_000);

    await expect<Promise<ContractTransaction>>(
      exchange.connect(PLAYER1).exchangeFrom(consumable1.address, 100_000),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1_000_000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1_000_000_000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, exchange.address)).toEqBN(99_999);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, exchange.address)).toEqBN(1_000_000);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await exchange.balanceOf(consumable1.address)).toEqBN(1000);
    expect<BigNumber>(await exchange.balanceOf(consumable2.address)).toEqBN(1000);
  });

  it.skip('should revert if the token contract does not have enough of the exchange token', async () => {
    // todo: need a test consumable that doesn't send enough tokens
  });

  it('should not exchange the token if disabled', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable = await createConvertibleConsumable(exchange.address, { name: 'Consumable' }, '', 1000);

    await mintConsumable(exchange, consumable.address, 1000);
    await mintConsumable(consumable, PLAYER1.address, 1_000_000);

    await consumable.connect(PLAYER1).increaseAllowance(exchange.address, 100_000);

    await disableContract(exchange, CONSUMABLE_MINTER);

    await expect<Promise<ContractTransaction>>(
      exchange.connect(PLAYER1).exchangeFrom(consumable.address, 100_000),
    ).toBeRevertedWith('Contract is disabled');
  });
});

describe('transferToken', () => {
  shouldTransferToken(createConsumableExchange, { getSuperAdmin: () => CONSUMABLE_MINTER });

  it('should transfer from consumable if there would be enough to exchangeFrom', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable = await createConvertibleConsumable(exchange.address, { name: 'Consumable' }, '', 1000);

    await mintConsumable(exchange, PLAYER1.address, 1000);
    await mintConsumable(exchange, consumable.address, 10);

    await exchange.connect(PLAYER1).exchangeTo(consumable.address, 2);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable.allowance(exchange.address, PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(998);
    expect<BigNumber>(await exchange.balanceOf(consumable.address)).toEqBN(12);

    await consumable.connect(PLAYER1).transferFrom(exchange.address, PLAYER1.address, 2000);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await consumable.allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(998);
    expect<BigNumber>(await exchange.balanceOf(consumable.address)).toEqBN(12);

    await consumable.connect(CONSUMABLE_MINTER).transferToken(exchange.address, 5, PLAYER1.address);

    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(1003);
    expect<BigNumber>(await exchange.balanceOf(consumable.address)).toEqBN(7);

    await exchange.connect(PLAYER1).exchangeTo(consumable.address, 100);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await consumable.allowance(exchange.address, PLAYER1.address)).toEqBN(100_000);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(903);
    expect<BigNumber>(await exchange.balanceOf(consumable.address)).toEqBN(107);

    await consumable.connect(PLAYER1).transferFrom(exchange.address, PLAYER1.address, 100_000);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(102_000);
    expect<BigNumber>(await consumable.allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(903);
    expect<BigNumber>(await exchange.balanceOf(consumable.address)).toEqBN(107);

    await consumable.connect(CONSUMABLE_MINTER).transferToken(exchange.address, 5, PLAYER1.address);

    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(908);
    expect<BigNumber>(await exchange.balanceOf(consumable.address)).toEqBN(102);
  });

  // tslint:disable-next-line:max-line-length
  it('should transfer from consumable with asymmetrical exchange rates if there would be enough to exchangeFrom', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable = await createConvertibleConsumable(exchange.address, { name: 'Consumable' }, '', 1000, 1_000_000);

    await mintConsumable(exchange, PLAYER1.address, 1000);

    await exchange.connect(PLAYER1).exchangeTo(consumable.address, 2);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable.allowance(exchange.address, PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(998);
    expect<BigNumber>(await exchange.balanceOf(consumable.address)).toEqBN(2);

    await consumable.connect(PLAYER1).transferFrom(exchange.address, PLAYER1.address, 2000);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await consumable.allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(998);
    expect<BigNumber>(await exchange.balanceOf(consumable.address)).toEqBN(2);

    await consumable.connect(CONSUMABLE_MINTER).transferToken(exchange.address, 1, PLAYER1.address);

    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(999);
    expect<BigNumber>(await exchange.balanceOf(consumable.address)).toEqBN(1);

    await exchange.connect(PLAYER1).exchangeTo(consumable.address, 100);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await consumable.allowance(exchange.address, PLAYER1.address)).toEqBN(100_000);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(899);
    expect<BigNumber>(await exchange.balanceOf(consumable.address)).toEqBN(101);

    await consumable.connect(PLAYER1).transferFrom(exchange.address, PLAYER1.address, 100_000);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(102_000);
    expect<BigNumber>(await consumable.allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(899);
    expect<BigNumber>(await exchange.balanceOf(consumable.address)).toEqBN(101);

    await consumable.connect(CONSUMABLE_MINTER).transferToken(exchange.address, 100, PLAYER1.address);

    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(999);
    expect<BigNumber>(await exchange.balanceOf(consumable.address)).toEqBN(1);
  });

  it('should not transfer from consumable if there would not be enough to exchangeFrom', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable = await createConvertibleConsumable(exchange.address, { name: 'Consumable' }, '', 1000);

    await mintConsumable(exchange, PLAYER1.address, 1000);

    await exchange.connect(PLAYER1).exchangeTo(consumable.address, 2);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable.allowance(exchange.address, PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(998);
    expect<BigNumber>(await exchange.balanceOf(consumable.address)).toEqBN(2);

    await consumable.connect(PLAYER1).transferFrom(exchange.address, PLAYER1.address, 2000);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await consumable.allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(998);
    expect<BigNumber>(await exchange.balanceOf(consumable.address)).toEqBN(2);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(CONSUMABLE_MINTER).transferToken(exchange.address, 2, PLAYER1.address),
    ).toBeRevertedWith('not enough left to cover exchange');

    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(998);
    expect<BigNumber>(await exchange.balanceOf(consumable.address)).toEqBN(2);

    await exchange.connect(PLAYER1).exchangeTo(consumable.address, 100);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await consumable.allowance(exchange.address, PLAYER1.address)).toEqBN(100_000);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(898);
    expect<BigNumber>(await exchange.balanceOf(consumable.address)).toEqBN(102);

    await consumable.connect(PLAYER1).transferFrom(exchange.address, PLAYER1.address, 100_000);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(102_000);
    expect<BigNumber>(await consumable.allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(898);
    expect<BigNumber>(await exchange.balanceOf(consumable.address)).toEqBN(102);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(CONSUMABLE_MINTER).transferToken(exchange.address, 10, PLAYER1.address),
    ).toBeRevertedWith('not enough left to cover exchange');

    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(898);
    expect<BigNumber>(await exchange.balanceOf(consumable.address)).toEqBN(102);
  });

  // tslint:disable-next-line:max-line-length
  it('should not transfer from consumable with asymmetrical exchange rates if there would not be enough to exchangeFrom', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable = await createConvertibleConsumable(exchange.address, { name: 'Consumable' }, '', 1000, 1_000_000);

    await mintConsumable(exchange, PLAYER1.address, 1000);

    await exchange.connect(PLAYER1).exchangeTo(consumable.address, 2);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable.allowance(exchange.address, PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(998);
    expect<BigNumber>(await exchange.balanceOf(consumable.address)).toEqBN(2);

    await consumable.connect(PLAYER1).transferFrom(exchange.address, PLAYER1.address, 2000);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await consumable.allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(998);
    expect<BigNumber>(await exchange.balanceOf(consumable.address)).toEqBN(2);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(CONSUMABLE_MINTER).transferToken(exchange.address, 2, PLAYER1.address),
    ).toBeRevertedWith('not enough left to cover exchange');

    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(998);
    expect<BigNumber>(await exchange.balanceOf(consumable.address)).toEqBN(2);

    await exchange.connect(PLAYER1).exchangeTo(consumable.address, 100);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await consumable.allowance(exchange.address, PLAYER1.address)).toEqBN(100_000);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(898);
    expect<BigNumber>(await exchange.balanceOf(consumable.address)).toEqBN(102);

    await consumable.connect(PLAYER1).transferFrom(exchange.address, PLAYER1.address, 100_000);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(102_000);
    expect<BigNumber>(await consumable.allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(898);
    expect<BigNumber>(await exchange.balanceOf(consumable.address)).toEqBN(102);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(CONSUMABLE_MINTER).transferToken(exchange.address, 102, PLAYER1.address),
    ).toBeRevertedWith('not enough left to cover exchange');

    expect<BigNumber>(await exchange.balanceOf(PLAYER1.address)).toEqBN(898);
    expect<BigNumber>(await exchange.balanceOf(consumable.address)).toEqBN(102);
  });
});

describe('transferItem', () => {
  shouldTransferItem(createConsumableExchange, { getSuperAdmin: () => CONSUMABLE_MINTER });
});
