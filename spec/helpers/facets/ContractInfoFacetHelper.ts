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

import { Contract } from 'ethers';
import { AccessRoleMembers } from '../../../src/contracts/access';
import { buildContractInfoInitializeInitFunction, ContractInfoInitOptions } from '../../../src/contracts/contractInfo';
import { buildDiamondFacetCut, DiamondFacetCut, DiamondInitFunction } from '../../../src/contracts/diamonds';
import { SUPER_ADMIN_ROLE } from '../../../src/contracts/roles';
import {
  ContractInfoFacet__factory,
  ContractInfoInit__factory,
  IContractInfo__factory,
} from '../../../types/contracts';
import { INITIALIZER } from '../Accounts';
import { createDiamond } from '../DiamondHelper';

export const asContractInfo = (contract: Contract) => IContractInfo__factory.connect(contract.address, INITIALIZER);

export interface ContractInfoCreateOptions extends ContractInfoInitOptions {
  additionalCuts?: DiamondFacetCut[];
  additionalRoleMembers?: AccessRoleMembers[];
  additionalInits?: DiamondInitFunction[];
}

export const createContractInfo = async (options: ContractInfoCreateOptions = {}) =>
  asContractInfo(
    await createDiamond({
      additionalCuts: [buildDiamondFacetCut(await deployContractInfoFacet()), ...(options.additionalCuts || [])],
      additionalInits: [
        buildContractInfoInitializeInitFunction(await deployContractInfoInit(), options),
        ...(options.additionalInits || []),
      ],
      additionalRoleMembers: [
        { role: SUPER_ADMIN_ROLE, members: [INITIALIZER.address] },
        ...(options.additionalRoleMembers || []),
      ],
    }),
  );

export const deployContractInfoFacet = () => new ContractInfoFacet__factory(INITIALIZER).deploy();
export const deployContractInfoInit = () => new ContractInfoInit__factory(INITIALIZER).deploy();
