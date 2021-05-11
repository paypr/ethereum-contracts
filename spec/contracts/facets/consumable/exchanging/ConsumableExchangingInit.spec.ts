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
import { ConsumableAmount } from '../../../../../src/contracts/consumables';
import { buildConsumableExchangingInitFunction } from '../../../../../src/contracts/consumables/exchanging';
import { buildDiamondFacetCut } from '../../../../../src/contracts/core/diamonds';
import { createDiamond } from '../../../../helpers/DiamondHelper';
import { asConsumableConsumer } from '../../../../helpers/facets/ConsumableConsumerFacetHelper';
import { createConvertibleConsumable } from '../../../../helpers/facets/ConsumableConversionFacetHelper';
import { createConsumableExchange } from '../../../../helpers/facets/ConsumableExchangeFacetHelper';
import {
  createConsumableExchanging,
  deployConsumableExchangingFacet,
  deployConsumableExchangingInit,
} from '../../../../helpers/facets/ConsumableExchangingFacetHelper';
import { createConsumable, toConsumableAmount } from '../../../../helpers/facets/ConsumableFacetHelper';
import { asConsumableProvider } from '../../../../helpers/facets/ConsumableProviderFacetHelper';
import { asDiamondCut } from '../../../../helpers/facets/DiamondFacetHelper';

