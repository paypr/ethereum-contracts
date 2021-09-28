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

import { Contract, Signer } from 'ethers';
import { buildArtifactInitFunction, Item, ItemBN } from '../../../src/contracts/artifacts';
import { buildDiamondFacetCut } from '../../../src/contracts/diamonds';
import { MINTER_ROLE, SUPER_ADMIN_ROLE } from '../../../src/contracts/roles';
import {
  ArtifactERC721Hooks__factory,
  ArtifactFacet__factory,
  ArtifactInit__factory,
  ArtifactMintFacet__factory,
  ArtifactTransferHooks__factory,
  IArtifact__factory,
  IArtifactMintable__factory,
} from '../../../types/contracts';
import { ARTIFACT_MINTER, INITIALIZER } from '../Accounts';
import { combineExtensibleDiamondOptions, ExtensibleDiamondOptions } from '../DiamondHelper';
import { createERC721, CreateERC721Options } from './ERC721FacetHelper';

export const asArtifact = (contract: Contract, signer: Signer = INITIALIZER) =>
  IArtifact__factory.connect(contract.address, signer);

export const asArtifactMint = (contract: Contract, signer: Signer = ARTIFACT_MINTER) =>
  IArtifactMintable__factory.connect(contract.address, signer);

export interface CreateArtifactOptions extends CreateERC721Options {}

export const createArtifact = async (initialUses: number = 1, options: CreateArtifactOptions = {}) =>
  asArtifact(
    await createERC721(
      combineExtensibleDiamondOptions(
        {
          additionalCuts: [buildDiamondFacetCut(await deployArtifactFacet())],
          additionalRoleAdmins: [{ role: SUPER_ADMIN_ROLE, admins: [INITIALIZER.address] }],
          additionalInits: [
            buildArtifactInitFunction(await deployArtifactInit(), {
              initialUses,
              erc721Hooks: await deployArtifactERC721Hooks(),
              transferHooks: await deployArtifactTransferHooks(),
            }),
          ],
        },
        options,
      ),
    ),
  );

export const createMintableArtifact = async (initialUses: number = 1, options: ExtensibleDiamondOptions = {}) =>
  asArtifactMint(
    await createArtifact(
      initialUses,
      combineExtensibleDiamondOptions(
        {
          additionalCuts: [buildDiamondFacetCut(await deployArtifactMintFacet())],
          additionalRoleAdmins: [{ role: MINTER_ROLE, admins: [ARTIFACT_MINTER.address] }],
        },
        options,
      ),
    ),
  );

export const deployArtifactFacet = () => new ArtifactFacet__factory(INITIALIZER).deploy();
export const deployArtifactERC721Hooks = () => new ArtifactERC721Hooks__factory(INITIALIZER).deploy();
export const deployArtifactTransferHooks = () => new ArtifactTransferHooks__factory(INITIALIZER).deploy();
export const deployArtifactInit = () => new ArtifactInit__factory(INITIALIZER).deploy();
export const deployArtifactMintFacet = () => new ArtifactMintFacet__factory(INITIALIZER).deploy();

export const toItem = (item: ItemBN): Item => {
  const { artifact, itemId } = item;
  return { artifact, itemId: itemId.toString() };
};

export const toItemAsync = async (item: Promise<ItemBN> | ItemBN): Promise<Item> => toItem(await item);
