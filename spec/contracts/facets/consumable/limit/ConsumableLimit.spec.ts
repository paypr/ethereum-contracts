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
import { buildDiamondFacetCut } from '../../../../../src/contracts/diamonds';
import { CONSUMABLE_EXCHANGE_INTERFACE_ID } from '../../../../../src/contracts/erc165InterfaceIds';
import { PLAYER1, PLAYER2, PLAYER3 } from '../../../../helpers/Accounts';
import { deployDiamond } from '../../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../../helpers/ERC165Helper';
import { deployConsumableExchangeFacet } from '../../../../helpers/facets/ConsumableExchangeFacetHelper';
import { asConsumable, asConsumableMint } from '../../../../helpers/facets/ConsumableFacetHelper';
import {
  asConsumableLimiter,
  buildLimiterConsumableAdditions,
  createLimitedConsumable,
} from '../../../../helpers/facets/ConsumableLimitFacetHelper';
import { asErc165, deployErc165Facet } from '../../../../helpers/facets/ERC165FacetHelper';

describe('supportsInterface', () => {
  const createDiamondForErc165 = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deployConsumableExchangeFacet()),
      ]),
    );

  shouldSupportInterface('Consumable', createDiamondForErc165, CONSUMABLE_EXCHANGE_INTERFACE_ID);
});

describe('limitOf', () => {
  it('should return 0 when no accounts with limit', async () => {
    const consumable = await createLimitedConsumable();

    expect<BigNumber>(await consumable.limitOf(PLAYER1.address)).toEqBN(0);
  });

  it('should return 0 for an account with no limit', async () => {
    const consumable = await createLimitedConsumable(await buildLimiterConsumableAdditions());

    const consumableLimiter = asConsumableLimiter(consumable);

    await consumableLimiter.increaseLimit(PLAYER2.address, 100);

    expect<BigNumber>(await consumable.limitOf(PLAYER1.address)).toEqBN(0);
  });

  it('should return the correct limit for an account with a limit', async () => {
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
});

describe('myLimit', () => {
  it('should return 0 when no accounts with limit', async () => {
    const consumable = await createLimitedConsumable();

    expect<BigNumber>(await consumable.connect(PLAYER1).myLimit()).toEqBN(0);
  });

  it('should return 0 for an account with no limit', async () => {
    const consumable = await createLimitedConsumable(await buildLimiterConsumableAdditions());

    const consumableLimiter = asConsumableLimiter(consumable);

    await consumableLimiter.increaseLimit(PLAYER2.address, 100);

    expect<BigNumber>(await consumable.connect(PLAYER1).myLimit()).toEqBN(0);
  });

  it('should return the correct limit for an account with a limit', async () => {
    const consumable = await createLimitedConsumable(await buildLimiterConsumableAdditions());

    const consumableLimiter = asConsumableLimiter(consumable);

    await consumableLimiter.increaseLimit(PLAYER1.address, 100);

    expect<BigNumber>(await consumable.connect(PLAYER1).myLimit()).toEqBN(100);

    await consumableLimiter.increaseLimit(PLAYER2.address, 200);

    expect<BigNumber>(await consumable.connect(PLAYER2).myLimit()).toEqBN(200);

    await consumableLimiter.increaseLimit(PLAYER1.address, 50);

    expect<BigNumber>(await consumable.connect(PLAYER1).myLimit()).toEqBN(150);
    expect<BigNumber>(await consumable.connect(PLAYER2).myLimit()).toEqBN(200);
  });
});

describe('mint', () => {
  it('should give coins to the player when they have a specific limit', async () => {
    const consumable = await createLimitedConsumable(await buildLimiterConsumableAdditions());

    const consumableMint = asConsumableMint(consumable);

    const consumableLimiter = asConsumableLimiter(consumable);

    await consumableLimiter.increaseLimit(PLAYER1.address, 100);
    await consumableLimiter.increaseLimit(PLAYER2.address, 200);
    await consumableLimiter.increaseLimit(PLAYER3.address, 300);

    await consumableMint.mint(PLAYER1.address, 100);
    await consumableMint.mint(PLAYER2.address, 50);

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER2.address)).toEqBN(50);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER3.address)).toEqBN(0);
  });

  it('should not mint coins if the receiver will be over their limit', async () => {
    const consumable = await createLimitedConsumable(await buildLimiterConsumableAdditions());

    const consumableMint = asConsumableMint(consumable);

    await expect<Promise<ContractTransaction>>(consumableMint.mint(PLAYER1.address, 1)).toBeRevertedWith(
      'account balance over the limit',
    );

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable).totalSupply()).toEqBN(0);

    const consumableLimiter = asConsumableLimiter(consumable);

    await consumableLimiter.increaseLimit(PLAYER1.address, 50);

    await expect<Promise<ContractTransaction>>(consumableMint.mint(PLAYER1.address, 51)).toBeRevertedWith(
      'account balance over the limit',
    );

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable).totalSupply()).toEqBN(0);

    await expect<Promise<ContractTransaction>>(consumableMint.mint(PLAYER1.address, 100)).toBeRevertedWith(
      'account balance over the limit',
    );

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable).totalSupply()).toEqBN(0);
  });
});

