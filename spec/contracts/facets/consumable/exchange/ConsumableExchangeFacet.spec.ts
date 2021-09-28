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
import { buildConsumableConversionInitFunction } from '../../../../../src/contracts/consumables/conversion';
import { ExchangeRate } from '../../../../../src/contracts/consumables/exchange';
import {
  buildDiamondFacetCut,
  DiamondFacetCutAction,
  emptyDiamondInitFunction,
} from '../../../../../src/contracts/diamonds';
import { CONSUMABLE_EXCHANGE_INTERFACE_ID } from '../../../../../src/contracts/erc165InterfaceIds';
import { PLAYER1, PLAYER2 } from '../../../../helpers/Accounts';
import { deployDiamond } from '../../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../../helpers/ERC165Helper';
import {
  createConvertibleConsumable,
  deployConsumableConversionConsumableHooks,
  deployConsumableConversionFacet,
  deployConsumableConversionInit,
  deployConsumableConversionTransferHooks,
} from '../../../../helpers/facets/ConsumableConversionFacetHelper';
import {
  createConsumableExchange,
  deployConsumableExchangeFacet,
  toExchangeRateAsync,
} from '../../../../helpers/facets/ConsumableExchangeFacetHelper';
import { asConsumable, asConsumableMint, createConsumable } from '../../../../helpers/facets/ConsumableFacetHelper';
import { asDiamondCut } from '../../../../helpers/facets/DiamondFacetHelper';
import { asDisableable, buildDisableableDiamondAdditions } from '../../../../helpers/facets/DisableableFacetHelper';
import { asErc165, deployErc165Facet } from '../../../../helpers/facets/ERC165FacetHelper';
import { asTransferring, buildTransferringDiamondAdditions } from '../../../../helpers/facets/TransferFacetHelper';

describe('supportsInterface', () => {
  const createDiamondForErc165 = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deployConsumableExchangeFacet()),
      ]),
    );

  shouldSupportInterface('Consumable', createDiamondForErc165, CONSUMABLE_EXCHANGE_INTERFACE_ID);
});

describe('totalConvertibles', () => {
  it('should return all convertibles that are registered', async () => {
    const exchange = await createConsumableExchange();

    expect<BigNumber>(await exchange.totalConvertibles()).toEqBN(0);

    await createConvertibleConsumable(exchange, { registerWithExchange: true });
    expect<BigNumber>(await exchange.totalConvertibles()).toEqBN(1);

    await createConvertibleConsumable(exchange, { registerWithExchange: false });
    expect<BigNumber>(await exchange.totalConvertibles()).toEqBN(1);

    await createConvertibleConsumable(exchange, { registerWithExchange: true });
    expect<BigNumber>(await exchange.totalConvertibles()).toEqBN(2);
  });
});

describe('convertibleAt', () => {
  it('should return the convertible at the proper index', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = await createConvertibleConsumable(exchange, { registerWithExchange: true });
    expect<string>(await exchange.convertibleAt(0)).toEqual(consumable1.address);

    await createConvertibleConsumable(exchange, { registerWithExchange: false });
    expect<string>(await exchange.convertibleAt(0)).toEqual(consumable1.address);

    const consumable3 = await createConvertibleConsumable(exchange, { registerWithExchange: true });
    expect<string>(await exchange.convertibleAt(0)).toEqual(consumable1.address);
    expect<string>(await exchange.convertibleAt(1)).toEqual(consumable3.address);
  });

  it('should revert for index out of bounds', async () => {
    const exchange = await createConsumableExchange();

    await createConvertibleConsumable(exchange, { registerWithExchange: true });
    await createConvertibleConsumable(exchange, { registerWithExchange: false });
    await createConvertibleConsumable(exchange, { registerWithExchange: true });

    await expect<Promise<string>>(exchange.convertibleAt(2)).toBeRevertedWith(
      'Array accessed at an out-of-bounds or negative index',
    );
    await expect<Promise<string>>(exchange.convertibleAt(10)).toBeRevertedWith(
      'Array accessed at an out-of-bounds or negative index',
    );
    await expect<Promise<string>>(exchange.convertibleAt(-1)).toBeRevertedWith(
      'Array accessed at an out-of-bounds or negative index',
    );
  });
});

