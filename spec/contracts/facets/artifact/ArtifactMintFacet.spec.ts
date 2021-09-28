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
import { ARTIFACT_MINTABLE_INTERFACE_ID } from '../../../../src/contracts/erc165InterfaceIds';
import { ARTIFACT_MINTER, INITIALIZER, PLAYER1 } from '../../../helpers/Accounts';
import { deployDiamond } from '../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165Helper';
import { createMintableArtifact, deployArtifactMintFacet } from '../../../helpers/facets/ArtifactFacetHelper';
import { asConsumableMint, createConsumable } from '../../../helpers/facets/ConsumableFacetHelper';
import { buildConsumableProviderDiamondAdditions } from '../../../helpers/facets/ConsumableProviderFacetHelper';
import { asDisableable, buildDisableableDiamondAdditions } from '../../../helpers/facets/DisableableFacetHelper';
import { asErc165, deployErc165Facet } from '../../../helpers/facets/ERC165FacetHelper';
import { asERC721 } from '../../../helpers/facets/ERC721FacetHelper';

describe('supportsInterface', () => {
  const createDiamondForErc165 = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deployArtifactMintFacet()),
      ]),
    );

  shouldSupportInterface('ArtifactMint', createDiamondForErc165, ARTIFACT_MINTABLE_INTERFACE_ID);
});

describe('mint', () => {
  it('should give a new item to the player', async () => {
    const artifact = await createMintableArtifact();
    await artifact.mint(PLAYER1.address);

    expect<string>(await asERC721(artifact).ownerOf(1)).toEqual(PLAYER1.address);
  });

  it('should mint a new item when there is enough consumable', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();

    const artifact = await createMintableArtifact(
      1,
      await buildConsumableProviderDiamondAdditions([
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ]),
    );

    await asConsumableMint(consumable1).mint(artifact.address, 1000);
    await asConsumableMint(consumable2).mint(artifact.address, 1000);

    await artifact.mint(PLAYER1.address);

    expect<string>(await asERC721(artifact).ownerOf(1)).toEqual(PLAYER1.address);

    await artifact.mint(PLAYER1.address);
    await artifact.mint(PLAYER1.address);
    await artifact.mint(PLAYER1.address);
    await artifact.mint(PLAYER1.address);
  });

  it('should not mint a new item if not enough consumables', async () => {
    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();

    const artifact = await createMintableArtifact(
      2,
      await buildConsumableProviderDiamondAdditions([
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ]),
    );

    await expect<Promise<ContractTransaction>>(artifact.mint(PLAYER1.address)).toBeRevertedWith(
      'not enough consumable for items',
    );
    await expect<Promise<string>>(asERC721(artifact).ownerOf(1)).toBeRevertedWith('owner query for nonexistent token');

    await asConsumableMint(consumable1).mint(artifact.address, 100);
    await asConsumableMint(consumable2).mint(artifact.address, 200);

    await expect<Promise<ContractTransaction>>(
      artifact.connect(ARTIFACT_MINTER).mint(PLAYER1.address),
    ).toBeRevertedWith('not enough consumable for items');
    await expect<Promise<string>>(asERC721(artifact).ownerOf(1)).toBeRevertedWith('owner query for nonexistent token');

    await asConsumableMint(consumable1).mint(artifact.address, 100);

    await expect<Promise<ContractTransaction>>(artifact.mint(PLAYER1.address)).toBeRevertedWith(
      'not enough consumable for items',
    );
    await expect<Promise<string>>(asERC721(artifact).ownerOf(1)).toBeRevertedWith('owner query for nonexistent token');

    // finally show it works
    await asConsumableMint(consumable2).mint(artifact.address, 200);

    await artifact.mint(PLAYER1.address);

    expect<string>(await asERC721(artifact).ownerOf(1)).toEqual(PLAYER1.address);
  });

  it('should not mint a new item if not the minter', async () => {
    const artifact = await createMintableArtifact();

    await expect<Promise<ContractTransaction>>(artifact.connect(INITIALIZER).mint(PLAYER1.address)).toBeRevertedWith(
      'missing role',
    );
    await expect<Promise<string>>(asERC721(artifact).ownerOf(1)).toBeRevertedWith('owner query for nonexistent token');

    await expect<Promise<ContractTransaction>>(artifact.connect(PLAYER1).mint(PLAYER1.address)).toBeRevertedWith(
      'missing role',
    );
    await expect<Promise<string>>(asERC721(artifact).ownerOf(1)).toBeRevertedWith('owner query for nonexistent token');
  });

  it('should not mint if disabled', async () => {
    const artifact = await createMintableArtifact(1, await buildDisableableDiamondAdditions());

    await asDisableable(artifact).disable();

    await expect<Promise<ContractTransaction>>(artifact.mint(PLAYER1.address)).toBeRevertedWith('Contract is disabled');
  });
});
