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

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ContractTransaction, Signer } from 'ethers';
import { DelegatingRoles, Roles, TestDelegatingRoles__factory, TestRoles__factory } from '../../types/contracts';
import { INITIALIZER, onInitAccounts, ZERO_ADDRESS } from './Accounts';

export let SUPER_ADMIN: SignerWithAddress;
export let ADMIN: SignerWithAddress;
export let MINTER: SignerWithAddress;
export let TRANSFER_AGENT: SignerWithAddress;
export let OTHER1: SignerWithAddress;
export let OTHER2: SignerWithAddress;

onInitAccounts((accounts) => {
  [SUPER_ADMIN, ADMIN, MINTER, TRANSFER_AGENT, OTHER1, OTHER2] = accounts;
});

export const getOrDefaultRoleDelegate = async (roleDelegate: string | undefined, role: SignerWithAddress) => {
  if (roleDelegate && roleDelegate !== ZERO_ADDRESS) {
    return roleDelegate;
  }
  const roles = await createRolesWithAllSameRole(role);
  return roles.address;
};

export const createRolesWithAllSameRole = async (role: SignerWithAddress = SUPER_ADMIN) => {
  const roles = await createRoles(ZERO_ADDRESS, role);
  const mutableRoles = roles.connect(role);
  await mutableRoles.addAdmin(role.address);
  await mutableRoles.addMinter(role.address);
  await mutableRoles.addTransferAgent(role.address);
  return roles;
};

export const createRoles = async (roleDelegateAddress: string = ZERO_ADDRESS, superAdminRole: Signer = SUPER_ADMIN) => {
  const roles = await deployRoles();
  await roles.connect(superAdminRole).initializeTestRoles(roleDelegateAddress);
  return roles;
};

export const deployRoles = (deployer: SignerWithAddress = INITIALIZER) => new TestRoles__factory(deployer).deploy();

const deployDelegatingRolesContract = () => new TestDelegatingRoles__factory(INITIALIZER).deploy();

export const createDelegatingRoles = async (roleDelegateAddress: string, superAdminRole: Signer = SUPER_ADMIN) => {
  const delegatingRoles = await deployDelegatingRolesContract();
  await delegatingRoles.connect(superAdminRole).initializeTestDelegatingRoles(roleDelegateAddress);
  return delegatingRoles;
};

export const checkSuperAdminDelegation = <R extends Roles>(
  createDelegateRoles: (address: string) => Promise<R>,
  forRole: (roles: R) => Promise<ContractTransaction | void>,
) => {
  describe('isSuperAdmin', () => {
    it('should return true for the super admin', async () => {
      const roles = await createRoles();
      const delegateRoles = await createDelegateRoles(roles.address);

      expect<boolean>(await delegateRoles.isSuperAdmin(SUPER_ADMIN.address)).toEqual(true);
    });

    it('should return false for someone else', async () => {
      const roles = await createRoles();
      const delegateRoles = await createDelegateRoles(roles.address);

      expect<boolean>(await delegateRoles.isSuperAdmin(OTHER1.address)).toEqual(false);
    });

    it('should return false for the minter', async () => {
      const roles = await createRoles();
      const delegateRoles = await createDelegateRoles(roles.address);

      await delegateRoles.connect(SUPER_ADMIN).addMinter(MINTER.address);

      expect<boolean>(await delegateRoles.isSuperAdmin(MINTER.address)).toEqual(false);
    });
  });

  describe('onlySuperAdmin', () => {
    it('should be callable by super admin', async () => {
      const roles = await createRoles();
      const delegateRoles = await createDelegateRoles(roles.address);

      await forRole(delegateRoles.connect(SUPER_ADMIN));
    });

    it('should not be callable by someone else', async () => {
      const roles = await createRoles();
      const delegateRoles = await createDelegateRoles(roles.address);

      await expect<Promise<ContractTransaction | void>>(forRole(delegateRoles.connect(OTHER1))).toBeRevertedWith(
        'Caller does not have the SuperAdmin role',
      );
    });
  });
};

