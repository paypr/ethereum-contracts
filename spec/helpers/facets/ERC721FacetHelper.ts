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
import {
  buildERC721AddHooksInitFunction,
  buildERC721TokenInfoInitFunction,
  buildERC721TokenInfoSetBaseUriInitFunction,
} from '../../../src/contracts/artifacts';
import { buildDiamondFacetCut } from '../../../src/contracts/diamonds';
import { MINTER_ROLE, SUPER_ADMIN_ROLE } from '../../../src/contracts/roles';
import {
  ERC721BurnFacet__factory,
  ERC721EnumerableFacet__factory,
  ERC721EnumerableHooks__factory,
  ERC721Facet__factory,
  ERC721Init__factory,
  ERC721MintFacet__factory,
  ERC721TokenInfoFacet__factory,
  ERC721TokenInfoInit__factory,
  IERC721__factory,
  IERC721Burnable__factory,
  IERC721Enumerable__factory,
  IERC721Mintable__factory,
  IERC721TokenInfo__factory,
} from '../../../types/contracts';
import { ARTIFACT_MINTER, INITIALIZER } from '../Accounts';
import { combineExtensibleDiamondOptions, createDiamond, ExtensibleDiamondOptions } from '../DiamondHelper';

export const asERC721 = (contract: Contract, signer: Signer = INITIALIZER) =>
  IERC721__factory.connect(contract.address, signer);

export const asERC721Enumerable = (contract: Contract, signer: Signer = INITIALIZER) =>
  IERC721Enumerable__factory.connect(contract.address, signer);

export const asERC721Mint = (contract: Contract, signer: Signer = ARTIFACT_MINTER) =>
  IERC721Mintable__factory.connect(contract.address, signer);

export const asERC721Burn = (contract: Contract, signer: Signer = ARTIFACT_MINTER) =>
  IERC721Burnable__factory.connect(contract.address, signer);

export const asERC721TokenInfo = (contract: Contract, signer: Signer = INITIALIZER) =>
  IERC721TokenInfo__factory.connect(contract.address, signer);

export interface CreateERC721Options extends ExtensibleDiamondOptions {}

export const createERC721 = async (options: CreateERC721Options = {}) =>
  asERC721(
    await createDiamond(
      combineExtensibleDiamondOptions(
        {
          additionalCuts: [buildDiamondFacetCut(await deployERC721Facet())],
          additionalRoleMembers: [{ role: SUPER_ADMIN_ROLE, members: [INITIALIZER.address] }],
        },
        options,
      ),
    ),
  );

export const createMintableERC721 = async (options: ExtensibleDiamondOptions = {}) =>
  asERC721Mint(
    await createERC721(
      combineExtensibleDiamondOptions(
        {
          additionalCuts: [buildDiamondFacetCut(await deployERC721MintFacet())],
          additionalRoleMembers: [{ role: MINTER_ROLE, members: [ARTIFACT_MINTER.address] }],
        },
        options,
      ),
    ),
  );

export const createBurnableERC721 = async (options: ExtensibleDiamondOptions = {}) =>
  asERC721Burn(
    await createMintableERC721(
      combineExtensibleDiamondOptions(
        {
          additionalCuts: [buildDiamondFacetCut(await deployERC721BurnFacet())],
        },
        options,
      ),
    ),
  );

export const buildERC721EnumerableAdditions = async (): Promise<ExtensibleDiamondOptions> => ({
  additionalCuts: [buildDiamondFacetCut(await deployERC721EnumerableFacet())],
  additionalInits: [buildERC721AddHooksInitFunction(await deployERC721Init(), await deployERC721EnumerableHooks())],
});

interface ERC721TokenInfoOptions {
  baseURI: string;
  includeAddress?: boolean;
}

export const buildERC721TokenInfoAdditions = async (
  options: ERC721TokenInfoOptions,
): Promise<ExtensibleDiamondOptions> => ({
  additionalCuts: [buildDiamondFacetCut(await deployERC721TokenInfoFacet())],
  additionalInits: [
    options.includeAddress
      ? buildERC721TokenInfoInitFunction(await deployERC721TokenInfoInit(), options.baseURI, true)
      : buildERC721TokenInfoSetBaseUriInitFunction(await deployERC721TokenInfoInit(), options.baseURI),
  ],
});

export const deployERC721Facet = () => new ERC721Facet__factory(INITIALIZER).deploy();
export const deployERC721MintFacet = () => new ERC721MintFacet__factory(INITIALIZER).deploy();
export const deployERC721BurnFacet = () => new ERC721BurnFacet__factory(INITIALIZER).deploy();
export const deployERC721EnumerableFacet = () => new ERC721EnumerableFacet__factory(INITIALIZER).deploy();
export const deployERC721EnumerableHooks = () => new ERC721EnumerableHooks__factory(INITIALIZER).deploy();
export const deployERC721Init = () => new ERC721Init__factory(INITIALIZER).deploy();
export const deployERC721TokenInfoFacet = () => new ERC721TokenInfoFacet__factory(INITIALIZER).deploy();
export const deployERC721TokenInfoInit = () => new ERC721TokenInfoInit__factory(INITIALIZER).deploy();
