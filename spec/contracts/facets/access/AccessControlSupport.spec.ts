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

import { buildDiamondFacetCut } from '../../../../src/contracts/diamonds';
import { SUPER_ADMIN_ROLE } from '../../../../src/contracts/roles';
import { TestCheckRole__factory } from '../../../../types/contracts';
import { INITIALIZER, PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { createDiamond } from '../../../helpers/DiamondHelper';
import { asAccessControl, deployTestCheckRole } from '../../../helpers/facets/AccessControlFacetHelper';
import { ROLE1, ROLE2 } from '../../../helpers/RoleIds';

describe('checkRole', () => {
  it('should succeed when the role is granted', async () => {
    const diamond = await createDiamond({
      additionalCuts: [buildDiamondFacetCut(await deployTestCheckRole())],
    });
    const accessControl = asAccessControl(diamond);
    const roleChecker = await TestCheckRole__factory.connect(diamond.address, INITIALIZER);

    await accessControl.setRoleAdmin(ROLE2, ROLE1);

    await roleChecker.needsRole(SUPER_ADMIN_ROLE);

    await accessControl.grantRole(ROLE1, PLAYER1.address);

    await roleChecker.connect(PLAYER1).needsRole(ROLE1);

    await accessControl.connect(PLAYER1).grantRole(ROLE2, PLAYER2.address);

    await roleChecker.connect(PLAYER2).needsRole(ROLE2);
  });

  it('should revert when the role is not granted', async () => {
    const diamond = await createDiamond({
      additionalCuts: [buildDiamondFacetCut(await deployTestCheckRole())],
    });
    const accessControl = asAccessControl(diamond);
    const roleChecker = await TestCheckRole__factory.connect(diamond.address, INITIALIZER);

    await accessControl.setRoleAdmin(ROLE2, ROLE1);

    await expect<Promise<void>>(roleChecker.connect(PLAYER1).needsRole(SUPER_ADMIN_ROLE)).toBeRevertedWith(
      'missing role',
    );

    await expect<Promise<void>>(roleChecker.connect(PLAYER1).needsRole(ROLE1)).toBeRevertedWith('missing role');

    await accessControl.grantRole(ROLE1, PLAYER1.address);

    await expect<Promise<void>>(roleChecker.connect(PLAYER2).needsRole(ROLE2)).toBeRevertedWith('missing role');
  });
});
