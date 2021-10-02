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
import { buildDiamondFacetCut } from '../../../../src/contracts/diamonds';
import { TRANSFERRING_INTERFACE_ID } from '../../../../src/contracts/erc165InterfaceIds';
import { DISABLER_ROLE, SUPER_ADMIN_ROLE, TRANSFER_AGENT_ROLE } from '../../../../src/contracts/roles';
import { DISABLER, INITIALIZER, PLAYER3, TRANSFER_AGENT } from '../../../helpers/Accounts';
import { createDiamond, deployDiamond } from '../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165Helper';
import { asConsumableMint, createConsumable } from '../../../helpers/facets/ConsumableFacetHelper';
import { asDisableable, deployDisableableFacet } from '../../../helpers/facets/DisableableFacetHelper';
import { asErc165, deployErc165Facet } from '../../../helpers/facets/ERC165FacetHelper';
import { asERC721, createMintableERC721 } from '../../../helpers/facets/ERC721FacetHelper';
import { asTransferring, deployTransferFacet } from '../../../helpers/facets/TransferFacetHelper';

describe('supportsInterface', () => {
  const createDiamondForErc165 = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deployTransferFacet()),
      ]),
    );

  shouldSupportInterface('Disableable', createDiamondForErc165, TRANSFERRING_INTERFACE_ID);
});

const createTransferring = async () =>
  asTransferring(
    await createDiamond({
      additionalCuts: [buildDiamondFacetCut(await deployTransferFacet())],
      additionalRoleMembers: [
        { role: SUPER_ADMIN_ROLE, members: [INITIALIZER.address] },
        { role: TRANSFER_AGENT_ROLE, members: [TRANSFER_AGENT.address] },
      ],
    }),
  );

const createDisableableTransferring = async () =>
  await asTransferring(
    await createDiamond({
      additionalCuts: [
        buildDiamondFacetCut(await deployTransferFacet()),
        buildDiamondFacetCut(await deployDisableableFacet()),
      ],
      additionalRoleMembers: [
        { role: SUPER_ADMIN_ROLE, members: [INITIALIZER.address] },
        { role: DISABLER_ROLE, members: [DISABLER.address] },
        { role: TRANSFER_AGENT_ROLE, members: [TRANSFER_AGENT.address] },
      ],
    }),
  );

describe('transferToken', () => {
  it('should transfer consumable to another address', async () => {
    const transferring = await createTransferring();

    const consumable = await createConsumable();
    await asConsumableMint(consumable).mint(transferring.address, 1000);

    await transferring.transferToken(consumable.address, 100, PLAYER3.address);

    expect<BigNumber>(await consumable.balanceOf(transferring.address)).toEqBN(900);
    expect<BigNumber>(await consumable.balanceOf(PLAYER3.address)).toEqBN(100);
  });

  it('should not transfer if not enough consumable', async () => {
    const transferring = await createTransferring();

    const consumable = await createConsumable();
    await asConsumableMint(consumable).mint(transferring.address, 99);

    await expect<Promise<ContractTransaction>>(
      transferring.transferToken(consumable.address, 100, PLAYER3.address),
    ).toBeRevertedWith('transfer amount exceeds balance');

    expect<BigNumber>(await consumable.balanceOf(transferring.address)).toEqBN(99);
    expect<BigNumber>(await consumable.balanceOf(PLAYER3.address)).toEqBN(0);
  });

  it('should not transfer if caller is not transfer agent', async () => {
    const transferring = await createTransferring();

    const consumable = await createConsumable();
    await asConsumableMint(consumable).mint(transferring.address, 1000);

    await expect<Promise<ContractTransaction>>(
      transferring.connect(PLAYER3).transferToken(consumable.address, 100, PLAYER3.address),
    ).toBeRevertedWith('missing role');

    expect<BigNumber>(await consumable.balanceOf(transferring.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER3.address)).toEqBN(0);
  });

  it('should not transfer if transfer is disabled', async () => {
    const transferring = await createDisableableTransferring();

    const consumable = await createConsumable();
    await asConsumableMint(consumable).mint(transferring.address, 1000);

    await asDisableable(transferring).disable();

    await expect<Promise<ContractTransaction>>(
      transferring.transferToken(consumable.address, 100, PLAYER3.address),
    ).toBeRevertedWith('Contract is disabled');

    expect<BigNumber>(await consumable.balanceOf(transferring.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER3.address)).toEqBN(0);
  });
});

describe('transferItem', () => {
  it('should transfer item to another address', async () => {
    const transferring = await createTransferring();

    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(transferring.address, 1);
    await erc721Mint.mint(transferring.address, 2);

    await transferring.transferItem(erc721Mint.address, 1, PLAYER3.address);

    expect<string>(await erc721.ownerOf(1)).toEqual(PLAYER3.address);
    expect<string>(await erc721.ownerOf(2)).toEqual(transferring.address);
  });

  it('should not transfer if not valid item', async () => {
    const transferring = await createTransferring();

    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(transferring.address, 1);

    await expect<Promise<ContractTransaction>>(
      transferring.transferItem(erc721Mint.address, 2, PLAYER3.address),
    ).toBeRevertedWith('operator query for nonexistent token');

    expect<string>(await erc721.ownerOf(1)).toEqual(transferring.address);
  });

  it('should not transfer if caller is not transfer agent', async () => {
    const transferring = await createTransferring();

    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(transferring.address, 1);

    await expect<Promise<ContractTransaction>>(
      transferring.connect(PLAYER3).transferItem(erc721Mint.address, 1, PLAYER3.address),
    ).toBeRevertedWith('missing role');

    expect<string>(await erc721.ownerOf(1)).toEqual(transferring.address);
  });

  it('should not transfer if transfer is disabled', async () => {
    const transferring = await createDisableableTransferring();

    const erc721Mint = await createMintableERC721();
    const erc721 = asERC721(erc721Mint);

    await erc721Mint.mint(transferring.address, 1);

    await asDisableable(transferring).disable();

    await expect<Promise<ContractTransaction>>(
      transferring.transferItem(erc721Mint.address, 1, PLAYER3.address),
    ).toBeRevertedWith('Contract is disabled');

    expect<string>(await erc721.ownerOf(1)).toEqual(transferring.address);
  });
});
