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
import { AccountAddress, ZERO_ADDRESS } from '../../../../src/contracts/accounts';
import { buildDiamondFacetCut } from '../../../../src/contracts/diamonds';
import { ERC721_INTERFACE_ID } from '../../../../src/contracts/erc165InterfaceIds';
import { PLAYER1, PLAYER2, PLAYER3 } from '../../../helpers/Accounts';
import { deployDiamond } from '../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165Helper';
import { asErc165, deployErc165Facet } from '../../../helpers/facets/ERC165FacetHelper';
import {
  asERC721,
  createERC721,
  createMintableERC721,
  deployERC721Facet,
} from '../../../helpers/facets/ERC721FacetHelper';

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

describe('balanceOf', () => {
  it('should return 0 for owner with no tokens', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    expect<BigNumber>(await erc721.balanceOf(PLAYER1.address)).toEqBN(0);

    await erc721Mint.mint(PLAYER1.address, 1);

    expect<BigNumber>(await erc721.balanceOf(PLAYER2.address)).toEqBN(0);
  });

  it('should return correct number for owners with tokens', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);

    expect<BigNumber>(await erc721.balanceOf(PLAYER1.address)).toEqBN(1);
    expect<BigNumber>(await erc721.balanceOf(PLAYER2.address)).toEqBN(0);

    await erc721Mint.mint(PLAYER1.address, 10);

    expect<BigNumber>(await erc721.balanceOf(PLAYER1.address)).toEqBN(2);
    expect<BigNumber>(await erc721.balanceOf(PLAYER2.address)).toEqBN(0);

    await erc721Mint.mint(PLAYER2.address, 2);

    expect<BigNumber>(await erc721.balanceOf(PLAYER1.address)).toEqBN(2);
    expect<BigNumber>(await erc721.balanceOf(PLAYER2.address)).toEqBN(1);
  });
});

describe('ownerOf', () => {
  it('should return the owner', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER1.address);

    await erc721Mint.mint(PLAYER1.address, 10);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER1.address);
    expect<AccountAddress>(await erc721.ownerOf(10)).toEqual(PLAYER1.address);

    await erc721Mint.mint(PLAYER2.address, 2);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER1.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.ownerOf(10)).toEqual(PLAYER1.address);
  });

  it('should fail if the token does not exist', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await expect<Promise<string>>(erc721.ownerOf(1)).toBeRevertedWith('owner query for nonexistent token');
    await expect<Promise<string>>(erc721.ownerOf(2)).toBeRevertedWith('owner query for nonexistent token');
    await expect<Promise<string>>(erc721.ownerOf(10)).toBeRevertedWith('owner query for nonexistent token');
    await expect<Promise<string>>(erc721.ownerOf(20)).toBeRevertedWith('owner query for nonexistent token');

    await erc721Mint.mint(PLAYER1.address, 1);

    await erc721.ownerOf(1);
    await expect<Promise<string>>(erc721.ownerOf(2)).toBeRevertedWith('owner query for nonexistent token');
    await expect<Promise<string>>(erc721.ownerOf(10)).toBeRevertedWith('owner query for nonexistent token');
    await expect<Promise<string>>(erc721.ownerOf(20)).toBeRevertedWith('owner query for nonexistent token');

    await erc721Mint.mint(PLAYER1.address, 10);

    await erc721.ownerOf(1);
    await expect<Promise<string>>(erc721.ownerOf(2)).toBeRevertedWith('owner query for nonexistent token');
    await erc721.ownerOf(10);
    await expect<Promise<string>>(erc721.ownerOf(20)).toBeRevertedWith('owner query for nonexistent token');

    await erc721Mint.mint(PLAYER2.address, 2);

    await erc721.ownerOf(1);
    await erc721.ownerOf(2);
    await erc721.ownerOf(10);
    await expect<Promise<string>>(erc721.ownerOf(20)).toBeRevertedWith('owner query for nonexistent token');
  });
});

describe('getApproved', () => {
  it('should return zero address when nobody approved', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 2);

    expect<AccountAddress>(await erc721.getApproved(1)).toEqual(ZERO_ADDRESS);
    expect<AccountAddress>(await erc721.getApproved(2)).toEqual(ZERO_ADDRESS);
  });

  it('should return the account when approved', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 2);

    await erc721.connect(PLAYER1).approve(PLAYER2.address, 1);
    expect<AccountAddress>(await erc721.getApproved(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.getApproved(2)).toEqual(ZERO_ADDRESS);

    await erc721.connect(PLAYER1).approve(PLAYER3.address, 2);
    expect<AccountAddress>(await erc721.getApproved(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.getApproved(2)).toEqual(PLAYER3.address);
  });
});

