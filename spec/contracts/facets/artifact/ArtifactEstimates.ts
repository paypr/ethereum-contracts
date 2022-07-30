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

import { buildArtifactInitFunction } from '../../../../src/contracts/artifacts';
import { buildDiamondFacetCut, emptyDiamondInitFunction } from '../../../../src/contracts/diamonds';
import { EstimateTest, singleFunctionFacetEstimate } from '../../../helpers/EstimateHelper';
import {
  deployArtifactERC721Hooks,
  deployArtifactFacet,
  deployArtifactInit,
  deployArtifactMintFacet,
  deployArtifactTransferHooks,
} from '../../../helpers/facets/ArtifactFacetHelper';

export const artifactEstimateTests: EstimateTest[] = [
  [
    'ArtifactFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployArtifactFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    170609,
  ],
  [
    'ArtifactFacet with init',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployArtifactFacet())],
      initFunction: buildArtifactInitFunction(await deployArtifactInit(), {
        erc721Hooks: await deployArtifactERC721Hooks(),
        transferHooks: await deployArtifactTransferHooks(),
        initialUses: 1,
      }),
    }),
    333320,
  ],
  [
    'ArtifactMintFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployArtifactMintFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    singleFunctionFacetEstimate,
  ],
];
