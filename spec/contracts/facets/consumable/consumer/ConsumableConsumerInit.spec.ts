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

import { ContractTransaction } from 'ethers';
import { ZERO_ADDRESS } from '../../../../../src/contracts/accounts';
import { ConsumableAmount } from '../../../../../src/contracts/consumables';
import { buildSetRequiredConsumablesFunction } from '../../../../../src/contracts/consumables/consumer';
import { buildDiamondFacetCut } from '../../../../../src/contracts/core/diamonds';
import { PLAYER1 } from '../../../../helpers/Accounts';
import { createDiamond } from '../../../../helpers/DiamondHelper';
import {
  createConsumableConsumer,
  deployConsumableConsumerFacet,
  deployConsumableConsumerInit,
  deployTestConsumableConsumerFacet,
} from '../../../../helpers/facets/ConsumableConsumerFacetHelper';
import { createConsumable, toConsumableAmount } from '../../../../helpers/facets/ConsumableFacetHelper';
import { createContractInfo } from '../../../../helpers/facets/ContractInfoFacetHelper';
import { asDiamondCut } from '../../../../helpers/facets/DiamondFacetHelper';

describe('setRequiredConsumables', () => {
  it('should succeed if called with no required consumables', async () => {
    const consumer = await createConsumableConsumer([]);

    expect<ConsumableAmount[]>((await consumer.requiredConsumables()).map(toConsumableAmount)).toEqual([]);
  });

  it('should succeed if called with one required consumable', async () => {
    const consumable = await createConsumable();

    const consumer = await createConsumableConsumer([{ consumable: consumable.address, amount: 10 }]);

    expect<ConsumableAmount[]>((await consumer.requiredConsumables()).map(toConsumableAmount)).toEqual([
      { consumable: consumable.address, amount: 10 },
    ]);
  });

  it('should succeed if called with multiple required consumables', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();

    const consumer = await createConsumableConsumer([
      { consumable: consumable1.address, amount: 10 },
      { consumable: consumable2.address, amount: 20 },
      { consumable: consumable3.address, amount: 30 },
    ]);

    expect<ConsumableAmount[]>((await consumer.requiredConsumables()).map(toConsumableAmount)).toEqual([
      { consumable: consumable1.address, amount: 10 },
      { consumable: consumable2.address, amount: 20 },
      { consumable: consumable3.address, amount: 30 },
    ]);
  });

  it('should revert if called with 0 amount', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();

    const consumerDiamond = asDiamondCut(await createDiamond());

    const consumerFacet = await deployConsumableConsumerFacet();
    const testConsumerFacet = await deployTestConsumableConsumerFacet();
    const consumerInit = await deployConsumableConsumerInit();

    const diamondCuts = [buildDiamondFacetCut(consumerFacet), buildDiamondFacetCut(testConsumerFacet)];

    await expect<Promise<ContractTransaction>>(
      consumerDiamond.diamondCut(
        diamondCuts,

        buildSetRequiredConsumablesFunction(consumerInit, [
          { consumable: consumable1.address, amount: 100 },
          { consumable: consumable2.address, amount: 0 },
        ]),
      ),
    ).toBeRevertedWith('required consumable amount is invalid');
  });

  it('should revert if called with non-consumables', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const genericConcept = await createContractInfo();

    const consumerDiamond = asDiamondCut(await createDiamond());

    const consumerFacet = await deployConsumableConsumerFacet();
    const testConsumerFacet = await deployTestConsumableConsumerFacet();
    const consumerInit = await deployConsumableConsumerInit();

    const diamondCuts = [buildDiamondFacetCut(consumerFacet), buildDiamondFacetCut(testConsumerFacet)];

    await expect<Promise<ContractTransaction>>(
      consumerDiamond.diamondCut(
        diamondCuts,

        buildSetRequiredConsumablesFunction(consumerInit, [
          { consumable: consumable1.address, amount: 50 },
          { consumable: ZERO_ADDRESS, amount: 100 },
          { consumable: consumable2.address, amount: 200 },
        ]),
      ),
    ).toBeRevertedWith('required consumable is zero address');

    await expect<Promise<ContractTransaction>>(
      consumerDiamond.diamondCut(
        diamondCuts,

        buildSetRequiredConsumablesFunction(consumerInit, [
          { consumable: consumable1.address, amount: 50 },
          { consumable: PLAYER1.address, amount: 100 },
          { consumable: consumable2.address, amount: 200 },
        ]),
      ),
    ).toBeReverted();

    await expect<Promise<ContractTransaction>>(
      consumerDiamond.diamondCut(
        diamondCuts,

        buildSetRequiredConsumablesFunction(consumerInit, [
          { consumable: consumable1.address, amount: 50 },
          { consumable: genericConcept.address, amount: 100 },
          { consumable: consumable2.address, amount: 200 },
        ]),
      ),
    ).toBeRevertedWith('Consumable must support interface');
  });
});