describe('isConvertible', () => {
  it('should return false if not registered', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();

    expect<boolean>(await exchange.isConvertible(consumable1.address)).toBe(false);
    expect<boolean>(await exchange.isConvertible(consumable2.address)).toBe(false);
  });

  it('should return true if registered', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = await createConsumable();

    const consumable2 = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 1000,
      purchasePriceExchangeRate: 1000,
      registerWithExchange: true,
    });

    expect<boolean>(await exchange.isConvertible(consumable1.address)).toBe(false);
    expect<boolean>(await exchange.isConvertible(consumable2.address)).toBe(true);

    const consumable3 = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 1000,
      purchasePriceExchangeRate: 1000,
      registerWithExchange: true,
    });

    expect<boolean>(await exchange.isConvertible(consumable1.address)).toBe(false);
    expect<boolean>(await exchange.isConvertible(consumable2.address)).toBe(true);
    expect<boolean>(await exchange.isConvertible(consumable3.address)).toBe(true);
  });
});

describe('exchangeRateOf', () => {
  it('should return 0 if not set', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();

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
    const exchange = await createConsumableExchange();

    const consumable1 = await createConsumable();

    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable1.address))).toEqual({
      purchasePrice: 0,
      intrinsicValue: 0,
    });

    const consumable2 = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 2000,
      purchasePriceExchangeRate: 1000,
      registerWithExchange: true,
    });

    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable1.address))).toEqual({
      purchasePrice: 0,
      intrinsicValue: 0,
    });
    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable2.address))).toEqual({
      purchasePrice: 1000,
      intrinsicValue: 2000,
    });

    const consumable3 = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 2_000_000,
      purchasePriceExchangeRate: 1_000_000,
      registerWithExchange: true,
    });

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
    const exchange = await createConsumableExchange();

    const consumable1 = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 2000,
      purchasePriceExchangeRate: 1000,
      registerWithExchange: true,
    });

    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable1.address))).toEqual({
      purchasePrice: 1000,
      intrinsicValue: 2000,
    });

    const consumable2 = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 2_000_000,
      purchasePriceExchangeRate: 1_000_000,
      registerWithExchange: true,
    });

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
    const exchange = await createConsumableExchange();

    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();

    const conversionFacet = await deployConsumableConversionFacet();
    const conversionInit = await deployConsumableConversionInit();
    const conversionConsumableHooks = await deployConsumableConversionConsumableHooks();
    const conversionTransferHooks = await deployConsumableConversionTransferHooks();

    await expect<ContractTransaction>(
      await asDiamondCut(consumable1).diamondCut(
        [buildDiamondFacetCut(conversionFacet)],
        buildConsumableConversionInitFunction(conversionInit, {
          conversionConsumableHooks,
          conversionTransferHooks,
          exchangeToken: exchange,
          intrinsicValueExchangeRate: 2000,
          purchasePriceExchangeRate: 1000,
          registerWithExchange: true,
        }),
      ),
    ).toHaveEmittedWith(exchange, 'ExchangeRateChanged', [consumable1.address, '1000', '2000']);

    await expect<ContractTransaction>(
      await asDiamondCut(consumable2).diamondCut(
        [buildDiamondFacetCut(conversionFacet)],
        buildConsumableConversionInitFunction(conversionInit, {
          conversionConsumableHooks,
          conversionTransferHooks,
          exchangeToken: exchange,
          intrinsicValueExchangeRate: 2_000_000,
          purchasePriceExchangeRate: 1_000_000,
          registerWithExchange: true,
        }),
      ),
    ).toHaveEmittedWith(exchange, 'ExchangeRateChanged', [consumable2.address, '1000000', '2000000']);
  });

  it('should revert if exchange rate is 0', async () => {
    const exchange = await createConsumableExchange();

    await expect<Promise<ContractTransaction>>(exchange.connect(PLAYER1).registerToken(0, 1)).toBeRevertedWith(
      'must register with a purchase price exchange rate',
    );
    await expect<Promise<ContractTransaction>>(exchange.connect(PLAYER1).registerToken(1, 0)).toBeRevertedWith(
      'must register with an intrinsic value exchange rate',
    );
  });

  it('should revert if the token is already registered', async () => {
    const exchange = await createConsumableExchange();

    const conversionFacet = await deployConsumableConversionFacet();
    const conversionInit = await deployConsumableConversionInit();
    const conversionConsumableHooks = await deployConsumableConversionConsumableHooks();
    const conversionTransferHooks = await deployConsumableConversionTransferHooks();

    const consumable = await createConvertibleConsumable(exchange, {
      conversionFacet,
      conversionInit,
      conversionConsumableHooks,
      conversionTransferHooks,
      intrinsicValueExchangeRate: 1000,
      purchasePriceExchangeRate: 1000,
      registerWithExchange: true,
    });

    await asDiamondCut(consumable).diamondCut(
      [buildDiamondFacetCut(conversionFacet, DiamondFacetCutAction.Remove)],
      emptyDiamondInitFunction,
    );

    await expect<Promise<ContractTransaction>>(
      asDiamondCut(consumable).diamondCut(
        [buildDiamondFacetCut(conversionFacet)],
        buildConsumableConversionInitFunction(conversionInit, {
          conversionConsumableHooks,
          conversionTransferHooks,
          exchangeToken: exchange,
          intrinsicValueExchangeRate: 1000,
          purchasePriceExchangeRate: 1000,
          registerWithExchange: true,
        }),
      ),
    ).toBeRevertedWith('cannot register already registered token');
  });
});

