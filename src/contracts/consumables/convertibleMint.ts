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
import { ConsumableConvertibleMintInit } from '../../../types/contracts';
import { ConsumableAmount, ConsumableAmountBN } from '../consumables';
import ContractAddress from '../ContractAddress';
import { DiamondInitFunction } from '../diamonds';

export type ConsumableCombinationLike = ConsumableCombination | ConsumableCombinationBN;

export interface ConsumableCombination {
  requiredConsumables: ConsumableAmount[];
  amountProvided: number;
}

export interface ConsumableCombinationBN {
  requiredConsumables: ConsumableAmountBN[];
  amountProvided: BigNumber;
}

export const buildConsumableConvertibleMintSetCombinationsFunction = (
  init: ConsumableConvertibleMintInit,
  combinations: ConsumableCombination[],
): DiamondInitFunction => ({
  initAddress: init.address,
  callData: encodeConsumableConvertibleMintSetCombinationsCallData(init, combinations),
});

const encodeConsumableConvertibleMintSetCombinationsCallData = (
  init: ConsumableConvertibleMintInit,
  combinations: ConsumableCombination[],
) => init.interface.encodeFunctionData('setCombinations', [combinations]);

export const buildConsumableConvertibleMintAddCombinationFunction = (
  init: ConsumableConvertibleMintInit,
  combination: ConsumableCombination,
): DiamondInitFunction => ({
  initAddress: init.address,
  callData: encodeConsumableConvertibleMintAddCombinationCallData(init, combination),
});

const encodeConsumableConvertibleMintAddCombinationCallData = (
  init: ConsumableConvertibleMintInit,
  combination: ConsumableCombination,
) => init.interface.encodeFunctionData('addCombination', [combination]);

export const buildConsumableConvertibleMintRemoveCombinationFunction = (
  init: ConsumableConvertibleMintInit,
  consumables: ContractAddress[],
): DiamondInitFunction => ({
  initAddress: init.address,
  callData: encodeConsumableConvertibleMintRemoveCombinationCallData(init, consumables),
});

const encodeConsumableConvertibleMintRemoveCombinationCallData = (
  init: ConsumableConvertibleMintInit,
  consumables: ContractAddress[],
) => init.interface.encodeFunctionData('removeCombination', [consumables]);
