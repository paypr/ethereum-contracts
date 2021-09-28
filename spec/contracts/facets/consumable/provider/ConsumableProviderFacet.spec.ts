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
import { ConsumableAmount, ConsumableAmountBN } from '../../../../../src/contracts/consumables';
import { buildDiamondFacetCut } from '../../../../../src/contracts/diamonds';
import { CONSUMABLE_PROVIDER_INTERFACE_ID } from '../../../../../src/contracts/erc165InterfaceIds';
import { PLAYER1, PLAYER2 } from '../../../../helpers/Accounts';
import { deployDiamond } from '../../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../../helpers/ERC165Helper';
import {
  asConsumableMint,
  createConsumable,
  toConsumableAmount,
} from '../../../../helpers/facets/ConsumableFacetHelper';
import {
  createConsumableProvider,
  createTestConsumableProvider,
  deployConsumableProviderFacet,
} from '../../../../helpers/facets/ConsumableProviderFacetHelper';
import { asErc165, deployErc165Facet } from '../../../../helpers/facets/ERC165FacetHelper';

describe('supportsInterface', () => {
  const createDiamondForErc165 = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deployConsumableProviderFacet()),
      ]),
    );

  shouldSupportInterface('ConsumableProvider', createDiamondForErc165, CONSUMABLE_PROVIDER_INTERFACE_ID);
});

describe('providedConsumables', () => {
  it('should return empty when no consumables required', async () => {
    const provider = await createConsumableProvider([]);

    expect<ConsumableAmountBN[]>(await provider.providedConsumables()).toEqual([]);
  });

  it('should return the consumables provided', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();

    const providedConsumables = [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ];
    const provider = await createConsumableProvider(providedConsumables);

    expect<ConsumableAmount[]>((await provider.providedConsumables()).map(toConsumableAmount)).toEqual(
      providedConsumables,
    );
  });
});