describe('isApprovedForAll', () => {
  it('should return false when not set', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 2);

    expect<boolean>(await erc721.isApprovedForAll(PLAYER1.address, PLAYER2.address)).toEqual(false);
    expect<boolean>(await erc721.isApprovedForAll(PLAYER1.address, PLAYER3.address)).toEqual(false);

    await erc721.connect(PLAYER2).setApprovalForAll(PLAYER3.address, true);
    expect<boolean>(await erc721.isApprovedForAll(PLAYER1.address, PLAYER2.address)).toEqual(false);
    expect<boolean>(await erc721.isApprovedForAll(PLAYER1.address, PLAYER3.address)).toEqual(false);
  });

  it('should return false when not set for the account', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 2);

    await erc721.connect(PLAYER1).setApprovalForAll(PLAYER2.address, true);
    expect<boolean>(await erc721.isApprovedForAll(PLAYER1.address, PLAYER3.address)).toEqual(false);

    await erc721.connect(PLAYER2).setApprovalForAll(PLAYER3.address, true);
    expect<boolean>(await erc721.isApprovedForAll(PLAYER1.address, PLAYER3.address)).toEqual(false);
  });

  it('should return true when set for the account', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 2);

    await erc721.connect(PLAYER1).setApprovalForAll(PLAYER2.address, true);
    expect<boolean>(await erc721.isApprovedForAll(PLAYER1.address, PLAYER2.address)).toEqual(true);
    expect<boolean>(await erc721.isApprovedForAll(PLAYER2.address, PLAYER3.address)).toEqual(false);

    await erc721.connect(PLAYER2).setApprovalForAll(PLAYER3.address, true);
    expect<boolean>(await erc721.isApprovedForAll(PLAYER1.address, PLAYER2.address)).toEqual(true);
    expect<boolean>(await erc721.isApprovedForAll(PLAYER2.address, PLAYER3.address)).toEqual(true);
  });
});

describe('approve', () => {
  it('should approve the token for transfer', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 2);

    await erc721.connect(PLAYER1).approve(PLAYER2.address, 1);

    await erc721.connect(PLAYER2)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 1);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER1.address);

    await erc721.connect(PLAYER1).approve(PLAYER3.address, 2);

    await erc721.connect(PLAYER3)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 2);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER2.address);
  });

  it('should approve the token for transfer if approved for all', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 2);

    await erc721.connect(PLAYER1).setApprovalForAll(PLAYER3.address, true);

    await erc721.connect(PLAYER3).approve(PLAYER2.address, 1);

    await erc721.connect(PLAYER2)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 1);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER1.address);

    await erc721.connect(PLAYER3).approve(PLAYER3.address, 2);

    await erc721.connect(PLAYER3)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 2);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER2.address);
  });

  it('should not prevent the owner from transferring', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 2);

    await erc721.connect(PLAYER1).approve(PLAYER2.address, 1);

    await erc721.connect(PLAYER1)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 1);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER1.address);

    await erc721.connect(PLAYER1).approve(PLAYER3.address, 2);

    await erc721.connect(PLAYER1)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 2);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER2.address);
  });

  it('should not approve other tokens for transfer', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 2);
    await erc721Mint.mint(PLAYER1.address, 3);

    await erc721.connect(PLAYER1).approve(PLAYER2.address, 1);

    await expect<Promise<ContractTransaction>>(
      erc721.connect(PLAYER2)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 2),
    ).toBeRevertedWith('transfer caller is not owner nor approved');

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER1.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER1.address);
    expect<AccountAddress>(await erc721.ownerOf(3)).toEqual(PLAYER1.address);

    await expect<Promise<ContractTransaction>>(
      erc721.connect(PLAYER3)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 3),
    ).toBeRevertedWith('transfer caller is not owner nor approved');

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER1.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER1.address);
    expect<AccountAddress>(await erc721.ownerOf(3)).toEqual(PLAYER1.address);
  });

  it('should not approve other accounts for transfer', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 2);
    await erc721Mint.mint(PLAYER1.address, 3);

    await erc721.connect(PLAYER1).approve(PLAYER2.address, 1);

    await expect<Promise<ContractTransaction>>(
      erc721.connect(PLAYER3)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 1),
    ).toBeRevertedWith('transfer caller is not owner nor approved');

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER1.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER1.address);
    expect<AccountAddress>(await erc721.ownerOf(3)).toEqual(PLAYER1.address);

    await erc721.connect(PLAYER1).approve(PLAYER3.address, 2);

    await expect<Promise<ContractTransaction>>(
      erc721.connect(PLAYER2)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 2),
    ).toBeRevertedWith('transfer caller is not owner nor approved');

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER1.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER1.address);
    expect<AccountAddress>(await erc721.ownerOf(3)).toEqual(PLAYER1.address);
  });

  it('should change the approval', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 2);

    await erc721.connect(PLAYER1).approve(PLAYER2.address, 1);
    await erc721.connect(PLAYER1).approve(PLAYER3.address, 1);

    await expect<Promise<ContractTransaction>>(
      erc721.connect(PLAYER2)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 1),
    ).toBeRevertedWith('transfer caller is not owner nor approved');
    await erc721.connect(PLAYER3)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER3.address, 1);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER3.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER1.address);
  });

  it('should revert if not owned by the approver', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 2);

    await expect<Promise<ContractTransaction>>(erc721.connect(PLAYER2).approve(PLAYER2.address, 1)).toBeRevertedWith(
      'approve caller is not owner nor approved for all',
    );

    expect<AccountAddress>(await erc721.getApproved(1)).toEqual(ZERO_ADDRESS);

    await erc721.connect(PLAYER1).approve(PLAYER2.address, 2);

    await expect<Promise<ContractTransaction>>(erc721.connect(PLAYER2).approve(PLAYER2.address, 1)).toBeRevertedWith(
      'approve caller is not owner nor approved for all',
    );

    expect<AccountAddress>(await erc721.getApproved(1)).toEqual(ZERO_ADDRESS);

    await erc721.connect(PLAYER1).setApprovalForAll(PLAYER3.address, true);

    await expect<Promise<ContractTransaction>>(erc721.connect(PLAYER2).approve(PLAYER2.address, 1)).toBeRevertedWith(
      'approve caller is not owner nor approved for all',
    );

    expect<AccountAddress>(await erc721.getApproved(1)).toEqual(ZERO_ADDRESS);
  });

  it('should send Approval event', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 2);

    expect<ContractTransaction>(await erc721.connect(PLAYER1).approve(PLAYER2.address, 1)).toHaveEmittedWith(
      erc721,
      'Approval',
      [PLAYER1.address, PLAYER2.address, BigNumber.from(1).toString()],
    );

    expect<ContractTransaction>(await erc721.connect(PLAYER1).approve(PLAYER3.address, 2)).toHaveEmittedWith(
      erc721,
      'Approval',
      [PLAYER1.address, PLAYER3.address, BigNumber.from(2).toString()],
    );
  });
});

