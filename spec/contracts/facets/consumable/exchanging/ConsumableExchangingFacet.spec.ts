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
import { buildDiamondFacetCut } from '../../../../../src/contracts/core/diamonds';
import { CONSUMABLE_EXCHANGING_INTERFACE_ID } from '../../../../../src/contracts/erc165InterfaceIds';
import { deployDiamond } from '../../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../../helpers/ERC165Helper';
import { createConvertibleConsumable } from '../../../../helpers/facets/ConsumableConversionFacetHelper';
import { createConsumableExchange } from '../../../../helpers/facets/ConsumableExchangeFacetHelper';
import {
  createConsumableExchanging,
  deployConsumableExchangingFacet,
} from '../../../../helpers/facets/ConsumableExchangingFacetHelper';
import { asErc165, deployErc165Facet } from '../../../../helpers/facets/ERC165FacetHelper';

describe('supportsInterface', () => {
  const createDiamondForErc165 = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deployConsumableExchangingFacet()),
      ]),
    );

  shouldSupportInterface('ConsumableExchanging', createDiamondForErc165, CONSUMABLE_EXCHANGING_INTERFACE_ID);
});

describe('exchange', () => {
  it('should return the exchange', async () => {
    const exchange = await createConsumableExchange();

    const exchanging = await createConsumableExchanging(exchange);

    expect<string>(await exchanging.exchange()).toEqual(exchange.address);
  });
});

describe('exchangeProfit', () => {
  it('should return 0 when there are no required or provided consumables', async () => {
    const exchange = await createConsumableExchange();

    const exchanging = await createConsumableExchanging(exchange);

    expect<BigNumber>(await exchanging.exchangeProfit()).toEqBN(0);
  });

  it('should return the total amount when only required consumables', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = await createConvertibleConsumable(exchange, {
      registerWithExchange: true,
      intrinsicValueExchangeRate: 100,
    });
    const consumable2 = await createConvertibleConsumable(exchange, {
      registerWithExchange: true,
      intrinsicValueExchangeRate: 1_000,
    });
    const consumable3 = await createConvertibleConsumable(exchange, {
      registerWithExchange: true,
      intrinsicValueExchangeRate: 10_000,
    });

    const exchanging = await createConsumableExchanging(exchange, [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 2_000 },
      { consumable: consumable3.address, amount: 30_000 },
    ]);

    expect<BigNumber>(await exchanging.exchangeProfit()).toEqBN(6);
  });

  it('should return the difference', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = await createConvertibleConsumable(exchange, {
      registerWithExchange: true,
      intrinsicValueExchangeRate: 100,
    });
    const consumable2 = await createConvertibleConsumable(exchange, {
      registerWithExchange: true,
      intrinsicValueExchangeRate: 1_000,
    });
    const consumable3 = await createConvertibleConsumable(exchange, {
      registerWithExchange: true,
      intrinsicValueExchangeRate: 10_000,
    });

    const exchanging = await createConsumableExchanging(
      exchange,
      [
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 2_000 },
      ],
      [{ consumable: consumable3.address, amount: 10_000 }],
    );

    expect<BigNumber>(await exchanging.exchangeProfit()).toEqBN(2);
  });
});
