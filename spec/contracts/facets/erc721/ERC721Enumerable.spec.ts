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

import { BigNumber } from 'ethers';
import { buildDiamondFacetCut } from '../../../../src/contracts/diamonds';
import { ERC721_ENUMERABLE_INTERFACE_ID } from '../../../../src/contracts/erc165InterfaceIds';
import { PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { deployDiamond } from '../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165Helper';
import { asErc165, deployErc165Facet } from '../../../helpers/facets/ERC165FacetHelper';
import {
  asERC721,
  asERC721Enumerable,
  asERC721Mint,
  buildERC721EnumerableAdditions,
  createBurnableERC721,
  createMintableERC721,
  deployERC721EnumerableFacet,
} from '../../../helpers/facets/ERC721FacetHelper';

describe('supportsInterface', () => {
  const createDiamondForErc165 = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deployERC721EnumerableFacet()),
      ]),
    );

  shouldSupportInterface('ERC721Enumerable', createDiamondForErc165, ERC721_ENUMERABLE_INTERFACE_ID);
});

describe('totalSupply', () => {
  it('should return 0 when there are no tokens in supply', async () => {
    const erc721Mint = await createMintableERC721(await buildERC721EnumerableAdditions());
    const erc721Enumerable = asERC721Enumerable(erc721Mint);

    expect<BigNumber>(await erc721Enumerable.totalSupply()).toEqBN(0);
  });

  it('should return the correct number when there are tokens in supply', async () => {
    const erc721Burn = await createBurnableERC721(await buildERC721EnumerableAdditions());
    const erc721Mint = asERC721Mint(erc721Burn);
    const erc721Enumerable = asERC721Enumerable(erc721Burn);
    const erc721 = asERC721(erc721Burn);

    await erc721Mint.mint(PLAYER1.address, 1);
    expect<BigNumber>(await erc721Enumerable.totalSupply()).toEqBN(1);

    await erc721Mint.mint(PLAYER2.address, 2);
    expect<BigNumber>(await erc721Enumerable.totalSupply()).toEqBN(2);

    await erc721Mint.mint(PLAYER1.address, 3);
    expect<BigNumber>(await erc721Enumerable.totalSupply()).toEqBN(3);

    await erc721.connect(PLAYER2)['safeTransferFrom(address,address,uint256)'](PLAYER2.address, PLAYER1.address, 2);
    expect<BigNumber>(await erc721Enumerable.totalSupply()).toEqBN(3);

    await erc721Burn.burn(2);
    expect<BigNumber>(await erc721Enumerable.totalSupply()).toEqBN(2);

    await erc721Burn.burn(3);
    expect<BigNumber>(await erc721Enumerable.totalSupply()).toEqBN(1);

    await erc721Burn.burn(1);
    expect<BigNumber>(await erc721Enumerable.totalSupply()).toEqBN(0);
  });
});

describe('tokenOfOwnerByIndex', () => {
  it('should return the token for the owner', async () => {
    const erc721Burn = await createBurnableERC721(await buildERC721EnumerableAdditions());
    const erc721Mint = asERC721Mint(erc721Burn);
    const erc721 = asERC721(erc721Burn);
    const erc721Enumerable = asERC721Enumerable(erc721Burn);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER2.address, 2);
    await erc721Mint.mint(PLAYER1.address, 3);
    await erc721Mint.mint(PLAYER2.address, 4);

    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 0)).toEqBN(1);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 1)).toEqBN(3);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER2.address, 0)).toEqBN(2);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER2.address, 1)).toEqBN(4);

    await erc721.connect(PLAYER1)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 1);

    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 0)).toEqBN(3);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER2.address, 0)).toEqBN(2);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER2.address, 1)).toEqBN(4);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER2.address, 2)).toEqBN(1);

    await erc721.connect(PLAYER2)['safeTransferFrom(address,address,uint256)'](PLAYER2.address, PLAYER1.address, 2);

    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 0)).toEqBN(3);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 1)).toEqBN(2);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER2.address, 0)).toEqBN(1);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER2.address, 1)).toEqBN(4);

    await erc721Burn.burn(3);

    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 0)).toEqBN(2);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER2.address, 0)).toEqBN(1);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER2.address, 1)).toEqBN(4);

    await erc721Burn.burn(4);

    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 0)).toEqBN(2);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER2.address, 0)).toEqBN(1);
  });

  it('should fail if index is out of bounds', async () => {
    const erc721Mint = await createMintableERC721(await buildERC721EnumerableAdditions());
    const erc721 = asERC721(erc721Mint);
    const erc721Enumerable = asERC721Enumerable(erc721Mint);

    await expect<Promise<BigNumber>>(erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 0)).toBeRevertedWith(
      'owner index out of bounds',
    );
    await expect<Promise<BigNumber>>(erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 1)).toBeRevertedWith(
      'owner index out of bounds',
    );
    await expect<Promise<BigNumber>>(erc721Enumerable.tokenOfOwnerByIndex(PLAYER2.address, 0)).toBeRevertedWith(
      'owner index out of bounds',
    );

    await erc721Mint.mint(PLAYER1.address, 1);

    await expect<Promise<BigNumber>>(erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 1)).toBeRevertedWith(
      'owner index out of bounds',
    );
    await expect<Promise<BigNumber>>(erc721Enumerable.tokenOfOwnerByIndex(PLAYER2.address, 1)).toBeRevertedWith(
      'owner index out of bounds',
    );

    await erc721Mint.mint(PLAYER2.address, 2);
    await erc721Mint.mint(PLAYER1.address, 3);
    await erc721Mint.mint(PLAYER2.address, 4);

    await expect<Promise<BigNumber>>(erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 2)).toBeRevertedWith(
      'owner index out of bounds',
    );
    await expect<Promise<BigNumber>>(erc721Enumerable.tokenOfOwnerByIndex(PLAYER2.address, 2)).toBeRevertedWith(
      'owner index out of bounds',
    );

    await erc721.connect(PLAYER1)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 1);

    await expect<Promise<BigNumber>>(erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 1)).toBeRevertedWith(
      'owner index out of bounds',
    );
    await expect<Promise<BigNumber>>(erc721Enumerable.tokenOfOwnerByIndex(PLAYER2.address, 3)).toBeRevertedWith(
      'owner index out of bounds',
    );
  });
});

