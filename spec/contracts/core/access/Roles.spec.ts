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

import { ERC165_ID, ROLE_DELEGATE_ID } from '../../../helpers/ContractIds';
import { TestRoles } from '../../../../types/contracts';
import {
  ADMIN,
  checkDelegatingRoles,
  checkRoles,
  checkSuperAdmin,
  checkSuperAdminDelegation,
  createRoles,
  MINTER,
  TRANSFER_AGENT,
} from '../../../helpers/AccessHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165';

describe('supportsInterface', () => {
  shouldSupportInterface('ERC165', createRoles, ERC165_ID);
  shouldSupportInterface('RoleDelegate', createRoles, ROLE_DELEGATE_ID);
});

describe('check roles', () => {
  checkSuperAdmin(createRoles, (roles) => roles.forSuperAdmin());

  checkRoles<TestRoles>('Admin', () => ADMIN, {
    createRoles,
    isInRole: (roles, role) => roles.isAdmin(role),
    forRole: (roles) => roles.forAdmin(),
    addToRole: (roles, role) => roles.addAdmin(role),
    renounceRole: (roles) => roles.renounceAdmin(),
    revokeRole: (roles, role) => roles.revokeAdmin(role),
  });

  checkRoles<TestRoles>('Minter', () => MINTER, {
    createRoles,
    isInRole: (roles, role) => roles.isMinter(role),
    forRole: (roles) => roles.forMinter(),
    addToRole: (roles, role) => roles.addMinter(role),
    renounceRole: (roles) => roles.renounceMinter(),
    revokeRole: (roles, role) => roles.revokeMinter(role),
  });

  checkRoles<TestRoles>('Transfer Agent', () => TRANSFER_AGENT, {
    createRoles,
    isInRole: (roles, role) => roles.isTransferAgent(role),
    forRole: (roles) => roles.forTransferAgent(),
    addToRole: (roles, role) => roles.addTransferAgent(role),
    renounceRole: (roles) => roles.renounceTransferAgent(),
    revokeRole: (roles, role) => roles.revokeTransferAgent(role),
  });
});

describe('check delegating roles', () => {
  const createDelegatingRoles = (address: string) => createRoles(address);

  checkSuperAdminDelegation<TestRoles>(createDelegatingRoles, (roles) => roles.forSuperAdmin());

  checkDelegatingRoles<TestRoles>('Admin', () => ADMIN, {
    createDelegatingRoles,
    isInRole: (roles, role) => roles.isAdmin(role),
    forRole: (roles) => roles.forAdmin(),
    addToRole: (roles, role) => roles.addAdmin(role),
  });

  checkDelegatingRoles<TestRoles>('Minter', () => MINTER, {
    createDelegatingRoles,
    isInRole: (roles, role) => roles.isMinter(role),
    forRole: (roles) => roles.forMinter(),
    addToRole: (roles, role) => roles.addMinter(role),
  });

  checkDelegatingRoles<TestRoles>('Transfer Agent', () => TRANSFER_AGENT, {
    createDelegatingRoles,
    isInRole: (roles, role) => roles.isTransferAgent(role),
    forRole: (roles) => roles.forTransferAgent(),
    addToRole: (roles, role) => roles.addTransferAgent(role),
  });
});
