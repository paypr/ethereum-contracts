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
import { buildDiamondFacetCut } from '../../../src/contracts/diamonds';
import { SUPER_ADMIN_ROLE } from '../../../src/contracts/roles';
import { IActivity__factory, ActivityFacet__factory } from '../../../types/contracts';
import { INITIALIZER } from '../Accounts';
import { combineExtensibleDiamondOptions, createDiamond, ExtensibleDiamondOptions } from '../DiamondHelper';

export const asActivity = (contract: Contract, signer: Signer = INITIALIZER) =>
  IActivity__factory.connect(contract.address, signer);

export interface CreateActivityOptions extends ExtensibleDiamondOptions {}

export const createActivity = async (options: CreateActivityOptions = {}) =>
  asActivity(
    await createDiamond(
      combineExtensibleDiamondOptions(
        {
          additionalCuts: [buildDiamondFacetCut(await deployActivityFacet())],
          additionalRoleMembers: [{ role: SUPER_ADMIN_ROLE, members: [INITIALIZER.address] }],
        },
        options,
      ),
    ),
  );

export const deployActivityFacet = () => new ActivityFacet__factory(INITIALIZER).deploy();
