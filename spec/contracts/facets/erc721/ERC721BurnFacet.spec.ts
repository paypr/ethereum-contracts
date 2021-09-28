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
import { buildDiamondFacetCut } from '../../../../src/contracts/diamonds';
import { ERC721_BURNABLE_INTERFACE_ID } from '../../../../src/contracts/erc165InterfaceIds';
import { INITIALIZER, PLAYER1 } from '../../../helpers/Accounts';
import { deployDiamond } from '../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165Helper';
import { asDisableable, buildDisableableDiamondAdditions } from '../../../helpers/facets/DisableableFacetHelper';
import { asErc165, deployErc165Facet } from '../../../helpers/facets/ERC165FacetHelper';
import {
  asERC721,
  asERC721Mint,
  createBurnableERC721,
  deployERC721BurnFacet,
} from '../../../helpers/facets/ERC721FacetHelper';

describe('supportsInterface', () => {
  const createDiamondForErc165 = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deployERC721BurnFacet()),
      ]),
    );

  shouldSupportInterface('ERC721Burn', createDiamondForErc165, ERC721_BURNABLE_INTERFACE_ID);
});

describe('burn', () => {
  it('should remove an item from the player', async () => {
    const erc721Burn = await createBurnableERC721();
    const erc721Mint = asERC721Mint(erc721Burn);
    const erc721 = asERC721(erc721Burn);

    await erc721Mint.mint(PLAYER1.address, 1);

    expect<string>(await erc721.ownerOf(1)).toEqual(PLAYER1.address);

    await erc721Burn.burn(1);

    await expect<Promise<string>>(erc721.ownerOf(1)).toBeRevertedWith('ERC721: owner query for nonexistent token');

    await erc721Mint.mint(PLAYER1.address, 1001);

    expect<string>(await erc721.ownerOf(1001)).toEqual(PLAYER1.address);

    await erc721Burn.burn(1001);

    await expect<Promise<string>>(erc721.ownerOf(1001)).toBeRevertedWith('ERC721: owner query for nonexistent token');
  });

  it('should not burn a new item if not the burner', async () => {
    const erc721Burn = await createBurnableERC721();
    const erc721Mint = asERC721Mint(erc721Burn);
    const erc721 = asERC721(erc721Burn);

    await erc721Mint.mint(PLAYER1.address, 1);

    await expect<Promise<ContractTransaction>>(erc721Burn.connect(INITIALIZER).burn(1)).toBeRevertedWith(
      'missing role',
    );
    expect<string>(await erc721.ownerOf(1)).toEqual(PLAYER1.address);

    await expect<Promise<ContractTransaction>>(erc721Burn.connect(PLAYER1).burn(1)).toBeRevertedWith('missing role');
    expect<string>(await erc721.ownerOf(1)).toEqual(PLAYER1.address);
  });

  it('should not burn if disabled', async () => {
    const erc721Burn = await createBurnableERC721(await buildDisableableDiamondAdditions());

    await asERC721Mint(erc721Burn).mint(PLAYER1.address, 1);

    await asDisableable(erc721Burn).disable();

    await expect<Promise<ContractTransaction>>(erc721Burn.burn(1)).toBeRevertedWith('Contract is disabled');
  });
});