describe('exchangeTo', () => {
  it('should exchange the token at the exchange rate', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 2000,
      purchasePriceExchangeRate: 1000,
      registerWithExchange: true,
    });
    const consumable2 = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 2_000_000,
      purchasePriceExchangeRate: 1_000_000,
      registerWithExchange: true,
    });

    await asConsumableMint(exchange).mint(PLAYER1.address, 1000);
    await exchange.connect(PLAYER1).exchangeTo(consumable1.address, 2);

    expect<BigNumber>(await asConsumable(consumable1).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable2).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable1).allowance(exchange.address, PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await asConsumable(consumable2).allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(998);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable1.address)).toEqBN(2);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable2.address)).toEqBN(0);

    await asConsumable(consumable1, PLAYER1).transferFrom(exchange.address, PLAYER1.address, 2000);

    expect<BigNumber>(await asConsumable(consumable1).balanceOf(PLAYER1.address)).toEqBN(2000);

    await exchange.connect(PLAYER1).exchangeTo(consumable2.address, 50);

    expect<BigNumber>(await asConsumable(consumable1).balanceOf(PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await asConsumable(consumable2).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable1).allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable2).allowance(exchange.address, PLAYER1.address)).toEqBN(50_000_000);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(948);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable1.address)).toEqBN(2);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable2.address)).toEqBN(50);

    await asConsumable(consumable2, PLAYER1).transferFrom(exchange.address, PLAYER1.address, 50_000_000);

    await exchange.connect(PLAYER1).exchangeTo(consumable1.address, 100);

    expect<BigNumber>(await asConsumable(consumable1).balanceOf(PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await asConsumable(consumable2).balanceOf(PLAYER1.address)).toEqBN(50_000_000);
    expect<BigNumber>(await asConsumable(consumable1).allowance(exchange.address, PLAYER1.address)).toEqBN(100_000);
    expect<BigNumber>(await asConsumable(consumable2).allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(848);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable1.address)).toEqBN(102);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable2.address)).toEqBN(50);

    await asConsumable(consumable1, PLAYER1).transferFrom(exchange.address, PLAYER1.address, 100_000);
  });

  it('should revert if the caller does not have enough of the exchange token', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 2000,
      purchasePriceExchangeRate: 1000,
      registerWithExchange: true,
    });
    const consumable2 = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 2_000_000,
      purchasePriceExchangeRate: 1_000_000,
      registerWithExchange: true,
    });

    await expect<Promise<ContractTransaction>>(
      exchange.connect(PLAYER1).exchangeTo(consumable1.address, 100),
    ).toBeRevertedWith('transfer amount exceeds balance');

    expect<BigNumber>(await asConsumable(consumable1).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable2).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable1).allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable2).allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable2.address)).toEqBN(0);

    await asConsumableMint(exchange).mint(PLAYER1.address, 99);

    await expect<Promise<ContractTransaction>>(
      exchange.connect(PLAYER1).exchangeTo(consumable1.address, 100),
    ).toBeRevertedWith('transfer amount exceeds balance');

    expect<BigNumber>(await asConsumable(consumable1).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable2).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable1).allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable2).allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(99);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable2.address)).toEqBN(0);

    await asConsumableMint(exchange).mint(PLAYER2.address, 1000);

    await expect<Promise<ContractTransaction>>(
      exchange.connect(PLAYER1).exchangeTo(consumable1.address, 100),
    ).toBeRevertedWith('transfer amount exceeds balance');

    expect<BigNumber>(await asConsumable(consumable1).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable2).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable1).allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable2).allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(99);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable2.address)).toEqBN(0);
  });

  // todo: need a test consumable that doesn't send enough tokens
  it.todo('should revert if the token contract does not send enough tokens');

  it('should not exchange the token if disabled', async () => {
    const exchange = await createConsumableExchange(await buildDisableableDiamondAdditions());

    const consumable = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 1000,
      purchasePriceExchangeRate: 1000,
      registerWithExchange: true,
    });

    await asConsumableMint(exchange).mint(PLAYER1.address, 1000);

    await asDisableable(exchange).disable();

    await expect<Promise<ContractTransaction>>(
      exchange.connect(PLAYER1).exchangeTo(consumable.address, 100),
    ).toBeRevertedWith('Contract is disabled');
  });
});