describe('tokenByIndex', () => {
  it('should return the token', async () => {
    const erc721Burn = await createBurnableERC721(await buildERC721EnumerableAdditions());
    const erc721Mint = asERC721Mint(erc721Burn);
    const erc721 = asERC721(erc721Burn);
    const erc721Enumerable = asERC721Enumerable(erc721Burn);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER2.address, 2);
    await erc721Mint.mint(PLAYER1.address, 4);
    await erc721Mint.mint(PLAYER2.address, 3);

    expect<BigNumber>(await erc721Enumerable.tokenByIndex(0)).toEqBN(1);
    expect<BigNumber>(await erc721Enumerable.tokenByIndex(1)).toEqBN(2);
    expect<BigNumber>(await erc721Enumerable.tokenByIndex(2)).toEqBN(4);
    expect<BigNumber>(await erc721Enumerable.tokenByIndex(3)).toEqBN(3);

    await erc721.connect(PLAYER1)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 1);

    expect<BigNumber>(await erc721Enumerable.tokenByIndex(0)).toEqBN(1);
    expect<BigNumber>(await erc721Enumerable.tokenByIndex(1)).toEqBN(2);
    expect<BigNumber>(await erc721Enumerable.tokenByIndex(2)).toEqBN(4);
    expect<BigNumber>(await erc721Enumerable.tokenByIndex(3)).toEqBN(3);

    await erc721Mint.mint(PLAYER2.address, 5);

    expect<BigNumber>(await erc721Enumerable.tokenByIndex(0)).toEqBN(1);
    expect<BigNumber>(await erc721Enumerable.tokenByIndex(1)).toEqBN(2);
    expect<BigNumber>(await erc721Enumerable.tokenByIndex(2)).toEqBN(4);
    expect<BigNumber>(await erc721Enumerable.tokenByIndex(3)).toEqBN(3);
    expect<BigNumber>(await erc721Enumerable.tokenByIndex(4)).toEqBN(5);

    await erc721Burn.burn(2);

    expect<BigNumber>(await erc721Enumerable.tokenByIndex(0)).toEqBN(1);
    expect<BigNumber>(await erc721Enumerable.tokenByIndex(1)).toEqBN(5);
    expect<BigNumber>(await erc721Enumerable.tokenByIndex(2)).toEqBN(4);
    expect<BigNumber>(await erc721Enumerable.tokenByIndex(3)).toEqBN(3);

    await erc721Burn.burn(3);

    expect<BigNumber>(await erc721Enumerable.tokenByIndex(0)).toEqBN(1);
    expect<BigNumber>(await erc721Enumerable.tokenByIndex(1)).toEqBN(5);
    expect<BigNumber>(await erc721Enumerable.tokenByIndex(2)).toEqBN(4);
  });

  it('should fail if index is out of bounds', async () => {
    const erc721Mint = await createMintableERC721(await buildERC721EnumerableAdditions());
    const erc721Enumerable = asERC721Enumerable(erc721Mint);

    await expect<Promise<BigNumber>>(erc721Enumerable.tokenByIndex(1)).toBeRevertedWith('global index out of bounds');
    await expect<Promise<BigNumber>>(erc721Enumerable.tokenByIndex(2)).toBeRevertedWith('global index out of bounds');
    await expect<Promise<BigNumber>>(erc721Enumerable.tokenByIndex(10)).toBeRevertedWith('global index out of bounds');

    await erc721Mint.mint(PLAYER1.address, 1);

    await expect<Promise<BigNumber>>(erc721Enumerable.tokenByIndex(2)).toBeRevertedWith('global index out of bounds');

    await erc721Mint.mint(PLAYER2.address, 2);

    await expect<Promise<BigNumber>>(erc721Enumerable.tokenByIndex(3)).toBeRevertedWith('global index out of bounds');
    await expect<Promise<BigNumber>>(erc721Enumerable.tokenByIndex(100)).toBeRevertedWith('global index out of bounds');
  });
});
