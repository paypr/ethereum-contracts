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
  AccessRole,
  AccessRoleMembers,
  buildAccessControlAddMembersInitFunction,
  buildAccessControlInitAdminsInitFunction,
  buildDelegatingAccessControlAddDelegateInitFunction,
} from '../../../src/contracts/access';
import { DiamondInitFunction } from '../../../src/contracts/diamonds';
import { SUPER_ADMIN_ROLE } from '../../../src/contracts/roles';
import {
  AccessControlFacet__factory,
  AccessControlInit,
  AccessControlInit__factory,
  CombinedAccess__factory,
  DelegatingAccessControlFacet__factory,
  DelegatingAccessControlInit,
  DelegatingAccessControlInit__factory,
  IAccessControl,
  IAccessControl__factory,
  IAccessDelegate__factory,
  IDelegatingAccessControl__factory,
  TestCheckRole__factory,
} from '../../../types/contracts';
import { INITIALIZER } from '../Accounts';
import { createDiamond } from '../DiamondHelper';

export const createAccessControl = async (additionalRoles: AccessRole[] = []) =>
  asAccessControl(await createDiamond({ additionalRoles }));

export const createDelegatingAccessControl = async (accessControl: IAccessControl) =>
  asDelegatingAccessControl(await createDiamond({ delegate: accessControl }));

export const asAccessControl = (contract: Contract, signer: Signer = INITIALIZER) =>
  IAccessControl__factory.connect(contract.address, signer);
export const asAccessDelegate = (contract: Contract, signer: Signer = INITIALIZER) =>
  IAccessDelegate__factory.connect(contract.address, signer);
export const asDelegatingAccessControl = (contract: Contract, signer: Signer = INITIALIZER) =>
  IDelegatingAccessControl__factory.connect(contract.address, signer);
export const asTestCheckRole = (contract: Contract, signer: Signer = INITIALIZER) =>
  TestCheckRole__factory.connect(contract.address, signer);

export const deployAccessControlFacet = () => new AccessControlFacet__factory(INITIALIZER).deploy();
export const deployAccessControlInit = () => new AccessControlInit__factory(INITIALIZER).deploy();
export const deployCombinedAccessFacet = () => new CombinedAccess__factory(INITIALIZER).deploy();
export const deployDelegatingAccessControlFacet = () => new DelegatingAccessControlFacet__factory(INITIALIZER).deploy();
export const deployDelegatingAccessControlInit = () => new DelegatingAccessControlInit__factory(INITIALIZER).deploy();
export const deployTestCheckRole = () => new TestCheckRole__factory(INITIALIZER).deploy();

export type OneOfAccessControlInitOptions = AccessControlInitOptions | DelegatingAccessControlInitOptions;

export type CombinedAccessControlInitOptions = AccessControlInitOptions & Partial<DelegatingAccessControlInitOptions>;

export type AccessControlInitOptions = {
  accessControlInit?: AccessControlInit;
} & (
  | {
      additionalRoles?: AccessRole[];
    }
  | {
      additionalRoleMembers?: AccessRoleMembers[];
    }
);

export type DelegatingAccessControlInitOptions = {
  delegatingAccessControlInit?: DelegatingAccessControlInit;
  delegate: IAccessControl;
};

export const buildDelegatingAccessControlInitFunction = async (
  options: DelegatingAccessControlInitOptions,
): Promise<DiamondInitFunction> => {
  const delegatingAccessControlInit =
    options.delegatingAccessControlInit || (await deployDelegatingAccessControlInit());

  return buildDelegatingAccessControlAddDelegateInitFunction(delegatingAccessControlInit, options.delegate.address);
};

export const buildAccessControlInitFunction = async (
  options: AccessControlInitOptions,
): Promise<DiamondInitFunction> => {
  const accessControlInit = options.accessControlInit || (await deployAccessControlInit());
  if ('additionalRoleMembers' in options && options.additionalRoleMembers) {
    return buildAccessControlAddMembersInitFunction(accessControlInit, options.additionalRoleMembers);
  }

  const initRoles = [SUPER_ADMIN_ROLE, ...(('additionalRoles' in options && options.additionalRoles) || [])];
  return buildAccessControlInitAdminsInitFunction(accessControlInit, initRoles);
};

export const buildOneOfAccessControlInitFunction = async (
  options: OneOfAccessControlInitOptions = {},
): Promise<DiamondInitFunction> => {
  if ('delegate' in options) {
    return await buildDelegatingAccessControlInitFunction(options);
  }

  return await buildAccessControlInitFunction(options);
};