describe('exchangeFrom', () => {
  it('should exchange the token at the exchange rate', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 1000,
      purchasePriceExchangeRate: 100,
      registerWithExchange: true,
    });
    const consumable2 = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 1_000_000,
      purchasePriceExchangeRate: 1000,
      registerWithExchange: true,
    });

    await asConsumableMint(exchange).mint(consumable1.address, 10_000);
    await asConsumableMint(consumable1).mint(PLAYER1.address, 1_000_000);

    await asConsumableMint(exchange).mint(consumable2.address, 1_000_000);
    await asConsumableMint(consumable2).mint(PLAYER1.address, 1_000_000_000);

    await asConsumable(consumable1, PLAYER1).increaseAllowance(exchange.address, 100_000);

    await exchange.connect(PLAYER1).exchangeFrom(consumable1.address, 100_000);

    expect<BigNumber>(await asConsumable(consumable1).balanceOf(PLAYER1.address)).toEqBN(900_000);
    expect<BigNumber>(await asConsumable(consumable2).balanceOf(PLAYER1.address)).toEqBN(1_000_000_000);
    expect<BigNumber>(await asConsumable(consumable1).allowance(PLAYER1.address, exchange.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable2).allowance(PLAYER1.address, exchange.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable1.address)).toEqBN(9900);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable2.address)).toEqBN(1_000_000);

    await asConsumable(consumable2, PLAYER1).increaseAllowance(exchange.address, 200_000_000);

    await exchange.connect(PLAYER1).exchangeFrom(consumable2.address, 200_000_000);

    expect<BigNumber>(await asConsumable(consumable1).balanceOf(PLAYER1.address)).toEqBN(900_000);
    expect<BigNumber>(await asConsumable(consumable2).balanceOf(PLAYER1.address)).toEqBN(800_000_000);
    expect<BigNumber>(await asConsumable(consumable1).allowance(PLAYER1.address, exchange.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable2).allowance(PLAYER1.address, exchange.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(300);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable1.address)).toEqBN(9900);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable2.address)).toEqBN(999_800);

    await asConsumable(consumable1, PLAYER1).increaseAllowance(exchange.address, 1500);

    await exchange.connect(PLAYER1).exchangeFrom(consumable1.address, 1500);

    expect<BigNumber>(await asConsumable(consumable1).balanceOf(PLAYER1.address)).toEqBN(898_500);
    expect<BigNumber>(await asConsumable(consumable2).balanceOf(PLAYER1.address)).toEqBN(800_000_000);
    expect<BigNumber>(await asConsumable(consumable1).allowance(PLAYER1.address, exchange.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable2).allowance(PLAYER1.address, exchange.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(301);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable1.address)).toEqBN(9899);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable2.address)).toEqBN(999_800);
  });

  it('should revert if the caller has not provided enough tokens', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 1000,
      purchasePriceExchangeRate: 1000,
      registerWithExchange: true,
    });
    const consumable2 = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 1_000_000,
      purchasePriceExchangeRate: 1_000_000,
      registerWithExchange: true,
    });

    await asConsumableMint(exchange).mint(consumable1.address, 1000);
    await asConsumableMint(consumable1).mint(PLAYER1.address, 1_000_000);

    await asConsumableMint(exchange).mint(consumable2.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER1.address, 1_000_000_000);

    await expect<Promise<ContractTransaction>>(
      exchange.connect(PLAYER1).exchangeFrom(consumable1.address, 100_000),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await asConsumable(consumable1).balanceOf(PLAYER1.address)).toEqBN(1_000_000);
    expect<BigNumber>(await asConsumable(consumable2).balanceOf(PLAYER1.address)).toEqBN(1_000_000_000);
    expect<BigNumber>(await asConsumable(consumable1).allowance(PLAYER1.address, exchange.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable2).allowance(PLAYER1.address, exchange.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable1.address)).toEqBN(1000);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable2.address)).toEqBN(1000);

    await asConsumable(consumable1, PLAYER1).increaseAllowance(exchange.address, 99_999);

    await expect<Promise<ContractTransaction>>(
      exchange.connect(PLAYER1).exchangeFrom(consumable1.address, 100_000),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await asConsumable(consumable1).balanceOf(PLAYER1.address)).toEqBN(1_000_000);
    expect<BigNumber>(await asConsumable(consumable2).balanceOf(PLAYER1.address)).toEqBN(1_000_000_000);
    expect<BigNumber>(await asConsumable(consumable1).allowance(PLAYER1.address, exchange.address)).toEqBN(99_999);
    expect<BigNumber>(await asConsumable(consumable2).allowance(PLAYER1.address, exchange.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable1.address)).toEqBN(1000);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable2.address)).toEqBN(1000);

    await asConsumable(consumable2, PLAYER1).increaseAllowance(exchange.address, 1_000_000);

    await expect<Promise<ContractTransaction>>(
      exchange.connect(PLAYER1).exchangeFrom(consumable1.address, 100_000),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await asConsumable(consumable1).balanceOf(PLAYER1.address)).toEqBN(1_000_000);
    expect<BigNumber>(await asConsumable(consumable2).balanceOf(PLAYER1.address)).toEqBN(1_000_000_000);
    expect<BigNumber>(await asConsumable(consumable1).allowance(PLAYER1.address, exchange.address)).toEqBN(99_999);
    expect<BigNumber>(await asConsumable(consumable2).allowance(PLAYER1.address, exchange.address)).toEqBN(1_000_000);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable1.address)).toEqBN(1000);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable2.address)).toEqBN(1000);
  });

  // todo: need a test consumable that doesn't send enough tokens
  it.todo('should revert if the token contract does not have enough of the exchange token');

  it('should not exchange the token if disabled', async () => {
    const exchange = await createConsumableExchange(await buildDisableableDiamondAdditions());

    const consumable = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 1000,
      purchasePriceExchangeRate: 1000,
      registerWithExchange: true,
    });

    await asConsumableMint(exchange).mint(consumable.address, 1000);
    await asConsumableMint(consumable).mint(PLAYER1.address, 1_000_000);

    await asConsumable(consumable, PLAYER1).increaseAllowance(exchange.address, 100_000);

    await asDisableable(exchange).disable();

    await expect<Promise<ContractTransaction>>(
      exchange.connect(PLAYER1).exchangeFrom(consumable.address, 100_000),
    ).toBeRevertedWith('Contract is disabled');
  });
});