describe('setApprovalForAll', () => {
  it('should approve all tokens for transfer when true', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 2);

    await erc721.connect(PLAYER1).setApprovalForAll(PLAYER2.address, true);

    await erc721.connect(PLAYER2)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 1);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER1.address);

    await erc721.connect(PLAYER2)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER3.address, 2);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER3.address);
  });

  it('should no longer approve all tokens for transfer when false', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 2);

    await erc721.connect(PLAYER1).setApprovalForAll(PLAYER2.address, true);

    await erc721.connect(PLAYER2)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 1);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER1.address);

    await erc721.connect(PLAYER1).setApprovalForAll(PLAYER2.address, false);

    await expect<Promise<ContractTransaction>>(
      erc721.connect(PLAYER2)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 2),
    ).toBeRevertedWith('transfer caller is not owner nor approved');

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER1.address);
  });

  it('should not prevent owner from transferring', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 2);

    await erc721.connect(PLAYER1).setApprovalForAll(PLAYER2.address, true);

    await erc721.connect(PLAYER1)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 1);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER1.address);

    await erc721.connect(PLAYER1)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER3.address, 2);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER3.address);
  });

  it('should not prevent normal approvals from transferring', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 2);

    await erc721.connect(PLAYER1).approve(PLAYER3.address, 1);
    await erc721.connect(PLAYER1).setApprovalForAll(PLAYER2.address, true);

    await erc721.connect(PLAYER3)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 1);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER1.address);

    await erc721.connect(PLAYER1).approve(PLAYER3.address, 2);

    await erc721.connect(PLAYER3)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER3.address, 2);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER3.address);
  });

  it('should not approve other accounts for transfer', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 2);

    await erc721.connect(PLAYER1).setApprovalForAll(PLAYER2.address, true);

    await expect<Promise<ContractTransaction>>(
      erc721.connect(PLAYER3)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 1),
    ).toBeRevertedWith('transfer caller is not owner nor approved');

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER1.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER1.address);

    await expect<Promise<ContractTransaction>>(
      erc721.connect(PLAYER3)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER3.address, 2),
    ).toBeRevertedWith('transfer caller is not owner nor approved');

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER1.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER1.address);
  });

  it('should add to the list of approvals', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 2);

    await erc721.connect(PLAYER1).setApprovalForAll(PLAYER2.address, true);
    await erc721.connect(PLAYER1).setApprovalForAll(PLAYER3.address, true);

    await erc721.connect(PLAYER2)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 1);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER1.address);

    await erc721.connect(PLAYER3)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER3.address, 2);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER3.address);
  });

  it('should send ApprovalForAll event', async () => {
    const erc721 = await createERC721();

    expect<ContractTransaction>(
      await erc721.connect(PLAYER1).setApprovalForAll(PLAYER2.address, true),
    ).toHaveEmittedWith(erc721, 'ApprovalForAll', [PLAYER1.address, PLAYER2.address, true]);

    expect<ContractTransaction>(
      await erc721.connect(PLAYER2).setApprovalForAll(PLAYER3.address, true),
    ).toHaveEmittedWith(erc721, 'ApprovalForAll', [PLAYER2.address, PLAYER3.address, true]);

    expect<ContractTransaction>(
      await erc721.connect(PLAYER1).setApprovalForAll(PLAYER3.address, false),
    ).toHaveEmittedWith(erc721, 'ApprovalForAll', [PLAYER1.address, PLAYER3.address, false]);
  });
});

