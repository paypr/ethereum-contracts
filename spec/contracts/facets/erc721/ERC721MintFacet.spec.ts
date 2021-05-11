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

import { ContractTransaction } from 'ethers';
import { buildDiamondFacetCut } from '../../../../src/contracts/core/diamonds';
import { ERC721_MINTABLE_INTERFACE_ID } from '../../../../src/contracts/erc165InterfaceIds';
import { INITIALIZER, PLAYER1 } from '../../../helpers/Accounts';
import { deployDiamond } from '../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165Helper';
import { asDisableable, buildDisableableDiamondAdditions } from '../../../helpers/facets/DisableableFacetHelper';
import { asErc165, deployErc165Facet } from '../../../helpers/facets/ERC165FacetHelper';
import { asERC721, createMintableERC721, deployERC721MintFacet } from '../../../helpers/facets/ERC721FacetHelper';

describe('supportsInterface', () => {
  const createDiamondForErc165 = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deployERC721MintFacet()),
      ]),
    );

  shouldSupportInterface('ERC721Mint', createDiamondForErc165, ERC721_MINTABLE_INTERFACE_ID);
});

describe('mint', () => {
  it('should give a new item to the player', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);

    expect<string>(await erc721.ownerOf(1)).toEqual(PLAYER1.address);

    await erc721Mint.mint(PLAYER1.address, 1001);

    expect<string>(await erc721.ownerOf(1001)).toEqual(PLAYER1.address);
  });

  it('should not mint a new item if not the minter', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await expect<Promise<ContractTransaction>>(
      erc721Mint.connect(INITIALIZER).mint(PLAYER1.address, 1),
    ).toBeRevertedWith('missing role');
    await expect<Promise<string>>(erc721.ownerOf(1)).toBeRevertedWith('ERC721: owner query for nonexistent token');

    await expect<Promise<ContractTransaction>>(erc721Mint.connect(PLAYER1).mint(PLAYER1.address, 1)).toBeRevertedWith(
      'missing role',
    );
    await expect<Promise<string>>(erc721.ownerOf(1)).toBeRevertedWith('ERC721: owner query for nonexistent token');
  });

  it('should not mint if disabled', async () => {
    const erc721Mint = await createMintableERC721(await buildDisableableDiamondAdditions());

    await asDisableable(erc721Mint).disable();

    await expect<Promise<ContractTransaction>>(erc721Mint.mint(PLAYER1.address, 1)).toBeRevertedWith(
      'Contract is disabled',
    );
  });

  it.todo('should mint to ERC721Receiver contract');
  it.todo('should not mint to invalid contract');
});
