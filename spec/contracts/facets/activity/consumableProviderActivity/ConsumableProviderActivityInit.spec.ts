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
import { createConsumableProviderActivity } from '../../../../helpers/facets/ConsumableProviderActivityHelper';
import { asConsumableProvider } from '../../../../helpers/facets/ConsumableProviderFacetHelper';
import { createConvertibleConsumable } from '../../../../helpers/facets/ConsumableConversionFacetHelper';
import { createConsumableExchange } from '../../../../helpers/facets/ConsumableExchangeFacetHelper';
import { toConsumableAmount } from '../../../../helpers/facets/ConsumableFacetHelper';

describe('initialize', () => {
  it('should succeed if called with no provided consumables', async () => {
    const activity = await createConsumableProviderActivity();

    expect<ConsumableAmount[]>(
      (await asConsumableProvider(activity).providedConsumables()).map(toConsumableAmount),
    ).toEqual([]);
  });

  it('should succeed if called with provided consumables', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = await createConvertibleConsumable(exchange, { registerWithExchange: true });
    const consumable2 = await createConvertibleConsumable(exchange, { registerWithExchange: true });
    const consumable3 = await createConvertibleConsumable(exchange, { registerWithExchange: true });

    const activity = await createConsumableProviderActivity([
      { consumable: consumable1.address, amount: 10 },
      { consumable: consumable2.address, amount: 20 },
      { consumable: consumable3.address, amount: 30 },
    ]);

    expect<ConsumableAmount[]>(
      (await asConsumableProvider(activity).providedConsumables()).map(toConsumableAmount),
    ).toEqual([
      { consumable: consumable1.address, amount: 10 },
      { consumable: consumable2.address, amount: 20 },
      { consumable: consumable3.address, amount: 30 },
    ]);
  });
});
