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
import { ZERO_ADDRESS } from '../../../../../src/contracts/accounts';
import { buildDiamondFacetCut } from '../../../../../src/contracts/diamonds';
import { CONSUMABLE_CONVERSION_INTERFACE_ID } from '../../../../../src/contracts/erc165InterfaceIds';
import { PLAYER1, PLAYER2, PLAYER3 } from '../../../../helpers/Accounts';
import { deployDiamond } from '../../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../../helpers/ERC165Helper';
import {
  createConvertibleConsumable,
  deployConsumableConversionFacet,
} from '../../../../helpers/facets/ConsumableConversionFacetHelper';
import { createConsumableExchange } from '../../../../helpers/facets/ConsumableExchangeFacetHelper';
import { asConsumable, asConsumableMint, createConsumable } from '../../../../helpers/facets/ConsumableFacetHelper';
import { asDisableable, buildDisableableDiamondAdditions } from '../../../../helpers/facets/DisableableFacetHelper';
import { asErc165, deployErc165Facet } from '../../../../helpers/facets/ERC165FacetHelper';

describe('supportsInterface', () => {
  const createDiamondForErc165 = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deployConsumableConversionFacet()),
      ]),
    );

  shouldSupportInterface('Consumable', createDiamondForErc165, CONSUMABLE_CONVERSION_INTERFACE_ID);
});

describe('exchangeToken', () => {
  it('should return the address of the exchange token', async () => {
    const consumable = await createConsumable();
    const convertibleConsumable = await createConvertibleConsumable(consumable);

    expect<string>(await convertibleConsumable.exchangeToken()).toEqual(consumable.address);
  });
});

describe('asymmetricalExchangeRate', () => {
  it('should return true when asymmetrical', async () => {
    const consumable = await createConsumable();

    const convertibleConsumable1 = await createConvertibleConsumable(consumable, {
      intrinsicValueExchangeRate: 2,
      purchasePriceExchangeRate: 1,
      registerWithExchange: false,
    });

    const convertibleConsumable2 = await createConvertibleConsumable(consumable, {
      intrinsicValueExchangeRate: 132,
      purchasePriceExchangeRate: 92,
      registerWithExchange: false,
    });

    const convertibleConsumable3 = await createConvertibleConsumable(consumable, {
      intrinsicValueExchangeRate: 1001,
      purchasePriceExchangeRate: 1000,
      registerWithExchange: false,
    });

    const convertibleConsumable4 = await createConvertibleConsumable(consumable, {
      intrinsicValueExchangeRate: 1_001_000,
      purchasePriceExchangeRate: 1_000_000,
      registerWithExchange: false,
    });

    const convertibleConsumable5 = await createConvertibleConsumable(consumable, {
      intrinsicValueExchangeRate: 1_000_000,
      purchasePriceExchangeRate: 1,
      registerWithExchange: false,
    });

    expect<boolean>(await convertibleConsumable1.asymmetricalExchangeRate()).toEqual(true);
    expect<boolean>(await convertibleConsumable2.asymmetricalExchangeRate()).toEqual(true);
    expect<boolean>(await convertibleConsumable3.asymmetricalExchangeRate()).toEqual(true);
    expect<boolean>(await convertibleConsumable4.asymmetricalExchangeRate()).toEqual(true);
    expect<boolean>(await convertibleConsumable5.asymmetricalExchangeRate()).toEqual(true);
  });

  it('should return false when not asymmetrical', async () => {
    const consumable = await createConsumable();

    const convertibleConsumable1 = await createConvertibleConsumable(consumable);

    const convertibleConsumable2 = await createConvertibleConsumable(consumable, {
      intrinsicValueExchangeRate: 10,
      purchasePriceExchangeRate: 10,
    });

    const convertibleConsumable3 = await createConvertibleConsumable(consumable, {
      intrinsicValueExchangeRate: 1000,
      purchasePriceExchangeRate: 1000,
    });

    const convertibleConsumable4 = await createConvertibleConsumable(consumable, {
      intrinsicValueExchangeRate: 1_000_000,
      purchasePriceExchangeRate: 1_000_000,
    });

    expect<boolean>(await convertibleConsumable1.asymmetricalExchangeRate()).toEqual(false);
    expect<boolean>(await convertibleConsumable2.asymmetricalExchangeRate()).toEqual(false);
    expect<boolean>(await convertibleConsumable3.asymmetricalExchangeRate()).toEqual(false);
    expect<boolean>(await convertibleConsumable4.asymmetricalExchangeRate()).toEqual(false);
  });
});

describe('exchangeRate', () => {
  it('should return the exchange rates', async () => {
    const consumable = await createConsumable();
    const convertibleConsumable = await createConvertibleConsumable(consumable, {
      intrinsicValueExchangeRate: 132,
      purchasePriceExchangeRate: 92,
      registerWithExchange: false,
    });

    expect<BigNumber>(await convertibleConsumable.purchasePriceExchangeRate()).toEqBN(92);
    expect<BigNumber>(await convertibleConsumable.intrinsicValueExchangeRate()).toEqBN(132);
  });
});

