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

import { accounts } from '@openzeppelin/test-environment';
import { expectRevert } from '@openzeppelin/test-helpers';
import { ZERO_ADDRESS } from './Accounts';
import { getContract } from './ContractHelper';

export const [SUPER_ADMIN, ADMIN, MINTER, TRANSFER_AGENT, OTHER1, OTHER2] = accounts;

const RolesContract = getContract('TestRoles');

export const getOrDefaultRoleDelegate = async (roleDelegate: string | undefined, role: string) => {
  if (roleDelegate && roleDelegate !== ZERO_ADDRESS) {
    return roleDelegate;
  }
  const roles = await createRolesWithAllSameRole(role);
  return roles.address;
};

export const createRolesWithAllSameRole = async (role: string) => {
  const roles = await createRoles(ZERO_ADDRESS, role);
  await roles.addAdmin(role, { from: role });
  await roles.addMinter(role, { from: role });
  await roles.addTransferAgent(role, { from: role });
  return roles;
};

export const createRoles = async (roleDelegateAddress: string = ZERO_ADDRESS, superAdminRole: string = SUPER_ADMIN) => {
  const roles = await RolesContract.new();
  await roles.initializeTestRoles(roleDelegateAddress, { from: superAdminRole });
  return roles;
};

const DelegatingRolesContract = getContract('TestDelegatingRoles');

export const createDelegatingRoles = async (roleDelegateAddress: string, superAdminRole: string = SUPER_ADMIN) => {
  const delegatingRoles = await DelegatingRolesContract.new();
  await delegatingRoles.initializeTestDelegatingRoles(roleDelegateAddress, { from: superAdminRole });
  return delegatingRoles;
};

export const checkSuperAdminDelegation = (
  createDelegateRoles: (address: string) => Promise<any>,
  forRole: (roles: any, options: any) => Promise<void>,
) => {
  describe('isSuperAdmin', () => {
    it('should return true for the super admin', async () => {
      const roles = await createRoles();
      const delegateRoles = await createDelegateRoles(roles.address);

      expect<boolean>(await delegateRoles.isSuperAdmin(SUPER_ADMIN)).toEqual(true);
    });

    it('should return false for someone else', async () => {
      const roles = await createRoles();
      const delegateRoles = await createDelegateRoles(roles.address);

      expect<boolean>(await delegateRoles.isSuperAdmin(OTHER1)).toEqual(false);
    });

    it('should return false for the minter', async () => {
      const roles = await createRoles();
      const delegateRoles = await createDelegateRoles(roles.address);

      delegateRoles.addMinter(MINTER, { from: SUPER_ADMIN });

      expect<boolean>(await delegateRoles.isSuperAdmin(MINTER)).toEqual(false);
    });
  });

  describe('onlySuperAdmin', () => {
    it('should be callable by super admin', async () => {
      const roles = await createRoles();
      const delegateRoles = await createDelegateRoles(roles.address);

      await forRole(delegateRoles, { from: SUPER_ADMIN });
    });

    it('should not be callable by someone else', async () => {
      const roles = await createRoles();
      const delegateRoles = await createDelegateRoles(roles.address);

      await expectRevert(forRole(delegateRoles, { from: OTHER1 }), 'Caller does not have the SuperAdmin role');
    });
  });
};

export interface CheckDelegatingRolesConfig {
  createDelegatingRoles: (roleDelegateAddress: string) => Promise<any>;
  isInRole: (roles: any, role: string) => Promise<boolean>;
  forRole?: (roles: any, options: any) => Promise<void>;
  addToRole: (roles: any, role: string, options: any) => Promise<void>;
}
export const checkDelegatingRoles = (roleName: string, roleUnderTest: string, config: CheckDelegatingRolesConfig) => {
  const { createDelegatingRoles, isInRole, forRole, addToRole } = config;

  describe(`is${roleName}`, () => {
    it(`should return true for the ${roleName}`, async () => {
      const roles = await createRoles();
      await addToRole(roles, roleUnderTest, { from: SUPER_ADMIN });

      const delegatingRoles = await createDelegatingRoles(roles.address);

      expect<boolean>(await isInRole(delegatingRoles, roleUnderTest)).toEqual(true);
    });

    it('should return false for someone else', async () => {
      const roles = await createRoles();
      await addToRole(roles, roleUnderTest, { from: SUPER_ADMIN });

      const delegatingRoles = await createDelegatingRoles(roles.address);

      expect<boolean>(await isInRole(delegatingRoles, OTHER1)).toEqual(false);
    });

    it('should return false for all when not set', async () => {
      const roles = await createRoles();
      const delegatingRoles = await createDelegatingRoles(roles.address);

      expect<boolean>(await isInRole(delegatingRoles, roleUnderTest)).toEqual(false);
    });

    it('should return false for the super admin', async () => {
      const roles = await createRoles();
      await addToRole(roles, roleUnderTest, { from: SUPER_ADMIN });

      const delegatingRoles = await createDelegatingRoles(roles.address);

      expect<boolean>(await isInRole(delegatingRoles, SUPER_ADMIN)).toEqual(false);
    });
  });

  if (forRole) {
    describe(`only${roleName}`, () => {
      it(`should be callable by ${roleName}`, async () => {
        const roles = await createRoles();
        await addToRole(roles, roleUnderTest, { from: SUPER_ADMIN });

        const delegatingRoles = await createDelegatingRoles(roles.address);

        await forRole(delegatingRoles, { from: roleUnderTest });
      });

      it('should not be callable by someone else', async () => {
        const roles = await createRoles();
        const delegatingRoles = await createDelegatingRoles(roles.address);

        await expectRevert(forRole(delegatingRoles, { from: OTHER1 }), `Caller does not have the ${roleName} role`);
      });
    });
  }
};

