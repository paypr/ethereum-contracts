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
import { PLAYER1 } from '../../../../helpers/Accounts';
import { createConvertibleConsumable } from '../../../../helpers/facets/ConsumableConversionFacetHelper';
import { createConsumableExchange } from '../../../../helpers/facets/ConsumableExchangeFacetHelper';
import { asConsumable, asConsumableMint } from '../../../../helpers/facets/ConsumableFacetHelper';
import { asTransferring, buildTransferringDiamondAdditions } from '../../../../helpers/facets/TransferFacetHelper';

describe('transferToken', () => {
  it('should transfer exchange consumable when enough left when not registered', async () => {
    const exchange = await createConsumableExchange();

    const consumable = await createConvertibleConsumable(exchange, await buildTransferringDiamondAdditions());

    await asConsumableMint(exchange).mint(consumable.address, 1000);

    await asConsumableMint(consumable).mint(PLAYER1.address, 500);

    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(1000);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(500);

    await asTransferring(consumable).transferToken(exchange.address, 100, PLAYER1.address);

    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(900);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(500);

    await asTransferring(consumable).transferToken(exchange.address, 399, PLAYER1.address);

    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(501);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(499);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(500);

    await asTransferring(consumable).transferToken(exchange.address, 1, PLAYER1.address);

    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(500);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(500);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(500);
  });

  it('should transfer exchange consumable when enough left when registered', async () => {
    const exchange = await createConsumableExchange();

    const consumable = await createConvertibleConsumable(exchange, {
      registerWithExchange: true,
      ...(await buildTransferringDiamondAdditions()),
    });

    await asConsumableMint(exchange).mint(consumable.address, 1000);

    await asConsumableMint(consumable).mint(PLAYER1.address, 500);

    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(1000);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(500);

    await asTransferring(consumable).transferToken(exchange.address, 100, PLAYER1.address);

    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(900);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(500);

    await asTransferring(consumable).transferToken(exchange.address, 399, PLAYER1.address);

    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(501);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(499);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(500);

    await asTransferring(consumable).transferToken(exchange.address, 1, PLAYER1.address);

    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(500);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(500);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(500);
  });

  it('should not transfer exchange consumable when not enough left when not registered', async () => {
    const exchange = await createConsumableExchange();

    const consumable = await createConvertibleConsumable(exchange, await buildTransferringDiamondAdditions());

    await asConsumableMint(exchange).mint(consumable.address, 1000);

    await asConsumableMint(consumable).mint(PLAYER1.address, 1);

    await expect<Promise<ContractTransaction>>(
      asTransferring(consumable).transferToken(exchange.address, 1000, PLAYER1.address),
    ).toBeRevertedWith('Not enough exchange token available to mint');

    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(1000);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(1);

    await asConsumableMint(consumable).mint(PLAYER1.address, 499);

    await expect<Promise<ContractTransaction>>(
      asTransferring(consumable).transferToken(exchange.address, 501, PLAYER1.address),
    ).toBeRevertedWith('Not enough exchange token available to mint');

    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(1000);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(500);

    await asConsumableMint(consumable).mint(PLAYER1.address, 500);

    await expect<Promise<ContractTransaction>>(
      asTransferring(consumable).transferToken(exchange.address, 1, PLAYER1.address),
    ).toBeRevertedWith('Not enough exchange token available to mint');

    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(1000);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(1000);
  });

  it('should not transfer exchange consumable when not enough left when registered', async () => {
    const exchange = await createConsumableExchange();

    const consumable = await createConvertibleConsumable(exchange, {
      registerWithExchange: true,
      ...(await buildTransferringDiamondAdditions()),
    });

    await asConsumableMint(exchange).mint(consumable.address, 1000);

    await asConsumableMint(consumable).mint(PLAYER1.address, 1);

    await expect<Promise<ContractTransaction>>(
      asTransferring(consumable).transferToken(exchange.address, 1000, PLAYER1.address),
    ).toBeRevertedWith('not enough left to cover exchange');

    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(1000);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(1);

    await asConsumableMint(consumable).mint(PLAYER1.address, 499);

    await expect<Promise<ContractTransaction>>(
      asTransferring(consumable).transferToken(exchange.address, 501, PLAYER1.address),
    ).toBeRevertedWith('not enough left to cover exchange');

    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(1000);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(500);

    await asConsumableMint(consumable).mint(PLAYER1.address, 500);

    await expect<Promise<ContractTransaction>>(
      asTransferring(consumable).transferToken(exchange.address, 1, PLAYER1.address),
    ).toBeRevertedWith('not enough left to cover exchange');

    expect<BigNumber>(await asConsumable(exchange).balanceOf(consumable.address)).toEqBN(1000);
    expect<BigNumber>(await asConsumable(exchange).balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(consumable).balanceOf(PLAYER1.address)).toEqBN(1000);
  });
});
