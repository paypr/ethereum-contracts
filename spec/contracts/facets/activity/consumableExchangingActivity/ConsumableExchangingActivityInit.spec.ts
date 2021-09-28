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
import { buildConsumableExchangingActivityInitFunction } from '../../../../../src/contracts/activities/consumableExchangingActivity';
import { ConsumableAmount } from '../../../../../src/contracts/consumables';
import { buildDiamondFacetCut } from '../../../../../src/contracts/core/diamonds';
import { createDiamond } from '../../../../helpers/DiamondHelper';
import { deployActivityFacet } from '../../../../helpers/facets/ActivityFacetHelper';
import { asConsumableConsumer } from '../../../../helpers/facets/ConsumableConsumerFacetHelper';
import { createConvertibleConsumable } from '../../../../helpers/facets/ConsumableConversionFacetHelper';
import { createConsumableExchange } from '../../../../helpers/facets/ConsumableExchangeFacetHelper';
import {
  createConsumableExchangingActivity,
  deployConsumableExchangingActivityHooks,
  deployConsumableExchangingActivityInit,
} from '../../../../helpers/facets/ConsumableExchangingActivityHelper';
import { asConsumableExchanging } from '../../../../helpers/facets/ConsumableExchangingFacetHelper';
import { createConsumable, toConsumableAmount } from '../../../../helpers/facets/ConsumableFacetHelper';
import { asConsumableProvider } from '../../../../helpers/facets/ConsumableProviderFacetHelper';
import { asDiamondCut } from '../../../../helpers/facets/DiamondFacetHelper';

describe('initialize', () => {
  it('should succeed if called with no required or provided consumables', async () => {
    const exchange = await createConsumableExchange();

    const activity = await createConsumableExchangingActivity(exchange);

    expect<string>(await asConsumableExchanging(activity).exchange()).toEqual(exchange.address);
    expect<ConsumableAmount[]>(
      (await asConsumableConsumer(activity).requiredConsumables()).map(toConsumableAmount),
    ).toEqual([]);
    expect<ConsumableAmount[]>(
      (await asConsumableProvider(activity).providedConsumables()).map(toConsumableAmount),
    ).toEqual([]);
    expect<BigNumber>(await asConsumableExchanging(activity).exchangeProfit()).toEqBN(0);
  });

  it('should succeed if called with required consumables', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = await createConvertibleConsumable(exchange, { registerWithExchange: true });
    const consumable2 = await createConvertibleConsumable(exchange, { registerWithExchange: true });
    const consumable3 = await createConvertibleConsumable(exchange, { registerWithExchange: true });

    const activity = await createConsumableExchangingActivity(exchange, [
      { consumable: consumable1.address, amount: 10 },
      { consumable: consumable2.address, amount: 20 },
      { consumable: consumable3.address, amount: 30 },
    ]);

    expect<string>(await asConsumableExchanging(activity).exchange()).toEqual(exchange.address);
    expect<ConsumableAmount[]>(
      (await asConsumableConsumer(activity).requiredConsumables()).map(toConsumableAmount),
    ).toEqual([
      { consumable: consumable1.address, amount: 10 },
      { consumable: consumable2.address, amount: 20 },
      { consumable: consumable3.address, amount: 30 },
    ]);
    expect<ConsumableAmount[]>(
      (await asConsumableProvider(activity).providedConsumables()).map(toConsumableAmount),
    ).toEqual([]);
    expect<BigNumber>(await asConsumableExchanging(activity).exchangeProfit()).toEqBN(60);
  });

  it('should succeed if called with provided consumables', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = await createConvertibleConsumable(exchange, { registerWithExchange: true });
    const consumable2 = await createConvertibleConsumable(exchange, { registerWithExchange: true });
    const consumable3 = await createConvertibleConsumable(exchange, { registerWithExchange: true });

    const activity = await createConsumableExchangingActivity(
      exchange,
      [{ consumable: consumable1.address, amount: 100 }],
      [
        { consumable: consumable2.address, amount: 10 },
        { consumable: consumable3.address, amount: 20 },
      ],
    );

    expect<string>(await asConsumableExchanging(activity).exchange()).toEqual(exchange.address);
    expect<ConsumableAmount[]>(
      (await asConsumableConsumer(activity).requiredConsumables()).map(toConsumableAmount),
    ).toEqual([{ consumable: consumable1.address, amount: 100 }]);
    expect<ConsumableAmount[]>(
      (await asConsumableProvider(activity).providedConsumables()).map(toConsumableAmount),
    ).toEqual([
      { consumable: consumable2.address, amount: 10 },
      { consumable: consumable3.address, amount: 20 },
    ]);
    expect<BigNumber>(await asConsumableExchanging(activity).exchangeProfit()).toEqBN(70);
  });

  it('should revert if required or provided consumables are not convertible by exchange', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = await createConvertibleConsumable(exchange, { registerWithExchange: true });
    const consumable2a = await createConsumable();
    const consumable2b = await createConvertibleConsumable(exchange);
    const consumable3 = await createConvertibleConsumable(exchange, { registerWithExchange: true });

    const activityDiamond = asDiamondCut(await createDiamond());

    const activityFacet = await deployActivityFacet();
    const activityInit = await deployConsumableExchangingActivityInit();
    const consumableExchangingActivityHooks = await deployConsumableExchangingActivityHooks();

    const diamondCuts = [buildDiamondFacetCut(activityFacet)];

    await expect<Promise<ContractTransaction>>(
      activityDiamond.diamondCut(
        diamondCuts,

        buildConsumableExchangingActivityInitFunction(activityInit, {
          exchange,
          consumableExchangingActivityHooks,
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
      activityDiamond.diamondCut(
        diamondCuts,

        buildConsumableExchangingActivityInitFunction(activityInit, {
          exchange,
          consumableExchangingActivityHooks,
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
      activityDiamond.diamondCut(
        diamondCuts,

        buildConsumableExchangingActivityInitFunction(activityInit, {
          exchange,
          consumableExchangingActivityHooks,
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
      activityDiamond.diamondCut(
        diamondCuts,

        buildConsumableExchangingActivityInitFunction(activityInit, {
          exchange,
          consumableExchangingActivityHooks,
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

    const activityDiamond = asDiamondCut(await createDiamond());

    const activityFacet = await deployActivityFacet();
    const activityInit = await deployConsumableExchangingActivityInit();
    const consumableExchangingActivityHooks = await deployConsumableExchangingActivityHooks();

    const diamondCuts = [buildDiamondFacetCut(activityFacet)];

    await expect<Promise<ContractTransaction>>(
      activityDiamond.diamondCut(
        diamondCuts,

        buildConsumableExchangingActivityInitFunction(activityInit, {
          exchange,
          consumableExchangingActivityHooks,
          requiredConsumables: [
            { consumable: consumable1.address, amount: 10 },
            { consumable: consumable2.address, amount: 20 },
          ],
          providedConsumables: [{ consumable: consumable3.address, amount: 31 }],
        }),
      ),
    ).toBeRevertedWith('Not enough exchange token consumed to be sustainable');
  });
});
