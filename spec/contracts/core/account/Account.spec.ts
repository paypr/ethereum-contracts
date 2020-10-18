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
  checkRoles,
  checkSuperAdmin,
  checkSuperAdminDelegation,
  createRoles,
  createRolesWithAllSameRole,
  MINTER,
  OTHER1,
  SUPER_ADMIN,
  TRANSFER_AGENT,
} from '../../../helpers/AccessHelper';
import { AccountContract, createAccount } from '../../../helpers/AccountHelper';
import { ZERO_ADDRESS } from '../../../helpers/Accounts';
import { createConsumable, mintConsumable } from '../../../helpers/ConsumableHelper';
import { ERC165_ID, ROLE_DELEGATE_ID } from '../../../helpers/ContractIds';
import { shouldRestrictEnableAndDisable } from '../../../helpers/DisableableHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165';
import { shouldTransferItem, shouldTransferToken } from '../../../helpers/TransferringHelper';

describe('supportsInterface', () => {
  shouldSupportInterface('ERC165', createAccount, ERC165_ID);
  shouldSupportInterface('RoleDelegate', createAccount, ROLE_DELEGATE_ID);
});

describe('initializeAccount', () => {
  it('should set roles when no delegate provided', async () => {
    const account = await AccountContract.new();
    await account.initializeAccount(ZERO_ADDRESS, { from: SUPER_ADMIN });

    expect<string>(await account.isSuperAdmin(SUPER_ADMIN)).toBe(true);
    expect<string>(await account.isAdmin(SUPER_ADMIN)).toBe(true);
    expect<string>(await account.isTransferAgent(SUPER_ADMIN)).toBe(true);
  });

  it('should set delegate', async () => {
    const roleDelegate = await createRolesWithAllSameRole(SUPER_ADMIN);
    const account = await AccountContract.new();
    await account.initializeAccount(roleDelegate.address, { from: SUPER_ADMIN });

    expect<string>(await account.isRoleDelegate(roleDelegate.address)).toBe(true);
    expect<string>(await account.isSuperAdmin(SUPER_ADMIN)).toBe(true);
    expect<string>(await account.isAdmin(SUPER_ADMIN)).toBe(true);
    expect<string>(await account.isTransferAgent(SUPER_ADMIN)).toBe(true);
  });
});

describe('Enable/Disable', () => {
  const admin = ADMIN;
  const nonAdmin = OTHER1;

  const create = async () => {
    const account = await createAccount();
    await account.addAdmin(admin, { from: SUPER_ADMIN });
    return account;
  };

  shouldRestrictEnableAndDisable(create, admin, nonAdmin);

  const createWithRoleDelegate = async () => {
    const roleDelegate = await createRoles();
    await roleDelegate.addAdmin(admin, { from: SUPER_ADMIN });

    return createAccount(roleDelegate.address);
  };

  shouldRestrictEnableAndDisable(createWithRoleDelegate, admin, nonAdmin);
});

describe('transferToken', () => {
  const create = async () => {
    const account = await createAccount();
    await account.addAdmin(SUPER_ADMIN, { from: SUPER_ADMIN });
    await account.addTransferAgent(SUPER_ADMIN, { from: SUPER_ADMIN });
    return account;
  };

  shouldTransferToken(create, { superAdmin: SUPER_ADMIN, withExchange: true });
});

describe('transferItem', () => {
  const create = async () => {
    const account = await createAccount();
    await account.addAdmin(SUPER_ADMIN, { from: SUPER_ADMIN });
    await account.addTransferAgent(SUPER_ADMIN, { from: SUPER_ADMIN });
    return account;
  };

  shouldTransferItem(create, { superAdmin: SUPER_ADMIN });
});

describe('check roles', () => {
  const createRoles = async () => {
    const account = await createAccount();
    await account.renounceAdmin({ from: SUPER_ADMIN });
    await account.renounceTransferAgent({ from: SUPER_ADMIN });
    return account;
  };

  checkSuperAdmin(createRoles, (account, options) => account.addAdmin(OTHER1, options));

  checkRoles('Admin', ADMIN, {
    createRoles,
    isInRole: (account, role) => account.isAdmin(role),
    forRole: (account, options) => account.disable(options),
    addToRole: (account, role, options) => account.addAdmin(role, options),
    renounceRole: (account, options) => account.renounceAdmin(options),
    revokeRole: (account, role, options) => account.revokeAdmin(role, options),
  });

  checkRoles('Minter', MINTER, {
    createRoles,
    isInRole: (account, role) => account.isMinter(role),
    addToRole: (account, role, options) => account.addMinter(role, options),
    renounceRole: (account, options) => account.renounceMinter(options),
    revokeRole: (account, role, options) => account.revokeMinter(role, options),
  });

  checkRoles('Transfer Agent', TRANSFER_AGENT, {
    createRoles,
    isInRole: (account, role) => account.isTransferAgent(role),
    forRole: async (account, options) => {
      const consumable = await createConsumable();
      await mintConsumable(consumable, account.address, 1000);
      await account.transferToken(consumable.address, 100, OTHER1, options);
    },
    addToRole: (account, role, options) => account.addTransferAgent(role, options),
    renounceRole: (account, options) => account.renounceTransferAgent(options),
    revokeRole: (account, role, options) => account.revokeTransferAgent(role, options),
  });
});

describe('check delegating roles', () => {
  const createDelegatingRoles = (address: string) => createAccount(address);

  checkSuperAdminDelegation(createDelegatingRoles, (account, options) => account.addAdmin(OTHER1, options));

  checkDelegatingRoles('Admin', ADMIN, {
    createDelegatingRoles,
    isInRole: (account, role) => account.isAdmin(role),
    forRole: (account, options) => account.disable(options),
    addToRole: (account, role, options) => account.addAdmin(role, options),
  });

  checkDelegatingRoles('Minter', MINTER, {
    createDelegatingRoles,
    isInRole: (account, role) => account.isMinter(role),
    addToRole: (account, role, options) => account.addMinter(role, options),
  });

  checkDelegatingRoles('Transfer Agent', TRANSFER_AGENT, {
    createDelegatingRoles,
    isInRole: (account, role) => account.isTransferAgent(role),
    forRole: async (account, options) => {
      const consumable = await createConsumable();
      await mintConsumable(consumable, account.address, 1000);
      await account.transferToken(consumable.address, 100, OTHER1, options);
    },
    addToRole: (account, role, options) => account.addTransferAgent(role, options),
  });
});