describe('amountExchangeTokenAvailable', () => {
  it('should return the amount available when exchange rate is 1', async () => {
    const exchange = await createConsumableExchange();
    const convertibleConsumable = await createConvertibleConsumable(exchange);

    const exchangeMint = asConsumableMint(exchange);
    const convertibleConsumableMint = asConsumableMint(convertibleConsumable);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(0);

    await exchangeMint.mint(convertibleConsumable.address, 10);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(10);

    await convertibleConsumableMint.mint(PLAYER1.address, 5);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(5);

    await convertibleConsumableMint.mint(PLAYER1.address, 5);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(0);
  });

  it('should return the amount available when exchange rate is large', async () => {
    const exchange = await createConsumableExchange();
    const convertibleConsumable = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 1000,
    });

    const exchangeMint = asConsumableMint(exchange);
    const convertibleConsumableMint = asConsumableMint(convertibleConsumable);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(0);

    await exchangeMint.mint(convertibleConsumable.address, 10);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(10);

    await convertibleConsumableMint.mint(PLAYER1.address, 5000);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(5);

    await convertibleConsumableMint.mint(PLAYER1.address, 5000);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(0);
  });

  it('should return the amount available when exchange rates are asymmetrical', async () => {
    const exchange = await createConsumableExchange();
    const convertibleConsumable = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 100,
      purchasePriceExchangeRate: 10,
    });

    const exchangeMint = asConsumableMint(exchange);
    const convertibleConsumableMint = asConsumableMint(convertibleConsumable);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(0);

    await exchangeMint.mint(convertibleConsumable.address, 10);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(10);

    await convertibleConsumableMint.mint(PLAYER1.address, 50);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(9);

    await convertibleConsumableMint.mint(PLAYER1.address, 50);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(9);

    await convertibleConsumableMint.mint(PLAYER1.address, 900);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenAvailable()).toEqBN(0);
  });
});

describe('amountExchangeTokenNeeded', () => {
  it('should return the amount needed when exchange rate is 1', async () => {
    const exchange = await createConsumableExchange();
    const convertibleConsumable = await createConvertibleConsumable(exchange);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(0)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(1)).toEqBN(1);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(100)).toEqBN(100);
  });

  it('should return the amount needed when exchange rate is large', async () => {
    const exchange = await createConsumableExchange();
    const convertibleConsumable = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 1000,
    });

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(0)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(1)).toEqBN(1);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(999)).toEqBN(1);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(1000)).toEqBN(1);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(1001)).toEqBN(2);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(2000)).toEqBN(2);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(10000)).toEqBN(10);
  });

  it('should return the amount needed when exchange rates are asymmetrical', async () => {
    const exchange = await createConsumableExchange();
    const convertibleConsumable = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 100,
      purchasePriceExchangeRate: 10,
    });

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(0)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(1)).toEqBN(1);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(9)).toEqBN(1);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(10)).toEqBN(1);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(11)).toEqBN(2);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(20)).toEqBN(2);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenNeeded(100)).toEqBN(10);
  });
});

describe('amountExchangeTokenProvided', () => {
  it('should return the amount provided when exchange rate is 1', async () => {
    const exchange = await createConsumableExchange();
    const convertibleConsumable = await createConvertibleConsumable(exchange);

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(0)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(1)).toEqBN(1);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(100)).toEqBN(100);
  });

  it('should return the amount provided when exchange rate is large', async () => {
    const exchange = await createConsumableExchange();
    const convertibleConsumable = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 1000,
    });

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(0)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(1)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(999)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(1000)).toEqBN(1);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(1001)).toEqBN(1);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(2000)).toEqBN(2);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(10000)).toEqBN(10);
  });

  it('should return the amount provided when exchange rates are asymmetrical', async () => {
    const exchange = await createConsumableExchange();
    const convertibleConsumable = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 100,
      purchasePriceExchangeRate: 10,
    });

    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(0)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(1)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(99)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(100)).toEqBN(1);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(101)).toEqBN(1);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(200)).toEqBN(2);
    expect<BigNumber>(await convertibleConsumable.amountExchangeTokenProvided(1000)).toEqBN(10);
  });
});