describe('canProvideMultiple', () => {
  it('should return true if there are no consumables provided', async () => {
    const provider = await createTestConsumableProvider([]);

    const result1 = await provider.canProvideMultiple(0);
    expect<boolean>(result1).toBe(true);

    const result2 = await provider.canProvideMultiple(1);
    expect<boolean>(result2).toBe(true);

    const result3 = await provider.canProvideMultiple(100);
    expect<boolean>(result3).toBe(true);
  });

  it('should return true if passed 0', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();

    const provider = await createTestConsumableProvider([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
      { consumable: consumable3.address, amount: 300 },
    ]);

    expect<BigNumber>(await consumable1.balanceOf(provider.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(provider.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(provider.address)).toEqBN(0);

    const result1 = await provider.canProvideMultiple(0);
    expect<boolean>(result1).toBe(true);

    await asConsumableMint(consumable1).mint(provider.address, 100);
    await asConsumableMint(consumable2).mint(provider.address, 200);
    await asConsumableMint(consumable3).mint(provider.address, 300);

    expect<BigNumber>(await consumable1.balanceOf(provider.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.balanceOf(provider.address)).toEqBN(200);
    expect<BigNumber>(await consumable3.balanceOf(provider.address)).toEqBN(300);

    const result2 = await provider.canProvideMultiple(0);
    expect<boolean>(result2).toBe(true);

    await asConsumableMint(consumable1).mint(provider.address, 100);
    await asConsumableMint(consumable2).mint(provider.address, 200);
    await asConsumableMint(consumable3).mint(provider.address, 300);

    expect<BigNumber>(await consumable1.balanceOf(provider.address)).toEqBN(200);
    expect<BigNumber>(await consumable2.balanceOf(provider.address)).toEqBN(400);
    expect<BigNumber>(await consumable3.balanceOf(provider.address)).toEqBN(600);

    const result3 = await provider.canProvideMultiple(0);
    expect<boolean>(result3).toBe(true);
  });

  it('should return true when there are exactly enough consumables available', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();

    const provider = await createTestConsumableProvider([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
      { consumable: consumable3.address, amount: 300 },
    ]);

    await asConsumableMint(consumable1).mint(provider.address, 100);
    await asConsumableMint(consumable2).mint(provider.address, 200);
    await asConsumableMint(consumable3).mint(provider.address, 300);

    expect<BigNumber>(await consumable1.balanceOf(provider.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.balanceOf(provider.address)).toEqBN(200);
    expect<BigNumber>(await consumable3.balanceOf(provider.address)).toEqBN(300);

    const result1 = await provider.canProvideMultiple(1);
    expect<boolean>(result1).toBe(true);

    await asConsumableMint(consumable1).mint(provider.address, 100);
    await asConsumableMint(consumable2).mint(provider.address, 200);
    await asConsumableMint(consumable3).mint(provider.address, 300);

    expect<BigNumber>(await consumable1.balanceOf(provider.address)).toEqBN(200);
    expect<BigNumber>(await consumable2.balanceOf(provider.address)).toEqBN(400);
    expect<BigNumber>(await consumable3.balanceOf(provider.address)).toEqBN(600);

    const result2 = await provider.canProvideMultiple(2);
    expect<boolean>(result2).toBe(true);

    await asConsumableMint(consumable1).mint(provider.address, 1000);
    await asConsumableMint(consumable2).mint(provider.address, 2000);
    await asConsumableMint(consumable3).mint(provider.address, 3000);

    expect<BigNumber>(await consumable1.balanceOf(provider.address)).toEqBN(1200);
    expect<BigNumber>(await consumable2.balanceOf(provider.address)).toEqBN(2400);
    expect<BigNumber>(await consumable3.balanceOf(provider.address)).toEqBN(3600);

    const result3 = await provider.canProvideMultiple(12);
    expect<boolean>(result3).toBe(true);
  });

  it('should return true when there are more than enough consumables available', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();

    const provider = await createTestConsumableProvider([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
      { consumable: consumable3.address, amount: 300 },
    ]);

    await asConsumableMint(consumable1).mint(provider.address, 101);
    await asConsumableMint(consumable2).mint(provider.address, 201);
    await asConsumableMint(consumable3).mint(provider.address, 301);

    expect<BigNumber>(await consumable1.balanceOf(provider.address)).toEqBN(101);
    expect<BigNumber>(await consumable2.balanceOf(provider.address)).toEqBN(201);
    expect<BigNumber>(await consumable3.balanceOf(provider.address)).toEqBN(301);

    const result1 = await provider.canProvideMultiple(1);
    expect<boolean>(result1).toBe(true);

    await asConsumableMint(consumable1).mint(provider.address, 200);
    await asConsumableMint(consumable2).mint(provider.address, 400);
    await asConsumableMint(consumable3).mint(provider.address, 600);

    expect<BigNumber>(await consumable1.balanceOf(provider.address)).toEqBN(301);
    expect<BigNumber>(await consumable2.balanceOf(provider.address)).toEqBN(601);
    expect<BigNumber>(await consumable3.balanceOf(provider.address)).toEqBN(901);

    const result2 = await provider.canProvideMultiple(2);
    expect<boolean>(result2).toBe(true);

    await asConsumableMint(consumable1).mint(provider.address, 1000);
    await asConsumableMint(consumable2).mint(provider.address, 2000);
    await asConsumableMint(consumable3).mint(provider.address, 3000);

    expect<BigNumber>(await consumable1.balanceOf(provider.address)).toEqBN(1301);
    expect<BigNumber>(await consumable2.balanceOf(provider.address)).toEqBN(2601);
    expect<BigNumber>(await consumable3.balanceOf(provider.address)).toEqBN(3901);

    const result3 = await provider.canProvideMultiple(10);
    expect<boolean>(result3).toBe(true);

    await asConsumableMint(consumable1).mint(provider.address, 10000);
    await asConsumableMint(consumable2).mint(provider.address, 20000);
    await asConsumableMint(consumable3).mint(provider.address, 30000);

    expect<BigNumber>(await consumable1.balanceOf(provider.address)).toEqBN(11301);
    expect<BigNumber>(await consumable2.balanceOf(provider.address)).toEqBN(22601);
    expect<BigNumber>(await consumable3.balanceOf(provider.address)).toEqBN(33901);

    const result4 = await provider.canProvideMultiple(10);
    expect<boolean>(result4).toBe(true);
  });

  it('should return false when there are no consumables available', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();

    const provider = await createTestConsumableProvider([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
      { consumable: consumable3.address, amount: 300 },
    ]);

    expect<BigNumber>(await consumable1.balanceOf(provider.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(provider.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(provider.address)).toEqBN(0);

    const result1 = await provider.canProvideMultiple(1);
    expect<boolean>(result1).toBe(false);

    const result2 = await provider.canProvideMultiple(2);
    expect<boolean>(result2).toBe(false);

    const result3 = await provider.canProvideMultiple(12);
    expect<boolean>(result3).toBe(false);
  });

  it('should return false when there are not enough consumables available', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();

    const provider = await createTestConsumableProvider([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
      { consumable: consumable3.address, amount: 300 },
    ]);

    await asConsumableMint(consumable1).mint(provider.address, 1);
    await asConsumableMint(consumable2).mint(provider.address, 1);
    await asConsumableMint(consumable3).mint(provider.address, 1);

    expect<BigNumber>(await consumable1.balanceOf(provider.address)).toEqBN(1);
    expect<BigNumber>(await consumable2.balanceOf(provider.address)).toEqBN(1);
    expect<BigNumber>(await consumable3.balanceOf(provider.address)).toEqBN(1);

    const result1 = await provider.canProvideMultiple(1);
    expect<boolean>(result1).toBe(false);

    await asConsumableMint(consumable1).mint(provider.address, 98);
    await asConsumableMint(consumable2).mint(provider.address, 198);
    await asConsumableMint(consumable3).mint(provider.address, 298);

    expect<BigNumber>(await consumable1.balanceOf(provider.address)).toEqBN(99);
    expect<BigNumber>(await consumable2.balanceOf(provider.address)).toEqBN(199);
    expect<BigNumber>(await consumable3.balanceOf(provider.address)).toEqBN(299);

    const result2 = await provider.canProvideMultiple(1);
    expect<boolean>(result2).toBe(false);

    await asConsumableMint(consumable1).mint(provider.address, 100);
    await asConsumableMint(consumable2).mint(provider.address, 200);
    await asConsumableMint(consumable3).mint(provider.address, 300);

    expect<BigNumber>(await consumable1.balanceOf(provider.address)).toEqBN(199);
    expect<BigNumber>(await consumable2.balanceOf(provider.address)).toEqBN(399);
    expect<BigNumber>(await consumable3.balanceOf(provider.address)).toEqBN(599);

    const result3 = await provider.canProvideMultiple(2);
    expect<boolean>(result3).toBe(false);

    await asConsumableMint(consumable1).mint(provider.address, 1000);
    await asConsumableMint(consumable2).mint(provider.address, 2000);
    await asConsumableMint(consumable3).mint(provider.address, 3000);

    expect<BigNumber>(await consumable1.balanceOf(provider.address)).toEqBN(1199);
    expect<BigNumber>(await consumable2.balanceOf(provider.address)).toEqBN(2399);
    expect<BigNumber>(await consumable3.balanceOf(provider.address)).toEqBN(3599);

    const result4 = await provider.canProvideMultiple(12);
    expect<boolean>(result4).toBe(false);

    await asConsumableMint(consumable1).mint(provider.address, 1);
    await asConsumableMint(consumable3).mint(provider.address, 1);

    expect<BigNumber>(await consumable1.balanceOf(provider.address)).toEqBN(1200);
    expect<BigNumber>(await consumable2.balanceOf(provider.address)).toEqBN(2399);
    expect<BigNumber>(await consumable3.balanceOf(provider.address)).toEqBN(3600);

    const result5 = await provider.canProvideMultiple(12);
    expect<boolean>(result5).toBe(false);
  });
});

describe('provideConsumables', () => {
  it('should allow the right amount of consumables to the receiver', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();

    const provider = await createTestConsumableProvider([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
      { consumable: consumable3.address, amount: 300 },
    ]);

    await asConsumableMint(consumable1).mint(provider.address, 1000);
    await asConsumableMint(consumable2).mint(provider.address, 1000);
    await asConsumableMint(consumable3).mint(provider.address, 1000);

    expect<BigNumber>(await consumable1.balanceOf(provider.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(provider.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(provider.address)).toEqBN(1000);

    await provider.provideConsumables(PLAYER1.address);

    expect<BigNumber>(await consumable1.allowance(provider.address, PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(provider.address, PLAYER1.address)).toEqBN(200);
    expect<BigNumber>(await consumable3.allowance(provider.address, PLAYER1.address)).toEqBN(300);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(provider.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(provider.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(provider.address)).toEqBN(1000);

    await provider.provideConsumables(PLAYER2.address);

    expect<BigNumber>(await consumable1.allowance(provider.address, PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(provider.address, PLAYER1.address)).toEqBN(200);
    expect<BigNumber>(await consumable3.allowance(provider.address, PLAYER1.address)).toEqBN(300);

    expect<BigNumber>(await consumable1.allowance(provider.address, PLAYER2.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(provider.address, PLAYER2.address)).toEqBN(200);
    expect<BigNumber>(await consumable3.allowance(provider.address, PLAYER2.address)).toEqBN(300);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER2.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(provider.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(provider.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(provider.address)).toEqBN(1000);

    await provider.provideConsumables(PLAYER1.address);

    expect<BigNumber>(await consumable1.allowance(provider.address, PLAYER1.address)).toEqBN(200);
    expect<BigNumber>(await consumable2.allowance(provider.address, PLAYER1.address)).toEqBN(400);
    expect<BigNumber>(await consumable3.allowance(provider.address, PLAYER1.address)).toEqBN(600);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(provider.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(provider.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(provider.address)).toEqBN(1000);
  });

  it('should not allow any consumables to the receiver when there is not enough of all', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();

    const provider = await createTestConsumableProvider([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
      { consumable: consumable3.address, amount: 300 },
    ]);

    expect<BigNumber>(await consumable1.balanceOf(provider.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(provider.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(provider.address)).toEqBN(0);

    await expect<Promise<ContractTransaction>>(provider.provideConsumables(PLAYER1.address)).toBeRevertedWith(
      'Provider: Not enough consumable to provide',
    );

    expect<BigNumber>(await consumable1.allowance(provider.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(provider.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(provider.address, PLAYER1.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(0);

    await asConsumableMint(consumable1).mint(provider.address, 99);
    await asConsumableMint(consumable2).mint(provider.address, 200);
    await asConsumableMint(consumable3).mint(provider.address, 299);

    expect<BigNumber>(await consumable1.balanceOf(provider.address)).toEqBN(99);
    expect<BigNumber>(await consumable2.balanceOf(provider.address)).toEqBN(200);
    expect<BigNumber>(await consumable3.balanceOf(provider.address)).toEqBN(299);

    await expect<Promise<ContractTransaction>>(provider.provideConsumables(PLAYER1.address)).toBeRevertedWith(
      'Provider: Not enough consumable to provide',
    );

    expect<BigNumber>(await consumable1.allowance(provider.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(provider.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(provider.address, PLAYER1.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(provider.address)).toEqBN(99);
    expect<BigNumber>(await consumable2.balanceOf(provider.address)).toEqBN(200);
    expect<BigNumber>(await consumable3.balanceOf(provider.address)).toEqBN(299);

    await asConsumableMint(consumable1).mint(provider.address, 1);

    expect<BigNumber>(await consumable1.balanceOf(provider.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.balanceOf(provider.address)).toEqBN(200);
    expect<BigNumber>(await consumable3.balanceOf(provider.address)).toEqBN(299);

    await expect<Promise<ContractTransaction>>(provider.provideConsumables(PLAYER1.address)).toBeRevertedWith(
      'Provider: Not enough consumable to provide',
    );

    expect<BigNumber>(await consumable1.allowance(provider.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(provider.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(provider.address, PLAYER1.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(provider.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.balanceOf(provider.address)).toEqBN(200);
    expect<BigNumber>(await consumable3.balanceOf(provider.address)).toEqBN(299);
  });
});
