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
import { buildDiamondFacetCut } from '../../../../../src/contracts/core/diamonds';
import { CONSUMABLE_CONSUMER_INTERFACE_ID } from '../../../../../src/contracts/erc165InterfaceIds';
import { PLAYER1, PLAYER2, PLAYER3 } from '../../../../helpers/Accounts';
import { deployDiamond } from '../../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../../helpers/ERC165Helper';
import {
  createConsumableConsumer,
  createTestConsumableConsumer,
  deployConsumableConsumerFacet,
} from '../../../../helpers/facets/ConsumableConsumerFacetHelper';
import {
  asConsumableMint,
  createConsumable,
  toConsumableAmount,
} from '../../../../helpers/facets/ConsumableFacetHelper';
import { asErc165, deployErc165Facet } from '../../../../helpers/facets/ERC165FacetHelper';

describe('supportsInterface', () => {
  const createDiamondForErc165 = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deployConsumableConsumerFacet()),
      ]),
    );

  shouldSupportInterface('ConsumableConsumer', createDiamondForErc165, CONSUMABLE_CONSUMER_INTERFACE_ID);
});

describe('requiredConsumables', () => {
  it('should return empty when no consumables required', async () => {
    const consumer = await createConsumableConsumer([]);

    expect<ConsumableAmountBN[]>(await consumer.requiredConsumables()).toEqual([]);
  });

  it('should return the consumables required', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();

    const requiredConsumables = [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ];
    const consumer = await createConsumableConsumer(requiredConsumables);

    expect<ConsumableAmount[]>((await consumer.requiredConsumables()).map(toConsumableAmount)).toEqual(
      requiredConsumables,
    );
  });
});