export interface CheckDelegatingRolesConfig<R extends Roles | DelegatingRoles> {
  createDelegatingRoles: (roleDelegateAddress: string) => Promise<R>;
  isInRole: (roles: R, role: string) => Promise<boolean>;
  forRole?: (roles: R) => Promise<ContractTransaction | void>;
  addToRole: (roles: Roles, role: string) => Promise<ContractTransaction | void>;
}
export const checkDelegatingRoles = <R extends DelegatingRoles>(
  roleName: string,
  getRoleUnderTest: () => SignerWithAddress,
  config: CheckDelegatingRolesConfig<R>,
) => {
  const { createDelegatingRoles, isInRole, forRole, addToRole } = config;

  describe(`is${roleName}`, () => {
    it(`should return true for the ${roleName}`, async () => {
      const roles = await createRoles();
      await addToRole(roles.connect(SUPER_ADMIN), getRoleUnderTest().address);

      const delegatingRoles = await createDelegatingRoles(roles.address);

      expect<boolean>(await isInRole(delegatingRoles, getRoleUnderTest().address)).toEqual(true);
    });

    it('should return false for someone else', async () => {
      const roles = await createRoles();
      await addToRole(roles.connect(SUPER_ADMIN), getRoleUnderTest().address);

      const delegatingRoles = await createDelegatingRoles(roles.address);

      expect<boolean>(await isInRole(delegatingRoles, OTHER1.address)).toEqual(false);
    });

    it('should return false for all when not set', async () => {
      const roles = await createRoles();
      const delegatingRoles = await createDelegatingRoles(roles.address);

      expect<boolean>(await isInRole(delegatingRoles, getRoleUnderTest().address)).toEqual(false);
    });

    it('should return false for the super admin', async () => {
      const roles = await createRoles();
      await addToRole(roles.connect(SUPER_ADMIN), getRoleUnderTest().address);

      const delegatingRoles = await createDelegatingRoles(roles.address);

      expect<boolean>(await isInRole(delegatingRoles, SUPER_ADMIN.address)).toEqual(false);
    });
  });

  if (forRole) {
    describe(`only${roleName}`, () => {
      it(`should be callable by ${roleName}`, async () => {
        const roles = await createRoles();
        await addToRole(roles.connect(SUPER_ADMIN), getRoleUnderTest().address);

        const delegatingRoles = await createDelegatingRoles(roles.address);

        await forRole(delegatingRoles.connect(getRoleUnderTest()));
      });

      it('should not be callable by someone else', async () => {
        const roles = await createRoles();
        const delegatingRoles = await createDelegatingRoles(roles.address);

        await expect<Promise<ContractTransaction | void>>(forRole(delegatingRoles.connect(OTHER1))).toBeRevertedWith(
          `Caller does not have the ${roleName} role`,
        );
      });
    });
  }
};

