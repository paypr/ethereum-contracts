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

import { BigNumber, Contract, Signer } from 'ethers';
import {
  buildConsumableConvertibleMintSetCombinationsFunction,
  ConsumableCombination,
  ConsumableCombinationBN,
} from '../../../src/contracts/consumables/convertibleMint';
import { buildDiamondFacetCut } from '../../../src/contracts/diamonds';
import {
  ConsumableConvertibleMintConsumableFacet__factory,
  ConsumableConvertibleMintInit__factory,
  IConsumableConvertibleMint__factory,
} from '../../../types/contracts';
import { INITIALIZER } from '../Accounts';
import { combineExtensibleDiamondOptions, ExtensibleDiamondOptions } from '../DiamondHelper';
import { createConsumable, toConsumableAmount, toConsumableAmountBN } from './ConsumableFacetHelper';

export const asConsumableConvertibleMint = (contract: Contract, signer: Signer = INITIALIZER) =>
  IConsumableConvertibleMint__factory.connect(contract.address, signer);

export const createConvertibleMintConsumable = async (
  combinations: ConsumableCombination[],
  options: ExtensibleDiamondOptions = {},
) => {
  const convertibleMintConsumableFacet = await deployConsumableConvertibleMintConsumableFacet();
  const conversionInit = await deployConsumableConvertibleMintInit();
  return asConsumableConvertibleMint(
    await createConsumable(
      combineExtensibleDiamondOptions(
        {
          additionalCuts: [buildDiamondFacetCut(convertibleMintConsumableFacet)],
          additionalInits: [buildConsumableConvertibleMintSetCombinationsFunction(conversionInit, combinations)],
        },
        options,
      ),
    ),
  );
};

export const toConsumableCombination = (consumableCombination: ConsumableCombinationBN): ConsumableCombination => {
  const { requiredConsumables, amountProvided } = consumableCombination;
  return {
    requiredConsumables: requiredConsumables.map(toConsumableAmount),
    amountProvided: amountProvided.toNumber(),
  };
};

export const toConsumableCombinationBN = (consumableCombination: ConsumableCombination): ConsumableCombinationBN => {
  const { requiredConsumables, amountProvided } = consumableCombination;
  return {
    requiredConsumables: requiredConsumables.map(toConsumableAmountBN),
    amountProvided: BigNumber.from(amountProvided),
  };
};

export const deployConsumableConvertibleMintConsumableFacet = () =>
  new ConsumableConvertibleMintConsumableFacet__factory(INITIALIZER).deploy();
export const deployConsumableConvertibleMintInit = () =>
  new ConsumableConvertibleMintInit__factory(INITIALIZER).deploy();
