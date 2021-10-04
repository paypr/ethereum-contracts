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
import { ACCESS_CHECK_INTERFACE_ID } from '../../../../src/contracts/erc165InterfaceIds';
import { SUPER_ADMIN_ROLE } from '../../../../src/contracts/roles';
import { INITIALIZER, PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { createDiamond, deployDiamond } from '../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165Helper';
import {
  asAccessCheck,
  asAccessControl,
  deployAccessControlCheckFacet,
} from '../../../helpers/facets/AccessControlFacetHelper';
import { asErc165, deployErc165Facet } from '../../../helpers/facets/ERC165FacetHelper';
import { ROLE1, ROLE2 } from '../../../helpers/RoleIds';

describe('supportsInterface', () => {
  const createContract = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deployAccessControlCheckFacet()),
      ]),
    );

  shouldSupportInterface('AccessCheck', createContract, ACCESS_CHECK_INTERFACE_ID);
});

describe('hasRole', () => {
  it('should return false for any random role and user', async () => {
    const diamond = await createDiamond();
    const accessControl = asAccessControl(diamond);
    const accessCheck = asAccessCheck(accessControl);

    expect<boolean>(await accessCheck.hasRole(SUPER_ADMIN_ROLE, PLAYER1.address)).toBe(false);

    expect<boolean>(await accessCheck.hasRole(ROLE1, PLAYER1.address)).toBe(false);
    expect<boolean>(await accessCheck.hasRole(ROLE2, PLAYER1.address)).toBe(false);

    await accessControl.grantRole(ROLE1, PLAYER1.address);

    expect<boolean>(await accessCheck.hasRole(ROLE1, PLAYER2.address)).toBe(false);
    expect<boolean>(await accessCheck.hasRole(ROLE2, PLAYER1.address)).toBe(false);
  });

  it('should return true for specific roles and users', async () => {
    const diamond = await createDiamond();
    const accessControl = asAccessControl(diamond);
    const accessCheck = asAccessCheck(accessControl);

    expect<boolean>(await accessCheck.hasRole(SUPER_ADMIN_ROLE, INITIALIZER.address)).toBe(true);

    await accessControl.grantRole(ROLE1, PLAYER1.address);

    expect<boolean>(await accessCheck.hasRole(ROLE1, PLAYER1.address)).toBe(true);
  });
});
