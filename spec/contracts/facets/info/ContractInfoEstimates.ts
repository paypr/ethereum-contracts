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

import { buildContractInfoInitializeInitFunction } from '../../../../src/contracts/contractInfo';
import { buildDiamondFacetCut, emptyDiamondInitFunction } from '../../../../src/contracts/diamonds';
import { EstimateTest } from '../../../helpers/EstimateHelper';
import { deployContractInfoFacet, deployContractInfoInit } from '../../../helpers/facets/ContractInfoFacetHelper';

export const contractInfoEstimateTests: EstimateTest[] = [
  [
    'ContractInfoFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployContractInfoFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    170609,
  ],
  [
    'ContractInfoFacet with init name',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployContractInfoFacet())],
      initFunction: buildContractInfoInitializeInitFunction(await deployContractInfoInit(), { name: 'the name' }),
    }),
    215643,
  ],
  [
    'ContractInfoFacet with init name and symbol',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployContractInfoFacet())],
      initFunction: buildContractInfoInitializeInitFunction(await deployContractInfoInit(), {
        name: 'the name',
        symbol: 'the symbol',
      }),
    }),
    236328,
  ],
  [
    'ContractInfoFacet with init all',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployContractInfoFacet())],
      initFunction: buildContractInfoInitializeInitFunction(await deployContractInfoInit(), {
        name: 'the name',
        symbol: 'the symbol',
        description: 'the description',
        uri: 'the uri',
      }),
    }),
    277698,
  ],
];