describe('consumeConsumables', () => {
  it('should transfer the right amount consumables from the providers', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();

    const consumer = await createTestConsumableConsumer([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
      { consumable: consumable3.address, amount: 300 },
    ]);

    await asConsumableMint(consumable1).mint(PLAYER1.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER1.address, 1000);
    await asConsumableMint(consumable3).mint(PLAYER1.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(consumer.address, 100);
    await consumable2.connect(PLAYER1).increaseAllowance(consumer.address, 200);
    await consumable3.connect(PLAYER1).increaseAllowance(consumer.address, 300);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(1000);

    await consumer.consumeConsumables([PLAYER1.address]);

    expect<BigNumber>(await consumable1.balanceOf(consumer.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.balanceOf(consumer.address)).toEqBN(200);
    expect<BigNumber>(await consumable3.balanceOf(consumer.address)).toEqBN(300);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(800);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(700);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, consumer.address)).toEqBN(0);

    await asConsumableMint(consumable1).mint(PLAYER2.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER2.address, 1000);
    await asConsumableMint(consumable3).mint(PLAYER2.address, 1000);

    await consumable1.connect(PLAYER2).increaseAllowance(consumer.address, 100);
    await consumable2.connect(PLAYER2).increaseAllowance(consumer.address, 200);
    await consumable3.connect(PLAYER2).increaseAllowance(consumer.address, 300);

    await consumer.consumeConsumables([PLAYER2.address]);

    expect<BigNumber>(await consumable1.balanceOf(consumer.address)).toEqBN(200);
    expect<BigNumber>(await consumable2.balanceOf(consumer.address)).toEqBN(400);
    expect<BigNumber>(await consumable3.balanceOf(consumer.address)).toEqBN(600);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER2.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER2.address)).toEqBN(800);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER2.address)).toEqBN(700);

    await consumable1.connect(PLAYER1).increaseAllowance(consumer.address, 100);
    await consumable2.connect(PLAYER1).increaseAllowance(consumer.address, 200);
    await consumable3.connect(PLAYER1).increaseAllowance(consumer.address, 300);

    await consumer.consumeConsumables([PLAYER1.address]);

    expect<BigNumber>(await consumable1.balanceOf(consumer.address)).toEqBN(300);
    expect<BigNumber>(await consumable2.balanceOf(consumer.address)).toEqBN(600);
    expect<BigNumber>(await consumable3.balanceOf(consumer.address)).toEqBN(900);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(800);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(600);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(400);

    await consumable1.connect(PLAYER1).increaseAllowance(consumer.address, 50);
    await consumable2.connect(PLAYER1).increaseAllowance(consumer.address, 100);
    await consumable3.connect(PLAYER1).increaseAllowance(consumer.address, 100);

    await consumable1.connect(PLAYER2).increaseAllowance(consumer.address, 50);
    await consumable2.connect(PLAYER2).increaseAllowance(consumer.address, 100);
    await consumable3.connect(PLAYER2).increaseAllowance(consumer.address, 100);

    await asConsumableMint(consumable3).mint(PLAYER3.address, 1000);

    await consumable3.connect(PLAYER3).increaseAllowance(consumer.address, 100);

    await consumer.consumeConsumables([PLAYER1.address, PLAYER2.address, PLAYER3.address]);

    expect<BigNumber>(await consumable1.balanceOf(consumer.address)).toEqBN(400);
    expect<BigNumber>(await consumable2.balanceOf(consumer.address)).toEqBN(800);
    expect<BigNumber>(await consumable3.balanceOf(consumer.address)).toEqBN(1200);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(750);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(500);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(300);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER2.address)).toEqBN(850);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER2.address)).toEqBN(700);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER2.address)).toEqBN(600);

    expect<BigNumber>(await consumable3.balanceOf(PLAYER3.address)).toEqBN(900);
  });

  it('should transfer as much as the providers are willing to give', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();

    const consumer = await createTestConsumableConsumer([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
      { consumable: consumable3.address, amount: 300 },
    ]);

    await asConsumableMint(consumable1).mint(PLAYER1.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER1.address, 1000);
    await asConsumableMint(consumable3).mint(PLAYER1.address, 1000);

    await asConsumableMint(consumable1).mint(PLAYER2.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER2.address, 1000);
    await asConsumableMint(consumable3).mint(PLAYER2.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(consumer.address, 500);
    await consumable2.connect(PLAYER1).increaseAllowance(consumer.address, 500);
    await consumable3.connect(PLAYER1).increaseAllowance(consumer.address, 500);

    await consumable1.connect(PLAYER2).increaseAllowance(consumer.address, 500);
    await consumable2.connect(PLAYER2).increaseAllowance(consumer.address, 500);
    await consumable3.connect(PLAYER2).increaseAllowance(consumer.address, 500);

    await consumer.consumeConsumables([PLAYER1.address, PLAYER2.address]);

    expect<BigNumber>(await consumable1.balanceOf(consumer.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(consumer.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(consumer.address)).toEqBN(1000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(500);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(500);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(500);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, consumer.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER2.address)).toEqBN(500);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER2.address)).toEqBN(500);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER2.address)).toEqBN(500);

    expect<BigNumber>(await consumable1.allowance(PLAYER2.address, consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER2.address, consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(PLAYER2.address, consumer.address)).toEqBN(0);
  });

  it('should not transfer consumables to the receiver when there is not enough of all', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();

    const consumer = await createTestConsumableConsumer([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
      { consumable: consumable3.address, amount: 300 },
    ]);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(0);

    await expect<Promise<ContractTransaction>>(consumer.consumeConsumables([PLAYER1.address])).toBeRevertedWith(
      'Consumer: Not enough consumable to transfer',
    );

    expect<BigNumber>(await consumable1.balanceOf(consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(consumer.address)).toEqBN(0);

    await asConsumableMint(consumable1).mint(PLAYER1.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER1.address, 1000);
    await asConsumableMint(consumable3).mint(PLAYER1.address, 1000);

    await asConsumableMint(consumable1).mint(PLAYER2.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER2.address, 1000);
    await asConsumableMint(consumable3).mint(PLAYER2.address, 1000);

    await expect<Promise<ContractTransaction>>(consumer.consumeConsumables([PLAYER1.address])).toBeRevertedWith(
      'Consumer: Not enough consumable to transfer',
    );

    expect<BigNumber>(await consumable1.balanceOf(consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(consumer.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(1000);

    await consumable1.connect(PLAYER1).increaseAllowance(consumer.address, 99);
    await consumable2.connect(PLAYER1).increaseAllowance(consumer.address, 200);
    await consumable3.connect(PLAYER1).increaseAllowance(consumer.address, 299);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(1000);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, consumer.address)).toEqBN(99);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, consumer.address)).toEqBN(200);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, consumer.address)).toEqBN(299);

    await expect<Promise<ContractTransaction>>(consumer.consumeConsumables([PLAYER1.address])).toBeRevertedWith(
      'Consumer: Not enough consumable to transfer',
    );

    expect<BigNumber>(await consumable1.balanceOf(consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(consumer.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(1000);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, consumer.address)).toEqBN(99);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, consumer.address)).toEqBN(200);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, consumer.address)).toEqBN(299);

    await consumable1.connect(PLAYER2).increaseAllowance(consumer.address, 1);

    await expect<Promise<ContractTransaction>>(
      consumer.consumeConsumables([PLAYER1.address, PLAYER2.address]),
    ).toBeRevertedWith('Consumer: Not enough consumable to transfer');

    expect<BigNumber>(await consumable1.balanceOf(consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(consumer.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(1000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER2.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER2.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER2.address)).toEqBN(1000);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, consumer.address)).toEqBN(99);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, consumer.address)).toEqBN(200);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, consumer.address)).toEqBN(299);

    expect<BigNumber>(await consumable1.allowance(PLAYER2.address, consumer.address)).toEqBN(1);

    await consumable1.connect(PLAYER1).increaseAllowance(consumer.address, 1);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, consumer.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, consumer.address)).toEqBN(200);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, consumer.address)).toEqBN(299);

    await expect<Promise<ContractTransaction>>(consumer.consumeConsumables([PLAYER1.address])).toBeRevertedWith(
      'Consumer: Not enough consumable to transfer',
    );

    expect<BigNumber>(await consumable1.balanceOf(consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(consumer.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(consumer.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(1000);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, consumer.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, consumer.address)).toEqBN(200);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, consumer.address)).toEqBN(299);
  });
});
