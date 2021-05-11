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

import { AccessControlInit, DelegatingAccessControlInit } from '../../types/contracts';
import { AccountAddress } from './accounts';
import ContractAddress from './ContractAddress';
import { DiamondInitFunction } from './core/diamonds';

export type AccessRole = string;

export const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

export interface AccessRoleAdmins {
  role: AccessRole;
  admins: AccountAddress[];
}

export const buildAccessControlInitAdminsInitFunction = (
  accessControlInit: AccessControlInit,
  roles: AccessRole[],
): DiamondInitFunction => ({
  initAddress: accessControlInit.address,
  callData: encodeAccessControlInitAdminsCallData(accessControlInit, roles),
});

export const encodeAccessControlInitAdminsCallData = (accessControlInit: AccessControlInit, roles: AccessRole[]) =>
  accessControlInit.interface.encodeFunctionData('initializeAdmins', [roles]);

export const buildAccessControlAddAdminsInitFunction = (
  accessControlInit: AccessControlInit,
  roleAdmins: AccessRoleAdmins[],
): DiamondInitFunction => ({
  initAddress: accessControlInit.address,
  callData: encodeAccessControlAddAdminsCallData(accessControlInit, roleAdmins),
});

export const encodeAccessControlAddAdminsCallData = (
  accessControlInit: AccessControlInit,
  roleAdmins: AccessRoleAdmins[],
) => accessControlInit.interface.encodeFunctionData('addAdmins', [roleAdmins]);

export const buildDelegatingAccessControlAddDelegateInitFunction = (
  delegatingAccessControlInit: DelegatingAccessControlInit,
  delegateAddress: ContractAddress,
): DiamondInitFunction => ({
  initAddress: delegatingAccessControlInit.address,
  callData: encodeDelegatingAccessControlAddDelegateCallData(delegatingAccessControlInit, delegateAddress),
});

export const encodeDelegatingAccessControlAddDelegateCallData = (
  delegatingAccessControlInit: DelegatingAccessControlInit,
  delegateAddress: ContractAddress,
) => delegatingAccessControlInit.interface.encodeFunctionData('addDelegate', [delegateAddress]);