describe('mintByExchange', () => {
  it('should exchange proper amount when the exchange rate is 1', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const convertibleConsumable = await createConvertibleConsumable(consumable1, {
      registerWithExchange: false,
    });

    const consumable1Mint = asConsumableMint(consumable1);
    const consumable2Mint = asConsumableMint(consumable2);

    await consumable1Mint.mint(PLAYER1.address, 1000);
    await consumable2Mint.mint(PLAYER1.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 100);

    await convertibleConsumable.connect(PLAYER1).mintByExchange(100);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleConsumable).balanceOf(PLAYER1.address)).toEqBN(100);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 50);

    await convertibleConsumable.connect(PLAYER1).mintByExchange(50);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(850);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleConsumable).balanceOf(PLAYER1.address)).toEqBN(150);
  });

  it('should exchange proper amount when the exchange rate is large', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const convertibleConsumable = await createConvertibleConsumable(consumable1, {
      intrinsicValueExchangeRate: 1000,
      registerWithExchange: false,
    });

    const consumable1Mint = asConsumableMint(consumable1);
    const consumable2Mint = asConsumableMint(consumable2);

    await consumable1Mint.mint(PLAYER1.address, 1000);
    await consumable2Mint.mint(PLAYER1.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 100);

    await convertibleConsumable.connect(PLAYER1).mintByExchange(100_000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleConsumable).balanceOf(PLAYER1.address)).toEqBN(100_000);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 50);

    await convertibleConsumable.connect(PLAYER1).mintByExchange(50_000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(850);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleConsumable).balanceOf(PLAYER1.address)).toEqBN(150_000);
  });

  it('should exchange proper amount when the exchange rates are asymmetrical', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const convertibleConsumable = await createConvertibleConsumable(consumable1, {
      intrinsicValueExchangeRate: 100,
      purchasePriceExchangeRate: 10,
      registerWithExchange: false,
    });

    const consumable1Mint = asConsumableMint(consumable1);
    const consumable2Mint = asConsumableMint(consumable2);

    await consumable1Mint.mint(PLAYER1.address, 1000);
    await consumable2Mint.mint(PLAYER1.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 100);

    await convertibleConsumable.connect(PLAYER1).mintByExchange(1000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleConsumable).balanceOf(PLAYER1.address)).toEqBN(1000);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 50);

    await convertibleConsumable.connect(PLAYER1).mintByExchange(500);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(850);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleConsumable).balanceOf(PLAYER1.address)).toEqBN(1500);
  });

  it('should revert if the sender does not allow the correct exchangeToken balance of the sender when the exchange rate is 1', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const convertibleConsumable = await createConvertibleConsumable(consumable1, {
      registerWithExchange: false,
    });

    const consumable1Mint = asConsumableMint(consumable1);
    const consumable2Mint = asConsumableMint(consumable2);

    await consumable1Mint.mint(PLAYER1.address, 1000);
    await consumable2Mint.mint(PLAYER1.address, 1000);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).mintByExchange(100),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleConsumable).balanceOf(PLAYER1.address)).toEqBN(0);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 99);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).mintByExchange(100),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(99);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleConsumable).balanceOf(PLAYER1.address)).toEqBN(0);
  });

  it('should revert if the sender does not allow the correct exchangeToken balance of the sender when the exchange rate is large', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const convertibleConsumable = await createConvertibleConsumable(consumable1, {
      intrinsicValueExchangeRate: 1000,
      registerWithExchange: false,
    });

    const consumable1Mint = asConsumableMint(consumable1);
    const consumable2Mint = asConsumableMint(consumable2);

    await consumable1Mint.mint(PLAYER1.address, 1000);
    await consumable2Mint.mint(PLAYER1.address, 1000);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).mintByExchange(100000),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleConsumable).balanceOf(PLAYER1.address)).toEqBN(0);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 99);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).mintByExchange(100000),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(99);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleConsumable).balanceOf(PLAYER1.address)).toEqBN(0);
  });

  it('should revert if the sender does not allow the correct exchangeToken balance of the sender when the exchange rates are asymmetrical', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const convertibleConsumable = await createConvertibleConsumable(consumable1, {
      intrinsicValueExchangeRate: 100,
      purchasePriceExchangeRate: 10,
      registerWithExchange: false,
    });

    const consumable1Mint = asConsumableMint(consumable1);
    const consumable2Mint = asConsumableMint(consumable2);

    await consumable1Mint.mint(PLAYER1.address, 1000);
    await consumable2Mint.mint(PLAYER1.address, 1000);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).mintByExchange(1000),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleConsumable).balanceOf(PLAYER1.address)).toEqBN(0);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 99);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).mintByExchange(1000),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(99);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleConsumable).balanceOf(PLAYER1.address)).toEqBN(0);
  });

  it('should not exchange if disabled', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const convertibleConsumable = await createConvertibleConsumable(consumable1, {
      registerWithExchange: false,
      ...(await buildDisableableDiamondAdditions()),
    });

    const consumable1Mint = asConsumableMint(consumable1);
    const consumable2Mint = asConsumableMint(consumable2);

    await consumable1Mint.mint(PLAYER1.address, 1000);
    await consumable2Mint.mint(PLAYER1.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 100);

    await asDisableable(convertibleConsumable).disable();

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).mintByExchange(100),
    ).toBeRevertedWith('Contract is disabled');
  });
});

