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
import { Account } from '../../../../types/contracts';
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
import { createAccount, deployAccountContract } from '../../../helpers/AccountHelper';
import { ZERO_ADDRESS } from '../../../helpers/Accounts';
import { createConsumable, mintConsumable } from '../../../helpers/ConsumableHelper';
import { shouldRestrictEnableAndDisable } from '../../../helpers/DisableableHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165';
import { shouldTransferItem, shouldTransferToken } from '../../../helpers/TransferringHelper';

describe('supportsInterface', () => {
  shouldSupportInterface('ERC165', createAccount, ERC165_ID);
  shouldSupportInterface('RoleDelegate', createAccount, ROLE_DELEGATE_ID);
});

describe('initializeAccount', () => {
  it('should set roles when no delegate provided', async () => {
    const account = await deployAccountContract();
    await account.connect(SUPER_ADMIN).initializeAccount(ZERO_ADDRESS);

    expect<boolean>(await account.isSuperAdmin(SUPER_ADMIN.address)).toBe(true);
    expect<boolean>(await account.isAdmin(SUPER_ADMIN.address)).toBe(true);
    expect<boolean>(await account.isTransferAgent(SUPER_ADMIN.address)).toBe(true);
  });

  it('should set delegate', async () => {
    const roleDelegate = await createRolesWithAllSameRole(SUPER_ADMIN);
    const account = await deployAccountContract();
    await account.connect(SUPER_ADMIN).initializeAccount(roleDelegate.address);

    expect<boolean>(await account.isRoleDelegate(roleDelegate.address)).toBe(true);
    expect<boolean>(await account.isSuperAdmin(SUPER_ADMIN.address)).toBe(true);
    expect<boolean>(await account.isAdmin(SUPER_ADMIN.address)).toBe(true);
    expect<boolean>(await account.isTransferAgent(SUPER_ADMIN.address)).toBe(true);
  });
});

describe('Enable/Disable', () => {
  const getAdmin = () => ADMIN;
  const getNonAdmin = () => OTHER1;

  const create = async () => {
    const account = await createAccount();
    await account.connect(SUPER_ADMIN).addAdmin(getAdmin().address);
    return account;
  };

  shouldRestrictEnableAndDisable(create, { getAdmin, getNonAdmin });

  const createWithRoleDelegate = async () => {
    const roleDelegate = await createRoles();
    await roleDelegate.connect(SUPER_ADMIN).addAdmin(getAdmin().address);

    return createAccount(roleDelegate.address);
  };

  shouldRestrictEnableAndDisable(createWithRoleDelegate, { getAdmin, getNonAdmin });
});

describe('transferToken', () => {
  const create = async () => {
    const account = await createAccount();
    await account.connect(SUPER_ADMIN).addAdmin(SUPER_ADMIN.address);
    await account.connect(SUPER_ADMIN).addTransferAgent(SUPER_ADMIN.address);
    return account;
  };

  shouldTransferToken(create, { getSuperAdmin: () => SUPER_ADMIN, withExchange: true });
});

describe('transferItem', () => {
  const create = async () => {
    const account = await createAccount();
    await account.connect(SUPER_ADMIN).addAdmin(SUPER_ADMIN.address);
    await account.connect(SUPER_ADMIN).addTransferAgent(SUPER_ADMIN.address);
    return account;
  };

  shouldTransferItem(create, { getSuperAdmin: () => SUPER_ADMIN });
});

describe('check roles', () => {
  const createRoles = async () => {
    const account = await createAccount();
    await account.connect(SUPER_ADMIN).renounceAdmin();
    await account.connect(SUPER_ADMIN).renounceTransferAgent();
    return account;
  };

  checkSuperAdmin(createRoles, (account) => account.addAdmin(OTHER1.address));

  checkRoles<Account>('Admin', () => ADMIN, {
    createRoles,
    isInRole: (account, role) => account.isAdmin(role),
    forRole: (account) => account.disable(),
    addToRole: (account, role) => account.addAdmin(role),
    renounceRole: (account) => account.renounceAdmin(),
    revokeRole: (account, role) => account.revokeAdmin(role),
  });

  checkRoles<Account>('Minter', () => MINTER, {
    createRoles,
    isInRole: (account, role) => account.isMinter(role),
    addToRole: (account, role) => account.addMinter(role),
    renounceRole: (account) => account.renounceMinter(),
    revokeRole: (account, role) => account.revokeMinter(role),
  });

  checkRoles<Account>('Transfer Agent', () => TRANSFER_AGENT, {
    createRoles,
    isInRole: (account, role) => account.isTransferAgent(role),
    forRole: async (account) => {
      const consumable = await createConsumable();
      await mintConsumable(consumable, account.address, 1000);
      return account.transferToken(consumable.address, 100, OTHER1.address);
    },
    addToRole: (account, role) => account.addTransferAgent(role),
    renounceRole: (account) => account.renounceTransferAgent(),
    revokeRole: (account, role) => account.revokeTransferAgent(role),
  });
});

describe('check delegating roles', () => {
  const createDelegatingRoles = (address: string) => createAccount(address);

  checkSuperAdminDelegation<Account>(createDelegatingRoles, (account) => account.addAdmin(OTHER1.address));

  checkDelegatingRoles<Account>('Admin', () => ADMIN, {
    createDelegatingRoles,
    isInRole: (account, role) => account.isAdmin(role),
    forRole: (account) => account.disable(),
    addToRole: (account, role) => account.addAdmin(role),
  });

  checkDelegatingRoles<Account>('Minter', () => MINTER, {
    createDelegatingRoles,
    isInRole: (account, role) => account.isMinter(role),
    addToRole: (account, role) => account.addMinter(role),
  });

  checkDelegatingRoles('Transfer Agent', () => TRANSFER_AGENT, {
    createDelegatingRoles,
    isInRole: (account, role) => account.isTransferAgent(role),
    forRole: async (account) => {
      const consumable = await createConsumable();
      await mintConsumable(consumable, account.address, 1000);
      return account.transferToken(consumable.address, 100, OTHER1.address);
    },
    addToRole: (account, role) => account.addTransferAgent(role),
  });
});
