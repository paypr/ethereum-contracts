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
  buildDelegatingAccessAddDelegateInitFunction,
} from '../../../src/contracts/access';
import { DiamondInitFunction } from '../../../src/contracts/diamonds';
import { SUPER_ADMIN_ROLE } from '../../../src/contracts/roles';
import {
  AccessControlCheckFacet__factory,
  AccessControlFacet__factory,
  AccessControlInit,
  AccessControlInit__factory,
  CombinedAccessCheckFacet__factory,
  DelegatingAccessCheckFacet__factory,
  DelegatingAccessFacet__factory,
  DelegatingAccessInit,
  DelegatingAccessInit__factory,
  IAccessCheck__factory,
  IAccessControl,
  IAccessControl__factory,
  IDelegatingAccess__factory,
  TestCheckRole__factory,
} from '../../../types/contracts';
import { INITIALIZER } from '../Accounts';
import { createDiamond } from '../DiamondHelper';

export const createAccessControl = async (additionalRoles: AccessRole[] = []) =>
  asAccessControl(await createDiamond({ additionalRoles }));

export const createDelegatingAccess = async (accessControl: IAccessControl) =>
  asDelegatingAccess(await createDiamond({ delegate: accessControl }));

export const asAccessCheck = (contract: Contract, signer: Signer = INITIALIZER) =>
  IAccessCheck__factory.connect(contract.address, signer);
export const asAccessControl = (contract: Contract, signer: Signer = INITIALIZER) =>
  IAccessControl__factory.connect(contract.address, signer);
export const asDelegatingAccess = (contract: Contract, signer: Signer = INITIALIZER) =>
  IDelegatingAccess__factory.connect(contract.address, signer);
export const asTestCheckRole = (contract: Contract, signer: Signer = INITIALIZER) =>
  TestCheckRole__factory.connect(contract.address, signer);

export const deployAccessControlCheckFacet = () => new AccessControlCheckFacet__factory(INITIALIZER).deploy();
export const deployAccessControlFacet = () => new AccessControlFacet__factory(INITIALIZER).deploy();
export const deployAccessControlInit = () => new AccessControlInit__factory(INITIALIZER).deploy();
export const deployCombinedAccessFacet = () => new CombinedAccessCheckFacet__factory(INITIALIZER).deploy();
export const deployDelegatingAccessFacet = () => new DelegatingAccessFacet__factory(INITIALIZER).deploy();
export const deployDelegatingAccessCheckFacet = () => new DelegatingAccessCheckFacet__factory(INITIALIZER).deploy();
export const deployDelegatingAccessInit = () => new DelegatingAccessInit__factory(INITIALIZER).deploy();
export const deployTestCheckRole = () => new TestCheckRole__factory(INITIALIZER).deploy();

export type OneOfAccessControlInitOptions = AccessControlInitOptions | DelegatingAccessInitOptions;

export type CombinedAccessControlInitOptions = AccessControlInitOptions & Partial<DelegatingAccessInitOptions>;

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

export type DelegatingAccessInitOptions = {
  delegatingAccessInit?: DelegatingAccessInit;
  delegate: IAccessControl;
};

export const buildDelegatingAccessInitFunction = async (
  options: DelegatingAccessInitOptions,
): Promise<DiamondInitFunction> => {
  const delegatingAccessInit = options.delegatingAccessInit || (await deployDelegatingAccessInit());

  return buildDelegatingAccessAddDelegateInitFunction(delegatingAccessInit, options.delegate.address);
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
    return await buildDelegatingAccessInitFunction(options);
  }

  return await buildAccessControlInitFunction(options);
};