describe('burnByExchange', () => {
  it('should exchange proper amount when the exchange rate is 1', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const convertibleConsumable = await createConvertibleConsumable(consumable1, {
      registerWithExchange: false,
    });

    const consumable1Mint = asConsumableMint(consumable1);
    const consumable2Mint = asConsumableMint(consumable2);
    const convertibleConsumableMint = asConsumableMint(convertibleConsumable);

    await consumable1Mint.mint(convertibleConsumable.address, 1000);
    await consumable2Mint.mint(convertibleConsumable.address, 1000);
    await convertibleConsumableMint.mint(PLAYER1.address, 1000);

    await convertibleConsumable.connect(PLAYER1).burnByExchange(100);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleConsumable).balanceOf(PLAYER1.address)).toEqBN(900);

    await consumable1.connect(PLAYER1).transferFrom(convertibleConsumable.address, PLAYER1.address, 100);

    await convertibleConsumable.connect(PLAYER1).burnByExchange(50);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(convertibleConsumable.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(50);
    expect<BigNumber>(await consumable2.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleConsumable).balanceOf(PLAYER1.address)).toEqBN(850);
  });

  it('should exchange proper amount when the exchange rate is large', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const convertibleConsumable = await createConvertibleConsumable(consumable1, {
      intrinsicValueExchangeRate: 1000,
      registerWithExchange: false,
    });

    const consumable1Mint = asConsumableMint(consumable1);
    const consumable2Mint = asConsumableMint(consumable2);
    const convertibleConsumableMint = asConsumableMint(convertibleConsumable);

    await consumable1Mint.mint(convertibleConsumable.address, 1000);
    await consumable2Mint.mint(convertibleConsumable.address, 1000);
    await convertibleConsumableMint.mint(PLAYER1.address, 1_000_000);

    await convertibleConsumable.connect(PLAYER1).burnByExchange(100_000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleConsumable).balanceOf(PLAYER1.address)).toEqBN(900_000);

    await consumable1.connect(PLAYER1).transferFrom(convertibleConsumable.address, PLAYER1.address, 100);

    await convertibleConsumable.connect(PLAYER1).burnByExchange(50_000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(convertibleConsumable.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(50);
    expect<BigNumber>(await consumable2.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleConsumable).balanceOf(PLAYER1.address)).toEqBN(850_000);
  });

  it('should exchange proper amount when the exchange rates are asymmetrical', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const convertibleConsumable = await createConvertibleConsumable(consumable1, {
      intrinsicValueExchangeRate: 100,
      purchasePriceExchangeRate: 10,
      registerWithExchange: false,
    });

    const consumable1Mint = asConsumableMint(consumable1);
    const consumable2Mint = asConsumableMint(consumable2);
    const convertibleConsumableMint = asConsumableMint(convertibleConsumable);

    await consumable1Mint.mint(convertibleConsumable.address, 1000);
    await consumable2Mint.mint(convertibleConsumable.address, 1000);
    await convertibleConsumableMint.mint(PLAYER1.address, 100_000);

    await convertibleConsumable.connect(PLAYER1).burnByExchange(10_000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleConsumable).balanceOf(PLAYER1.address)).toEqBN(90_000);

    await consumable1.connect(PLAYER1).transferFrom(convertibleConsumable.address, PLAYER1.address, 100);

    await convertibleConsumable.connect(PLAYER1).burnByExchange(5_000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(convertibleConsumable.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(50);
    expect<BigNumber>(await consumable2.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleConsumable).balanceOf(PLAYER1.address)).toEqBN(85_000);
  });

  it('should revert if the sender does not have enough token to burn when the exchange rate is 1', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const convertibleConsumable = await createConvertibleConsumable(consumable1, {
      registerWithExchange: false,
    });

    const consumable1Mint = asConsumableMint(consumable1);
    const consumable2Mint = asConsumableMint(consumable2);
    const convertibleConsumableMint = asConsumableMint(convertibleConsumable);

    await consumable1Mint.mint(convertibleConsumable.address, 1000);
    await consumable2Mint.mint(convertibleConsumable.address, 1000);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).burnByExchange(100),
    ).toBeRevertedWith('burn amount exceeds balance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleConsumable).balanceOf(PLAYER1.address)).toEqBN(0);

    await convertibleConsumableMint.mint(PLAYER1.address, 99);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).burnByExchange(100),
    ).toBeRevertedWith('burn amount exceeds balance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleConsumable).balanceOf(PLAYER1.address)).toEqBN(99);
  });

  it('should revert if the sender does not have enough token to burn when the exchange rate is large', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const convertibleConsumable = await createConvertibleConsumable(consumable1, {
      intrinsicValueExchangeRate: 1000,
      registerWithExchange: false,
    });

    const consumable1Mint = asConsumableMint(consumable1);
    const consumable2Mint = asConsumableMint(consumable2);
    const convertibleConsumableMint = asConsumableMint(convertibleConsumable);

    await consumable1Mint.mint(convertibleConsumable.address, 1_000_000);
    await consumable2Mint.mint(convertibleConsumable.address, 1_000_000);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).burnByExchange(100_000),
    ).toBeRevertedWith('burn amount exceeds balance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(convertibleConsumable.address)).toEqBN(1_000_000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleConsumable.address)).toEqBN(1_000_000);
    expect<BigNumber>(await consumable1.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleConsumable).balanceOf(PLAYER1.address)).toEqBN(0);

    await convertibleConsumableMint.mint(PLAYER1.address, 99_999);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).burnByExchange(100_000),
    ).toBeRevertedWith('burn amount exceeds balance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(convertibleConsumable.address)).toEqBN(1_000_000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleConsumable.address)).toEqBN(1_000_000);
    expect<BigNumber>(await consumable1.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleConsumable).balanceOf(PLAYER1.address)).toEqBN(99_999);
  });

  // tslint:disable-next-line:max-line-length
  it('should revert if the sender does not have enough token to burn when the exchange rates are asymmetrical', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const convertibleConsumable = await createConvertibleConsumable(consumable1, {
      intrinsicValueExchangeRate: 100,
      purchasePriceExchangeRate: 10,
      registerWithExchange: false,
    });

    const consumable1Mint = asConsumableMint(consumable1);
    const consumable2Mint = asConsumableMint(consumable2);
    const convertibleConsumableMint = asConsumableMint(convertibleConsumable);

    await consumable1Mint.mint(convertibleConsumable.address, 100_000);
    await consumable2Mint.mint(convertibleConsumable.address, 100_000);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).burnByExchange(10_000),
    ).toBeRevertedWith('burn amount exceeds balance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(convertibleConsumable.address)).toEqBN(100_000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleConsumable.address)).toEqBN(100_000);
    expect<BigNumber>(await consumable1.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleConsumable).balanceOf(PLAYER1.address)).toEqBN(0);

    await convertibleConsumableMint.mint(PLAYER1.address, 9_999);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).burnByExchange(10_000),
    ).toBeRevertedWith('burn amount exceeds balance');

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(convertibleConsumable.address)).toEqBN(100_000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleConsumable.address)).toEqBN(100_000);
    expect<BigNumber>(await consumable1.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(convertibleConsumable.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleConsumable).balanceOf(PLAYER1.address)).toEqBN(9_999);
  });

  it('should not exchange if disabled', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const convertibleConsumable = await createConvertibleConsumable(consumable1, {
      registerWithExchange: false,
      ...(await buildDisableableDiamondAdditions()),
    });

    const consumable1Mint = asConsumableMint(consumable1);
    const consumable2Mint = asConsumableMint(consumable2);
    const convertibleConsumableMint = asConsumableMint(convertibleConsumable);

    await consumable1Mint.mint(convertibleConsumable.address, 1000);
    await consumable2Mint.mint(convertibleConsumable.address, 1000);
    await convertibleConsumableMint.mint(PLAYER1.address, 1000);

    await asDisableable(convertibleConsumable).disable();

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).burnByExchange(100),
    ).toBeRevertedWith('Contract is disabled');
  });
});

