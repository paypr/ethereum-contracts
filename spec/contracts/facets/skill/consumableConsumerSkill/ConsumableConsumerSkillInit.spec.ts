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
import { asConsumableConsumer } from '../../../../helpers/facets/ConsumableConsumerFacetHelper';
import { buildConsumableConsumerSkillAdditions } from '../../../../helpers/facets/ConsumableConsumerSkillHelper';
import { createConsumable, toConsumableAmount } from '../../../../helpers/facets/ConsumableFacetHelper';
import { createSkill } from '../../../../helpers/facets/SkillFacetHelper';

describe('initialize', () => {
  it('should set required consumables', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();

    const skill = await createSkill(
      await buildConsumableConsumerSkillAdditions([
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ]),
    );

    expect<ConsumableAmount[]>(
      (await asConsumableConsumer(skill).requiredConsumables()).map(toConsumableAmount),
    ).toEqual([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ]);
  });
});
