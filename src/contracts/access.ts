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

import { AccessControlInit, DelegatingAccessInit } from '../../types/contracts';
import { AccountAddress } from './accounts';
import ContractAddress from './ContractAddress';
import { DiamondInitFunction } from './diamonds';

export type AccessRole = string;

export const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

export interface AccessRoleMembers {
  role: AccessRole;
  members: AccountAddress[];
}

export const buildAccessControlInitAdminsInitFunction = (
  accessControlInit: AccessControlInit,
  roles: AccessRole[],
): DiamondInitFunction => ({
  initAddress: accessControlInit.address,
  callData: encodeAccessControlAddRolesCallData(accessControlInit, roles),
});

export const encodeAccessControlAddRolesCallData = (accessControlInit: AccessControlInit, roles: AccessRole[]) =>
  accessControlInit.interface.encodeFunctionData('addRoles', [roles]);

export const buildAccessControlAddMembersInitFunction = (
  accessControlInit: AccessControlInit,
  roleAdmins: AccessRoleMembers[],
): DiamondInitFunction => ({
  initAddress: accessControlInit.address,
  callData: encodeAccessControlAddAdminsCallData(accessControlInit, roleAdmins),
});

export const encodeAccessControlAddAdminsCallData = (
  accessControlInit: AccessControlInit,
  roleAdmins: AccessRoleMembers[],
) => accessControlInit.interface.encodeFunctionData('addMembers', [roleAdmins]);

export const buildDelegatingAccessAddDelegateInitFunction = (
  delegatingAccessInit: DelegatingAccessInit,
  delegateAddress: ContractAddress,
): DiamondInitFunction => ({
  initAddress: delegatingAccessInit.address,
  callData: encodeDelegatingAccessAddDelegateCallData(delegatingAccessInit, delegateAddress),
});

export const encodeDelegatingAccessAddDelegateCallData = (
  delegatingAccessInit: DelegatingAccessInit,
  delegateAddress: ContractAddress,
) => delegatingAccessInit.interface.encodeFunctionData('addDelegate', [delegateAddress]);