describe('initialize', () => {
  it('should succeed if called with no required or provided consumables', async () => {
    const exchange = await createConsumableExchange();

    const exchanging = await createConsumableExchanging(exchange);

    expect<string>(await exchanging.exchange()).toEqual(exchange.address);
    expect<ConsumableAmount[]>(
      (await asConsumableConsumer(exchanging).requiredConsumables()).map(toConsumableAmount),
    ).toEqual([]);
    expect<ConsumableAmount[]>(
      (await asConsumableProvider(exchanging).providedConsumables()).map(toConsumableAmount),
    ).toEqual([]);
    expect<BigNumber>(await exchanging.exchangeProfit()).toEqBN(0);
  });

  it('should succeed if called with required consumables', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = await createConvertibleConsumable(exchange, { registerWithExchange: true });
    const consumable2 = await createConvertibleConsumable(exchange, { registerWithExchange: true });
    const consumable3 = await createConvertibleConsumable(exchange, { registerWithExchange: true });

    const exchanging = await createConsumableExchanging(exchange, [
      { consumable: consumable1.address, amount: 10 },
      { consumable: consumable2.address, amount: 20 },
      { consumable: consumable3.address, amount: 30 },
    ]);

    expect<string>(await exchanging.exchange()).toEqual(exchange.address);
    expect<ConsumableAmount[]>(
      (await asConsumableConsumer(exchanging).requiredConsumables()).map(toConsumableAmount),
    ).toEqual([
      { consumable: consumable1.address, amount: 10 },
      { consumable: consumable2.address, amount: 20 },
      { consumable: consumable3.address, amount: 30 },
    ]);
    expect<ConsumableAmount[]>(
      (await asConsumableProvider(exchanging).providedConsumables()).map(toConsumableAmount),
    ).toEqual([]);
    expect<BigNumber>(await exchanging.exchangeProfit()).toEqBN(60);
  });

  it('should succeed if called with provided consumables', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = await createConvertibleConsumable(exchange, { registerWithExchange: true });
    const consumable2 = await createConvertibleConsumable(exchange, { registerWithExchange: true });
    const consumable3 = await createConvertibleConsumable(exchange, { registerWithExchange: true });

    const exchanging = await createConsumableExchanging(
      exchange,
      [{ consumable: consumable1.address, amount: 100 }],
      [
        { consumable: consumable2.address, amount: 10 },
        { consumable: consumable3.address, amount: 20 },
      ],
    );

    expect<string>(await exchanging.exchange()).toEqual(exchange.address);
    expect<ConsumableAmount[]>(
      (await asConsumableConsumer(exchanging).requiredConsumables()).map(toConsumableAmount),
    ).toEqual([{ consumable: consumable1.address, amount: 100 }]);
    expect<ConsumableAmount[]>(
      (await asConsumableProvider(exchanging).providedConsumables()).map(toConsumableAmount),
    ).toEqual([
      { consumable: consumable2.address, amount: 10 },
      { consumable: consumable3.address, amount: 20 },
    ]);
    expect<BigNumber>(await exchanging.exchangeProfit()).toEqBN(70);
  });

  it('should revert if required or provided consumables are not convertible by exchange', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = await createConvertibleConsumable(exchange, { registerWithExchange: true });
    const consumable2a = await createConsumable();
    const consumable2b = await createConvertibleConsumable(exchange);
    const consumable3 = await createConvertibleConsumable(exchange, { registerWithExchange: true });

    const exchangingDiamond = asDiamondCut(await createDiamond());

    const exchangingFacet = await deployConsumableExchangingFacet();
    const exchangingInit = await deployConsumableExchangingInit();

    const diamondCuts = [buildDiamondFacetCut(exchangingFacet)];

    await expect<Promise<ContractTransaction>>(
      exchangingDiamond.diamondCut(
        diamondCuts,

        buildConsumableExchangingInitFunction(exchangingInit, {
          exchange,
          requiredConsumables: [
            { consumable: consumable1.address, amount: 10 },
            { consumable: consumable2a.address, amount: 20 },
            { consumable: consumable3.address, amount: 30 },
          ],
          providedConsumables: [],
        }),
      ),
    ).toBeRevertedWith('Consumable must be convertible by exchange');

    await expect<Promise<ContractTransaction>>(
      exchangingDiamond.diamondCut(
        diamondCuts,

        buildConsumableExchangingInitFunction(exchangingInit, {
          exchange,
          requiredConsumables: [
            { consumable: consumable1.address, amount: 10 },
            { consumable: consumable2b.address, amount: 20 },
            { consumable: consumable3.address, amount: 30 },
          ],
          providedConsumables: [],
        }),
      ),
    ).toBeRevertedWith('Consumable must be convertible by exchange');

    await expect<Promise<ContractTransaction>>(
      exchangingDiamond.diamondCut(
        diamondCuts,

        buildConsumableExchangingInitFunction(exchangingInit, {
          exchange,
          requiredConsumables: [{ consumable: consumable1.address, amount: 100 }],
          providedConsumables: [
            { consumable: consumable1.address, amount: 10 },
            { consumable: consumable2a.address, amount: 20 },
            { consumable: consumable3.address, amount: 30 },
          ],
        }),
      ),
    ).toBeRevertedWith('Consumable must be convertible by exchange');

    await expect<Promise<ContractTransaction>>(
      exchangingDiamond.diamondCut(
        diamondCuts,

        buildConsumableExchangingInitFunction(exchangingInit, {
          exchange,
          requiredConsumables: [{ consumable: consumable1.address, amount: 100 }],
          providedConsumables: [
            { consumable: consumable1.address, amount: 10 },
            { consumable: consumable2b.address, amount: 20 },
            { consumable: consumable3.address, amount: 30 },
          ],
        }),
      ),
    ).toBeRevertedWith('Consumable must be convertible by exchange');
  });

  it('should revert if not enough required consumable for exchange', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = await createConvertibleConsumable(exchange, { registerWithExchange: true });
    const consumable2 = await createConvertibleConsumable(exchange, { registerWithExchange: true });
    const consumable3 = await createConvertibleConsumable(exchange, { registerWithExchange: true });

    const exchangingDiamond = asDiamondCut(await createDiamond());

    const exchangingFacet = await deployConsumableExchangingFacet();
    const exchangingInit = await deployConsumableExchangingInit();

    const diamondCuts = [buildDiamondFacetCut(exchangingFacet)];

    await expect<Promise<ContractTransaction>>(
      exchangingDiamond.diamondCut(
        diamondCuts,

        buildConsumableExchangingInitFunction(exchangingInit, {
          exchange,
          requiredConsumables: [
            { consumable: consumable1.address, amount: 10 },
            { consumable: consumable2.address, amount: 20 },
          ],
          providedConsumables: [{ consumable: consumable3.address, amount: 31 }],
        }),
      ),
    ).toBeRevertedWith('Not enough exchange token consumed to be sustainable');
  });

  it('should revert if not sustainable with asymmetric exchange rates', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = await createConvertibleConsumable(exchange, {
      registerWithExchange: true,
      intrinsicValueExchangeRate: 300,
      purchasePriceExchangeRate: 30,
    });
    const consumable2 = await createConvertibleConsumable(exchange, {
      registerWithExchange: true,
      intrinsicValueExchangeRate: 200,
    });
    const consumable3 = await createConvertibleConsumable(exchange, {
      registerWithExchange: true,
      intrinsicValueExchangeRate: 200,
      purchasePriceExchangeRate: 100,
    });

    const exchangingDiamond = asDiamondCut(await createDiamond());

    const exchangingFacet = await deployConsumableExchangingFacet();
    const exchangingInit = await deployConsumableExchangingInit();

    const diamondCuts = [buildDiamondFacetCut(exchangingFacet)];

    await expect<Promise<ContractTransaction>>(
      exchangingDiamond.diamondCut(
        diamondCuts,

        buildConsumableExchangingInitFunction(exchangingInit, {
          exchange,
          requiredConsumables: [
            { consumable: consumable1.address, amount: 100 }, // 30_000
          ],
          providedConsumables: [
            { consumable: consumable2.address, amount: 100 }, // 20_000
            { consumable: consumable3.address, amount: 200 }, // 20_000
          ],
        }),
      ),
    ).toBeRevertedWith('Not enough exchange token consumed to be sustainable');
  });

  it('should calculate advanced exchange profit', async () => {
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
        { consumable: consumable1.address, amount: 100_000 },
        { consumable: consumable2.address, amount: 20_000 },
      ],
      [
        { consumable: consumable2.address, amount: 1000 },
        { consumable: consumable3.address, amount: 50_000 },
      ],
    );

    //   (100,000 / 100 + 20,000 / 1,000) - (1,000 / 1,000 + 50_000 / 10_000)
    // = (     1,000    +       20      ) - (      1       +        5       )
    // =              1,020               -                6
    // = 1,014

    expect<BigNumber>(await exchanging.exchangeProfit()).toEqBN(1014);
  });
});
