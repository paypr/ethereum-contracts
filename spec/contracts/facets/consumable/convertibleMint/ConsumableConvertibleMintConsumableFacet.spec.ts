/*
 * Copyright (c) 2022 The Paypr Company, LLC
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
import { ConsumableAmount } from '../../../../../src/contracts/consumables';
import {
  ConsumableCombination,
  ConsumableCombinationBN,
} from '../../../../../src/contracts/consumables/convertibleMint';
import { buildDiamondFacetCut } from '../../../../../src/contracts/diamonds';
import { CONSUMABLE_CONVERTIBLE_MINT_INTERFACE_ID } from '../../../../../src/contracts/erc165InterfaceIds';
import { PLAYER1 } from '../../../../helpers/Accounts';
import { deployDiamond } from '../../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../../helpers/ERC165Helper';
import {
  createConvertibleMintConsumable,
  deployConsumableConvertibleMintConsumableFacet,
  toConsumableCombination,
} from '../../../../helpers/facets/ConsumableConvertibleMintFacetHelper';
import {
  asConsumable,
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
        buildDiamondFacetCut(await deployConsumableConvertibleMintConsumableFacet()),
      ]),
    );

  shouldSupportInterface('ConsumableConvertibleMint', createDiamondForErc165, CONSUMABLE_CONVERTIBLE_MINT_INTERFACE_ID);
});

describe('isValidConsumableCombination', () => {
  it('should return true when valid consumables provided', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();

    const convertibleMintConsumable = await createConvertibleMintConsumable([
      {
        requiredConsumables: [{ consumable: consumable1.address, amount: 1 }],
        amountProvided: 1,
      },
      {
        requiredConsumables: [
          { consumable: consumable1.address, amount: 1 },
          { consumable: consumable2.address, amount: 2 },
        ],
        amountProvided: 1,
      },
      {
        requiredConsumables: [
          { consumable: consumable1.address, amount: 1 },
          { consumable: consumable3.address, amount: 3 },
        ],
        amountProvided: 2,
      },
      {
        requiredConsumables: [
          { consumable: consumable1.address, amount: 1 },
          { consumable: consumable2.address, amount: 2 },
          { consumable: consumable3.address, amount: 3 },
        ],
        amountProvided: 3,
      },
    ]);

    expect<boolean>(await convertibleMintConsumable.isValidConsumableCombination([consumable1.address])).toBeTruthy();
    expect<boolean>(
      await convertibleMintConsumable.isValidConsumableCombination([consumable1.address, consumable2.address]),
    ).toBeTruthy();
    expect<boolean>(
      await convertibleMintConsumable.isValidConsumableCombination([consumable1.address, consumable3.address]),
    ).toBeTruthy();
    expect<boolean>(
      await convertibleMintConsumable.isValidConsumableCombination([
        consumable1.address,
        consumable2.address,
        consumable3.address,
      ]),
    ).toBeTruthy();
  });

  it('should return false when invalid consumables provided', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();
    const consumable4 = await createConsumable();

    const convertibleMintConsumable = await createConvertibleMintConsumable([
      {
        requiredConsumables: [{ consumable: consumable1.address, amount: 1 }],
        amountProvided: 1,
      },
      {
        requiredConsumables: [
          { consumable: consumable1.address, amount: 1 },
          { consumable: consumable2.address, amount: 2 },
        ],
        amountProvided: 1,
      },
      {
        requiredConsumables: [
          { consumable: consumable1.address, amount: 1 },
          { consumable: consumable3.address, amount: 3 },
        ],
        amountProvided: 2,
      },
      {
        requiredConsumables: [
          { consumable: consumable1.address, amount: 1 },
          { consumable: consumable2.address, amount: 2 },
          { consumable: consumable3.address, amount: 3 },
        ],
        amountProvided: 3,
      },
    ]);

    expect<boolean>(await convertibleMintConsumable.isValidConsumableCombination([consumable2.address])).toBeFalsy();
    expect<boolean>(await convertibleMintConsumable.isValidConsumableCombination([consumable3.address])).toBeFalsy();
    expect<boolean>(await convertibleMintConsumable.isValidConsumableCombination([consumable4.address])).toBeFalsy();
    expect<boolean>(
      await convertibleMintConsumable.isValidConsumableCombination([consumable2.address, consumable3.address]),
    ).toBeFalsy();
    expect<boolean>(
      await convertibleMintConsumable.isValidConsumableCombination([
        consumable1.address,
        consumable2.address,
        consumable3.address,
        consumable4.address,
      ]),
    ).toBeFalsy();
  });
});

describe('validConsumableCombinations', () => {
  it('should return empty when no combinations set', async () => {
    const convertibleMintConsumable = await createConvertibleMintConsumable([]);

    expect<ConsumableCombinationBN[]>(await convertibleMintConsumable.validConsumableCombinations()).toEqual([]);
  });

  it('should return all valid consumable combinations', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();

    const combinations = [
      {
        requiredConsumables: [{ consumable: consumable1.address, amount: 1 }],
        amountProvided: 1,
      },
      {
        requiredConsumables: [
          { consumable: consumable1.address, amount: 1 },
          { consumable: consumable2.address, amount: 2 },
        ],
        amountProvided: 1,
      },
      {
        requiredConsumables: [
          { consumable: consumable1.address, amount: 1 },
          { consumable: consumable3.address, amount: 3 },
        ],
        amountProvided: 2,
      },
      {
        requiredConsumables: [
          { consumable: consumable1.address, amount: 1 },
          { consumable: consumable2.address, amount: 2 },
          { consumable: consumable3.address, amount: 3 },
        ],
        amountProvided: 3,
      },
    ];

    const convertibleMintConsumable = await createConvertibleMintConsumable(combinations);

    expect<ConsumableCombination[]>(
      (await convertibleMintConsumable.validConsumableCombinations()).map(toConsumableCombination),
    ).toEqual(combinations);
  });
});

describe('calcRequiredConsumables', () => {
  it('should return the required consumable amounts when 0 requested', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();

    const combinations = [
      {
        requiredConsumables: [{ consumable: consumable1.address, amount: 1 }],
        amountProvided: 1,
      },
      {
        requiredConsumables: [
          { consumable: consumable1.address, amount: 1 },
          { consumable: consumable2.address, amount: 2 },
        ],
        amountProvided: 1,
      },
      {
        requiredConsumables: [
          { consumable: consumable1.address, amount: 1 },
          { consumable: consumable3.address, amount: 3 },
        ],
        amountProvided: 2,
      },
      {
        requiredConsumables: [
          { consumable: consumable1.address, amount: 1 },
          { consumable: consumable2.address, amount: 2 },
          { consumable: consumable3.address, amount: 3 },
        ],
        amountProvided: 3,
      },
    ];

    const convertibleMintConsumable = await createConvertibleMintConsumable(combinations);

    expect<ConsumableAmount[]>(
      (await convertibleMintConsumable.calcRequiredConsumables(0, [consumable1.address])).map(toConsumableAmount),
    ).toEqual([{ consumable: consumable1.address, amount: 0 }]);

    expect<ConsumableAmount[]>(
      (await convertibleMintConsumable.calcRequiredConsumables(0, [consumable1.address, consumable2.address])).map(
        toConsumableAmount,
      ),
    ).toEqual([
      { consumable: consumable1.address, amount: 0 },
      { consumable: consumable2.address, amount: 0 },
    ]);

    expect<ConsumableAmount[]>(
      (await convertibleMintConsumable.calcRequiredConsumables(0, [consumable1.address, consumable3.address])).map(
        toConsumableAmount,
      ),
    ).toEqual([
      { consumable: consumable1.address, amount: 0 },
      { consumable: consumable3.address, amount: 0 },
    ]);

    expect<ConsumableAmount[]>(
      (
        await convertibleMintConsumable.calcRequiredConsumables(0, [
          consumable1.address,
          consumable2.address,
          consumable3.address,
        ])
      ).map(toConsumableAmount),
    ).toEqual([
      { consumable: consumable1.address, amount: 0 },
      { consumable: consumable2.address, amount: 0 },
      { consumable: consumable3.address, amount: 0 },
    ]);
  });

  it('should return the required consumable amounts when >= 1 is requested', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();

    const combinations = [
      {
        requiredConsumables: [{ consumable: consumable1.address, amount: 1 }],
        amountProvided: 1,
      },
      {
        requiredConsumables: [
          { consumable: consumable1.address, amount: 1 },
          { consumable: consumable2.address, amount: 2 },
        ],
        amountProvided: 1,
      },
      {
        requiredConsumables: [
          { consumable: consumable1.address, amount: 1 },
          { consumable: consumable3.address, amount: 3 },
        ],
        amountProvided: 2,
      },
      {
        requiredConsumables: [
          { consumable: consumable1.address, amount: 1 },
          { consumable: consumable2.address, amount: 2 },
          { consumable: consumable3.address, amount: 3 },
        ],
        amountProvided: 3,
      },
    ];

    const convertibleMintConsumable = await createConvertibleMintConsumable(combinations);

    expect<ConsumableAmount[]>(
      (await convertibleMintConsumable.calcRequiredConsumables(1, [consumable1.address])).map(toConsumableAmount),
    ).toEqual([{ consumable: consumable1.address, amount: 1 }]);

    expect<ConsumableAmount[]>(
      (await convertibleMintConsumable.calcRequiredConsumables(2, [consumable1.address])).map(toConsumableAmount),
    ).toEqual([{ consumable: consumable1.address, amount: 2 }]);

    expect<ConsumableAmount[]>(
      (await convertibleMintConsumable.calcRequiredConsumables(100, [consumable1.address])).map(toConsumableAmount),
    ).toEqual([{ consumable: consumable1.address, amount: 100 }]);

    expect<ConsumableAmount[]>(
      (await convertibleMintConsumable.calcRequiredConsumables(1, [consumable1.address, consumable2.address])).map(
        toConsumableAmount,
      ),
    ).toEqual([
      { consumable: consumable1.address, amount: 1 },
      { consumable: consumable2.address, amount: 2 },
    ]);

    expect<ConsumableAmount[]>(
      (await convertibleMintConsumable.calcRequiredConsumables(2, [consumable1.address, consumable2.address])).map(
        toConsumableAmount,
      ),
    ).toEqual([
      { consumable: consumable1.address, amount: 2 },
      { consumable: consumable2.address, amount: 4 },
    ]);

    expect<ConsumableAmount[]>(
      (await convertibleMintConsumable.calcRequiredConsumables(1000, [consumable1.address, consumable2.address])).map(
        toConsumableAmount,
      ),
    ).toEqual([
      { consumable: consumable1.address, amount: 1000 },
      { consumable: consumable2.address, amount: 2000 },
    ]);

    expect<ConsumableAmount[]>(
      (await convertibleMintConsumable.calcRequiredConsumables(1, [consumable1.address, consumable3.address])).map(
        toConsumableAmount,
      ),
    ).toEqual([
      { consumable: consumable1.address, amount: 1 },
      { consumable: consumable3.address, amount: 2 },
    ]);

    expect<ConsumableAmount[]>(
      (await convertibleMintConsumable.calcRequiredConsumables(2, [consumable1.address, consumable3.address])).map(
        toConsumableAmount,
      ),
    ).toEqual([
      { consumable: consumable1.address, amount: 1 },
      { consumable: consumable3.address, amount: 3 },
    ]);

    expect<ConsumableAmount[]>(
      (await convertibleMintConsumable.calcRequiredConsumables(3, [consumable1.address, consumable3.address])).map(
        toConsumableAmount,
      ),
    ).toEqual([
      { consumable: consumable1.address, amount: 2 },
      { consumable: consumable3.address, amount: 5 },
    ]);

    expect<ConsumableAmount[]>(
      (await convertibleMintConsumable.calcRequiredConsumables(4, [consumable1.address, consumable3.address])).map(
        toConsumableAmount,
      ),
    ).toEqual([
      { consumable: consumable1.address, amount: 2 },
      { consumable: consumable3.address, amount: 6 },
    ]);

    expect<ConsumableAmount[]>(
      (await convertibleMintConsumable.calcRequiredConsumables(2000, [consumable1.address, consumable3.address])).map(
        toConsumableAmount,
      ),
    ).toEqual([
      { consumable: consumable1.address, amount: 1000 },
      { consumable: consumable3.address, amount: 3000 },
    ]);

    expect<ConsumableAmount[]>(
      (
        await convertibleMintConsumable.calcRequiredConsumables(1, [
          consumable1.address,
          consumable2.address,
          consumable3.address,
        ])
      ).map(toConsumableAmount),
    ).toEqual([
      { consumable: consumable1.address, amount: 1 },
      { consumable: consumable2.address, amount: 1 },
      { consumable: consumable3.address, amount: 1 },
    ]);

    expect<ConsumableAmount[]>(
      (
        await convertibleMintConsumable.calcRequiredConsumables(2, [
          consumable1.address,
          consumable2.address,
          consumable3.address,
        ])
      ).map(toConsumableAmount),
    ).toEqual([
      { consumable: consumable1.address, amount: 1 },
      { consumable: consumable2.address, amount: 2 },
      { consumable: consumable3.address, amount: 2 },
    ]);

    expect<ConsumableAmount[]>(
      (
        await convertibleMintConsumable.calcRequiredConsumables(3, [
          consumable1.address,
          consumable2.address,
          consumable3.address,
        ])
      ).map(toConsumableAmount),
    ).toEqual([
      { consumable: consumable1.address, amount: 1 },
      { consumable: consumable2.address, amount: 2 },
      { consumable: consumable3.address, amount: 3 },
    ]);

    expect<ConsumableAmount[]>(
      (
        await convertibleMintConsumable.calcRequiredConsumables(4, [
          consumable1.address,
          consumable2.address,
          consumable3.address,
        ])
      ).map(toConsumableAmount),
    ).toEqual([
      { consumable: consumable1.address, amount: 2 },
      { consumable: consumable2.address, amount: 3 },
      { consumable: consumable3.address, amount: 4 },
    ]);

    expect<ConsumableAmount[]>(
      (
        await convertibleMintConsumable.calcRequiredConsumables(5, [
          consumable1.address,
          consumable2.address,
          consumable3.address,
        ])
      ).map(toConsumableAmount),
    ).toEqual([
      { consumable: consumable1.address, amount: 2 },
      { consumable: consumable2.address, amount: 4 },
      { consumable: consumable3.address, amount: 5 },
    ]);

    expect<ConsumableAmount[]>(
      (
        await convertibleMintConsumable.calcRequiredConsumables(6, [
          consumable1.address,
          consumable2.address,
          consumable3.address,
        ])
      ).map(toConsumableAmount),
    ).toEqual([
      { consumable: consumable1.address, amount: 2 },
      { consumable: consumable2.address, amount: 4 },
      { consumable: consumable3.address, amount: 6 },
    ]);

    expect<ConsumableAmount[]>(
      (
        await convertibleMintConsumable.calcRequiredConsumables(3000, [
          consumable1.address,
          consumable2.address,
          consumable3.address,
        ])
      ).map(toConsumableAmount),
    ).toEqual([
      { consumable: consumable1.address, amount: 1000 },
      { consumable: consumable2.address, amount: 2000 },
      { consumable: consumable3.address, amount: 3000 },
    ]);
  });
});

describe('mint', () => {
  it('should consume the required consumables and mint the appropriate number of provided consumables', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();

    const convertibleMintConsumable = await createConvertibleMintConsumable([
      {
        requiredConsumables: [{ consumable: consumable1.address, amount: 1 }],
        amountProvided: 1,
      },
      {
        requiredConsumables: [
          { consumable: consumable1.address, amount: 1 },
          { consumable: consumable2.address, amount: 2 },
        ],
        amountProvided: 1,
      },
      {
        requiredConsumables: [
          { consumable: consumable1.address, amount: 1 },
          { consumable: consumable3.address, amount: 3 },
        ],
        amountProvided: 2,
      },
      {
        requiredConsumables: [
          { consumable: consumable1.address, amount: 1 },
          { consumable: consumable2.address, amount: 2 },
          { consumable: consumable3.address, amount: 3 },
        ],
        amountProvided: 3,
      },
    ]);

    await asConsumableMint(consumable1).mint(PLAYER1.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER1.address, 1000);
    await asConsumableMint(consumable3).mint(PLAYER1.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleMintConsumable.address, 1);
    await convertibleMintConsumable.connect(PLAYER1).mint(1, [consumable1.address]);
    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(999);
    expect<BigNumber>(await consumable1.balanceOf(convertibleMintConsumable.address)).toEqBN(1);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleMintConsumable).balanceOf(PLAYER1.address)).toEqBN(1);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleMintConsumable.address, 1);
    await consumable2.connect(PLAYER1).increaseAllowance(convertibleMintConsumable.address, 2);
    await convertibleMintConsumable.connect(PLAYER1).mint(1, [consumable1.address, consumable2.address]);
    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(998);
    expect<BigNumber>(await consumable1.balanceOf(convertibleMintConsumable.address)).toEqBN(2);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(998);
    expect<BigNumber>(await consumable2.balanceOf(convertibleMintConsumable.address)).toEqBN(2);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleMintConsumable).balanceOf(PLAYER1.address)).toEqBN(2);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleMintConsumable.address, 1);
    await consumable3.connect(PLAYER1).increaseAllowance(convertibleMintConsumable.address, 3);
    await convertibleMintConsumable.connect(PLAYER1).mint(2, [consumable1.address, consumable3.address]);
    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(997);
    expect<BigNumber>(await consumable1.balanceOf(convertibleMintConsumable.address)).toEqBN(3);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(998);
    expect<BigNumber>(await consumable2.balanceOf(convertibleMintConsumable.address)).toEqBN(2);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(997);
    expect<BigNumber>(await consumable3.balanceOf(convertibleMintConsumable.address)).toEqBN(3);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleMintConsumable).balanceOf(PLAYER1.address)).toEqBN(4);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleMintConsumable.address, 1);
    await consumable2.connect(PLAYER1).increaseAllowance(convertibleMintConsumable.address, 2);
    await consumable3.connect(PLAYER1).increaseAllowance(convertibleMintConsumable.address, 3);
    await convertibleMintConsumable
      .connect(PLAYER1)
      .mint(3, [consumable1.address, consumable2.address, consumable3.address]);
    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(996);
    expect<BigNumber>(await consumable1.balanceOf(convertibleMintConsumable.address)).toEqBN(4);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(996);
    expect<BigNumber>(await consumable2.balanceOf(convertibleMintConsumable.address)).toEqBN(4);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(994);
    expect<BigNumber>(await consumable3.balanceOf(convertibleMintConsumable.address)).toEqBN(6);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleMintConsumable).balanceOf(PLAYER1.address)).toEqBN(7);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleMintConsumable.address, 2);
    await consumable2.connect(PLAYER1).increaseAllowance(convertibleMintConsumable.address, 3);
    await consumable3.connect(PLAYER1).increaseAllowance(convertibleMintConsumable.address, 4);
    await convertibleMintConsumable
      .connect(PLAYER1)
      .mint(4, [consumable1.address, consumable2.address, consumable3.address]);
    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(994);
    expect<BigNumber>(await consumable1.balanceOf(convertibleMintConsumable.address)).toEqBN(6);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(993);
    expect<BigNumber>(await consumable2.balanceOf(convertibleMintConsumable.address)).toEqBN(7);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(990);
    expect<BigNumber>(await consumable3.balanceOf(convertibleMintConsumable.address)).toEqBN(10);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleMintConsumable).balanceOf(PLAYER1.address)).toEqBN(11);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleMintConsumable.address, 2);
    await consumable2.connect(PLAYER1).increaseAllowance(convertibleMintConsumable.address, 4);
    await consumable3.connect(PLAYER1).increaseAllowance(convertibleMintConsumable.address, 5);
    await convertibleMintConsumable
      .connect(PLAYER1)
      .mint(5, [consumable1.address, consumable2.address, consumable3.address]);
    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(992);
    expect<BigNumber>(await consumable1.balanceOf(convertibleMintConsumable.address)).toEqBN(8);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(989);
    expect<BigNumber>(await consumable2.balanceOf(convertibleMintConsumable.address)).toEqBN(11);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(985);
    expect<BigNumber>(await consumable3.balanceOf(convertibleMintConsumable.address)).toEqBN(15);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleMintConsumable).balanceOf(PLAYER1.address)).toEqBN(16);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleMintConsumable.address, 2);
    await consumable2.connect(PLAYER1).increaseAllowance(convertibleMintConsumable.address, 4);
    await consumable3.connect(PLAYER1).increaseAllowance(convertibleMintConsumable.address, 6);
    await convertibleMintConsumable
      .connect(PLAYER1)
      .mint(6, [consumable1.address, consumable2.address, consumable3.address]);
    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(990);
    expect<BigNumber>(await consumable1.balanceOf(convertibleMintConsumable.address)).toEqBN(10);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(985);
    expect<BigNumber>(await consumable2.balanceOf(convertibleMintConsumable.address)).toEqBN(15);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(979);
    expect<BigNumber>(await consumable3.balanceOf(convertibleMintConsumable.address)).toEqBN(21);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleMintConsumable).balanceOf(PLAYER1.address)).toEqBN(22);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleMintConsumable.address, 100);
    await consumable2.connect(PLAYER1).increaseAllowance(convertibleMintConsumable.address, 200);
    await consumable3.connect(PLAYER1).increaseAllowance(convertibleMintConsumable.address, 300);
    await convertibleMintConsumable
      .connect(PLAYER1)
      .mint(300, [consumable1.address, consumable2.address, consumable3.address]);
    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(890);
    expect<BigNumber>(await consumable1.balanceOf(convertibleMintConsumable.address)).toEqBN(110);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(785);
    expect<BigNumber>(await consumable2.balanceOf(convertibleMintConsumable.address)).toEqBN(215);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(679);
    expect<BigNumber>(await consumable3.balanceOf(convertibleMintConsumable.address)).toEqBN(321);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleMintConsumable).balanceOf(PLAYER1.address)).toEqBN(322);
  });

  it('should fail if invalid consumables provided', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();
    const consumable4 = await createConsumable();

    const convertibleMintConsumable = await createConvertibleMintConsumable([
      {
        requiredConsumables: [{ consumable: consumable1.address, amount: 1 }],
        amountProvided: 1,
      },
      {
        requiredConsumables: [
          { consumable: consumable1.address, amount: 1 },
          { consumable: consumable2.address, amount: 2 },
        ],
        amountProvided: 1,
      },
      {
        requiredConsumables: [
          { consumable: consumable1.address, amount: 1 },
          { consumable: consumable3.address, amount: 3 },
        ],
        amountProvided: 2,
      },
      {
        requiredConsumables: [
          { consumable: consumable1.address, amount: 1 },
          { consumable: consumable2.address, amount: 2 },
          { consumable: consumable3.address, amount: 3 },
        ],
        amountProvided: 3,
      },
    ]);

    await expect(convertibleMintConsumable.connect(PLAYER1).mint(1, [consumable2.address])).toBeRevertedWith(
      'ConsumableCombinationNotFound',
    );

    await expect(convertibleMintConsumable.connect(PLAYER1).mint(1, [consumable3.address])).toBeRevertedWith(
      'ConsumableCombinationNotFound',
    );

    await expect(convertibleMintConsumable.connect(PLAYER1).mint(1, [consumable4.address])).toBeRevertedWith(
      'ConsumableCombinationNotFound',
    );

    await expect(
      convertibleMintConsumable.connect(PLAYER1).mint(1, [consumable2.address, consumable3.address]),
    ).toBeRevertedWith('ConsumableCombinationNotFound');

    await expect(
      convertibleMintConsumable
        .connect(PLAYER1)
        .mint(1, [consumable1.address, consumable2.address, consumable3.address, consumable4.address]),
    ).toBeRevertedWith('ConsumableCombinationNotFound');
  });

  it('should fail if not enough consumables provided', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();

    const convertibleMintConsumable = await createConvertibleMintConsumable([
      {
        requiredConsumables: [{ consumable: consumable1.address, amount: 1 }],
        amountProvided: 1,
      },
      {
        requiredConsumables: [
          { consumable: consumable1.address, amount: 1 },
          { consumable: consumable2.address, amount: 2 },
        ],
        amountProvided: 1,
      },
      {
        requiredConsumables: [
          { consumable: consumable1.address, amount: 1 },
          { consumable: consumable3.address, amount: 3 },
        ],
        amountProvided: 2,
      },
      {
        requiredConsumables: [
          { consumable: consumable1.address, amount: 1 },
          { consumable: consumable2.address, amount: 2 },
          { consumable: consumable3.address, amount: 3 },
        ],
        amountProvided: 3,
      },
    ]);

    await asConsumableMint(consumable1).mint(PLAYER1.address, 1000);
    await asConsumableMint(consumable2).mint(PLAYER1.address, 1000);
    await asConsumableMint(consumable3).mint(PLAYER1.address, 1000);

    await expect(convertibleMintConsumable.connect(PLAYER1).mint(1, [consumable1.address])).toBeRevertedWith(
      'transfer amount exceeds allowance',
    );
    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleMintConsumable).balanceOf(PLAYER1.address)).toEqBN(0);

    await consumable1.connect(PLAYER1).increaseAllowance(convertibleMintConsumable.address, 1);
    await expect(
      convertibleMintConsumable.connect(PLAYER1).mint(1, [consumable1.address, consumable2.address]),
    ).toBeRevertedWith('transfer amount exceeds allowance');
    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(1);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleMintConsumable).balanceOf(PLAYER1.address)).toEqBN(0);

    await consumable2.connect(PLAYER1).increaseAllowance(convertibleMintConsumable.address, 1);
    await expect(
      convertibleMintConsumable.connect(PLAYER1).mint(1, [consumable1.address, consumable2.address]),
    ).toBeRevertedWith('transfer amount exceeds allowance');
    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(1);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(1);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleMintConsumable).balanceOf(PLAYER1.address)).toEqBN(0);

    await expect(
      convertibleMintConsumable.connect(PLAYER1).mint(1, [consumable1.address, consumable3.address]),
    ).toBeRevertedWith('transfer amount exceeds allowance');
    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(1);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(1);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await asConsumable(convertibleMintConsumable).balanceOf(PLAYER1.address)).toEqBN(0);

    await consumable3.connect(PLAYER1).increaseAllowance(convertibleMintConsumable.address, 1);
    await expect(
      convertibleMintConsumable.connect(PLAYER1).mint(2, [consumable1.address, consumable3.address]),
    ).toBeRevertedWith('transfer amount exceeds allowance');
    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(1);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(1);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(1);
    expect<BigNumber>(await asConsumable(convertibleMintConsumable).balanceOf(PLAYER1.address)).toEqBN(0);

    await expect(
      convertibleMintConsumable
        .connect(PLAYER1)
        .mint(2, [consumable1.address, consumable2.address, consumable3.address]),
    ).toBeRevertedWith('transfer amount exceeds allowance');
    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(1);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(1);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(1);
    expect<BigNumber>(await asConsumable(convertibleMintConsumable).balanceOf(PLAYER1.address)).toEqBN(0);

    await consumable3.connect(PLAYER1).increaseAllowance(convertibleMintConsumable.address, 1);
    await expect(
      convertibleMintConsumable
        .connect(PLAYER1)
        .mint(2, [consumable1.address, consumable2.address, consumable3.address]),
    ).toBeRevertedWith('transfer amount exceeds allowance');
    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(1);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(1);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(2);
    expect<BigNumber>(await asConsumable(convertibleMintConsumable).balanceOf(PLAYER1.address)).toEqBN(0);

    await consumable2.connect(PLAYER1).increaseAllowance(convertibleMintConsumable.address, 1);
    await expect(
      convertibleMintConsumable
        .connect(PLAYER1)
        .mint(3, [consumable1.address, consumable2.address, consumable3.address]),
    ).toBeRevertedWith('transfer amount exceeds allowance');
    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(1);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(2);
    expect<BigNumber>(await consumable3.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable3.balanceOf(convertibleMintConsumable.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(PLAYER1.address, convertibleMintConsumable.address)).toEqBN(2);
    expect<BigNumber>(await asConsumable(convertibleMintConsumable).balanceOf(PLAYER1.address)).toEqBN(0);
  });
});