export const checkSuperAdmin = (
  createRoles: () => Promise<any>,
  forRole: (roles: any, options: any) => Promise<void>,
) => {
  describe('isSuperAdmin', () => {
    it('should return true for the super admin', async () => {
      const roles = await createRoles();

      expect<boolean>(await roles.isSuperAdmin(SUPER_ADMIN)).toEqual(true);
    });

    it('should return false for someone else', async () => {
      const roles = await createRoles();

      expect<boolean>(await roles.isSuperAdmin(OTHER1)).toEqual(false);
    });

    it('should return false for the minter', async () => {
      const roles = await createRoles();

      roles.addMinter(MINTER, { from: SUPER_ADMIN });

      expect<boolean>(await roles.isSuperAdmin(MINTER)).toEqual(false);
    });
  });

  describe('onlySuperAdmin', () => {
    it('should be callable by super admin', async () => {
      const roles = await createRoles();

      await forRole(roles, { from: SUPER_ADMIN });
    });

    it('should not be callable by someone else', async () => {
      const roles = await createRoles();

      await expectRevert(forRole(roles, { from: OTHER1 }), 'Caller does not have the SuperAdmin role');
    });
  });

  describe('addSuperAdmin', () => {
    it('should add if called by a current super admin', async () => {
      const roles = await createRoles();

      await roles.addSuperAdmin(OTHER1, { from: SUPER_ADMIN });
      expect<boolean>(await roles.isSuperAdmin(OTHER1)).toEqual(true);

      await roles.addSuperAdmin(OTHER2, { from: OTHER1 });
      expect<boolean>(await roles.isSuperAdmin(OTHER2)).toEqual(true);
    });

    it('should fail if called by someone other than a super admin', async () => {
      const roles = await createRoles();

      await roles.addMinter(MINTER, { from: SUPER_ADMIN });

      await expectRevert(roles.addSuperAdmin(MINTER, { from: MINTER }), 'Caller does not have the SuperAdmin role');
      expect<boolean>(await roles.isSuperAdmin(MINTER)).toEqual(false);

      await expectRevert(roles.addSuperAdmin(OTHER2, { from: MINTER }), 'Caller does not have the SuperAdmin role');
      expect<boolean>(await roles.isSuperAdmin(OTHER2)).toEqual(false);
    });
  });

  describe('renounceSuperAdmin', () => {
    it('should renounce if called by a current super admin', async () => {
      const roles = await createRoles();

      await roles.addSuperAdmin(MINTER, { from: SUPER_ADMIN });
      await roles.addMinter(MINTER, { from: SUPER_ADMIN });

      await roles.renounceSuperAdmin({ from: SUPER_ADMIN });
      expect<boolean>(await roles.isSuperAdmin(SUPER_ADMIN)).toEqual(false);
      expect<boolean>(await roles.isSuperAdmin(MINTER)).toEqual(true);
      expect<boolean>(await roles.isMinter(MINTER)).toEqual(true);

      await roles.renounceSuperAdmin({ from: MINTER });
      expect<boolean>(await roles.isSuperAdmin(MINTER)).toEqual(false);
      expect<boolean>(await roles.isMinter(MINTER)).toEqual(true);
    });

    it('should not fail if called by someone other than a super admin', async () => {
      const roles = await createRoles();

      await roles.addMinter(MINTER, { from: SUPER_ADMIN });

      roles.renounceSuperAdmin({ from: MINTER });
      expect<boolean>(await roles.isSuperAdmin(MINTER)).toEqual(false);
      expect<boolean>(await roles.isMinter(MINTER)).toEqual(true);
      expect<boolean>(await roles.isSuperAdmin(SUPER_ADMIN)).toEqual(true);

      roles.renounceSuperAdmin({ from: OTHER1 });
      expect<boolean>(await roles.isSuperAdmin(OTHER1)).toEqual(false);
      expect<boolean>(await roles.isSuperAdmin(SUPER_ADMIN)).toEqual(true);
    });
  });

  describe('revokeSuperAdmin', () => {
    it('should revoke if called by a current super admin', async () => {
      const roles = await createRoles();

      await roles.addSuperAdmin(MINTER, { from: SUPER_ADMIN });
      await roles.addMinter(MINTER, { from: SUPER_ADMIN });
      await roles.addSuperAdmin(OTHER1, { from: SUPER_ADMIN });

      await roles.revokeSuperAdmin(MINTER, { from: OTHER1 });
      expect<boolean>(await roles.isSuperAdmin(SUPER_ADMIN)).toEqual(true);
      expect<boolean>(await roles.isSuperAdmin(MINTER)).toEqual(false);
      expect<boolean>(await roles.isMinter(MINTER)).toEqual(true);
      expect<boolean>(await roles.isSuperAdmin(OTHER1)).toEqual(true);

      await roles.revokeSuperAdmin(SUPER_ADMIN, { from: OTHER1 });
      expect<boolean>(await roles.isSuperAdmin(SUPER_ADMIN)).toEqual(false);
      expect<boolean>(await roles.isSuperAdmin(MINTER)).toEqual(false);
      expect<boolean>(await roles.isMinter(MINTER)).toEqual(true);
      expect<boolean>(await roles.isSuperAdmin(OTHER1)).toEqual(true);
    });

    it('should fail if called by someone other than a super admin', async () => {
      const roles = await createRoles();

      await roles.addSuperAdmin(OTHER1, { from: SUPER_ADMIN });
      await roles.addMinter(MINTER, { from: SUPER_ADMIN });

      await expectRevert(roles.revokeSuperAdmin(OTHER1, { from: MINTER }), 'sender must be an admin to revoke');
      expect<boolean>(await roles.isSuperAdmin(OTHER1)).toEqual(true);

      await expectRevert(roles.revokeSuperAdmin(OTHER1, { from: OTHER2 }), 'sender must be an admin to revoke');
      expect<boolean>(await roles.isSuperAdmin(OTHER1)).toEqual(true);
    });
  });
};