describe('transfer', () => {
  it('should transfer if the receiver will not be over the limit', async () => {
    const consumable = await createLimitedConsumable(await buildLimiterConsumableAdditions());

    const consumableMint = asConsumableMint(consumable);

    const consumableLimiter = asConsumableLimiter(consumable);

    await consumableLimiter.increaseLimit(PLAYER1.address, 200);
    await consumableLimiter.increaseLimit(PLAYER2.address, 500);

    await consumableMint.mint(PLAYER1.address, 100);
    await consumableMint.mint(PLAYER2.address, 500);

    await asConsumable(consumable, PLAYER2).transfer(PLAYER1.address, 50);

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(150);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER2.address)).toEqBN(450);

    await asConsumable(consumable, PLAYER2).transfer(PLAYER1.address, 50);

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(200);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER2.address)).toEqBN(400);

    await asConsumable(consumable, PLAYER1).transfer(PLAYER2.address, 75);

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(125);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER2.address)).toEqBN(475);

    await asConsumable(consumable, PLAYER1).transfer(PLAYER2.address, 25);

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER2.address)).toEqBN(500);
  });

  it('should not transfer if the receiver would go over the limit', async () => {
    const consumable = await createLimitedConsumable(await buildLimiterConsumableAdditions());

    const consumableMint = asConsumableMint(consumable);

    const consumableLimiter = asConsumableLimiter(consumable);

    await consumableLimiter.increaseLimit(PLAYER2.address, 500);
    await consumableMint.mint(PLAYER2.address, 450);

    await expect<Promise<ContractTransaction>>(
      asConsumable(consumable, PLAYER2).transfer(PLAYER1.address, 1),
    ).toBeRevertedWith('account balance over the limit');

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER2.address)).toEqBN(450);

    await consumableLimiter.increaseLimit(PLAYER1.address, 200);
    await consumableMint.mint(PLAYER1.address, 100);

    await expect<Promise<ContractTransaction>>(
      asConsumable(consumable, PLAYER2).transfer(PLAYER1.address, 101),
    ).toBeRevertedWith('account balance over the limit');

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER2.address)).toEqBN(450);

    await expect<Promise<ContractTransaction>>(
      asConsumable(consumable, PLAYER2).transfer(PLAYER1.address, 150),
    ).toBeRevertedWith('account balance over the limit');

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER2.address)).toEqBN(450);

    await expect<Promise<ContractTransaction>>(
      asConsumable(consumable, PLAYER1).transfer(PLAYER2.address, 51),
    ).toBeRevertedWith('account balance over the limit');

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER2.address)).toEqBN(450);

    await expect<Promise<ContractTransaction>>(
      asConsumable(consumable, PLAYER1).transfer(PLAYER2.address, 100),
    ).toBeRevertedWith('account balance over the limit');

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER2.address)).toEqBN(450);
  });
});

