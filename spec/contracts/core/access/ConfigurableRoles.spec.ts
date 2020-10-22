/*
 * Copyright (c) 2020 The Paypr Company, LLC
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

import { expectEvent, expectRevert } from '@openzeppelin/test-helpers';
import { createRoles, OTHER1, SUPER_ADMIN } from '../../../helpers/AccessHelper';

describe('addRoleDelegate', () => {
  it('should add the delegate when called with super admin', async () => {
    const roleDelegate = await createRoles();
    const roles = await createRoles();

    expect(await roles.isRoleDelegate(roleDelegate.address)).toBe(false);
    await roles.addRoleDelegate(roleDelegate.address, { from: SUPER_ADMIN });
    expect(await roles.isRoleDelegate(roleDelegate.address)).toBe(true);
  });

  it('should not add the delegate when called by someone else', async () => {
    const roleDelegate = await createRoles();
    const roles = await createRoles();

    expect(await roles.isRoleDelegate(roleDelegate.address)).toBe(false);
    await expectRevert(
      roles.addRoleDelegate(roleDelegate.address, { from: OTHER1 }),
      'Caller does not have the SuperAdmin role',
    );
    expect(await roles.isRoleDelegate(roleDelegate.address)).toBe(false);
  });

  it('should not fail when added twice', async () => {
    const roleDelegate = await createRoles();
    const roles = await createRoles(roleDelegate.address);

    expect(await roles.isRoleDelegate(roleDelegate.address)).toBe(true);
    await roles.addRoleDelegate(roleDelegate.address, { from: SUPER_ADMIN });
    expect(await roles.isRoleDelegate(roleDelegate.address)).toBe(true);
  });

  it('should emit RoleDelegateAdded event when added', async () => {
    const roleDelegate = await createRoles();
    const roles = await createRoles();

    expect(await roles.isRoleDelegate(roleDelegate.address)).toBe(false);

    expectEvent(await roles.addRoleDelegate(roleDelegate.address, { from: SUPER_ADMIN }), 'RoleDelegateAdded', {
      roleDelegate: roleDelegate.address,
    });

    expect(await roles.isRoleDelegate(roleDelegate.address)).toBe(true);
  });
});

describe('removeRoleDelegate', () => {
  it('should remove the delegate when called with super admin', async () => {
    const roleDelegate = await createRoles();
    const roles = await createRoles(roleDelegate.address);

    expect(await roles.isRoleDelegate(roleDelegate.address)).toBe(true);
    await roles.removeRoleDelegate(roleDelegate.address, { from: SUPER_ADMIN });
    expect(await roles.isRoleDelegate(roleDelegate.address)).toBe(false);
  });

  it('should not remove the delegate when called by someone else', async () => {
    const roleDelegate = await createRoles();
    const roles = await createRoles(roleDelegate.address);

    expect(await roles.isRoleDelegate(roleDelegate.address)).toBe(true);
    await expectRevert(
      roles.removeRoleDelegate(roleDelegate.address, { from: OTHER1 }),
      'Caller does not have the SuperAdmin role',
    );
    expect(await roles.isRoleDelegate(roleDelegate.address)).toBe(true);
  });

  it('should not fail if the delegate is not in the list', async () => {
    const roleDelegate = await createRoles();
    const roles = await createRoles();

    expect(await roles.isRoleDelegate(roleDelegate.address)).toBe(false);
    await roles.removeRoleDelegate(roleDelegate.address, { from: SUPER_ADMIN });
    expect(await roles.isRoleDelegate(roleDelegate.address)).toBe(false);
  });

  it('should emit RoleDelegateRemoved event when removed', async () => {
    const roleDelegate = await createRoles();
    const roles = await createRoles(roleDelegate.address);

    expect(await roles.isRoleDelegate(roleDelegate.address)).toBe(true);

    expectEvent(await roles.removeRoleDelegate(roleDelegate.address, { from: SUPER_ADMIN }), 'RoleDelegateRemoved', {
      roleDelegate: roleDelegate.address,
    });

    expect(await roles.isRoleDelegate(roleDelegate.address)).toBe(false);
  });
});
