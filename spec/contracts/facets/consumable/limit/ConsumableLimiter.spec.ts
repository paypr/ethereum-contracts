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
import { combineConsumableAdditions } from '../../../../helpers/facets/ConsumableFacetHelper';
import {
  asConsumableLimiter,
  buildLimiterConsumableAdditions,
  createLimitedConsumable,
} from '../../../../helpers/facets/ConsumableLimitFacetHelper';
import { asDisableable, buildDisableableDiamondAdditions } from '../../../../helpers/facets/DisableableFacetHelper';

describe('increaseLimit', () => {
  it('should increase the limit of the account', async () => {
    const consumable = await createLimitedConsumable(await buildLimiterConsumableAdditions());

    const consumableLimiter = asConsumableLimiter(consumable);

    await consumableLimiter.increaseLimit(PLAYER1.address, 100);

    expect<BigNumber>(await consumable.limitOf(PLAYER1.address)).toEqBN(100);

    await consumableLimiter.increaseLimit(PLAYER2.address, 200);

    expect<BigNumber>(await consumable.limitOf(PLAYER2.address)).toEqBN(200);

    await consumableLimiter.increaseLimit(PLAYER1.address, 50);

    expect<BigNumber>(await consumable.limitOf(PLAYER1.address)).toEqBN(150);
    expect<BigNumber>(await consumable.limitOf(PLAYER2.address)).toEqBN(200);
  });

  it('should not change limit if would overflow', async () => {
    const consumable = await createLimitedConsumable(await buildLimiterConsumableAdditions());

    const consumableLimiter = asConsumableLimiter(consumable);

    await consumableLimiter.increaseLimit(PLAYER1.address, 100);

    await expect<Promise<ContractTransaction>>(consumableLimiter.increaseLimit(PLAYER1.address, -1)).toBeRevertedWith(
      'value out-of-bounds',
    );

    expect<BigNumber>(await consumable.limitOf(PLAYER1.address)).toEqBN(100);
  });

  it('should not change limit if not the minter', async () => {
    const consumable = await createLimitedConsumable(await buildLimiterConsumableAdditions());

    const consumableLimiter = asConsumableLimiter(consumable);

    await expect<Promise<ContractTransaction>>(
      consumableLimiter.connect(PLAYER2).increaseLimit(PLAYER1.address, 100),
    ).toBeRevertedWith('missing role');

    expect<BigNumber>(await consumable.limitOf(PLAYER1.address)).toEqBN(0);

    expect<BigNumber>(await consumable.limitOf(PLAYER2.address)).toEqBN(0);
  });

  it('should not increase the limit if disabled', async () => {
    const consumable = await createLimitedConsumable(
      combineConsumableAdditions(await buildLimiterConsumableAdditions(), await buildDisableableDiamondAdditions()),
    );

    const consumableLimiter = asConsumableLimiter(consumable);

    await asDisableable(consumable).disable();

    await expect<Promise<ContractTransaction>>(consumableLimiter.increaseLimit(PLAYER1.address, 100)).toBeRevertedWith(
      'Contract is disabled',
    );
  });
});

describe('decreaseLimit', () => {
  it('should decrease the limit of the account', async () => {
    const consumable = await createLimitedConsumable(await buildLimiterConsumableAdditions());

    const consumableLimiter = asConsumableLimiter(consumable);

    await consumableLimiter.increaseLimit(PLAYER1.address, 200);
    await consumableLimiter.increaseLimit(PLAYER2.address, 500);

    await consumableLimiter.decreaseLimit(PLAYER1.address, 100);

    expect<BigNumber>(await consumable.limitOf(PLAYER1.address)).toEqBN(100);

    await consumableLimiter.decreaseLimit(PLAYER2.address, 200);

    expect<BigNumber>(await consumable.limitOf(PLAYER2.address)).toEqBN(300);

    await consumableLimiter.decreaseLimit(PLAYER1.address, 50);

    expect<BigNumber>(await consumable.limitOf(PLAYER1.address)).toEqBN(50);
    expect<BigNumber>(await consumable.limitOf(PLAYER2.address)).toEqBN(300);
  });

  it('should not change limit if would go below 0', async () => {
    const consumable = await createLimitedConsumable(await buildLimiterConsumableAdditions());

    const consumableLimiter = asConsumableLimiter(consumable);

    await expect<Promise<ContractTransaction>>(consumableLimiter.decreaseLimit(PLAYER1.address, 1)).toBeRevertedWith(
      'decreased limit below zero',
    );

    expect<BigNumber>(await consumable.limitOf(PLAYER1.address)).toEqBN(0);

    await consumableLimiter.increaseLimit(PLAYER1.address, 100);

    await expect<Promise<ContractTransaction>>(consumableLimiter.decreaseLimit(PLAYER1.address, 101)).toBeRevertedWith(
      'decreased limit below zero',
    );

    expect<BigNumber>(await consumable.limitOf(PLAYER1.address)).toEqBN(100);
  });

  it('should not change limit if not the minter', async () => {
    const consumable = await createLimitedConsumable(await buildLimiterConsumableAdditions());

    const consumableLimiter = asConsumableLimiter(consumable);

    await consumableLimiter.increaseLimit(PLAYER1.address, 100);
    await consumableLimiter.increaseLimit(PLAYER2.address, 200);

    await expect<Promise<ContractTransaction>>(
      consumableLimiter.connect(PLAYER2).decreaseLimit(PLAYER1.address, 50),
    ).toBeRevertedWith('missing role');

    expect<BigNumber>(await consumable.limitOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable.limitOf(PLAYER2.address)).toEqBN(200);

    await expect<Promise<ContractTransaction>>(
      consumableLimiter.connect(PLAYER2).decreaseLimit(PLAYER1.address, 100),
    ).toBeRevertedWith('missing role');

    expect<BigNumber>(await consumable.limitOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable.limitOf(PLAYER2.address)).toEqBN(200);
  });

  it('should not decrease the limit if disabled', async () => {
    const consumable = await createLimitedConsumable(
      combineConsumableAdditions(await buildLimiterConsumableAdditions(), await buildDisableableDiamondAdditions()),
    );

    const consumableLimiter = asConsumableLimiter(consumable);

    await consumableLimiter.increaseLimit(PLAYER1.address, 200);

    await asDisableable(consumable).disable();

    await expect<Promise<ContractTransaction>>(consumableLimiter.decreaseLimit(PLAYER1.address, 100)).toBeRevertedWith(
      'Contract is disabled',
    );
  });
});