describe('transfer', () => {
  it('should transfer when there are enough tokens', async () => {
    const exchange = await createConsumable();
    const consumable = asConsumable(await createConvertibleConsumable(exchange));

    const exchangeMint = asConsumableMint(exchange);
    await exchangeMint.mint(consumable.address, 1000);

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);

    await consumable.connect(PLAYER1).transfer(PLAYER2.address, 100);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(900);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(100);
  });

  it('should emit Transfer', async () => {
    const exchange = await createConsumable();
    const consumable = asConsumable(await createConvertibleConsumable(exchange));

    const exchangeMint = asConsumableMint(exchange);
    await exchangeMint.mint(consumable.address, 1000);

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);

    await expect<ContractTransaction>(
      await consumable.connect(PLAYER1).transfer(PLAYER2.address, 100),
    ).toHaveEmittedWith(consumable, 'Transfer', [PLAYER1.address, PLAYER2.address, BigNumber.from(100).toString()]);
  });

  it('should mint tokens when needed', async () => {
    const consumable = await createConsumable();
    const convertibleConsumable = asConsumable(
      await createConvertibleConsumable(consumable, {
        intrinsicValueExchangeRate: 1000,
        registerWithExchange: false,
      }),
    );

    const consumableMint = asConsumableMint(consumable);
    const convertibleConsumableMint = asConsumableMint(convertibleConsumable);

    await consumableMint.mint(PLAYER1.address, 1000);

    await consumable.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 100);

    await convertibleConsumable.connect(PLAYER1).transfer(PLAYER2.address, 100_000);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(900);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable.balanceOf(convertibleConsumable.address)).toEqBN(100);
    expect<BigNumber>(await consumable.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER2.address)).toEqBN(100_000);

    await consumable.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 25);

    await consumableMint.mint(convertibleConsumable.address, 25);
    await convertibleConsumableMint.mint(PLAYER1.address, 25_000);

    await convertibleConsumable.connect(PLAYER1).transfer(PLAYER2.address, 50_000);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(875);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable.balanceOf(convertibleConsumable.address)).toEqBN(150);
    expect<BigNumber>(await consumable.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER2.address)).toEqBN(150_000);
  });

  it('should not mint tokens when not needed', async () => {
    const consumable = await createConsumable();
    const convertibleConsumable = asConsumable(
      await createConvertibleConsumable(consumable, {
        intrinsicValueExchangeRate: 1000,
        registerWithExchange: false,
      }),
    );

    const consumableMint = asConsumableMint(consumable);
    const convertibleConsumableMint = asConsumableMint(convertibleConsumable);

    await consumableMint.mint(PLAYER1.address, 1000);

    await consumableMint.mint(convertibleConsumable.address, 1000);
    await convertibleConsumableMint.mint(PLAYER1.address, 1_000_000);

    await convertibleConsumable.connect(PLAYER1).transfer(PLAYER2.address, 100_000);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(900_000);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER2.address)).toEqBN(100_000);

    await convertibleConsumable.connect(PLAYER1).transfer(PLAYER2.address, 50_000);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable.balanceOf(convertibleConsumable.address)).toEqBN(1000);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(850_000);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER2.address)).toEqBN(150_000);
  });

  it('should revert if there are not enough tokens or exchange tokens', async () => {
    const consumable = await createConsumable();
    const convertibleConsumable = asConsumable(
      await createConvertibleConsumable(consumable, {
        intrinsicValueExchangeRate: 1000,
        registerWithExchange: false,
      }),
    );

    const consumableMint = asConsumableMint(consumable);
    const convertibleConsumableMint = asConsumableMint(convertibleConsumable);

    await consumableMint.mint(PLAYER1.address, 1000);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).transfer(PLAYER2.address, 100_000),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable.balanceOf(convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER2.address)).toEqBN(0);

    await consumable.connect(PLAYER1).increaseAllowance(convertibleConsumable.address, 99);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).transfer(PLAYER2.address, 100_000),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable.balanceOf(convertibleConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(99);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER2.address)).toEqBN(0);

    await consumableMint.mint(convertibleConsumable.address, 1);
    await convertibleConsumableMint.mint(PLAYER1.address, 999);

    await expect<Promise<ContractTransaction>>(
      convertibleConsumable.connect(PLAYER1).transfer(PLAYER2.address, 100_000),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable.balanceOf(convertibleConsumable.address)).toEqBN(1);
    expect<BigNumber>(await consumable.allowance(PLAYER1.address, convertibleConsumable.address)).toEqBN(99);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER1.address)).toEqBN(999);
    expect<BigNumber>(await convertibleConsumable.balanceOf(PLAYER2.address)).toEqBN(0);
  });

  it('should not transfer if not enough consumables', async () => {
    const exchange = await createConsumable();
    const consumable = asConsumable(await createConvertibleConsumable(exchange));

    const exchangeMint = asConsumableMint(exchange);
    await exchangeMint.mint(consumable.address, 1000);

    const consumableMint = asConsumableMint(consumable);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER1).transfer(PLAYER2.address, 100),
    ).toBeRevertedWith('transfer amount exceeds balance');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);

    await consumableMint.mint(PLAYER1.address, 99);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER1).transfer(PLAYER2.address, 100),
    ).toBeRevertedWith('transfer amount exceeds balance');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(99);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
  });

  it('should not transfer if disabled', async () => {
    const exchange = await createConsumable();
    const consumable = asConsumable(
      await createConvertibleConsumable(exchange, await buildDisableableDiamondAdditions()),
    );

    const exchangeMint = asConsumableMint(exchange);
    await exchangeMint.mint(consumable.address, 1000);

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);

    await asDisableable(consumable).disable();

    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER1).transfer(PLAYER2.address, 100),
    ).toBeRevertedWith('Contract is disabled');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
  });
});

