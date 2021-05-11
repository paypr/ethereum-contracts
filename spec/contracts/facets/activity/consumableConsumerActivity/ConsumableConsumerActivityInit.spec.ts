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

import { ConsumableAmount } from '../../../../../src/contracts/consumables';
import { createConsumableConsumerActivity } from '../../../../helpers/facets/ConsumableConsumerActivityHelper';
import { asConsumableConsumer } from '../../../../helpers/facets/ConsumableConsumerFacetHelper';
import { createConvertibleConsumable } from '../../../../helpers/facets/ConsumableConversionFacetHelper';
import { createConsumableExchange } from '../../../../helpers/facets/ConsumableExchangeFacetHelper';
import { toConsumableAmount } from '../../../../helpers/facets/ConsumableFacetHelper';

describe('initialize', () => {
  it('should succeed if called with no required consumables', async () => {
    const activity = await createConsumableConsumerActivity();

    expect<ConsumableAmount[]>(
      (await asConsumableConsumer(activity).requiredConsumables()).map(toConsumableAmount),
    ).toEqual([]);
  });

  it('should succeed if called with required consumables', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = await createConvertibleConsumable(exchange, { registerWithExchange: true });
    const consumable2 = await createConvertibleConsumable(exchange, { registerWithExchange: true });
    const consumable3 = await createConvertibleConsumable(exchange, { registerWithExchange: true });

    const activity = await createConsumableConsumerActivity([
      { consumable: consumable1.address, amount: 10 },
      { consumable: consumable2.address, amount: 20 },
      { consumable: consumable3.address, amount: 30 },
    ]);

    expect<ConsumableAmount[]>(
      (await asConsumableConsumer(activity).requiredConsumables()).map(toConsumableAmount),
    ).toEqual([
      { consumable: consumable1.address, amount: 10 },
      { consumable: consumable2.address, amount: 20 },
      { consumable: consumable3.address, amount: 30 },
    ]);
  });
});
