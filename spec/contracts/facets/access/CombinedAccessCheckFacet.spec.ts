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
import { PLAYER1, PLAYER2, PLAYER3 } from '../../../helpers/Accounts';
import { createDiamondWithCombinedAccess, deployDiamond } from '../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165Helper';
import {
  asAccessControl,
  asAccessCheck,
  asTestCheckRole,
  buildDelegatingAccessInitFunction,
  createAccessControl,
  deployCombinedAccessFacet,
  deployTestCheckRole,
} from '../../../helpers/facets/AccessControlFacetHelper';
import { asErc165, deployErc165Facet } from '../../../helpers/facets/ERC165FacetHelper';
import { ROLE1, ROLE2, ROLE3 } from '../../../helpers/RoleIds';

describe('supportsInterface', () => {
  const createContract = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deployCombinedAccessFacet()),
      ]),
    );

  shouldSupportInterface('AccessCheck', createContract, ACCESS_CHECK_INTERFACE_ID);
});

describe('grantRole', () => {
  it('should succeed for user with admin role in access delegate', async () => {
    const accessControl = await createAccessControl();

    const combinedAccess = asAccessCheck(
      await createDiamondWithCombinedAccess({
        additionalInits: [await buildDelegatingAccessInitFunction({ delegate: asAccessCheck(accessControl) })],
      }),
    );

    await asAccessControl(combinedAccess).setRoleAdmin(ROLE2, ROLE1);

    await accessControl.grantRole(ROLE1, PLAYER1.address);

    await asAccessControl(combinedAccess, PLAYER1).grantRole(ROLE2, PLAYER2.address);

    await accessControl.grantRole(SUPER_ADMIN_ROLE, PLAYER2.address);

    await asAccessControl(combinedAccess, PLAYER2).grantRole(ROLE3, PLAYER3.address);
  });

  it('should succeed for user with admin role in contract', async () => {
    const combinedAccess = asAccessCheck(await createDiamondWithCombinedAccess());

    const accessControl = asAccessControl(combinedAccess);

    await accessControl.setRoleAdmin(ROLE2, ROLE1);

    await accessControl.grantRole(ROLE1, PLAYER1.address);

    await asAccessControl(combinedAccess, PLAYER1).grantRole(ROLE2, PLAYER2.address);

    await accessControl.grantRole(SUPER_ADMIN_ROLE, PLAYER2.address);

    await asAccessControl(combinedAccess, PLAYER2).grantRole(ROLE3, PLAYER3.address);
  });
});

describe('hasRole', () => {
  it('should return true for user with role in access delegate', async () => {
    const accessControl = await createAccessControl();

    const combinedAccess = asAccessCheck(
      await createDiamondWithCombinedAccess({
        additionalInits: [await buildDelegatingAccessInitFunction({ delegate: asAccessCheck(accessControl) })],
      }),
    );

    expect<boolean>(await combinedAccess.hasRole(ROLE1, PLAYER1.address)).toBe(false);
    expect<boolean>(await combinedAccess.hasRole(ROLE2, PLAYER1.address)).toBe(false);
    expect<boolean>(await combinedAccess.hasRole(ROLE1, PLAYER2.address)).toBe(false);
    expect<boolean>(await combinedAccess.hasRole(ROLE2, PLAYER2.address)).toBe(false);

    await accessControl.grantRole(ROLE1, PLAYER1.address);

    expect<boolean>(await combinedAccess.hasRole(ROLE1, PLAYER1.address)).toBe(true);
    expect<boolean>(await combinedAccess.hasRole(ROLE2, PLAYER1.address)).toBe(false);
    expect<boolean>(await combinedAccess.hasRole(ROLE1, PLAYER2.address)).toBe(false);
    expect<boolean>(await combinedAccess.hasRole(ROLE2, PLAYER2.address)).toBe(false);

    await accessControl.grantRole(ROLE2, PLAYER2.address);

    expect<boolean>(await combinedAccess.hasRole(ROLE1, PLAYER1.address)).toBe(true);
    expect<boolean>(await combinedAccess.hasRole(ROLE2, PLAYER1.address)).toBe(false);
    expect<boolean>(await combinedAccess.hasRole(ROLE1, PLAYER2.address)).toBe(false);
    expect<boolean>(await combinedAccess.hasRole(ROLE2, PLAYER2.address)).toBe(true);
  });

  it('should return true for user with role in contract', async () => {
    const combinedAccess = asAccessCheck(await createDiamondWithCombinedAccess());

    const accessControl = asAccessControl(combinedAccess);

    expect<boolean>(await combinedAccess.hasRole(ROLE1, PLAYER1.address)).toBe(false);
    expect<boolean>(await combinedAccess.hasRole(ROLE2, PLAYER1.address)).toBe(false);
    expect<boolean>(await combinedAccess.hasRole(ROLE1, PLAYER2.address)).toBe(false);
    expect<boolean>(await combinedAccess.hasRole(ROLE2, PLAYER2.address)).toBe(false);

    await accessControl.grantRole(ROLE1, PLAYER1.address);

    expect<boolean>(await combinedAccess.hasRole(ROLE1, PLAYER1.address)).toBe(true);
    expect<boolean>(await combinedAccess.hasRole(ROLE2, PLAYER1.address)).toBe(false);
    expect<boolean>(await combinedAccess.hasRole(ROLE1, PLAYER2.address)).toBe(false);
    expect<boolean>(await combinedAccess.hasRole(ROLE2, PLAYER2.address)).toBe(false);

    await accessControl.grantRole(ROLE2, PLAYER2.address);

    expect<boolean>(await combinedAccess.hasRole(ROLE1, PLAYER1.address)).toBe(true);
    expect<boolean>(await combinedAccess.hasRole(ROLE2, PLAYER1.address)).toBe(false);
    expect<boolean>(await combinedAccess.hasRole(ROLE1, PLAYER2.address)).toBe(false);
    expect<boolean>(await combinedAccess.hasRole(ROLE2, PLAYER2.address)).toBe(true);
  });

  it('should return true for user with role in both', async () => {
    const accessControl = await createAccessControl();

    const combinedAccess = asAccessCheck(
      await createDiamondWithCombinedAccess({
        additionalInits: [await buildDelegatingAccessInitFunction({ delegate: asAccessCheck(accessControl) })],
      }),
    );

    const accessControl2 = asAccessControl(combinedAccess);

    expect<boolean>(await combinedAccess.hasRole(ROLE1, PLAYER1.address)).toBe(false);
    expect<boolean>(await combinedAccess.hasRole(ROLE2, PLAYER1.address)).toBe(false);
    expect<boolean>(await combinedAccess.hasRole(ROLE1, PLAYER2.address)).toBe(false);
    expect<boolean>(await combinedAccess.hasRole(ROLE2, PLAYER2.address)).toBe(false);

    await accessControl.grantRole(ROLE1, PLAYER1.address);
    await accessControl2.grantRole(ROLE1, PLAYER1.address);

    expect<boolean>(await combinedAccess.hasRole(ROLE1, PLAYER1.address)).toBe(true);
    expect<boolean>(await combinedAccess.hasRole(ROLE2, PLAYER1.address)).toBe(false);
    expect<boolean>(await combinedAccess.hasRole(ROLE1, PLAYER2.address)).toBe(false);
    expect<boolean>(await combinedAccess.hasRole(ROLE2, PLAYER2.address)).toBe(false);

    await accessControl.grantRole(ROLE2, PLAYER2.address);
    await accessControl2.grantRole(ROLE2, PLAYER2.address);

    expect<boolean>(await combinedAccess.hasRole(ROLE1, PLAYER1.address)).toBe(true);
    expect<boolean>(await combinedAccess.hasRole(ROLE2, PLAYER1.address)).toBe(false);
    expect<boolean>(await combinedAccess.hasRole(ROLE1, PLAYER2.address)).toBe(false);
    expect<boolean>(await combinedAccess.hasRole(ROLE2, PLAYER2.address)).toBe(true);
  });
});