export const checkSuperAdmin = (
  createRoles: () => Promise<Roles>,
  forRole: (roles: Roles) => Promise<ContractTransaction>,
) => {
  describe('isSuperAdmin', () => {
    it('should return true for the super admin', async () => {
      const roles = await createRoles();

      expect<boolean>(await roles.isSuperAdmin(SUPER_ADMIN.address)).toEqual(true);
    });

    it('should return false for someone else', async () => {
      const roles = await createRoles();

      expect<boolean>(await roles.isSuperAdmin(OTHER1.address)).toEqual(false);
    });

    it('should return false for the minter', async () => {
      const roles = await createRoles();

      await roles.connect(SUPER_ADMIN).addMinter(MINTER.address);

      expect<boolean>(await roles.isSuperAdmin(MINTER.address)).toEqual(false);
    });
  });

  describe('onlySuperAdmin', () => {
    it('should be callable by super admin', async () => {
      const roles = await createRoles();

      await forRole(roles.connect(SUPER_ADMIN));
    });

    it('should not be callable by someone else', async () => {
      const roles = await createRoles();

      await expect<Promise<ContractTransaction>>(forRole(roles.connect(OTHER1))).toBeRevertedWith(
        'Caller does not have the SuperAdmin role',
      );
    });
  });

  describe('addSuperAdmin', () => {
    it('should add if called by a current super admin', async () => {
      const roles = await createRoles();

      await roles.connect(SUPER_ADMIN).addSuperAdmin(OTHER1.address);
      expect<boolean>(await roles.isSuperAdmin(OTHER1.address)).toEqual(true);

      await roles.connect(OTHER1).addSuperAdmin(OTHER2.address);
      expect<boolean>(await roles.isSuperAdmin(OTHER2.address)).toEqual(true);
    });

    it('should fail if called by someone other than a super admin', async () => {
      const roles = await createRoles();

      await roles.connect(SUPER_ADMIN).addMinter(MINTER.address);

      await expect<Promise<ContractTransaction>>(roles.connect(MINTER).addSuperAdmin(MINTER.address)).toBeRevertedWith(
        'Caller does not have the SuperAdmin role',
      );
      expect<boolean>(await roles.isSuperAdmin(MINTER.address)).toEqual(false);

      await expect<Promise<ContractTransaction>>(roles.connect(MINTER).addSuperAdmin(OTHER2.address)).toBeRevertedWith(
        'Caller does not have the SuperAdmin role',
      );
      expect<boolean>(await roles.isSuperAdmin(OTHER2.address)).toEqual(false);
    });
  });

  describe('renounceSuperAdmin', () => {
    it('should renounce if called by a current super admin', async () => {
      const roles = await createRoles();

      await roles.connect(SUPER_ADMIN).addSuperAdmin(MINTER.address);
      await roles.connect(SUPER_ADMIN).addMinter(MINTER.address);

      await roles.connect(SUPER_ADMIN).renounceSuperAdmin();
      expect<boolean>(await roles.isSuperAdmin(SUPER_ADMIN.address)).toEqual(false);
      expect<boolean>(await roles.isSuperAdmin(MINTER.address)).toEqual(true);
      expect<boolean>(await roles.isMinter(MINTER.address)).toEqual(true);

      await roles.connect(MINTER).renounceSuperAdmin();
      expect<boolean>(await roles.isSuperAdmin(MINTER.address)).toEqual(false);
      expect<boolean>(await roles.isMinter(MINTER.address)).toEqual(true);
    });

    it('should not fail if called by someone other than a super admin', async () => {
      const roles = await createRoles();

      await roles.connect(SUPER_ADMIN).addMinter(MINTER.address);

      await roles.connect(MINTER).renounceSuperAdmin();
      expect<boolean>(await roles.isSuperAdmin(MINTER.address)).toEqual(false);
      expect<boolean>(await roles.isMinter(MINTER.address)).toEqual(true);
      expect<boolean>(await roles.isSuperAdmin(SUPER_ADMIN.address)).toEqual(true);

      await roles.connect(OTHER1).renounceSuperAdmin();
      expect<boolean>(await roles.isSuperAdmin(OTHER1.address)).toEqual(false);
      expect<boolean>(await roles.isSuperAdmin(SUPER_ADMIN.address)).toEqual(true);
    });
  });

  describe('revokeSuperAdmin', () => {
    it('should revoke if called by a current super admin', async () => {
      const roles = await createRoles();

      await roles.connect(SUPER_ADMIN).addSuperAdmin(MINTER.address);
      await roles.connect(SUPER_ADMIN).addMinter(MINTER.address);
      await roles.connect(SUPER_ADMIN).addSuperAdmin(OTHER1.address);

      await roles.connect(OTHER1).revokeSuperAdmin(MINTER.address);
      expect<boolean>(await roles.isSuperAdmin(SUPER_ADMIN.address)).toEqual(true);
      expect<boolean>(await roles.isSuperAdmin(MINTER.address)).toEqual(false);
      expect<boolean>(await roles.isMinter(MINTER.address)).toEqual(true);
      expect<boolean>(await roles.isSuperAdmin(OTHER1.address)).toEqual(true);

      await roles.connect(OTHER1).revokeSuperAdmin(SUPER_ADMIN.address);
      expect<boolean>(await roles.isSuperAdmin(SUPER_ADMIN.address)).toEqual(false);
      expect<boolean>(await roles.isSuperAdmin(MINTER.address)).toEqual(false);
      expect<boolean>(await roles.isMinter(MINTER.address)).toEqual(true);
      expect<boolean>(await roles.isSuperAdmin(OTHER1.address)).toEqual(true);
    });

    it('should fail if called by someone other than a super admin', async () => {
      const roles = await createRoles();

      await roles.connect(SUPER_ADMIN).addSuperAdmin(OTHER1.address);
      await roles.connect(SUPER_ADMIN).addMinter(MINTER.address);

      await expect<Promise<ContractTransaction>>(
        roles.connect(MINTER).revokeSuperAdmin(OTHER1.address),
      ).toBeRevertedWith('sender must be an admin to revoke');
      expect<boolean>(await roles.isSuperAdmin(OTHER1.address)).toEqual(true);

      await expect<Promise<ContractTransaction>>(
        roles.connect(OTHER2).revokeSuperAdmin(OTHER1.address),
      ).toBeRevertedWith('sender must be an admin to revoke');
      expect<boolean>(await roles.isSuperAdmin(OTHER1.address)).toEqual(true);
    });
  });
};

