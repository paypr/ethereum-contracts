/*
 * Copyright (c) 2020 The Paypr Company
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

import {
  ADMIN,
  checkDelegatingRoles,
  createDelegatingRoles,
  MINTER,
  TRANSFER_AGENT,
} from '../../../helpers/AccessHelper';

describe('check delegating roles', () => {
  checkDelegatingRoles('Admin', ADMIN, {
    createDelegatingRoles,
    isInRole: (roles, role) => roles.isAdmin(role),
    forRole: (roles, options) => roles.forAdmin(options),
    addToRole: (roles, role, options) => roles.addAdmin(role, options),
  });

  checkDelegatingRoles('Minter', MINTER, {
    createDelegatingRoles,
    isInRole: (roles, role) => roles.isMinter(role),
    forRole: (roles, options) => roles.forMinter(options),
    addToRole: (roles, role, options) => roles.addMinter(role, options),
  });

  checkDelegatingRoles('Transfer Agent', TRANSFER_AGENT, {
    createDelegatingRoles,
    isInRole: (roles, role) => roles.isTransferAgent(role),
    forRole: (roles, options) => roles.forTransferAgent(options),
    addToRole: (roles, role, options) => roles.addTransferAgent(role, options),
  });
});