describe('safeTransferFrom', () => {
  it('should transfer the tokens from owner', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 2);

    await erc721.connect(PLAYER1)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 1);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER1.address);

    await erc721.connect(PLAYER1)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER3.address, 2);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER3.address);
  });

  it('should transfer the tokens when approved', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 2);

    await erc721.connect(PLAYER1).approve(PLAYER2.address, 1);

    await erc721.connect(PLAYER2)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 1);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER1.address);

    await erc721.connect(PLAYER1).approve(PLAYER2.address, 2);

    await erc721.connect(PLAYER2)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER3.address, 2);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER3.address);
  });

  it('should transfer the tokens when approved for all', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 2);

    await erc721.connect(PLAYER1).setApprovalForAll(PLAYER2.address, true);

    await erc721.connect(PLAYER2)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 1);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER1.address);

    await erc721.connect(PLAYER2)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER3.address, 2);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER3.address);
  });

  it('should revert when not owner', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 2);

    await expect<Promise<ContractTransaction>>(
      erc721.connect(PLAYER2)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 1),
    ).toBeRevertedWith('transfer caller is not owner nor approved');

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER1.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER1.address);

    await expect<Promise<ContractTransaction>>(
      erc721.connect(PLAYER2)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER3.address, 2),
    ).toBeRevertedWith('transfer caller is not owner nor approved');

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER1.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER1.address);
  });

  it('should revert when not approved', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER1.address, 2);

    await erc721.connect(PLAYER1).approve(PLAYER2.address, 1);

    await expect<Promise<ContractTransaction>>(
      erc721.connect(PLAYER3)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 1),
    ).toBeRevertedWith('transfer caller is not owner nor approved');

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER1.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER1.address);

    await expect<Promise<ContractTransaction>>(
      erc721.connect(PLAYER2)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 2),
    ).toBeRevertedWith('transfer caller is not owner nor approved');

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER1.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER1.address);

    await erc721.connect(PLAYER1).setApprovalForAll(PLAYER2.address, true);

    await expect<Promise<ContractTransaction>>(
      erc721.connect(PLAYER3)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 1),
    ).toBeRevertedWith('transfer caller is not owner nor approved');

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER1.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER1.address);
  });

  it('should emit Transfer event', async () => {
    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(PLAYER1.address, 1);
    await erc721Mint.mint(PLAYER2.address, 2);

    expect<ContractTransaction>(
      await erc721.connect(PLAYER1)['safeTransferFrom(address,address,uint256)'](PLAYER1.address, PLAYER2.address, 1),
    ).toHaveEmittedWith(erc721, 'Transfer', [PLAYER1.address, PLAYER2.address, BigNumber.from(1).toString()]);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER2.address);

    expect<ContractTransaction>(
      await erc721.connect(PLAYER2)['safeTransferFrom(address,address,uint256)'](PLAYER2.address, PLAYER3.address, 2),
    ).toHaveEmittedWith(erc721, 'Transfer', [PLAYER2.address, PLAYER3.address, BigNumber.from(2).toString()]);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER2.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER3.address);

    await erc721.connect(PLAYER2).approve(PLAYER3.address, 1);

    expect<ContractTransaction>(
      await erc721.connect(PLAYER3)['safeTransferFrom(address,address,uint256)'](PLAYER2.address, PLAYER3.address, 1),
    ).toHaveEmittedWith(erc721, 'Transfer', [PLAYER2.address, PLAYER3.address, BigNumber.from(1).toString()]);

    expect<AccountAddress>(await erc721.ownerOf(1)).toEqual(PLAYER3.address);
    expect<AccountAddress>(await erc721.ownerOf(2)).toEqual(PLAYER3.address);
  });
});