describe('mint', () => {
  it('should mint when there is enough exchange', async () => {
    const exchange = await createConsumable();
    const consumable = asConsumable(await createConvertibleConsumable(exchange));

    const exchangeMint = asConsumableMint(exchange);
    await exchangeMint.mint(consumable.address, 1200);

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable.balanceOf(PLAYER3.address)).toEqBN(0);

    await consumableMint.mint(PLAYER2.address, 100);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(100);
    expect<BigNumber>(await consumable.balanceOf(PLAYER3.address)).toEqBN(0);

    await consumableMint.mint(PLAYER1.address, 100);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1100);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(100);
    expect<BigNumber>(await consumable.balanceOf(PLAYER3.address)).toEqBN(0);
  });

  it('should set the totalSupply', async () => {
    const exchange = await createConsumable();
    const consumable = asConsumable(await createConvertibleConsumable(exchange));

    const exchangeMint = asConsumableMint(exchange);
    await exchangeMint.mint(consumable.address, 100_000);

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);
    await consumableMint.mint(PLAYER2.address, 1000);

    await consumableMint.burn(PLAYER1.address, 500);

    expect<BigNumber>(await consumable.totalSupply()).toEqBN(1500);

    await consumableMint.burn(PLAYER2.address, 100);

    expect<BigNumber>(await consumable.totalSupply()).toEqBN(1400);

    await consumableMint.burn(PLAYER1.address, 200);

    expect<BigNumber>(await consumable.totalSupply()).toEqBN(1200);

    await consumableMint.burn(PLAYER2.address, 900);

    expect<BigNumber>(await consumable.totalSupply()).toEqBN(300);

    await consumableMint.burn(PLAYER1.address, 300);

    expect<BigNumber>(await consumable.totalSupply()).toEqBN(0);
  });

  it('should emit Transfer', async () => {
    const exchange = await createConsumable();
    const consumable = asConsumable(await createConvertibleConsumable(exchange));

    const exchangeMint = asConsumableMint(exchange);
    await exchangeMint.mint(consumable.address, 100_000);

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);
    await consumableMint.mint(PLAYER2.address, 1000);

    await expect<ContractTransaction>(await consumableMint.burn(PLAYER1.address, 500)).toHaveEmittedWith(
      consumable,
      'Transfer',
      [PLAYER1.address, ZERO_ADDRESS, BigNumber.from(500).toString()],
    );

    await expect<ContractTransaction>(await consumableMint.burn(PLAYER2.address, 200)).toHaveEmittedWith(
      consumable,
      'Transfer',
      [PLAYER2.address, ZERO_ADDRESS, BigNumber.from(200).toString()],
    );
  });

  it('should not mint the token if there is not enough exchange', async () => {
    const exchange = await createConsumable();

    const consumable1 = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 1000,
      purchasePriceExchangeRate: 100,
    });
    const consumable2 = await createConvertibleConsumable(exchange, {
      intrinsicValueExchangeRate: 1_000_000,
      purchasePriceExchangeRate: 1_000,
    });

    const exchangeMint = asConsumableMint(exchange);
    const consumable1Mint = asConsumableMint(consumable1);
    const consumable2Mint = asConsumableMint(consumable2);

    await expect<Promise<ContractTransaction>>(consumable1Mint.mint(PLAYER1.address, 1)).toBeRevertedWith(
      'Not enough exchange token available to mint',
    );

    await exchangeMint.mint(consumable1.address, 1);
    await expect<Promise<ContractTransaction>>(consumable1Mint.mint(PLAYER1.address, 1_001)).toBeRevertedWith(
      'Not enough exchange token available to mint',
    );

    await exchangeMint.mint(consumable1.address, 999);
    await expect<Promise<ContractTransaction>>(consumable1Mint.mint(PLAYER1.address, 1_000_001)).toBeRevertedWith(
      'Not enough exchange token available to mint',
    );

    await expect<Promise<ContractTransaction>>(consumable2Mint.mint(PLAYER1.address, 1)).toBeRevertedWith(
      'Not enough exchange token available to mint',
    );

    await exchangeMint.mint(consumable2.address, 1);
    await expect<Promise<ContractTransaction>>(consumable2Mint.mint(PLAYER1.address, 1_000_001)).toBeRevertedWith(
      'Not enough exchange token available to mint',
    );

    await exchangeMint.mint(consumable2.address, 999);
    await expect<Promise<ContractTransaction>>(consumable2Mint.mint(PLAYER1.address, 1_000_000_001)).toBeRevertedWith(
      'Not enough exchange token available to mint',
    );
  });

  it('should not mint if called by someone without minter role', async () => {
    const exchange = await createConsumable();
    const consumable = asConsumable(await createConvertibleConsumable(exchange));

    const exchangeMint = asConsumableMint(exchange);
    await exchangeMint.mint(consumable.address, 100_000);

    const consumableMint = asConsumableMint(consumable);

    await expect<Promise<ContractTransaction>>(
      consumableMint.connect(PLAYER1).mint(PLAYER2.address, 100),
    ).toBeRevertedWith('missing role');

    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
  });

  it('should not transfer if disabled', async () => {
    const exchange = await createConsumable();
    const consumable = asConsumable(
      await createConvertibleConsumable(exchange, await buildDisableableDiamondAdditions()),
    );

    const exchangeMint = asConsumableMint(exchange);
    await exchangeMint.mint(consumable.address, 100_000);

    const consumableMint = asConsumableMint(consumable);

    await asDisableable(consumable).disable();

    await expect<Promise<ContractTransaction>>(consumableMint.mint(PLAYER1.address, 100)).toBeRevertedWith(
      'Contract is disabled',
    );

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(0);
  });
});

