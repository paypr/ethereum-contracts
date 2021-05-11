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
import { PLAYER1, PLAYER2 } from '../../../../helpers/Accounts';
import { buildConsumableConsumerActivityAdditions } from '../../../../helpers/facets/ConsumableConsumerActivityHelper';
import { asConsumableMint, createConsumable } from '../../../../helpers/facets/ConsumableFacetHelper';
import { createConsumableProviderActivity } from '../../../../helpers/facets/ConsumableProviderActivityHelper';

describe('execute', () => {
  it('should provide correct consumable to player', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();

    const activity = await createConsumableProviderActivity([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ]);

    await asConsumableMint(consumable1).mint(activity.address, 1000);
    await asConsumableMint(consumable2).mint(activity.address, 1000);

    await activity.connect(PLAYER1).execute([]);

    expect<BigNumber>(await consumable1.allowance(activity.address, PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(activity.address, PLAYER1.address)).toEqBN(200);
  });

  it('should send and receive correct consumables from/to player', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();

    const activity = await createConsumableProviderActivity(
      [
        { consumable: consumable2.address, amount: 50 },
        { consumable: consumable3.address, amount: 75 },
      ],
      await buildConsumableConsumerActivityAdditions([
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ]),
    );

    await asConsumableMint(consumable1).mint(PLAYER1.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER1.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(activity.address, 100);
    await consumable2.connect(PLAYER1).increaseAllowance(activity.address, 200);

    await asConsumableMint(consumable3).mint(activity.address, 1000);

    await activity.connect(PLAYER1).execute([]);

    expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(200);
    expect<BigNumber>(await consumable3.balanceOf(activity.address)).toEqBN(1000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(800);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, activity.address)).toEqBN(0);

    expect<BigNumber>(await consumable2.allowance(activity.address, PLAYER1.address)).toEqBN(50);
    expect<BigNumber>(await consumable3.allowance(activity.address, PLAYER1.address)).toEqBN(75);

    await consumable2.connect(PLAYER1).transferFrom(activity.address, PLAYER1.address, 50);
    await consumable3.connect(PLAYER1).transferFrom(activity.address, PLAYER1.address, 75);

    await asConsumableMint(consumable1).mint(PLAYER2.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER2.address, 1000);

    await consumable1.connect(PLAYER2).increaseAllowance(activity.address, 100);
    await consumable2.connect(PLAYER2).increaseAllowance(activity.address, 200);

    await activity.connect(PLAYER2).execute([]);

    expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(200);
    expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(350);
    expect<BigNumber>(await consumable3.balanceOf(activity.address)).toEqBN(925);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER2.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER2.address)).toEqBN(800);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER2.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.allowance(PLAYER2.address, activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER2.address, activity.address)).toEqBN(0);

    expect<BigNumber>(await consumable2.allowance(activity.address, PLAYER2.address)).toEqBN(50);
    expect<BigNumber>(await consumable3.allowance(activity.address, PLAYER2.address)).toEqBN(75);

    await consumable2.connect(PLAYER2).transferFrom(activity.address, PLAYER2.address, 50);
    await consumable3.connect(PLAYER2).transferFrom(activity.address, PLAYER2.address, 75);

    await consumable1.connect(PLAYER1).increaseAllowance(activity.address, 60);
    await consumable2.connect(PLAYER1).increaseAllowance(activity.address, 110);

    await consumable1.connect(PLAYER2).increaseAllowance(activity.address, 40);
    await consumable2.connect(PLAYER2).increaseAllowance(activity.address, 90);

    await activity.connect(PLAYER1).execute([PLAYER2.address]);

    expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(300);
    expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(500);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(840);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(740);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER2.address)).toEqBN(860);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER2.address)).toEqBN(760);

    expect<BigNumber>(await consumable2.allowance(activity.address, PLAYER1.address)).toEqBN(50);
    expect<BigNumber>(await consumable3.allowance(activity.address, PLAYER1.address)).toEqBN(75);

    await consumable2.connect(PLAYER1).transferFrom(activity.address, PLAYER1.address, 50);
    await consumable3.connect(PLAYER1).transferFrom(activity.address, PLAYER1.address, 75);
  });

  it('should not send any consumables to player if any requirements are not met', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();

    const activity = await createConsumableProviderActivity(
      [
        { consumable: consumable2.address, amount: 50 },
        { consumable: consumable3.address, amount: 75 },
      ],
      await buildConsumableConsumerActivityAdditions([
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ]),
    );

    await asConsumableMint(consumable1).mint(PLAYER1.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER1.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(activity.address, 99);
    await consumable2.connect(PLAYER1).increaseAllowance(activity.address, 199);

    await asConsumableMint(consumable3).mint(activity.address, 1000);

    await expect<Promise<ContractTransaction>>(activity.connect(PLAYER1).execute([])).toBeRevertedWith(
      'Consumer: Not enough consumable to transfer',
    );

    expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(activity.address)).toEqBN(1000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, activity.address)).toEqBN(99);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, activity.address)).toEqBN(199);

    expect<BigNumber>(await consumable2.allowance(activity.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(activity.address, PLAYER1.address)).toEqBN(0);

    await consumable1.connect(PLAYER1).increaseAllowance(activity.address, 1);

    await expect<Promise<ContractTransaction>>(activity.connect(PLAYER1).execute([])).toBeRevertedWith(
      'Consumer: Not enough consumable to transfer',
    );

    expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(activity.address)).toEqBN(1000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, activity.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, activity.address)).toEqBN(199);

    expect<BigNumber>(await consumable2.allowance(activity.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(activity.address, PLAYER1.address)).toEqBN(0);
  });

  it('should not send any consumables to player if not enough of any consumable to provide', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();

    const activity = await createConsumableProviderActivity(
      [
        { consumable: consumable2.address, amount: 300 },
        { consumable: consumable3.address, amount: 75 },
      ],
      await buildConsumableConsumerActivityAdditions([
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ]),
    );

    await asConsumableMint(consumable1).mint(PLAYER1.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER1.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(activity.address, 100);
    await consumable2.connect(PLAYER1).increaseAllowance(activity.address, 200);

    await asConsumableMint(consumable2).mint(activity.address, 299);
    await asConsumableMint(consumable3).mint(activity.address, 74);

    await expect<Promise<ContractTransaction>>(activity.connect(PLAYER1).execute([])).toBeRevertedWith(
      'Not enough consumable to provide',
    );

    expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(299);
    expect<BigNumber>(await consumable3.balanceOf(activity.address)).toEqBN(74);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, activity.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, activity.address)).toEqBN(200);

    expect<BigNumber>(await consumable2.allowance(activity.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(activity.address, PLAYER1.address)).toEqBN(0);

    await asConsumableMint(consumable2).mint(activity.address, 1);

    await expect<Promise<ContractTransaction>>(activity.connect(PLAYER1).execute([])).toBeRevertedWith(
      'Not enough consumable to provide',
    );

    expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(300);
    expect<BigNumber>(await consumable3.balanceOf(activity.address)).toEqBN(74);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, activity.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, activity.address)).toEqBN(200);

    expect<BigNumber>(await consumable2.allowance(activity.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(activity.address, PLAYER1.address)).toEqBN(0);
  });
});
