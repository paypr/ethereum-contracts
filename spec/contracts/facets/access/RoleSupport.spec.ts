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

import { AccessRole } from '../../../../src/contracts/access';
import {
  ADMIN_ROLE,
  DELEGATE_ADMIN_ROLE,
  DIAMOND_CUTTER_ROLE,
  DISABLER_ROLE,
  LIMITER_ROLE,
  MINTER_ROLE,
  OWNER_MANAGER_ROLE,
  SUPER_ADMIN_ROLE,
  TRANSFER_AGENT_ROLE,
} from '../../../../src/contracts/roles';
import { RoleSupport, RoleSupport__factory } from '../../../../types/contracts';
import { INITIALIZER } from '../../../helpers/Accounts';

type RoleTest = [string, AccessRole, (RoleSupport) => Promise<AccessRole>];

const roleTests: RoleTest[] = [
  ['SuperAdmin', SUPER_ADMIN_ROLE, (roleSupport) => roleSupport.SUPER_ADMIN_ROLE()],
  ['Admin', ADMIN_ROLE, (roleSupport) => roleSupport.ADMIN_ROLE()],
  ['DelegateAdmin', DELEGATE_ADMIN_ROLE, (roleSupport) => roleSupport.DELEGATE_ADMIN_ROLE()],
  ['DiamondCutter', DIAMOND_CUTTER_ROLE, (roleSupport) => roleSupport.DIAMOND_CUTTER_ROLE()],
  ['Disabler', DISABLER_ROLE, (roleSupport) => roleSupport.DISABLER_ROLE()],
  ['Limiter', LIMITER_ROLE, (roleSupport) => roleSupport.LIMITER_ROLE()],
  ['Minter', MINTER_ROLE, (roleSupport) => roleSupport.MINTER_ROLE()],
  ['OwnerManager', OWNER_MANAGER_ROLE, (roleSupport) => roleSupport.OWNER_MANAGER_ROLE()],
  ['TransferAgent', TRANSFER_AGENT_ROLE, (roleSupport) => roleSupport.TRANSFER_AGENT_ROLE()],
];

test.each(roleTests)(
  'should match %s role id',
  async (roleName: string, roleId: AccessRole, getRoleId: (roleSupport: RoleSupport) => Promise<AccessRole>) => {
    const roleSupport = await new RoleSupport__factory(INITIALIZER).deploy();

    expect<string>(await getRoleId(roleSupport)).toEqual(roleId);
  },
);

it('should not have any duplicates', () => {
  const roleIds = roleTests.map((it) => it[1]);
  const roleSet = new Set(roleIds);

  expect<number>(roleIds.length).toEqual(roleSet.size);
});
