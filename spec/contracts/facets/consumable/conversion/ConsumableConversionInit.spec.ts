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

import { BigNumber } from 'ethers';
import ContractAddress from '../../../../../src/contracts/ContractAddress';
import { ExchangeRate } from '../../../../../src/contracts/consumables/exchange';
import { createConvertibleConsumable } from '../../../../helpers/facets/ConsumableConversionFacetHelper';
import {
  createConsumableExchange,
  toExchangeRateAsync,
} from '../../../../helpers/facets/ConsumableExchangeFacetHelper';
import { createConsumable } from '../../../../helpers/facets/ConsumableFacetHelper';

describe('initialize', () => {
  it('should set the exchange token', async () => {
    const exchange = await createConsumable();
    const convertibleConsumable = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 1000,
      purchasePriceExchangeRate: 10,
    });

    expect<ContractAddress>(await convertibleConsumable.exchangeToken()).toEqual(exchange.address);
  });

  it('should set the intrinsic value exchange rate', async () => {
    const convertibleConsumable = await createConvertibleConsumable(await createConsumable(), {
      intrinsicValueExchangeRate: 1000,
      purchasePriceExchangeRate: 10,
    });

    expect<BigNumber>(await convertibleConsumable.intrinsicValueExchangeRate()).toEqBN(1000);
  });

  it('should set the purchase price exchange rate', async () => {
    const convertibleConsumable = await createConvertibleConsumable(await createConsumable(), {
      intrinsicValueExchangeRate: 1000,
      purchasePriceExchangeRate: 10,
    });

    expect<BigNumber>(await convertibleConsumable.purchasePriceExchangeRate()).toEqBN(10);
  });

  it('should revert if the intrinsic value exchange rate is 0', async () => {
    await expect(
      createConvertibleConsumable(await createConsumable(), {
        intrinsicValueExchangeRate: 0,
        purchasePriceExchangeRate: 0,
      }),
    ).toBeRevertedWith('intrinsic value exchange rate must be > 0');
  });

  it('should revert if the purchase price exchange rate is 0', async () => {
    await expect(
      createConvertibleConsumable(await createConsumable(), {
        intrinsicValueExchangeRate: 1,
        purchasePriceExchangeRate: 0,
      }),
    ).toBeRevertedWith('purchase price exchange rate must be > 0');
  });

  it('should revert if the purchase price exchange rate is more than the intrinsic value exchange rate', async () => {
    await expect(
      createConvertibleConsumable(await createConsumable(), {
        intrinsicValueExchangeRate: 1,
        purchasePriceExchangeRate: 10,
      }),
    ).toBeRevertedWith('purchase price exchange rate must be <= intrinsic value exchange rate');
  });

  it('should register with the exchange', async () => {
    const exchange = await createConsumableExchange();

    const convertibleConsumable = await createConvertibleConsumable(exchange, {
      purchasePriceExchangeRate: 100,
      intrinsicValueExchangeRate: 200,
      registerWithExchange: true,
    });

    expect<boolean>(await exchange.isConvertible(convertibleConsumable.address)).toEqual(true);
    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(convertibleConsumable.address))).toEqual({
      purchasePrice: 100,
      intrinsicValue: 200,
    });
  });

  it('should not register with the exchange', async () => {
    const exchange = await createConsumableExchange();

    const convertibleConsumable = await createConvertibleConsumable(exchange, {
      purchasePriceExchangeRate: 100,
      intrinsicValueExchangeRate: 200,
      registerWithExchange: false,
    });

    expect<boolean>(await exchange.isConvertible(convertibleConsumable.address)).toEqual(false);
  });
});
