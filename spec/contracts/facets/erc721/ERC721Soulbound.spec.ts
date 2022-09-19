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
import { ContractTransaction } from 'ethers/lib/ethers';
import { PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { combineExtensibleDiamondOptions } from '../../../helpers/DiamondHelper';
import {
  asERC721,
  asERC721Enumerable,
  asERC721Mint,
  buildERC721EnumerableAdditions,
  buildERC721SoulboundAdditions,
  createBurnableERC721,
  createMintableERC721,
} from '../../../helpers/facets/ERC721FacetHelper';

describe('ERC721SoulboundHooks', () => {
  it('should revert when not minting or burning', async () => {
    const erc721Mint = await createMintableERC721(
      combineExtensibleDiamondOptions(await buildERC721EnumerableAdditions(), await buildERC721SoulboundAdditions()),
    );
    const erc721 = asERC721(erc721Mint);
    const erc721Enumerable = asERC721Enumerable(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER2.address, 2);
    await erc721Mint.mint(PLAYER1.address, 3);

    expect<BigNumber>(await erc721.balanceOf(PLAYER1.address)).toEqBN(2);
    expect<BigNumber>(await erc721.balanceOf(PLAYER2.address)).toEqBN(1);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 0)).toEqBN(1);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 1)).toEqBN(3);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER2.address, 0)).toEqBN(2);

    await expect<Promise<ContractTransaction>>(
      erc721.connect(PLAYER1)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 1),
    ).toBeRevertedWith('TransferNotAllowed');

    expect<BigNumber>(await erc721.balanceOf(PLAYER1.address)).toEqBN(2);
    expect<BigNumber>(await erc721.balanceOf(PLAYER2.address)).toEqBN(1);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 0)).toEqBN(1);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 1)).toEqBN(3);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER2.address, 0)).toEqBN(2);

    await expect<Promise<ContractTransaction>>(
      erc721.connect(PLAYER2)['safeTransferFrom(address,address,uint256)'](PLAYER2.address, PLAYER1.address, 2),
    ).toBeRevertedWith('TransferNotAllowed');

    expect<BigNumber>(await erc721.balanceOf(PLAYER1.address)).toEqBN(2);
    expect<BigNumber>(await erc721.balanceOf(PLAYER2.address)).toEqBN(1);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 0)).toEqBN(1);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 1)).toEqBN(3);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER2.address, 0)).toEqBN(2);
  });

  it('should not revert when minting', async () => {
    const erc721Mint = await createMintableERC721(
      combineExtensibleDiamondOptions(await buildERC721EnumerableAdditions(), await buildERC721SoulboundAdditions()),
    );
    const erc721 = asERC721(erc721Mint);
    const erc721Enumerable = asERC721Enumerable(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    expect<BigNumber>(await erc721.balanceOf(PLAYER1.address)).toEqBN(1);
    expect<BigNumber>(await erc721.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 0)).toEqBN(1);

    await erc721Mint.mint(PLAYER2.address, 2);
    expect<BigNumber>(await erc721.balanceOf(PLAYER1.address)).toEqBN(1);
    expect<BigNumber>(await erc721.balanceOf(PLAYER2.address)).toEqBN(1);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 0)).toEqBN(1);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER2.address, 0)).toEqBN(2);

    await erc721Mint.mint(PLAYER1.address, 3);
    expect<BigNumber>(await erc721.balanceOf(PLAYER1.address)).toEqBN(2);
    expect<BigNumber>(await erc721.balanceOf(PLAYER2.address)).toEqBN(1);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 0)).toEqBN(1);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 1)).toEqBN(3);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER2.address, 0)).toEqBN(2);
  });

  it('should not revert when burning', async () => {
    const erc721Burn = await createBurnableERC721(
      combineExtensibleDiamondOptions(await buildERC721EnumerableAdditions(), await buildERC721SoulboundAdditions()),
    );
    const erc721Mint = asERC721Mint(erc721Burn);
    const erc721 = asERC721(erc721Burn);
    const erc721Enumerable = asERC721Enumerable(erc721Burn);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER2.address, 2);
    await erc721Mint.mint(PLAYER1.address, 3);
    expect<BigNumber>(await erc721.balanceOf(PLAYER1.address)).toEqBN(2);
    expect<BigNumber>(await erc721.balanceOf(PLAYER2.address)).toEqBN(1);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 0)).toEqBN(1);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 1)).toEqBN(3);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER2.address, 0)).toEqBN(2);

    await erc721Burn.burn(3);
    expect<BigNumber>(await erc721.balanceOf(PLAYER1.address)).toEqBN(1);
    expect<BigNumber>(await erc721.balanceOf(PLAYER2.address)).toEqBN(1);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 0)).toEqBN(1);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER2.address, 0)).toEqBN(2);

    await erc721Burn.burn(2);
    expect<BigNumber>(await erc721.balanceOf(PLAYER1.address)).toEqBN(1);
    expect<BigNumber>(await erc721.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await erc721Enumerable.tokenOfOwnerByIndex(PLAYER1.address, 0)).toEqBN(1);

    await erc721Burn.burn(1);
    expect<BigNumber>(await erc721.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await erc721.balanceOf(PLAYER2.address)).toEqBN(0);
  });
});
