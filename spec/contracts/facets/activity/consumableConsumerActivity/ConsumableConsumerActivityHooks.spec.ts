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

import { BigNumber } from 'ethers';
import { HELPER1, HELPER2, PLAYER1 } from '../../../../helpers/Accounts';
import { createConsumableConsumerActivity } from '../../../../helpers/facets/ConsumableConsumerActivityHelper';
import { asConsumableMint, createConsumable } from '../../../../helpers/facets/ConsumableFacetHelper';

describe('execute', () => {
  it('should receive correct consumable from player', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();

    const activity = await createConsumableConsumerActivity([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ]);

    await asConsumableMint(consumable1).mint(PLAYER1.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER1.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(activity.address, 100);
    await consumable2.connect(PLAYER1).increaseAllowance(activity.address, 200);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, activity.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, activity.address)).toEqBN(200);

    await activity.connect(PLAYER1).execute([]);

    expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(200);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(800);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, activity.address)).toEqBN(0);
  });

  it('should receive all consumables from player and helpers', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();

    const activity = await createConsumableConsumerActivity([
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ]);

    await asConsumableMint(consumable1).mint(PLAYER1.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER1.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(activity.address, 50);
    await consumable2.connect(PLAYER1).increaseAllowance(activity.address, 60);

    await asConsumableMint(consumable1).mint(HELPER1.address, 1000);
    await asConsumableMint(consumable2).mint(HELPER1.address, 1000);

    await consumable1.connect(HELPER1).increaseAllowance(activity.address, 100);

    await asConsumableMint(consumable1).mint(HELPER2.address, 1000);
    await asConsumableMint(consumable2).mint(HELPER2.address, 1000);

    await consumable2.connect(HELPER2).increaseAllowance(activity.address, 200);

    await activity.connect(PLAYER1).execute([HELPER1.address, HELPER2.address]);

    expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(150);
    expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(260);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(950);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(940);

    expect<BigNumber>(await consumable1.balanceOf(HELPER1.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(HELPER1.address)).toEqBN(1000);

    expect<BigNumber>(await consumable1.balanceOf(HELPER2.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(HELPER2.address)).toEqBN(800);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, activity.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.allowance(HELPER1.address, activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(HELPER1.address, activity.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.allowance(HELPER2.address, activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(HELPER2.address, activity.address)).toEqBN(0);
  });
});