describe('burn', () => {
  it('should burn when there is enough to burn', async () => {
    const exchange = await createConsumable();
    const consumable = asConsumable(await createConvertibleConsumable(exchange));

    const exchangeMint = asConsumableMint(exchange);
    await exchangeMint.mint(consumable.address, 2000);

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);
    await consumableMint.mint(PLAYER2.address, 1000);

    await consumableMint.burn(PLAYER1.address, 500);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(500);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(1000);

    await consumableMint.burn(PLAYER2.address, 100);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(500);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(900);

    await consumableMint.burn(PLAYER1.address, 200);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(300);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(900);

    await consumableMint.burn(PLAYER1.address, 300);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(900);
  });

  it('should not burn if there is not enough to burn', async () => {
    const exchange = await createConsumable();
    const consumable = asConsumable(await createConvertibleConsumable(exchange));

    const exchangeMint = asConsumableMint(exchange);
    await exchangeMint.mint(consumable.address, 1000);

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 0);

    await expect<Promise<ContractTransaction>>(consumableMint.burn(PLAYER1.address, 100)).toBeRevertedWith(
      'burn amount exceeds balance',
    );

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(0);

    await consumableMint.mint(PLAYER1.address, 99);

    await expect<Promise<ContractTransaction>>(consumableMint.burn(PLAYER1.address, 100)).toBeRevertedWith(
      'burn amount exceeds balance',
    );

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(99);
  });

  it('should set the totalSupply', async () => {
    const exchange = await createConsumable();
    const consumable = asConsumable(await createConvertibleConsumable(exchange));

    const exchangeMint = asConsumableMint(exchange);
    await exchangeMint.mint(consumable.address, 2000);

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);
    await consumableMint.mint(PLAYER2.address, 1000);

    await consumableMint.burn(PLAYER1.address, 500);

    expect<BigNumber>(await consumable.totalSupply()).toEqBN(1500);

    await consumableMint.burn(PLAYER2.address, 100);

    expect<BigNumber>(await consumable.totalSupply()).toEqBN(1400);

    await consumableMint.burn(PLAYER1.address, 200);

    expect<BigNumber>(await consumable.totalSupply()).toEqBN(1200);

    await consumableMint.burn(PLAYER2.address, 900);

    expect<BigNumber>(await consumable.totalSupply()).toEqBN(300);

    await consumableMint.burn(PLAYER1.address, 300);

    expect<BigNumber>(await consumable.totalSupply()).toEqBN(0);
  });

  it('should emit Transfer', async () => {
    const exchange = await createConsumable();
    const consumable = asConsumable(await createConvertibleConsumable(exchange));

    const exchangeMint = asConsumableMint(exchange);
    await exchangeMint.mint(consumable.address, 2000);

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);
    await consumableMint.mint(PLAYER2.address, 1000);

    await expect<ContractTransaction>(await consumableMint.burn(PLAYER1.address, 500)).toHaveEmittedWith(
      consumable,
      'Transfer',
      [PLAYER1.address, ZERO_ADDRESS, BigNumber.from(500).toString()],
    );

    await expect<ContractTransaction>(await consumableMint.burn(PLAYER2.address, 200)).toHaveEmittedWith(
      consumable,
      'Transfer',
      [PLAYER2.address, ZERO_ADDRESS, BigNumber.from(200).toString()],
    );
  });

  it('should not burn if called by someone without minter role', async () => {
    const exchange = await createConsumable();
    const consumable = asConsumable(await createConvertibleConsumable(exchange));

    const exchangeMint = asConsumableMint(exchange);
    await exchangeMint.mint(consumable.address, 1000);

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER2.address, 1000);

    await expect<Promise<ContractTransaction>>(
      consumableMint.connect(PLAYER1).burn(PLAYER2.address, 100),
    ).toBeRevertedWith('missing role');

    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(1000);
  });

  it('should not transfer if disabled', async () => {
    const exchange = await createConsumable();
    const consumable = asConsumable(
      await createConvertibleConsumable(exchange, await buildDisableableDiamondAdditions()),
    );

    const exchangeMint = asConsumableMint(exchange);
    await exchangeMint.mint(consumable.address, 1000);

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);

    await asDisableable(consumable).disable();

    await expect<Promise<ContractTransaction>>(consumableMint.burn(PLAYER1.address, 100)).toBeRevertedWith(
      'Contract is disabled',
    );

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
  });
});
