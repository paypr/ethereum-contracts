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
import { buildDiamondFacetCut } from '../../../src/contracts/core/diamonds';
import { ADMIN_ROLE, SUPER_ADMIN_ROLE } from '../../../src/contracts/roles';
import { ISkillAcquirer__factory, SkillAcquirerFacet__factory } from '../../../types/contracts';
import { INITIALIZER, PLAYER_ADMIN } from '../Accounts';
import { combineExtensibleDiamondOptions, createDiamond, ExtensibleDiamondOptions } from '../DiamondHelper';

export const asSkillAcquirer = (contract: Contract, signer: Signer = PLAYER_ADMIN) =>
  ISkillAcquirer__factory.connect(contract.address, signer);

export interface CreateSkillAcquirerOptions extends ExtensibleDiamondOptions {}

export const createSkillAcquirer = async (options: CreateSkillAcquirerOptions = {}) =>
  asSkillAcquirer(
    await createDiamond(
      combineExtensibleDiamondOptions(
        {
          additionalCuts: [buildDiamondFacetCut(await deploySkillAcquirerFacet())],
          additionalRoleAdmins: [
            { role: SUPER_ADMIN_ROLE, admins: [INITIALIZER.address] },
            { role: ADMIN_ROLE, admins: [PLAYER_ADMIN.address] },
          ],
        },
        options,
      ),
    ),
  );

export const deploySkillAcquirerFacet = () => new SkillAcquirerFacet__factory(INITIALIZER).deploy();
