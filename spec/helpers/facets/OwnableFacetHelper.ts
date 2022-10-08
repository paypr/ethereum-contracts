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

import { Contract, Signer } from 'ethers';
import { buildOwnableSetOwnerInitFunction } from '../../../src/contracts/access/ownable';
import { EthereumAddress } from '../../../src/contracts/address';
import { buildDiamondFacetCut } from '../../../src/contracts/diamonds';
import { OWNER_MANAGER_ROLE, SUPER_ADMIN_ROLE } from '../../../src/contracts/roles';
import {
  IOwnable__factory,
  OwnableFacet__factory,
  OwnableInit__factory,
  TestCheckOwner__factory,
} from '../../../types/contracts';
import { INITIALIZER, OWNER_MANAGER } from '../Accounts';
import { combineExtensibleDiamondOptions, createDiamond, ExtensibleDiamondOptions } from '../DiamondHelper';

export const asOwnable = (contract: Contract, signer: Signer = contract.signer) =>
  IOwnable__factory.connect(contract.address, signer);

export interface CreateOwnableOptions extends ExtensibleDiamondOptions {}

export const createOwnable = async (owner: EthereumAddress, options: CreateOwnableOptions = {}) =>
  asOwnable(
    await createDiamond(
      combineExtensibleDiamondOptions(
        {
          additionalCuts: [buildDiamondFacetCut(await deployOwnableFacet())],
          additionalRoleMembers: [
            { role: SUPER_ADMIN_ROLE, members: [INITIALIZER.address] },
            { role: OWNER_MANAGER_ROLE, members: [OWNER_MANAGER.address] },
          ],
          additionalInits: [buildOwnableSetOwnerInitFunction(await deployOwnableInit(), owner)],
        },
        options,
      ),
    ),
  );

export const deployOwnableInit = () => new OwnableInit__factory(INITIALIZER).deploy();
export const deployOwnableFacet = () => new OwnableFacet__factory(INITIALIZER).deploy();
export const deployTestCheckOwner = () => new TestCheckOwner__factory(INITIALIZER).deploy();
