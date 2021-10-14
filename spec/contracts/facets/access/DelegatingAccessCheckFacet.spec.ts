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
import { INITIALIZER, PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { deployDiamond } from '../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165Helper';
import {
  asAccessCheck,
  createAccessControl,
  createDelegatingAccess,
  deployDelegatingAccessCheckFacet,
} from '../../../helpers/facets/AccessControlFacetHelper';
import { asErc165, deployErc165Facet } from '../../../helpers/facets/ERC165FacetHelper';
import { ROLE1 } from '../../../helpers/RoleIds';

describe('supportsInterface', () => {
  const createContract = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deployDelegatingAccessCheckFacet()),
      ]),
    );

  shouldSupportInterface('AccessCheck', createContract, ACCESS_CHECK_INTERFACE_ID);
});

describe(`hasRole`, () => {
  it(`should return true for the user`, async () => {
    const accessControl = await createAccessControl();
    const delegatingAccess = await createDelegatingAccess(asAccessCheck(accessControl));
    const accessCheck = asAccessCheck(delegatingAccess);

    await accessControl.grantRole(ROLE1, PLAYER1.address);

    expect<boolean>(await accessCheck.hasRole(ROLE1, PLAYER1.address)).toEqual(true);
  });

  it('should return false for someone else', async () => {
    const accessControl = await createAccessControl();
    const delegatingAccess = await createDelegatingAccess(asAccessCheck(accessControl));
    const accessCheck = asAccessCheck(delegatingAccess);

    await accessControl.grantRole(ROLE1, PLAYER1.address);

    expect<boolean>(await accessCheck.hasRole(ROLE1, PLAYER2.address)).toEqual(false);
  });

  it('should return false for all when not set', async () => {
    const accessControl = await createAccessControl();
    const delegatingAccess = await createDelegatingAccess(asAccessCheck(accessControl));
    const accessCheck = asAccessCheck(delegatingAccess);

    expect<boolean>(await accessCheck.hasRole(ROLE1, PLAYER1.address)).toEqual(false);
  });

  it('should return false for the super admin', async () => {
    const accessControl = await createAccessControl();
    const delegatingAccess = await createDelegatingAccess(asAccessCheck(accessControl));
    const accessCheck = asAccessCheck(delegatingAccess);

    await accessControl.grantRole(ROLE1, PLAYER1.address);

    expect<boolean>(await accessCheck.hasRole(ROLE1, INITIALIZER.address)).toEqual(false);
  });
});
