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
  buildERC721AddHooksInitFunction,
  buildERC721TokenInfoSetBaseUriInitFunction,
} from '../../../../src/contracts/artifacts';
import { buildDiamondFacetCut, emptyDiamondInitFunction } from '../../../../src/contracts/diamonds';
import { EstimateTest, singleFunctionFacetEstimate } from '../../../helpers/EstimateHelper';
import {
  deployERC721BurnFacet,
  deployERC721EnumerableFacet,
  deployERC721EnumerableHooks,
  deployERC721Facet,
  deployERC721Init,
  deployERC721MintFacet,
  deployERC721TokenInfoFacet,
  deployERC721TokenInfoInit,
} from '../../../helpers/facets/ERC721FacetHelper';

export const erc721EstimateTests: EstimateTest[] = [
  [
    'ERC721Facet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployERC721Facet())],
      initFunction: emptyDiamondInitFunction,
    }),
    313729,
  ],
  [
    'ERC721EnumerableFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployERC721EnumerableFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    146355,
  ],
  [
    'ERC721EnumerableFacet with init',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployERC721EnumerableFacet())],
      initFunction: buildERC721AddHooksInitFunction(await deployERC721Init(), await deployERC721EnumerableHooks()),
    }),
    218354,
  ],
  [
    'ERC72MintFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployERC721MintFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    singleFunctionFacetEstimate,
  ],
  [
    'ERC72BurnFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployERC721BurnFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    singleFunctionFacetEstimate,
  ],
  [
    'ERC721TokenInfoFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployERC721TokenInfoFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    singleFunctionFacetEstimate,
  ],
  [
    'ERC721TokenInfoFacet with init',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployERC721TokenInfoFacet())],
      initFunction: buildERC721TokenInfoSetBaseUriInitFunction(await deployERC721TokenInfoInit(), 'base uri'),
    }),
    126939,
  ],
];
