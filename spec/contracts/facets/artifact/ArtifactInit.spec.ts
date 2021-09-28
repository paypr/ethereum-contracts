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
import { buildArtifactInitFunction } from '../../../../src/contracts/artifacts';
import { buildDiamondFacetCut } from '../../../../src/contracts/diamonds';
import { ERC721_INTERFACE_ID } from '../../../../src/contracts/erc165InterfaceIds';
import { createDiamond, deployDiamond } from '../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165Helper';
import {
  createArtifact,
  deployArtifactFacet,
  deployArtifactERC721Hooks,
  deployArtifactInit,
  deployArtifactTransferHooks,
} from '../../../helpers/facets/ArtifactFacetHelper';
import { asDiamondCut } from '../../../helpers/facets/DiamondFacetHelper';
import { asErc165, deployErc165Facet } from '../../../helpers/facets/ERC165FacetHelper';
import { deployERC721Facet } from '../../../helpers/facets/ERC721FacetHelper';

describe('supportsInterface', () => {
  const createDiamondForErc165 = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deployERC721Facet()),
      ]),
    );

  shouldSupportInterface('ERC721', createDiamondForErc165, ERC721_INTERFACE_ID);
});

describe('initialize', () => {
  it('should set the initial uses', async () => {
    const artifact1 = await createArtifact(1);

    expect<BigNumber>(await artifact1.initialUses()).toEqBN(1);

    const artifact2 = await createArtifact(10);

    expect<BigNumber>(await artifact2.initialUses()).toEqBN(10);
  });

  it('should revert if initial uses is 0', async () => {
    const diamond = asDiamondCut(await createDiamond());

    const artifactFacet = await deployArtifactFacet();
    const artifactERC721Hooks = await deployArtifactERC721Hooks();
    const artifactTransferHooks = await deployArtifactTransferHooks();
    const artifactInit = await deployArtifactInit();

    await expect<Promise<ContractTransaction>>(
      diamond.diamondCut(
        [buildDiamondFacetCut(artifactFacet)],
        buildArtifactInitFunction(artifactInit, {
          initialUses: 0,
          erc721Hooks: artifactERC721Hooks,
          transferHooks: artifactTransferHooks,
        }),
      ),
    ).toBeRevertedWith('initial uses must be > 0');
  });
});