interface CheckRolesConfig<R extends Roles> {
  createRoles: () => Promise<R>;
  isInRole: (roles: R, role: string) => Promise<boolean>;
  forRole?: (roles: R) => Promise<ContractTransaction | void>;
  addToRole: (roles: R, role: string) => Promise<ContractTransaction>;
  renounceRole: (roles: R) => Promise<ContractTransaction>;
  revokeRole: (roles: R, role: string) => Promise<ContractTransaction>;
}

export const checkRoles = <R extends Roles>(
  roleName: string,
  getRoleUnderTest: () => SignerWithAddress,
  config: CheckRolesConfig<R>,
) => {
  const { createRoles, isInRole, forRole, addToRole, renounceRole, revokeRole } = config;

  describe(`is${roleName}`, () => {
    it(`should return true for the ${roleName}`, async () => {
      const roles = await createRoles();

      await addToRole(roles.connect(SUPER_ADMIN), getRoleUnderTest().address);

      expect<boolean>(await isInRole(roles, getRoleUnderTest().address)).toEqual(true);
    });

    it('should return false for someone else', async () => {
      const roles = await createRoles();

      await addToRole(roles.connect(SUPER_ADMIN), getRoleUnderTest().address);

      expect<boolean>(await isInRole(roles, OTHER1.address)).toEqual(false);
    });

    it('should return false for all when not set', async () => {
      const roles = await createRoles();

      expect<boolean>(await isInRole(roles, getRoleUnderTest().address)).toEqual(false);
    });

    it('should return false for the super admin', async () => {
      const roles = await createRoles();

      await addToRole(roles.connect(SUPER_ADMIN), getRoleUnderTest().address);

      expect<boolean>(await isInRole(roles, SUPER_ADMIN.address)).toEqual(false);
    });
  });

  if (forRole) {
    describe(`only${roleName}`, () => {
      it(`should be callable by ${roleName}`, async () => {
        const roles = await createRoles();

        await addToRole(roles.connect(SUPER_ADMIN), getRoleUnderTest().address);

        await forRole(roles.connect(getRoleUnderTest()));
      });

      it('should not be callable by someone else', async () => {
        const roles = await createRoles();

        await expect<Promise<ContractTransaction | void>>(forRole(roles.connect(OTHER1))).toBeRevertedWith(
          `Caller does not have the ${roleName} role`,
        );
      });
    });
  }

  describe(`add${roleName}`, () => {
    it('should add if called by a current super admin', async () => {
      const roles = await createRoles();

      await addToRole(roles.connect(SUPER_ADMIN), getRoleUnderTest().address);
      expect<boolean>(await isInRole(roles, getRoleUnderTest().address)).toEqual(true);

      await roles.connect(SUPER_ADMIN).addSuperAdmin(getRoleUnderTest().address);
      await addToRole(roles.connect(getRoleUnderTest()), OTHER1.address);
      expect<boolean>(await isInRole(roles, OTHER1.address)).toEqual(true);
    });

    it('should fail if called by someone other than a super admin', async () => {
      const roles = await createRoles();

      await addToRole(roles.connect(SUPER_ADMIN), getRoleUnderTest().address);

      await expect<Promise<ContractTransaction>>(addToRole(roles.connect(OTHER1), OTHER1.address)).toBeRevertedWith(
        'Caller does not have the SuperAdmin role',
      );
      expect<boolean>(await isInRole(roles, OTHER1.address)).toEqual(false);

      await expect<Promise<ContractTransaction>>(
        addToRole(roles.connect(getRoleUnderTest()), OTHER1.address),
      ).toBeRevertedWith('Caller does not have the SuperAdmin role');
      expect<boolean>(await isInRole(roles, OTHER1.address)).toEqual(false);
    });
  });

  describe(`renounce${roleName}`, () => {
    it(`should renounce if called by a current ${roleName}`, async () => {
      const roles = await createRoles();

      await roles.connect(SUPER_ADMIN).addSuperAdmin(getRoleUnderTest().address);
      await addToRole(roles.connect(SUPER_ADMIN), getRoleUnderTest().address);
      await addToRole(roles.connect(SUPER_ADMIN), OTHER1.address);

      await renounceRole(roles.connect(getRoleUnderTest()));
      expect<boolean>(await isInRole(roles, getRoleUnderTest().address)).toEqual(false);
      expect<boolean>(await isInRole(roles, OTHER1.address)).toEqual(true);
      expect<boolean>(await roles.isSuperAdmin(getRoleUnderTest().address)).toEqual(true);

      await renounceRole(roles.connect(OTHER1));
      expect<boolean>(await isInRole(roles, OTHER1.address)).toEqual(false);
      expect<boolean>(await roles.isSuperAdmin(getRoleUnderTest().address)).toEqual(true);
    });

    it(`should not fail if called by someone other than a ${roleName}`, async () => {
      const roles = await createRoles();

      await roles.connect(SUPER_ADMIN).addSuperAdmin(OTHER1.address);

      await renounceRole(roles.connect(OTHER1));
      expect<boolean>(await isInRole(roles, OTHER1.address)).toEqual(false);
      expect<boolean>(await roles.isSuperAdmin(OTHER1.address)).toEqual(true);
      expect<boolean>(await roles.isSuperAdmin(SUPER_ADMIN.address)).toEqual(true);

      await renounceRole(roles.connect(OTHER2));
      expect<boolean>(await isInRole(roles, OTHER2.address)).toEqual(false);
      expect<boolean>(await roles.isSuperAdmin(OTHER1.address)).toEqual(true);
      expect<boolean>(await roles.isSuperAdmin(SUPER_ADMIN.address)).toEqual(true);
    });
  });

  describe(`revoke${roleName}`, () => {
    it('should revoke if called by a super admin', async () => {
      const roles = await createRoles();

      await roles.connect(SUPER_ADMIN).addSuperAdmin(OTHER1.address);
      await roles.connect(SUPER_ADMIN).addSuperAdmin(getRoleUnderTest().address);
      await addToRole(roles.connect(SUPER_ADMIN), getRoleUnderTest().address);
      await addToRole(roles.connect(SUPER_ADMIN), OTHER2.address);

      await revokeRole(roles.connect(OTHER1), getRoleUnderTest().address);
      expect<boolean>(await isInRole(roles, getRoleUnderTest().address)).toEqual(false);
      expect<boolean>(await roles.isSuperAdmin(getRoleUnderTest().address)).toEqual(true);
      expect<boolean>(await isInRole(roles, OTHER2.address)).toEqual(true);

      await revokeRole(roles.connect(OTHER1), OTHER2.address);
      expect<boolean>(await isInRole(roles, getRoleUnderTest().address)).toEqual(false);
      expect<boolean>(await roles.isSuperAdmin(getRoleUnderTest().address)).toEqual(true);
      expect<boolean>(await isInRole(roles, OTHER2.address)).toEqual(false);
    });

    it('should fail if called by someone other than a super admin', async () => {
      const roles = await createRoles();

      await addToRole(roles.connect(SUPER_ADMIN), OTHER1.address);
      await addToRole(roles.connect(SUPER_ADMIN), getRoleUnderTest().address);

      await expect<Promise<ContractTransaction>>(
        revokeRole(roles.connect(getRoleUnderTest()), OTHER1.address),
      ).toBeRevertedWith('sender must be an admin to revoke');
      expect<boolean>(await isInRole(roles, OTHER1.address)).toEqual(true);

      await expect<Promise<ContractTransaction>>(
        revokeRole(roles.connect(OTHER2), getRoleUnderTest().address),
      ).toBeRevertedWith('sender must be an admin to revoke');
      expect<boolean>(await isInRole(roles, getRoleUnderTest().address)).toEqual(true);
    });
  });
};
