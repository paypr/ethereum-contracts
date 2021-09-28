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

import { buildDiamondFacetCut } from '../../../../src/contracts/core/diamonds';
import { ERC721_TOKEN_INFO_INTERFACE_ID } from '../../../../src/contracts/erc165InterfaceIds';
import { PLAYER1 } from '../../../helpers/Accounts';
import { deployDiamond } from '../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165Helper';
import { asErc165, deployErc165Facet } from '../../../helpers/facets/ERC165FacetHelper';
import {
  asERC721TokenInfo,
  buildERC721TokenInfoAdditions,
  createMintableERC721,
  deployERC721TokenInfoFacet,
} from '../../../helpers/facets/ERC721FacetHelper';

describe('supportsInterface', () => {
  const createDiamondForErc165 = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deployERC721TokenInfoFacet()),
      ]),
    );

  shouldSupportInterface('ERC721TokenInfo', createDiamondForErc165, ERC721_TOKEN_INFO_INTERFACE_ID);
});

describe('tokenURI', () => {
  it('should return the empty string when no base URI set', async () => {
    const erc721Mint = await createMintableERC721({
      additionalCuts: [buildDiamondFacetCut(await deployERC721TokenInfoFacet())],
    });
    const erc721TokenInfo = asERC721TokenInfo(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 1001);

    expect<string>(await erc721TokenInfo.tokenURI(1)).toEqual('');
    expect<string>(await erc721TokenInfo.tokenURI(1001)).toEqual('');
  });

  it('should return the empty string when base URI set to empty string', async () => {
    const erc721Mint = await createMintableERC721(await buildERC721TokenInfoAdditions({ baseURI: '' }));

    const erc721TokenInfo = asERC721TokenInfo(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 1001);

    expect<string>(await erc721TokenInfo.tokenURI(1)).toEqual('');
    expect<string>(await erc721TokenInfo.tokenURI(1001)).toEqual('');
  });

  it('should return the correct URI when base URI set', async () => {
    const erc721Mint = await createMintableERC721(await buildERC721TokenInfoAdditions({ baseURI: 'myBase/' }));

    const erc721TokenInfo = asERC721TokenInfo(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 1001);

    expect<string>(await erc721TokenInfo.tokenURI(1)).toEqual('myBase/1');
    expect<string>(await erc721TokenInfo.tokenURI(1001)).toEqual('myBase/1001');
  });

  it('should fail when the token does not exist', async () => {
    const erc721Mint = await createMintableERC721(await buildERC721TokenInfoAdditions({ baseURI: 'myBase/' }));

    const erc721TokenInfo = asERC721TokenInfo(erc721Mint);

    await expect<Promise<string>>(erc721TokenInfo.tokenURI(1)).toBeRevertedWith('URI query for nonexistent token');
  });
});