describe('transferToken', () => {
  it('should transfer when there are enough tokens', async () => {
    const exchange = await createConsumableExchange();

    await asConsumableMint(exchange).mint(PLAYER1.address, 1000);

    await asConsumable(exchange).connect(PLAYER1).transfer(PLAYER2.address, 100);

    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(900);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER2.address)).toEqBN(100);
  });

  it('should emit Transfer', async () => {
    const exchange = await createConsumableExchange();

    await asConsumableMint(exchange).mint(PLAYER1.address, 1000);

    await expect<ContractTransaction>(
      await asConsumable(exchange).connect(PLAYER1).transfer(PLAYER2.address, 100),
    ).toHaveEmittedWith(asConsumable(exchange), 'Transfer', [
      PLAYER1.address,
      PLAYER2.address,
      BigNumber.from(100).toString(),
    ]);
  });

  it('should not transfer if not enough consumables', async () => {
    const exchange = await createConsumableExchange();

    await expect<Promise<ContractTransaction>>(
      asConsumable(exchange).connect(PLAYER1).transfer(PLAYER2.address, 100),
    ).toBeRevertedWith('transfer amount exceeds balance');

    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER2.address)).toEqBN(0);

    await asConsumableMint(exchange).mint(PLAYER1.address, 99);

    await expect<Promise<ContractTransaction>>(
      asConsumable(exchange).connect(PLAYER1).transfer(PLAYER2.address, 100),
    ).toBeRevertedWith('transfer amount exceeds balance');

    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(99);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER2.address)).toEqBN(0);
  });

  it('should not transfer if disabled', async () => {
    const exchange = await createConsumableExchange(await buildDisableableDiamondAdditions());

    await asConsumableMint(exchange).mint(PLAYER1.address, 1000);

    await asDisableable(exchange).disable();

    await expect<Promise<ContractTransaction>>(
      asConsumable(exchange).connect(PLAYER1).transfer(PLAYER2.address, 100),
    ).toBeRevertedWith('Contract is disabled');

    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER2.address)).toEqBN(0);
  });

  it('should transfer from consumable if there would be enough to exchangeFrom', async () => {
    const exchange = await createConsumableExchange();

    const consumable = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 1000,
      purchasePriceExchangeRate: 1000,
      registerWithExchange: true,
      ...(await buildTransferringDiamondAdditions()),
    });

    await asConsumableMint(exchange).mint(PLAYER1.address, 1000);
    await asConsumableMint(exchange).mint(consumable.address, 10);

    await exchange.connect(PLAYER1).exchangeTo(consumable.address, 2);

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable).allowance(exchange.address, PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(998);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(12);

    await asConsumable(consumable, PLAYER1).transferFrom(exchange.address, PLAYER1.address, 2000);

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await asConsumable(consumable).allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(998);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(12);

    await asTransferring(consumable).transferToken(exchange.address, 5, PLAYER1.address);

    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(1003);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(7);

    await exchange.connect(PLAYER1).exchangeTo(consumable.address, 100);

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await asConsumable(consumable).allowance(exchange.address, PLAYER1.address)).toEqBN(100_000);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(903);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(107);

    await asConsumable(consumable, PLAYER1).transferFrom(exchange.address, PLAYER1.address, 100_000);

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(102_000);
    expect<BigNumber>(await asConsumable(consumable).allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(903);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(107);

    await asTransferring(consumable).transferToken(exchange.address, 5, PLAYER1.address);

    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(908);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(102);
  });

  // tslint:disable-next-line:max-line-length
  it('should transfer from consumable with asymmetrical exchange rates if there would be enough to exchangeFrom', async () => {
    const exchange = await createConsumableExchange();

    const consumable = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 1_000_000,
      purchasePriceExchangeRate: 1000,
      registerWithExchange: true,
      ...(await buildTransferringDiamondAdditions()),
    });

    await asConsumableMint(exchange).mint(PLAYER1.address, 1000);

    await exchange.connect(PLAYER1).exchangeTo(consumable.address, 2);

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable).allowance(exchange.address, PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(998);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(2);

    await asConsumable(consumable, PLAYER1).transferFrom(exchange.address, PLAYER1.address, 2000);

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await asConsumable(consumable).allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(998);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(2);

    await asTransferring(consumable).transferToken(exchange.address, 1, PLAYER1.address);

    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(999);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(1);

    await exchange.connect(PLAYER1).exchangeTo(consumable.address, 100);

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await asConsumable(consumable).allowance(exchange.address, PLAYER1.address)).toEqBN(100_000);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(899);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(101);

    await asConsumable(consumable, PLAYER1).transferFrom(exchange.address, PLAYER1.address, 100_000);

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(102_000);
    expect<BigNumber>(await asConsumable(consumable).allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(899);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(101);

    await asTransferring(consumable).transferToken(exchange.address, 100, PLAYER1.address);

    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(999);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(1);
  });

  it('should not transfer from consumable if there would not be enough to exchangeFrom', async () => {
    const exchange = await createConsumableExchange();

    const consumable = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 1000,
      purchasePriceExchangeRate: 1000,
      registerWithExchange: true,
      ...(await buildTransferringDiamondAdditions()),
    });

    await asConsumableMint(exchange).mint(PLAYER1.address, 1000);

    await exchange.connect(PLAYER1).exchangeTo(consumable.address, 2);

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable).allowance(exchange.address, PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(998);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(2);

    await asConsumable(consumable, PLAYER1).transferFrom(exchange.address, PLAYER1.address, 2000);

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await asConsumable(consumable).allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(998);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(2);

    await expect<Promise<ContractTransaction>>(
      asTransferring(consumable).transferToken(exchange.address, 2, PLAYER1.address),
    ).toBeRevertedWith('not enough left to cover exchange');

    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(998);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(2);

    await exchange.connect(PLAYER1).exchangeTo(consumable.address, 100);

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await asConsumable(consumable).allowance(exchange.address, PLAYER1.address)).toEqBN(100_000);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(898);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(102);

    await asConsumable(consumable, PLAYER1).transferFrom(exchange.address, PLAYER1.address, 100_000);

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(102_000);
    expect<BigNumber>(await asConsumable(consumable).allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(898);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(102);

    await expect<Promise<ContractTransaction>>(
      asTransferring(consumable).transferToken(exchange.address, 10, PLAYER1.address),
    ).toBeRevertedWith('not enough left to cover exchange');

    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(898);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(102);
  });

  // tslint:disable-next-line:max-line-length
  it('should not transfer from consumable with asymmetrical exchange rates if there would not be enough to exchangeFrom', async () => {
    const exchange = await createConsumableExchange();

    const consumable = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 1_000_000,
      purchasePriceExchangeRate: 1000,
      registerWithExchange: true,
      ...(await buildTransferringDiamondAdditions()),
    });

    await asConsumableMint(exchange).mint(PLAYER1.address, 1000);

    await exchange.connect(PLAYER1).exchangeTo(consumable.address, 2);

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable).allowance(exchange.address, PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(998);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(2);

    await asConsumable(consumable, PLAYER1).transferFrom(exchange.address, PLAYER1.address, 2000);

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await asConsumable(consumable).allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(998);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(2);

    await expect<Promise<ContractTransaction>>(
      asTransferring(consumable).transferToken(exchange.address, 2, PLAYER1.address),
    ).toBeRevertedWith('not enough left to cover exchange');

    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(998);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(2);

    await exchange.connect(PLAYER1).exchangeTo(consumable.address, 100);

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(2000);
    expect<BigNumber>(await asConsumable(consumable).allowance(exchange.address, PLAYER1.address)).toEqBN(100_000);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(898);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(102);

    await asConsumable(consumable, PLAYER1).transferFrom(exchange.address, PLAYER1.address, 100_000);

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(102_000);
    expect<BigNumber>(await asConsumable(consumable).allowance(exchange.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(898);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(102);

    await expect<Promise<ContractTransaction>>(
      asTransferring(consumable).transferToken(exchange.address, 102, PLAYER1.address),
    ).toBeRevertedWith('not enough left to cover exchange');

    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(898);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(102);
  });
});
