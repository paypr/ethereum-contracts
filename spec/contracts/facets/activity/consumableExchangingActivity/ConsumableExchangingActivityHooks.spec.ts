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
import { HELPER1, PLAYER1, PLAYER2 } from '../../../../helpers/Accounts';
import { createConvertibleConsumable } from '../../../../helpers/facets/ConsumableConversionFacetHelper';
import { createConsumableExchange } from '../../../../helpers/facets/ConsumableExchangeFacetHelper';
import { createConsumableExchangingActivity } from '../../../../helpers/facets/ConsumableExchangingActivityHelper';
import { asConsumable, asConsumableMint } from '../../../../helpers/facets/ConsumableFacetHelper';

describe('execute', () => {
  it('should receive correct consumable from player', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = asConsumable(
      await createConvertibleConsumable(exchange, {
        intrinsicValueExchangeRate: 100,
        registerWithExchange: true,
      }),
    );
    const consumable2 = asConsumable(
      await createConvertibleConsumable(exchange, {
        intrinsicValueExchangeRate: 50,
        registerWithExchange: true,
      }),
    );

    const activity = await createConsumableExchangingActivity(exchange, [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ]);

    await asConsumableMint(exchange).mint(consumable1.address, 1000);
    await asConsumableMint(exchange).mint(consumable2.address, 1000);

    await asConsumableMint(consumable1).mint(PLAYER1.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER1.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(activity.address, 100);
    await consumable2.connect(PLAYER1).increaseAllowance(activity.address, 200);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, activity.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, activity.address)).toEqBN(200);

    await activity.connect(PLAYER1).execute([]);

    expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(activity.address)).toEqBN(5);

    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable1.address)).toEqBN(999);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable2.address)).toEqBN(996);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(800);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, activity.address)).toEqBN(0);
  });

  it('should send and receive correct consumables from/to player', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = asConsumable(
      await createConvertibleConsumable(exchange, {
        intrinsicValueExchangeRate: 100,
        registerWithExchange: true,
      }),
    );
    const consumable2 = asConsumable(
      await createConvertibleConsumable(exchange, {
        intrinsicValueExchangeRate: 50,
        registerWithExchange: true,
      }),
    );
    const consumable3 = asConsumable(
      await createConvertibleConsumable(exchange, {
        intrinsicValueExchangeRate: 25,
        registerWithExchange: true,
      }),
    );

    const activity = await createConsumableExchangingActivity(
      exchange,
      [
        { consumable: consumable1.address, amount: 100 }, // 1
        { consumable: consumable2.address, amount: 200 }, // 4
      ],
      [
        { consumable: consumable2.address, amount: 50 }, // 1
        { consumable: consumable3.address, amount: 75 }, // 3
      ],
    );

    await asConsumableMint(exchange).mint(consumable1.address, 1000);
    await asConsumableMint(exchange).mint(consumable2.address, 1000);

    await asConsumableMint(consumable1).mint(PLAYER1.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER1.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(activity.address, 100);
    await consumable2.connect(PLAYER1).increaseAllowance(activity.address, 200);

    await activity.connect(PLAYER1).execute([]);

    expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(50);
    expect<BigNumber>(await consumable3.balanceOf(activity.address)).toEqBN(75);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(activity.address)).toEqBN(1);

    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable1.address)).toEqBN(999);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable2.address)).toEqBN(997);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable3.address)).toEqBN(3);

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

    expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(50);
    expect<BigNumber>(await consumable3.balanceOf(activity.address)).toEqBN(75);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(activity.address)).toEqBN(2);

    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable1.address)).toEqBN(998);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable2.address)).toEqBN(994);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable3.address)).toEqBN(6);

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

    expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(50);
    expect<BigNumber>(await consumable3.balanceOf(activity.address)).toEqBN(75);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(activity.address)).toEqBN(3);

    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable1.address)).toEqBN(997);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable2.address)).toEqBN(991);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable3.address)).toEqBN(9);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(840);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(740);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(75);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER2.address)).toEqBN(860);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER2.address)).toEqBN(760);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER2.address)).toEqBN(75);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, activity.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.allowance(PLAYER2.address, activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER2.address, activity.address)).toEqBN(0);

    expect<BigNumber>(await consumable2.allowance(activity.address, PLAYER1.address)).toEqBN(50);
    expect<BigNumber>(await consumable3.allowance(activity.address, PLAYER1.address)).toEqBN(75);

    expect<BigNumber>(await consumable2.allowance(activity.address, PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(activity.address, PLAYER2.address)).toEqBN(0);

    await consumable2.connect(PLAYER1).transferFrom(activity.address, PLAYER1.address, 50);
    await consumable3.connect(PLAYER1).transferFrom(activity.address, PLAYER1.address, 75);
  });

  it('should send and receive correct consumables from/to player with asymmetrical exchange rates', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = asConsumable(
      await createConvertibleConsumable(exchange, {
        intrinsicValueExchangeRate: 100,
        purchasePriceExchangeRate: 10,
        registerWithExchange: true,
      }),
    );
    const consumable2 = asConsumable(
      await createConvertibleConsumable(exchange, {
        intrinsicValueExchangeRate: 50,
        purchasePriceExchangeRate: 50,
        registerWithExchange: true,
      }),
    );
    const consumable3 = asConsumable(
      await createConvertibleConsumable(exchange, {
        intrinsicValueExchangeRate: 250,
        purchasePriceExchangeRate: 25,
        registerWithExchange: true,
      }),
    );

    const activity = await createConsumableExchangingActivity(
      exchange,
      [
        { consumable: consumable1.address, amount: 100 }, // 1
        { consumable: consumable2.address, amount: 200 }, // 4
      ],
      [
        { consumable: consumable2.address, amount: 50 }, // 1
        { consumable: consumable3.address, amount: 75 }, // 3
      ],
    );

    await asConsumableMint(exchange).mint(consumable1.address, 1000);
    await asConsumableMint(exchange).mint(consumable2.address, 1000);

    await asConsumableMint(consumable1).mint(PLAYER1.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER1.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(activity.address, 100);
    await consumable2.connect(PLAYER1).increaseAllowance(activity.address, 200);

    await activity.connect(PLAYER1).execute([]);

    expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(50);
    expect<BigNumber>(await consumable3.balanceOf(activity.address)).toEqBN(75);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(activity.address)).toEqBN(1);

    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable1.address)).toEqBN(999);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable2.address)).toEqBN(997);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable3.address)).toEqBN(3);

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

    expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(50);
    expect<BigNumber>(await consumable3.balanceOf(activity.address)).toEqBN(75);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(activity.address)).toEqBN(2);

    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable1.address)).toEqBN(998);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable2.address)).toEqBN(994);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable3.address)).toEqBN(6);

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

    expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(50);
    expect<BigNumber>(await consumable3.balanceOf(activity.address)).toEqBN(75);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(activity.address)).toEqBN(3);

    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable1.address)).toEqBN(997);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable2.address)).toEqBN(991);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable3.address)).toEqBN(9);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(840);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(740);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(75);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER2.address)).toEqBN(860);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER2.address)).toEqBN(760);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER2.address)).toEqBN(75);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, activity.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.allowance(PLAYER2.address, activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER2.address, activity.address)).toEqBN(0);

    expect<BigNumber>(await consumable2.allowance(activity.address, PLAYER1.address)).toEqBN(50);
    expect<BigNumber>(await consumable3.allowance(activity.address, PLAYER1.address)).toEqBN(75);

    expect<BigNumber>(await consumable2.allowance(activity.address, PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(activity.address, PLAYER2.address)).toEqBN(0);

    await consumable2.connect(PLAYER1).transferFrom(activity.address, PLAYER1.address, 50);
    await consumable3.connect(PLAYER1).transferFrom(activity.address, PLAYER1.address, 75);
  });

  it('should receive all consumables from player and helpers', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = asConsumable(
      await createConvertibleConsumable(exchange, {
        intrinsicValueExchangeRate: 30,
        registerWithExchange: true,
      }),
    );
    const consumable2 = asConsumable(
      await createConvertibleConsumable(exchange, {
        intrinsicValueExchangeRate: 50,
        registerWithExchange: true,
      }),
    );
    const consumable3 = asConsumable(
      await createConvertibleConsumable(exchange, {
        intrinsicValueExchangeRate: 60,
        registerWithExchange: true,
      }),
    );

    const activity = await createConsumableExchangingActivity(
      exchange,
      [
        { consumable: consumable1.address, amount: 100 }, // 3
        { consumable: consumable2.address, amount: 200 }, // 4
      ],
      [
        { consumable: consumable2.address, amount: 50 }, // 1
        { consumable: consumable3.address, amount: 75 }, // 2
      ],
    );

    await asConsumableMint(exchange).mint(consumable1.address, 1000);
    await asConsumableMint(exchange).mint(consumable2.address, 1000);

    await asConsumableMint(consumable1).mint(PLAYER1.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER1.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(activity.address, 100);
    await consumable2.connect(PLAYER1).increaseAllowance(activity.address, 200);

    await asConsumableMint(consumable1).mint(HELPER1.address, 1000);
    await asConsumableMint(consumable2).mint(HELPER1.address, 1000);

    await consumable1.connect(HELPER1).increaseAllowance(activity.address, 100);
    await consumable2.connect(HELPER1).increaseAllowance(activity.address, 200);

    await activity.connect(PLAYER1).execute([HELPER1.address]);

    expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(20);
    expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(50);
    expect<BigNumber>(await consumable3.balanceOf(activity.address)).toEqBN(120);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(activity.address)).toEqBN(11);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(800);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(HELPER1.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(HELPER1.address)).toEqBN(800);
    expect<BigNumber>(await consumable3.balanceOf(HELPER1.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, activity.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.allowance(PLAYER2.address, activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER2.address, activity.address)).toEqBN(0);

    expect<BigNumber>(await consumable2.allowance(activity.address, PLAYER1.address)).toEqBN(50);
    expect<BigNumber>(await consumable3.allowance(activity.address, PLAYER1.address)).toEqBN(75);

    await consumable2.connect(PLAYER1).transferFrom(activity.address, PLAYER1.address, 50);
    await consumable3.connect(PLAYER1).transferFrom(activity.address, PLAYER1.address, 75);
  });

  it('should not send any consumables to player if any requirements are not met', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = asConsumable(
      await createConvertibleConsumable(exchange, {
        registerWithExchange: true,
      }),
    );
    const consumable2 = asConsumable(
      await createConvertibleConsumable(exchange, {
        registerWithExchange: true,
      }),
    );
    const consumable3 = asConsumable(
      await createConvertibleConsumable(exchange, {
        registerWithExchange: true,
      }),
    );

    const activity = await createConsumableExchangingActivity(
      exchange,
      [
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ],
      [
        { consumable: consumable2.address, amount: 50 },
        { consumable: consumable3.address, amount: 75 },
      ],
    );

    await asConsumableMint(exchange).mint(consumable1.address, 1000);
    await asConsumableMint(consumable1).mint(PLAYER1.address, 1000);

    await asConsumableMint(exchange).mint(consumable2.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER1.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(activity.address, 99);
    await consumable2.connect(PLAYER1).increaseAllowance(activity.address, 199);

    await asConsumableMint(exchange).mint(consumable3.address, 1000);
    await asConsumableMint(consumable3).mint(activity.address, 1000);

    await expect<Promise<ContractTransaction>>(activity.connect(PLAYER1).execute([])).toBeRevertedWith(
      'Not enough consumable to transfer',
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

  it('should not send any consumables to player if not enough of exchange to convert', async () => {
    const exchange = await createConsumableExchange();

    const consumable1 = asConsumable(
      await createConvertibleConsumable(exchange, {
        intrinsicValueExchangeRate: 50,
        registerWithExchange: true,
      }),
    );
    const consumable2 = asConsumable(
      await createConvertibleConsumable(exchange, {
        intrinsicValueExchangeRate: 100,
        registerWithExchange: true,
      }),
    );
    const consumable3 = asConsumable(
      await createConvertibleConsumable(exchange, {
        intrinsicValueExchangeRate: 75,
        registerWithExchange: true,
      }),
    );

    const activity = await createConsumableExchangingActivity(
      exchange,
      [
        { consumable: consumable1.address, amount: 100 }, // 2 @ 50
        { consumable: consumable2.address, amount: 200 }, // 2 @ 100
      ],
      [
        { consumable: consumable2.address, amount: 300 }, // 3 @ 100
        { consumable: consumable3.address, amount: 75 }, // 1 @ 75
      ],
    );

    await asConsumableMint(exchange).mint(consumable1.address, 20);

    await asConsumableMint(exchange).mint(consumable2.address, 10);

    await consumable1.connect(PLAYER1).increaseAllowance(activity.address, 100);
    await consumable2.connect(PLAYER1).increaseAllowance(activity.address, 200);

    await asConsumableMint(exchange).burn(consumable1.address, 19);
    await asConsumableMint(exchange).burn(consumable2.address, 9);

    await expect<Promise<ContractTransaction>>(activity.connect(PLAYER1).execute([])).toBeRevertedWith(
      'transfer amount exceeds balance',
    );

    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable1.address)).toEqBN(1);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable2.address)).toEqBN(1);

    expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(activity.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(activity.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, activity.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, activity.address)).toEqBN(200);

    expect<BigNumber>(await consumable2.allowance(activity.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(activity.address, PLAYER1.address)).toEqBN(0);

    await asConsumableMint(exchange).mint(consumable1.address, 1);

    await expect<Promise<ContractTransaction>>(activity.connect(PLAYER1).execute([])).toBeRevertedWith(
      'transfer amount exceeds balance',
    );

    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable1.address)).toEqBN(2);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable2.address)).toEqBN(1);

    expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(activity.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(activity.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, activity.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, activity.address)).toEqBN(200);

    expect<BigNumber>(await consumable2.allowance(activity.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(activity.address, PLAYER1.address)).toEqBN(0);
  });
});