describe('transferFrom', () => {
  it('should transfer if the receiver will not be over the limit', async () => {
    const consumable = await createLimitedConsumable(await buildLimiterConsumableAdditions());

    const consumableMint = asConsumableMint(consumable);
    const consumableLimiter = asConsumableLimiter(consumable);

    await consumableLimiter.increaseLimit(PLAYER1.address, 200);
    await consumableLimiter.increaseLimit(PLAYER2.address, 500);

    await consumableMint.mint(PLAYER1.address, 100);
    await consumableMint.mint(PLAYER2.address, 500);

    await asConsumable(consumable, PLAYER2).increaseAllowance(PLAYER1.address, 50);
    await asConsumable(consumable, PLAYER1).transferFrom(PLAYER2.address, PLAYER1.address, 50);

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(150);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER2.address)).toEqBN(450);

    await asConsumable(consumable, PLAYER2).increaseAllowance(PLAYER1.address, 50);
    await asConsumable(consumable, PLAYER1).transferFrom(PLAYER2.address, PLAYER1.address, 50);

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(200);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER2.address)).toEqBN(400);

    await asConsumable(consumable, PLAYER1).increaseAllowance(PLAYER2.address, 75);
    await asConsumable(consumable, PLAYER2).transferFrom(PLAYER1.address, PLAYER2.address, 75);

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(125);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER2.address)).toEqBN(475);

    await asConsumable(consumable, PLAYER1).increaseAllowance(PLAYER2.address, 25);
    await asConsumable(consumable, PLAYER2).transferFrom(PLAYER1.address, PLAYER2.address, 25);

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER2.address)).toEqBN(500);
  });

  it('should not transfer if the receiver would go over the limit', async () => {
    const consumable = await createLimitedConsumable(await buildLimiterConsumableAdditions());

    const consumableMint = asConsumableMint(consumable);
    const consumableLimiter = asConsumableLimiter(consumable);

    await consumableLimiter.increaseLimit(PLAYER2.address, 500);
    await consumableMint.mint(PLAYER2.address, 450);

    await asConsumable(consumable, PLAYER2).increaseAllowance(PLAYER1.address, 1);
    await expect<Promise<ContractTransaction>>(
      asConsumable(consumable, PLAYER1).transferFrom(PLAYER2.address, PLAYER1.address, 1),
    ).toBeRevertedWith('account balance over the limit');

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER2.address)).toEqBN(450);

    await consumableLimiter.increaseLimit(PLAYER1.address, 200);
    await consumableMint.mint(PLAYER1.address, 100);

    await asConsumable(consumable, PLAYER2).increaseAllowance(PLAYER1.address, 101);
    await expect<Promise<ContractTransaction>>(
      asConsumable(consumable, PLAYER1).transferFrom(PLAYER2.address, PLAYER1.address, 101),
    ).toBeRevertedWith('account balance over the limit');

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER2.address)).toEqBN(450);

    await asConsumable(consumable, PLAYER2).increaseAllowance(PLAYER1.address, 49);
    await expect<Promise<ContractTransaction>>(
      asConsumable(consumable, PLAYER1).transferFrom(PLAYER2.address, PLAYER1.address, 150),
    ).toBeRevertedWith('account balance over the limit');

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER2.address)).toEqBN(450);

    await asConsumable(consumable, PLAYER1).increaseAllowance(PLAYER2.address, 51);
    await expect<Promise<ContractTransaction>>(
      asConsumable(consumable, PLAYER1).transferFrom(PLAYER1.address, PLAYER2.address, 51),
    ).toBeRevertedWith('account balance over the limit');

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER2.address)).toEqBN(450);

    await asConsumable(consumable, PLAYER1).increaseAllowance(PLAYER2.address, 49);
    await expect<Promise<ContractTransaction>>(
      asConsumable(consumable, PLAYER1).transferFrom(PLAYER1.address, PLAYER2.address, 100),
    ).toBeRevertedWith('account balance over the limit');

    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER2.address)).toEqBN(450);
  });
});
