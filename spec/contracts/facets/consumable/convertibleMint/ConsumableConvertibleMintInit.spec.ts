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

import {
  buildConsumableConvertibleMintAddCombinationFunction,
  buildConsumableConvertibleMintRemoveCombinationFunction,
  buildConsumableConvertibleMintSetCombinationsFunction,
  ConsumableCombination,
} from '../../../../../src/contracts/consumables/convertibleMint';
import { combineDiamondInitFunctions } from '../../../../helpers/DiamondHelper';
import {
  createConvertibleMintConsumable,
  deployConsumableConvertibleMintInit,
  toConsumableCombination,
} from '../../../../helpers/facets/ConsumableConvertibleMintFacetHelper';
import { createConsumable, extractConsumables } from '../../../../helpers/facets/ConsumableFacetHelper';
import { asDiamondCut } from '../../../../helpers/facets/DiamondFacetHelper';

describe('setCombinations', () => {
  it('should add all combinations', async () => {
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

  it('should replace all existing combinations', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();
    const consumable4 = await createConsumable();

    const combinations1 = [
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

    const convertibleMintConsumable = await createConvertibleMintConsumable(combinations1);
    expect<ConsumableCombination[]>(
      (await convertibleMintConsumable.validConsumableCombinations()).map(toConsumableCombination),
    ).toEqual(combinations1);

    const convertibleMintInit = await deployConsumableConvertibleMintInit();

    const combinations2 = [
      {
        requiredConsumables: [{ consumable: consumable4.address, amount: 1 }],
        amountProvided: 10,
      },
      {
        requiredConsumables: [{ consumable: consumable3.address, amount: 2 }],
        amountProvided: 20,
      },
      {
        requiredConsumables: [{ consumable: consumable2.address, amount: 3 }],
        amountProvided: 30,
      },
      {
        requiredConsumables: [{ consumable: consumable1.address, amount: 4 }],
        amountProvided: 40,
      },
    ];

    await asDiamondCut(convertibleMintConsumable).diamondCut(
      [],
      buildConsumableConvertibleMintSetCombinationsFunction(convertibleMintInit, combinations2),
    );

    expect<ConsumableCombination[]>(
      (await convertibleMintConsumable.validConsumableCombinations()).map(toConsumableCombination),
    ).toEqual(combinations2);

    const combinations3 = [
      {
        requiredConsumables: [
          { consumable: consumable1.address, amount: 10 },
          { consumable: consumable4.address, amount: 40 },
        ],
        amountProvided: 100,
      },
    ];

    await asDiamondCut(convertibleMintConsumable).diamondCut(
      [],
      buildConsumableConvertibleMintSetCombinationsFunction(convertibleMintInit, combinations3),
    );

    expect<ConsumableCombination[]>(
      (await convertibleMintConsumable.validConsumableCombinations()).map(toConsumableCombination),
    ).toEqual(combinations3);
  });
});

describe('addCombination', () => {
  it('should add the combination', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();

    const combo1 = {
      requiredConsumables: [{ consumable: consumable1.address, amount: 1 }],
      amountProvided: 1,
    };
    const combo2 = {
      requiredConsumables: [
        { consumable: consumable1.address, amount: 1 },
        { consumable: consumable2.address, amount: 2 },
      ],
      amountProvided: 1,
    };
    const combo3 = {
      requiredConsumables: [
        { consumable: consumable1.address, amount: 1 },
        { consumable: consumable3.address, amount: 3 },
      ],
      amountProvided: 2,
    };
    const combo4 = {
      requiredConsumables: [
        { consumable: consumable1.address, amount: 1 },
        { consumable: consumable2.address, amount: 2 },
        { consumable: consumable3.address, amount: 3 },
      ],
      amountProvided: 3,
    };
    const convertibleMintConsumable = await createConvertibleMintConsumable([]);

    expect<ConsumableCombination[]>(
      (await convertibleMintConsumable.validConsumableCombinations()).map(toConsumableCombination),
    ).toEqual([]);

    const convertibleMintInit = await deployConsumableConvertibleMintInit();
    const diamondCut = asDiamondCut(convertibleMintConsumable);

    await diamondCut.diamondCut([], buildConsumableConvertibleMintAddCombinationFunction(convertibleMintInit, combo1));

    expect<ConsumableCombination[]>(
      (await convertibleMintConsumable.validConsumableCombinations()).map(toConsumableCombination),
    ).toEqual([combo1]);

    await diamondCut.diamondCut([], buildConsumableConvertibleMintAddCombinationFunction(convertibleMintInit, combo2));

    expect<ConsumableCombination[]>(
      (await convertibleMintConsumable.validConsumableCombinations()).map(toConsumableCombination),
    ).toEqual([combo1, combo2]);

    await diamondCut.diamondCut([], buildConsumableConvertibleMintAddCombinationFunction(convertibleMintInit, combo3));

    expect<ConsumableCombination[]>(
      (await convertibleMintConsumable.validConsumableCombinations()).map(toConsumableCombination),
    ).toEqual([combo1, combo2, combo3]);

    await diamondCut.diamondCut([], buildConsumableConvertibleMintAddCombinationFunction(convertibleMintInit, combo4));

    expect<ConsumableCombination[]>(
      (await convertibleMintConsumable.validConsumableCombinations()).map(toConsumableCombination),
    ).toEqual([combo1, combo2, combo3, combo4]);
  });
});

describe('removeCombination', () => {
  it('should remove the correct combination', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();

    const combo1 = {
      requiredConsumables: [{ consumable: consumable1.address, amount: 1 }],
      amountProvided: 1,
    };
    const combo2 = {
      requiredConsumables: [
        { consumable: consumable1.address, amount: 1 },
        { consumable: consumable2.address, amount: 2 },
      ],
      amountProvided: 1,
    };
    const combo3 = {
      requiredConsumables: [
        { consumable: consumable1.address, amount: 1 },
        { consumable: consumable3.address, amount: 3 },
      ],
      amountProvided: 2,
    };
    const combo4 = {
      requiredConsumables: [
        { consumable: consumable1.address, amount: 1 },
        { consumable: consumable2.address, amount: 2 },
        { consumable: consumable3.address, amount: 3 },
      ],
      amountProvided: 3,
    };
    const convertibleMintConsumable = await createConvertibleMintConsumable([combo1, combo2, combo3, combo4]);

    expect<ConsumableCombination[]>(
      (await convertibleMintConsumable.validConsumableCombinations()).map(toConsumableCombination),
    ).toEqual([combo1, combo2, combo3, combo4]);

    const convertibleMintInit = await deployConsumableConvertibleMintInit();
    const diamondCut = asDiamondCut(convertibleMintConsumable);

    await diamondCut.diamondCut(
      [],
      buildConsumableConvertibleMintRemoveCombinationFunction(
        convertibleMintInit,
        extractConsumables(combo4.requiredConsumables),
      ),
    );

    expect<ConsumableCombination[]>(
      (await convertibleMintConsumable.validConsumableCombinations()).map(toConsumableCombination),
    ).toEqual([combo1, combo2, combo3]);

    await diamondCut.diamondCut(
      [],
      buildConsumableConvertibleMintRemoveCombinationFunction(
        convertibleMintInit,
        extractConsumables(combo1.requiredConsumables),
      ),
    );

    expect<ConsumableCombination[]>(
      (await convertibleMintConsumable.validConsumableCombinations()).map(toConsumableCombination),
    ).toEqual([combo3, combo2]);

    await diamondCut.diamondCut([], buildConsumableConvertibleMintAddCombinationFunction(convertibleMintInit, combo4));

    expect<ConsumableCombination[]>(
      (await convertibleMintConsumable.validConsumableCombinations()).map(toConsumableCombination),
    ).toEqual([combo3, combo2, combo4]);

    await diamondCut.diamondCut(
      [],
      buildConsumableConvertibleMintRemoveCombinationFunction(
        convertibleMintInit,
        extractConsumables(combo2.requiredConsumables),
      ),
    );

    expect<ConsumableCombination[]>(
      (await convertibleMintConsumable.validConsumableCombinations()).map(toConsumableCombination),
    ).toEqual([combo3, combo4]);

    await diamondCut.diamondCut(
      [],
      buildConsumableConvertibleMintRemoveCombinationFunction(
        convertibleMintInit,
        extractConsumables(combo3.requiredConsumables),
      ),
    );

    expect<ConsumableCombination[]>(
      (await convertibleMintConsumable.validConsumableCombinations()).map(toConsumableCombination),
    ).toEqual([combo4]);

    await diamondCut.diamondCut(
      [],
      buildConsumableConvertibleMintRemoveCombinationFunction(
        convertibleMintInit,
        extractConsumables(combo4.requiredConsumables),
      ),
    );

    expect<ConsumableCombination[]>(
      (await convertibleMintConsumable.validConsumableCombinations()).map(toConsumableCombination),
    ).toEqual([]);
  });

  it('should fail if the combination is not found', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();
    const consumable3 = await createConsumable();

    const combo1 = {
      requiredConsumables: [{ consumable: consumable1.address, amount: 1 }],
      amountProvided: 1,
    };
    const combo2 = {
      requiredConsumables: [
        { consumable: consumable1.address, amount: 1 },
        { consumable: consumable2.address, amount: 2 },
      ],
      amountProvided: 1,
    };
    const combo3 = {
      requiredConsumables: [
        { consumable: consumable1.address, amount: 1 },
        { consumable: consumable3.address, amount: 3 },
      ],
      amountProvided: 2,
    };
    const combo4 = {
      requiredConsumables: [
        { consumable: consumable1.address, amount: 1 },
        { consumable: consumable2.address, amount: 2 },
        { consumable: consumable3.address, amount: 3 },
      ],
      amountProvided: 3,
    };
    const convertibleMintConsumable = await createConvertibleMintConsumable([combo1, combo2, combo3]);

    expect<ConsumableCombination[]>(
      (await convertibleMintConsumable.validConsumableCombinations()).map(toConsumableCombination),
    ).toEqual([combo1, combo2, combo3]);

    const convertibleMintInit = await deployConsumableConvertibleMintInit();
    const diamondCut = asDiamondCut(convertibleMintConsumable);

    await expect(
      diamondCut.diamondCut(
        [],
        buildConsumableConvertibleMintRemoveCombinationFunction(
          convertibleMintInit,
          extractConsumables(combo4.requiredConsumables),
        ),
      ),
    ).toBeRevertedWith('ConsumableCombinationNotFound');

    expect<ConsumableCombination[]>(
      (await convertibleMintConsumable.validConsumableCombinations()).map(toConsumableCombination),
    ).toEqual([combo1, combo2, combo3]);

    await diamondCut.diamondCut(
      [],
      buildConsumableConvertibleMintRemoveCombinationFunction(
        convertibleMintInit,
        extractConsumables(combo3.requiredConsumables),
      ),
    );

    expect<ConsumableCombination[]>(
      (await convertibleMintConsumable.validConsumableCombinations()).map(toConsumableCombination),
    ).toEqual([combo1, combo2]);

    await expect(
      diamondCut.diamondCut(
        [],
        buildConsumableConvertibleMintRemoveCombinationFunction(
          convertibleMintInit,
          extractConsumables(combo3.requiredConsumables),
        ),
      ),
    ).toBeRevertedWith('ConsumableCombinationNotFound');

    expect<ConsumableCombination[]>(
      (await convertibleMintConsumable.validConsumableCombinations()).map(toConsumableCombination),
    ).toEqual([combo1, combo2]);

    await diamondCut.diamondCut(
      [],
      await combineDiamondInitFunctions([
        buildConsumableConvertibleMintRemoveCombinationFunction(
          convertibleMintInit,
          extractConsumables(combo1.requiredConsumables),
        ),
        buildConsumableConvertibleMintRemoveCombinationFunction(
          convertibleMintInit,
          extractConsumables(combo2.requiredConsumables),
        ),
      ]),
    );

    expect<ConsumableCombination[]>(
      (await convertibleMintConsumable.validConsumableCombinations()).map(toConsumableCombination),
    ).toEqual([]);

    await expect(
      diamondCut.diamondCut(
        [],
        buildConsumableConvertibleMintRemoveCombinationFunction(
          convertibleMintInit,
          extractConsumables(combo1.requiredConsumables),
        ),
      ),
    ).toBeRevertedWith('ConsumableCombinationNotFound');

    expect<ConsumableCombination[]>(
      (await convertibleMintConsumable.validConsumableCombinations()).map(toConsumableCombination),
    ).toEqual([]);
  });
});