interface CheckRolesConfig {
  createRoles: () => Promise<any>;
  isInRole: (roles: any, role: string) => Promise<boolean>;
  forRole?: (roles: any, options: any) => Promise<void>;
  addToRole: (roles: any, role: string, options: any) => Promise<void>;
  renounceRole: (roles: any, options: any) => Promise<void>;
  revokeRole: (roles: any, role: string, options: any) => Promise<void>;
}

export const checkRoles = (roleName: string, roleUnderTest: string, config: CheckRolesConfig) => {
  const { createRoles, isInRole, forRole, addToRole, renounceRole, revokeRole } = config;

  describe(`is${roleName}`, () => {
    it(`should return true for the ${roleName}`, async () => {
      const roles = await createRoles();

      await addToRole(roles, roleUnderTest, { from: SUPER_ADMIN });

      expect<boolean>(await isInRole(roles, roleUnderTest)).toEqual(true);
    });

    it('should return false for someone else', async () => {
      const roles = await createRoles();

      await addToRole(roles, roleUnderTest, { from: SUPER_ADMIN });

      expect<boolean>(await isInRole(roles, OTHER1)).toEqual(false);
    });

    it('should return false for all when not set', async () => {
      const roles = await createRoles();

      expect<boolean>(await isInRole(roles, roleUnderTest)).toEqual(false);
    });

    it('should return false for the super admin', async () => {
      const roles = await createRoles();

      await addToRole(roles, roleUnderTest, { from: SUPER_ADMIN });

      expect<boolean>(await isInRole(roles, SUPER_ADMIN)).toEqual(false);
    });
  });

  if (forRole) {
    describe(`only${roleName}`, () => {
      it(`should be callable by ${roleName}`, async () => {
        const roles = await createRoles();

        await addToRole(roles, roleUnderTest, { from: SUPER_ADMIN });

        await forRole(roles, { from: roleUnderTest });
      });

      it('should not be callable by someone else', async () => {
        const roles = await createRoles();

        await expectRevert(forRole(roles, { from: OTHER1 }), `Caller does not have the ${roleName} role`);
      });
    });
  }

  describe(`add${roleName}`, () => {
    it('should add if called by a current super admin', async () => {
      const roles = await createRoles();

      await addToRole(roles, roleUnderTest, { from: SUPER_ADMIN });
      expect<boolean>(await isInRole(roles, roleUnderTest)).toEqual(true);

      await roles.addSuperAdmin(roleUnderTest, { from: SUPER_ADMIN });
      await addToRole(roles, OTHER1, { from: roleUnderTest });
      expect<boolean>(await isInRole(roles, OTHER1)).toEqual(true);
    });

    it('should fail if called by someone other than a super admin', async () => {
      const roles = await createRoles();

      await addToRole(roles, roleUnderTest, { from: SUPER_ADMIN });

      await expectRevert(addToRole(roles, OTHER1, { from: OTHER1 }), 'Caller does not have the SuperAdmin role');
      expect<boolean>(await isInRole(roles, OTHER1)).toEqual(false);

      await expectRevert(addToRole(roles, OTHER1, { from: roleUnderTest }), 'Caller does not have the SuperAdmin role');
      expect<boolean>(await isInRole(roles, OTHER1)).toEqual(false);
    });
  });

  describe(`renounce${roleName}`, () => {
    it(`should renounce if called by a current ${roleName}`, async () => {
      const roles = await createRoles();

      await roles.addSuperAdmin(roleUnderTest, { from: SUPER_ADMIN });
      await addToRole(roles, roleUnderTest, { from: SUPER_ADMIN });
      await addToRole(roles, OTHER1, { from: SUPER_ADMIN });

      await renounceRole(roles, { from: roleUnderTest });
      expect<boolean>(await isInRole(roles, roleUnderTest)).toEqual(false);
      expect<boolean>(await isInRole(roles, OTHER1)).toEqual(true);
      expect<boolean>(await roles.isSuperAdmin(roleUnderTest)).toEqual(true);

      await renounceRole(roles, { from: OTHER1 });
      expect<boolean>(await isInRole(roles, OTHER1)).toEqual(false);
      expect<boolean>(await roles.isSuperAdmin(roleUnderTest)).toEqual(true);
    });

    it(`should not fail if called by someone other than a ${roleName}`, async () => {
      const roles = await createRoles();

      await roles.addSuperAdmin(OTHER1, { from: SUPER_ADMIN });

      renounceRole(roles, { from: OTHER1 });
      expect<boolean>(await isInRole(roles, OTHER1)).toEqual(false);
      expect<boolean>(await roles.isSuperAdmin(OTHER1)).toEqual(true);
      expect<boolean>(await roles.isSuperAdmin(SUPER_ADMIN)).toEqual(true);

      renounceRole(roles, { from: OTHER2 });
      expect<boolean>(await isInRole(roles, OTHER2)).toEqual(false);
      expect<boolean>(await roles.isSuperAdmin(OTHER1)).toEqual(true);
      expect<boolean>(await roles.isSuperAdmin(SUPER_ADMIN)).toEqual(true);
    });
  });

  describe(`revoke${roleName}`, () => {
    it('should revoke if called by a super admin', async () => {
      const roles = await createRoles();

      await roles.addSuperAdmin(OTHER1, { from: SUPER_ADMIN });
      await roles.addSuperAdmin(roleUnderTest, { from: SUPER_ADMIN });
      await addToRole(roles, roleUnderTest, { from: SUPER_ADMIN });
      await addToRole(roles, OTHER2, { from: SUPER_ADMIN });

      await revokeRole(roles, roleUnderTest, { from: OTHER1 });
      expect<boolean>(await isInRole(roles, roleUnderTest)).toEqual(false);
      expect<boolean>(await roles.isSuperAdmin(roleUnderTest)).toEqual(true);
      expect<boolean>(await isInRole(roles, OTHER2)).toEqual(true);

      await revokeRole(roles, OTHER2, { from: OTHER1 });
      expect<boolean>(await isInRole(roles, roleUnderTest)).toEqual(false);
      expect<boolean>(await roles.isSuperAdmin(roleUnderTest)).toEqual(true);
      expect<boolean>(await isInRole(roles, OTHER2)).toEqual(false);
    });

    it('should fail if called by someone other than a super admin', async () => {
      const roles = await createRoles();

      await addToRole(roles, OTHER1, { from: SUPER_ADMIN });
      await addToRole(roles, roleUnderTest, { from: SUPER_ADMIN });

      await expectRevert(revokeRole(roles, OTHER1, { from: roleUnderTest }), 'sender must be an admin to revoke');
      expect<boolean>(await isInRole(roles, OTHER1)).toEqual(true);

      await expectRevert(revokeRole(roles, roleUnderTest, { from: OTHER2 }), 'sender must be an admin to revoke');
      expect<boolean>(await isInRole(roles, roleUnderTest)).toEqual(true);
    });
  });
};