describe('checkRole', () => {
  it('should succeed for user with role in access delegate', async () => {
    const accessControl = await createAccessControl();

    const combinedAccess = asTestCheckRole(
      await createDiamondWithCombinedAccess({
        additionalCuts: [buildDiamondFacetCut(await deployTestCheckRole())],
        additionalInits: [await buildDelegatingAccessInitFunction({ delegate: asAccessCheck(accessControl) })],
      }),
    );

    await accessControl.grantRole(ROLE1, PLAYER1.address);

    await combinedAccess.connect(PLAYER1).needsRole(ROLE1);

    await accessControl.grantRole(ROLE2, PLAYER2.address);

    await combinedAccess.connect(PLAYER2).needsRole(ROLE2);
  });

  it('should succeed for user with role in contract', async () => {
    const combinedAccess = asTestCheckRole(
      await createDiamondWithCombinedAccess({
        additionalCuts: [buildDiamondFacetCut(await deployTestCheckRole())],
      }),
    );

    const accessControl = asAccessControl(combinedAccess);

    await accessControl.grantRole(ROLE1, PLAYER1.address);

    await combinedAccess.connect(PLAYER1).needsRole(ROLE1);

    await accessControl.grantRole(ROLE2, PLAYER2.address);

    await combinedAccess.connect(PLAYER2).needsRole(ROLE2);
  });

  it('should succeed for user with role in both', async () => {
    const accessControl = await createAccessControl();

    const combinedAccess = asTestCheckRole(
      await createDiamondWithCombinedAccess({
        additionalCuts: [buildDiamondFacetCut(await deployTestCheckRole())],
        additionalInits: [await buildDelegatingAccessInitFunction({ delegate: asAccessCheck(accessControl) })],
      }),
    );

    const accessControl2 = asAccessControl(combinedAccess);

    await accessControl.grantRole(ROLE1, PLAYER1.address);
    await accessControl2.grantRole(ROLE1, PLAYER1.address);

    await combinedAccess.connect(PLAYER1).needsRole(ROLE1);

    await accessControl.grantRole(ROLE2, PLAYER2.address);
    await accessControl.grantRole(ROLE2, PLAYER2.address);

    await combinedAccess.connect(PLAYER2).needsRole(ROLE2);
  });

  it('should fail for user without role anywhere', async () => {
    const accessControl = await createAccessControl();

    const combinedAccess = asTestCheckRole(
      await createDiamondWithCombinedAccess({
        additionalCuts: [buildDiamondFacetCut(await deployTestCheckRole())],
        additionalInits: [await buildDelegatingAccessInitFunction({ delegate: asAccessCheck(accessControl) })],
      }),
    );

    await accessControl.grantRole(ROLE1, PLAYER1.address);

    await expect<Promise<void>>(combinedAccess.connect(PLAYER1).needsRole(ROLE2)).toBeRevertedWith('missing role');

    await accessControl.grantRole(ROLE2, PLAYER2.address);

    await expect<Promise<void>>(combinedAccess.connect(PLAYER2).needsRole(ROLE1)).toBeRevertedWith('missing role');
  });
});
