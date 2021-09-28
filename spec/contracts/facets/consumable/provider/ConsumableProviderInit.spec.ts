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
import { buildSetProvidedConsumablesFunction } from '../../../../../src/contracts/consumables/provider';
import { buildDiamondFacetCut } from '../../../../../src/contracts/diamonds';
import { PLAYER1 } from '../../../../helpers/Accounts';
import { createDiamond } from '../../../../helpers/DiamondHelper';
import {
  createConsumableProvider,
  deployConsumableProviderFacet,
  deployConsumableProviderInit,
  deployTestConsumableProviderFacet,
} from '../../../../helpers/facets/ConsumableProviderFacetHelper';
import { createConsumable } from '../../../../helpers/facets/ConsumableFacetHelper';
import { createContractInfo } from '../../../../helpers/facets/ContractInfoFacetHelper';
import { asDiamondCut } from '../../../../helpers/facets/DiamondFacetHelper';

describe('setProvidedConsumables', () => {
  it('should succeed if called with no provided consumables', async () => {
    await createConsumableProvider([]);
  });

  it('should succeed if called with one provided consumable', async () => {
    const consumable = await createConsumable();

    await createConsumableProvider([{ consumable: consumable.address, amount: 10 }]);
  });

  it('should succeed if called with multiple provided consumables', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();

    await createConsumableProvider([
      { consumable: consumable1.address, amount: 10 },
      { consumable: consumable2.address, amount: 20 },
      { consumable: consumable3.address, amount: 30 },
    ]);
  });

  it('should revert if called with 0 amount', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();

    const providerDiamond = asDiamondCut(await createDiamond());

    const providerFacet = await deployConsumableProviderFacet();
    const testProviderFacet = await deployTestConsumableProviderFacet();
    const providerInit = await deployConsumableProviderInit();

    const diamondCuts = [buildDiamondFacetCut(providerFacet), buildDiamondFacetCut(testProviderFacet)];

    await expect<Promise<ContractTransaction>>(
      providerDiamond.diamondCut(
        diamondCuts,

        buildSetProvidedConsumablesFunction(providerInit, [
          { consumable: consumable1.address, amount: 100 },
          { consumable: consumable2.address, amount: 0 },
        ]),
      ),
    ).toBeRevertedWith('provided consumable amount is invalid');
  });

  it('should revert if called with non-consumables', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const genericConcept = await createContractInfo();

    const providerDiamond = asDiamondCut(await createDiamond());

    const providerFacet = await deployConsumableProviderFacet();
    const testProviderFacet = await deployTestConsumableProviderFacet();
    const providerInit = await deployConsumableProviderInit();

    const diamondCuts = [buildDiamondFacetCut(providerFacet), buildDiamondFacetCut(testProviderFacet)];

    await expect<Promise<ContractTransaction>>(
      providerDiamond.diamondCut(
        diamondCuts,

        buildSetProvidedConsumablesFunction(providerInit, [
          { consumable: consumable1.address, amount: 50 },
          { consumable: ZERO_ADDRESS, amount: 100 },
          { consumable: consumable2.address, amount: 200 },
        ]),
      ),
    ).toBeRevertedWith('provided consumable is zero address');

    await expect<Promise<ContractTransaction>>(
      providerDiamond.diamondCut(
        diamondCuts,

        buildSetProvidedConsumablesFunction(providerInit, [
          { consumable: consumable1.address, amount: 50 },
          { consumable: PLAYER1.address, amount: 100 },
          { consumable: consumable2.address, amount: 200 },
        ]),
      ),
    ).toBeReverted();

    await expect<Promise<ContractTransaction>>(
      providerDiamond.diamondCut(
        diamondCuts,

        buildSetProvidedConsumablesFunction(providerInit, [
          { consumable: consumable1.address, amount: 50 },
          { consumable: genericConcept.address, amount: 100 },
          { consumable: consumable2.address, amount: 200 },
        ]),
      ),
    ).toBeRevertedWith('Consumable must support interface');
  });
});
